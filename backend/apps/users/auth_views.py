import secrets
from datetime import timedelta

from apps.core.decorators import (
    auth_ratelimit,
    monitor_security_events,
    progressive_delay_on_failure,
    security_ratelimit,
)
from apps.core.models import AuditLog
from apps.core.security_utils import SecurityMonitor
from apps.core.throttles import (
    AuthenticationThrottle,
    IPBasedThrottle,
    ProgressiveDelayThrottle,
    SecurityEventThrottle,
    UserBasedThrottle,
)
from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from django.core.cache import cache
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils import timezone
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import permissions, serializers, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .mfa_serializers import MFALoginSerializer
from .models import BackupCode, MFAEnforcementPolicy, PasswordResetToken, TOTPDevice
from .serializers import (
    CustomUserSerializer,
    LoginSerializer,
    PasswordChangeSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    UserCreateSerializer,
)
from .verification_decorators import require_verification

User = get_user_model()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom JWT serializer that includes user information in the token response
    and handles MFA verification
    """

    mfa_token = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        username = attrs.get("username")
        password = attrs.get("password")
        mfa_token = attrs.get("mfa_token", "").strip()
        mfa_method = None

        # First, authenticate with username and password
        user = authenticate(
            request=self.context.get("request"), username=username, password=password
        )

        if not user:
            # Log failed login attempt
            request = self.context.get("request")
            if request:
                AuditLog.log_authentication_event(
                    event_type="login_failed",
                    request=request,
                    extra_data={
                        "username": username,
                        "error": "invalid_credentials",
                        "login_method": "username_password",
                    },
                )
            raise serializers.ValidationError(
                "No active account found with the given credentials"
            )

        # Check if MFA is required for this user
        mfa_required = MFAEnforcementPolicy.is_mfa_required_for_role(user.role)

        # Check if user has MFA enabled
        user_has_mfa = False
        try:
            totp_device = user.totp_device
            user_has_mfa = totp_device.is_active and totp_device.confirmed
        except TOTPDevice.DoesNotExist:
            user_has_mfa = False

        # If MFA is required or user has MFA enabled, verify MFA token
        if (mfa_required or user_has_mfa) and user_has_mfa:
            if not mfa_token:
                # MFA token required but not provided
                request = self.context.get("request")
                if request:
                    AuditLog.log_authentication_event(
                        event_type="login_mfa_required",
                        request=request,
                        user=user,
                        extra_data={
                            "username": username,
                            "user_role": user.role,
                            "mfa_required": mfa_required,
                            "user_has_mfa": user_has_mfa,
                        },
                    )

                # Return MFA required response
                raise serializers.ValidationError(
                    {
                        "mfa_required": True,
                        "message": "Se requiere autenticación de dos factores",
                        "user_id": str(user.id),
                    }
                )

            # Verify MFA token
            mfa_valid = False

            try:
                totp_device = user.totp_device

                # Try TOTP first (6 digits)
                if len(mfa_token) == 6 and mfa_token.isdigit():
                    if totp_device.verify_token(mfa_token):
                        mfa_valid = True
                        mfa_method = "totp"

                # Try backup code (8 characters)
                elif len(mfa_token) == 8:
                    backup_code = BackupCode.objects.filter(
                        user=user, code=mfa_token.upper(), is_used=False
                    ).first()

                    if backup_code:
                        backup_code.mark_as_used()
                        mfa_valid = True
                        mfa_method = "backup_code"

                if not mfa_valid:
                    # Log failed MFA verification
                    request = self.context.get("request")
                    if request:
                        AuditLog.log_security_event(
                            event_type="login_mfa_failed",
                            request=request,
                            user=user,
                            message=f"Failed MFA verification for user {user.username}",
                            extra_data={
                                "username": username,
                                "mfa_token_length": len(mfa_token),
                                "attempted_method": (
                                    "totp" if len(mfa_token) == 6 else "backup_code"
                                ),
                            },
                        )
                    raise serializers.ValidationError("Token MFA inválido")

            except TOTPDevice.DoesNotExist:
                raise serializers.ValidationError(
                    "MFA no está configurado para este usuario"
                )

        # Set user for token generation
        self.user = user

        # Generate tokens
        refresh = RefreshToken.for_user(user)
        data = {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        }

        # Log successful login
        request = self.context.get("request")
        if request:
            AuditLog.log_authentication_event(
                event_type="login_success",
                request=request,
                user=user,
                extra_data={
                    "login_method": "username_password"
                    + (f"_mfa_{mfa_method}" if mfa_method else ""),
                    "user_role": user.role,
                    "user_id": str(user.id),
                    "mfa_used": bool(mfa_method),
                    "mfa_method": mfa_method,
                },
            )

        # Add extra user information to the response
        data["user"] = {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "full_name": user.get_full_name(),
            "role": user.role,
            "role_display": user.get_role_display(),
            "student_id": user.student_id,
            "phone": user.phone,
            "is_active_student": user.is_active_student,
            "mfa_enabled": user_has_mfa,
            "mfa_required": mfa_required,
        }

        return data


@extend_schema_view(
    post=extend_schema(
        summary="Iniciar sesión",
        description="""
        Autentica un usuario y devuelve tokens JWT (access y refresh) junto con información del usuario.
        
        Soporta autenticación de dos factores (MFA):
        - Si MFA es requerido pero no se proporciona token, devuelve status 202 con mfa_required=true
        - Si se proporciona mfa_token, verifica TOTP (6 dígitos) o código de respaldo (8 caracteres)
        
        El token de acceso debe incluirse en el header Authorization como:
        `Authorization: Bearer <access_token>`
        
        El token de acceso expira en 60 minutos, usa el refresh token para obtener uno nuevo.
        """,
        tags=["Authentication"],
        request={
            "type": "object",
            "properties": {
                "username": {"type": "string", "description": "Email del usuario"},
                "password": {"type": "string", "description": "Contraseña"},
                "mfa_token": {
                    "type": "string",
                    "description": "Token MFA (opcional)",
                    "required": False,
                },
            },
            "required": ["username", "password"],
        },
        responses={
            200: {
                "type": "object",
                "properties": {
                    "access": {"type": "string", "description": "Token JWT de acceso"},
                    "refresh": {
                        "type": "string",
                        "description": "Token JWT de renovación",
                    },
                    "user": {
                        "type": "object",
                        "properties": {
                            "id": {"type": "integer"},
                            "email": {"type": "string"},
                            "username": {"type": "string"},
                            "first_name": {"type": "string"},
                            "last_name": {"type": "string"},
                            "full_name": {"type": "string"},
                            "role": {
                                "type": "string",
                                "enum": ["admin", "president", "student"],
                            },
                            "role_display": {"type": "string"},
                            "student_id": {"type": "string"},
                            "phone": {"type": "string"},
                            "is_active_student": {"type": "boolean"},
                            "mfa_enabled": {"type": "boolean"},
                            "mfa_required": {"type": "boolean"},
                        },
                    },
                },
            },
            202: {
                "type": "object",
                "properties": {
                    "mfa_required": {"type": "boolean", "example": True},
                    "message": {
                        "type": "string",
                        "example": "Se requiere autenticación de dos factores",
                    },
                    "user_id": {"type": "string"},
                },
            },
            400: {
                "type": "object",
                "properties": {
                    "detail": {"type": "string", "example": "Token MFA inválido"},
                    "non_field_errors": {"type": "array", "items": {"type": "string"}},
                },
            },
            401: {
                "type": "object",
                "properties": {
                    "detail": {
                        "type": "string",
                        "example": "No active account found with the given credentials",
                    }
                },
            },
        },
    )
)
class LoginView(TokenObtainPairView):
    """
    Vista de login personalizada con información de usuario y soporte MFA
    """

    serializer_class = CustomTokenObtainPairSerializer
    throttle_classes = [AuthenticationThrottle, IPBasedThrottle]
    throttle_scope = "auth_login"

    def post(self, request, *args, **kwargs):
        try:
            return super().post(request, *args, **kwargs)
        except serializers.ValidationError as e:
            # Check if this is an MFA required error
            if isinstance(e.detail, dict) and e.detail.get("mfa_required"):
                return Response(e.detail, status=status.HTTP_202_ACCEPTED)
            raise


@extend_schema(
    summary="Registrar usuario",
    description="""
    Registra un nuevo usuario en el sistema.
    
    Los campos requeridos varían según el rol:
    - Estudiantes: requieren student_id (matrícula)
    - Presidentes y Administradores: student_id es opcional
    """,
    tags=["Authentication"],
    request=UserCreateSerializer,
    responses={
        201: CustomUserSerializer,
        400: {
            "type": "object",
            "properties": {
                "field_errors": {
                    "type": "object",
                    "description": "Errores específicos de campos",
                },
                "non_field_errors": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Errores generales",
                },
            },
        },
    },
)
class RegisterView(APIView):
    """
    Vista para registro de nuevos usuarios
    """

    permission_classes = [permissions.AllowAny]
    throttle_classes = [AuthenticationThrottle, IPBasedThrottle]
    throttle_scope = "auth_register"

    def post(self, request):
        serializer = UserCreateSerializer(data=request.data)
        if serializer.is_valid():
            try:
                user = serializer.save()

                # Log successful registration
                AuditLog.log_authentication_event(
                    event_type="register_success",
                    request=request,
                    user=user,
                    extra_data={
                        "user_role": user.role,
                        "user_id": str(user.id),
                        "email": user.email,
                    },
                )

                user_serializer = CustomUserSerializer(user)
                return Response(user_serializer.data, status=status.HTTP_201_CREATED)
            except Exception as e:
                # Log failed registration
                AuditLog.log_authentication_event(
                    event_type="register_failed",
                    request=request,
                    extra_data={
                        "error": str(e),
                        "attempted_email": request.data.get("email", "unknown"),
                        "attempted_username": request.data.get("username", "unknown"),
                    },
                )
                raise
        else:
            # Log failed registration due to validation errors
            AuditLog.log_authentication_event(
                event_type="register_failed",
                request=request,
                extra_data={
                    "validation_errors": serializer.errors,
                    "attempted_email": request.data.get("email", "unknown"),
                    "attempted_username": request.data.get("username", "unknown"),
                },
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(
    summary="Cerrar sesión",
    description="""
    Cierra la sesión del usuario invalidando el refresh token.
    
    Requiere el refresh token en el cuerpo de la petición.
    """,
    tags=["Authentication"],
    request={
        "type": "object",
        "properties": {
            "refresh": {"type": "string", "description": "Refresh token a invalidar"}
        },
        "required": ["refresh"],
    },
    responses={
        200: {
            "type": "object",
            "properties": {
                "message": {"type": "string", "example": "Sesión cerrada exitosamente"}
            },
        },
        400: {
            "type": "object",
            "properties": {"error": {"type": "string", "example": "Token inválido"}},
        },
    },
)
class LogoutView(APIView):
    """
    Vista para cerrar sesión
    """

    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [UserBasedThrottle]
    throttle_scope = "auth_default"

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if not refresh_token:
                # Log failed logout attempt
                AuditLog.log_authentication_event(
                    event_type="logout",
                    request=request,
                    user=request.user,
                    extra_data={
                        "error": "Missing refresh token",
                        "success": False,
                    },
                )
                return Response(
                    {"error": "Refresh token es requerido"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            token = RefreshToken(refresh_token)
            token.blacklist()

            # Log successful logout
            AuditLog.log_authentication_event(
                event_type="logout",
                request=request,
                user=request.user,
                extra_data={
                    "success": True,
                    "token_blacklisted": True,
                },
            )

            return Response(
                {"message": "Sesión cerrada exitosamente"}, status=status.HTTP_200_OK
            )
        except Exception as e:
            # Log failed logout attempt
            AuditLog.log_authentication_event(
                event_type="logout",
                request=request,
                user=request.user,
                extra_data={
                    "error": str(e),
                    "success": False,
                },
            )
            return Response(
                {"error": "Token inválido"}, status=status.HTTP_400_BAD_REQUEST
            )


@extend_schema(
    summary="Obtener información del usuario actual",
    description="""
    Obtiene la información completa del usuario autenticado.
    
    Requiere token de autenticación válido.
    """,
    tags=["Authentication"],
    responses={
        200: CustomUserSerializer,
        401: {
            "type": "object",
            "properties": {
                "detail": {
                    "type": "string",
                    "example": "Authentication credentials were not provided.",
                }
            },
        },
    },
)
class MeView(APIView):
    """
    Vista para obtener información del usuario actual
    """

    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [UserBasedThrottle]
    throttle_scope = "auth_default"

    def get(self, request):
        serializer = CustomUserSerializer(request.user)
        return Response(serializer.data)


@extend_schema_view(
    post=extend_schema(
        summary="Renovar token de acceso",
        description="""
        Renueva el token de acceso usando el refresh token.
        
        Cuando el access token expira, usa este endpoint para obtener uno nuevo
        sin necesidad de volver a hacer login.
        """,
        tags=["Authentication"],
    )
)
class CustomTokenRefreshView(TokenRefreshView):
    """
    Vista personalizada para renovar tokens
    """

    throttle_classes = [UserBasedThrottle, IPBasedThrottle]
    throttle_scope = "auth_default"

    def post(self, request, *args, **kwargs):
        try:
            response = super().post(request, *args, **kwargs)

            # Log successful token refresh
            if response.status_code == 200:
                # Try to get user from refresh token
                refresh_token = request.data.get("refresh")
                user = None
                if refresh_token:
                    try:
                        from rest_framework_simplejwt.tokens import RefreshToken

                        token_obj = RefreshToken(refresh_token)
                        user_id = token_obj.payload.get("user_id")
                        if user_id:
                            user = User.objects.get(id=user_id)
                    except:
                        pass

                AuditLog.log_authentication_event(
                    event_type="token_refresh",
                    request=request,
                    user=user,
                    extra_data={
                        "success": True,
                        "user_id": str(user.id) if user else None,
                    },
                )

            return response

        except Exception as e:
            # Log failed token refresh
            AuditLog.log_authentication_event(
                event_type="token_refresh_failed",
                request=request,
                extra_data={
                    "error": str(e),
                    "success": False,
                },
            )
            raise


def get_client_ip(request):
    """Get client IP address from request"""
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        ip = x_forwarded_for.split(",")[0]
    else:
        ip = request.META.get("REMOTE_ADDR")
    return ip


@extend_schema(
    summary="Solicitar restablecimiento de contraseña",
    description="""
    Solicita un restablecimiento de contraseña enviando un email con un enlace seguro.
    
    - Se envía un email con un token único que expira en 1 hora
    - El endpoint no revela si el email existe en el sistema por seguridad
    - Está limitado por tasa para prevenir abuso (5 intentos por IP cada 5 minutos)
    """,
    tags=["Authentication"],
    request=PasswordResetRequestSerializer,
    responses={
        200: {
            "type": "object",
            "properties": {
                "message": {
                    "type": "string",
                    "example": "Si el correo electrónico existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña.",
                }
            },
        },
        429: {
            "type": "object",
            "properties": {
                "error": {
                    "type": "string",
                    "example": "Demasiados intentos. Intenta de nuevo en unos minutos.",
                }
            },
        },
    },
)
class PasswordResetRequestView(APIView):
    """
    Vista para solicitar restablecimiento de contraseña
    """

    permission_classes = [permissions.AllowAny]
    throttle_classes = [SecurityEventThrottle, IPBasedThrottle]
    throttle_scope = "password_reset"

    def post(self, request):
        # Rate limiting is now handled by throttle classes
        with SecurityMonitor(request, "password_reset_request"):
            serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data["email"]

            try:
                user = User.objects.get(email=email, is_active=True)

                # Deactivate any existing tokens for this user
                PasswordResetToken.deactivate_user_tokens(user)

                # Generate secure token
                token = secrets.token_urlsafe(32)

                # Create password reset token
                reset_token = PasswordResetToken.objects.create(
                    user=user,
                    token=token,
                    ip_address=get_client_ip(request),
                    user_agent=request.META.get("HTTP_USER_AGENT", ""),
                )

                # Send password reset email
                self._send_password_reset_email(user, token, request)

                # Log successful password reset request
                AuditLog.log_event(
                    event_type="password_reset_request",
                    request=request,
                    user=user,
                    message=f"Password reset requested for user {user.username}",
                    extra_data={
                        "email": email,
                        "token_id": str(reset_token.id),
                        "success": True,
                    },
                    severity="medium",
                )

            except User.DoesNotExist:
                # Log password reset attempt for non-existent user
                AuditLog.log_security_event(
                    event_type="password_reset_request",
                    request=request,
                    message=f"Password reset requested for non-existent email: {email}",
                    extra_data={
                        "email": email,
                        "user_exists": False,
                    },
                )

            # Always return the same message for security
            return Response(
                {
                    "message": "Si el correo electrónico existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña."
                },
                status=status.HTTP_200_OK,
            )
        else:
            # Log failed password reset request due to validation
            AuditLog.log_event(
                event_type="password_reset_request",
                request=request,
                message="Password reset request failed due to validation errors",
                extra_data={
                    "validation_errors": serializer.errors,
                    "success": False,
                },
                severity="low",
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def _send_password_reset_email(self, user, token, request):
        """Send password reset email to user"""
        try:
            # Build reset URL
            protocol = "https" if request.is_secure() else "http"
            domain = request.get_host()
            reset_url = f"{protocol}://{domain}/reset-password?token={token}"

            # Email context
            context = {
                "user": user,
                "reset_url": reset_url,
                "site_url": f"{protocol}://{domain}",
            }

            # Render email template
            html_message = render_to_string("emails/password_reset.html", context)

            # Send email
            send_mail(
                subject="Restablecimiento de Contraseña - Grupos Estudiantiles",
                message=f"Haz clic en el siguiente enlace para restablecer tu contraseña: {reset_url}",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=html_message,
                fail_silently=False,
            )

        except Exception as e:
            # Log the error but don't expose it to the user
            print(f"Error sending password reset email: {e}")


@extend_schema(
    summary="Confirmar restablecimiento de contraseña",
    description="""
    Confirma el restablecimiento de contraseña usando el token recibido por email.
    
    - El token debe ser válido y no haber expirado (1 hora de validez)
    - La nueva contraseña debe cumplir con los requisitos de seguridad
    - Una vez usado, el token se invalida automáticamente
    - Se invalidan todas las sesiones activas del usuario
    """,
    tags=["Authentication"],
    request=PasswordResetConfirmSerializer,
    responses={
        200: {
            "type": "object",
            "properties": {
                "message": {
                    "type": "string",
                    "example": "Contraseña restablecida exitosamente",
                }
            },
        },
        400: {
            "type": "object",
            "properties": {
                "error": {"type": "string", "example": "Token inválido o expirado"}
            },
        },
        429: {
            "type": "object",
            "properties": {
                "error": {
                    "type": "string",
                    "example": "Demasiados intentos. Intenta de nuevo en unos minutos.",
                }
            },
        },
    },
)
class PasswordResetConfirmView(APIView):
    """
    Vista para confirmar restablecimiento de contraseña
    """

    permission_classes = [permissions.AllowAny]
    throttle_classes = [SecurityEventThrottle, IPBasedThrottle]
    throttle_scope = "password_reset"

    def post(self, request):
        # Rate limiting is now handled by throttle classes
        with SecurityMonitor(request, "password_reset_confirm"):
            serializer = PasswordResetConfirmSerializer(data=request.data)
        if serializer.is_valid():
            token = serializer.validated_data["token"]
            new_password = serializer.validated_data["new_password"]

            try:
                # Find valid token
                reset_token = PasswordResetToken.objects.get(
                    token=token, is_active=True
                )

                # Check if token is valid
                if not reset_token.is_valid:
                    # Log failed password reset due to invalid token
                    AuditLog.log_security_event(
                        event_type="password_reset_failed",
                        request=request,
                        user=reset_token.user,
                        message=f"Password reset failed for user {reset_token.user.username} - invalid or expired token",
                        extra_data={
                            "token_id": str(reset_token.id),
                            "token_expired": reset_token.is_expired,
                            "token_used": bool(reset_token.used_at),
                            "reason": "invalid_token",
                        },
                    )
                    return Response(
                        {"error": "Token inválido o expirado"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                # Update user password
                user = reset_token.user
                user.set_password(new_password)
                user.save()

                # Mark token as used
                reset_token.mark_as_used()

                # Invalidate all existing refresh tokens for this user
                # This forces re-authentication on all devices
                from rest_framework_simplejwt.token_blacklist.models import (
                    OutstandingToken,
                )

                try:
                    outstanding_tokens = OutstandingToken.objects.filter(user=user)
                    for outstanding_token in outstanding_tokens:
                        try:
                            token_obj = RefreshToken(outstanding_token.token)
                            token_obj.blacklist()
                        except:
                            pass
                except:
                    pass

                # Log successful password reset
                AuditLog.log_event(
                    event_type="password_reset_success",
                    request=request,
                    user=user,
                    message=f"Password successfully reset for user {user.username}",
                    extra_data={
                        "token_id": str(reset_token.id),
                        "all_sessions_invalidated": True,
                    },
                    severity="medium",
                )

                return Response(
                    {"message": "Contraseña restablecida exitosamente"},
                    status=status.HTTP_200_OK,
                )

            except PasswordResetToken.DoesNotExist:
                # Log failed password reset due to non-existent token
                AuditLog.log_security_event(
                    event_type="password_reset_failed",
                    request=request,
                    message="Password reset failed - token not found",
                    extra_data={
                        "token": token[:8] + "...",  # Log partial token for debugging
                        "reason": "token_not_found",
                    },
                )
                return Response(
                    {"error": "Token inválido o expirado"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            # Log failed password reset due to validation errors
            AuditLog.log_event(
                event_type="password_reset_failed",
                request=request,
                message="Password reset failed due to validation errors",
                extra_data={
                    "validation_errors": serializer.errors,
                    "reason": "validation_failed",
                },
                severity="low",
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(
    summary="Cambiar contraseña (usuario autenticado)",
    description="""
    Permite a un usuario autenticado cambiar su contraseña.
    
    - Requiere la contraseña actual para verificación
    - La nueva contraseña debe cumplir con los requisitos de seguridad
    - Se invalidan todas las sesiones activas excepto la actual
    """,
    tags=["Authentication"],
    request=PasswordChangeSerializer,
    responses={
        200: {
            "type": "object",
            "properties": {
                "message": {
                    "type": "string",
                    "example": "Contraseña cambiada exitosamente",
                }
            },
        },
        400: {
            "type": "object",
            "properties": {
                "error": {
                    "type": "string",
                    "example": "La contraseña actual es incorrecta",
                }
            },
        },
    },
)
class PasswordChangeView(APIView):
    """
    Vista para cambio de contraseña de usuarios autenticados
    """

    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [SecurityEventThrottle, UserBasedThrottle]
    throttle_scope = "security_event"

    @require_verification("password_change")
    def post(self, request):
        with SecurityMonitor(request, "password_change"):
            serializer = PasswordChangeSerializer(
                data=request.data, context={"request": request}
            )
        if serializer.is_valid():
            new_password = serializer.validated_data["new_password"]

            # Update user password
            user = request.user
            user.set_password(new_password)
            user.save()

            # Deactivate any existing password reset tokens
            PasswordResetToken.deactivate_user_tokens(user)

            # Invalidate all other refresh tokens for this user (keep current session)
            from rest_framework_simplejwt.token_blacklist.models import OutstandingToken

            try:
                outstanding_tokens = OutstandingToken.objects.filter(user=user)
                current_token = request.auth  # Current access token

                for outstanding_token in outstanding_tokens:
                    try:
                        token_obj = RefreshToken(outstanding_token.token)
                        # Don't blacklist the current session's refresh token
                        if str(token_obj.token) != str(current_token):
                            token_obj.blacklist()
                    except:
                        pass
            except:
                pass

            # Log successful password change
            AuditLog.log_event(
                event_type="password_change_success",
                request=request,
                user=user,
                message=f"Password successfully changed for user {user.username}",
                extra_data={
                    "other_sessions_invalidated": True,
                    "current_session_preserved": True,
                },
                severity="medium",
            )

            return Response(
                {"message": "Contraseña cambiada exitosamente"},
                status=status.HTTP_200_OK,
            )
        else:
            # Log failed password change
            AuditLog.log_event(
                event_type="password_change_failed",
                request=request,
                user=request.user,
                message=f"Password change failed for user {request.user.username}",
                extra_data={
                    "validation_errors": serializer.errors,
                    "reason": "validation_failed",
                },
                severity="medium",
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
