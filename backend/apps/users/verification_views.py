from apps.core.models import AuditLog
from apps.core.permissions import IsAdminUser
from apps.core.throttles import (
    IPBasedThrottle,
    SecurityEventThrottle,
    UserBasedThrottle,
)
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils import timezone
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import GenericViewSet

from .sms_service import check_sms_rate_limit, send_phone_verification_sms
from .verification_models import (
    EmailVerificationToken,
    PhoneVerificationToken,
    UserVerificationStatus,
    VerificationRequirement,
)
from .verification_serializers import (
    BulkVerificationStatusSerializer,
    EmailVerificationConfirmSerializer,
    EmailVerificationRequestSerializer,
    PhoneVerificationConfirmSerializer,
    PhoneVerificationRequestSerializer,
    ResendVerificationSerializer,
    UserVerificationStatusSerializer,
    VerificationCheckResponseSerializer,
    VerificationCheckSerializer,
    VerificationRequirementSerializer,
)

User = get_user_model()


def get_client_ip(request):
    """Get client IP address from request"""
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        ip = x_forwarded_for.split(",")[0]
    else:
        ip = request.META.get("REMOTE_ADDR")
    return ip


@extend_schema_view(
    post=extend_schema(
        summary="Solicitar verificación de email",
        description="""
        Solicita la verificación de email enviando un token de verificación.
        
        - Se envía un email con un enlace de verificación válido por 24 horas
        - Si no se proporciona email, se usa el email actual del usuario
        - Está limitado por tasa para prevenir abuso
        """,
        tags=["Verification"],
        request=EmailVerificationRequestSerializer,
        responses={
            200: {
                "type": "object",
                "properties": {
                    "message": {
                        "type": "string",
                        "example": "Email de verificación enviado exitosamente",
                    }
                },
            }
        },
    )
)
class EmailVerificationRequestView(APIView):
    """
    Vista para solicitar verificación de email
    """

    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [SecurityEventThrottle, UserBasedThrottle]
    throttle_scope = "security_event"

    def post(self, request):
        serializer = EmailVerificationRequestSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data.get("email", request.user.email)

            # Deactivate existing tokens for this email
            EmailVerificationToken.deactivate_user_tokens(request.user, email)

            # Create new verification token
            verification_token = EmailVerificationToken.objects.create(
                user=request.user,
                email=email,
                ip_address=get_client_ip(request),
                user_agent=request.META.get("HTTP_USER_AGENT", ""),
            )

            # Send verification email
            success = self._send_verification_email(
                request.user, email, verification_token.token, request
            )

            if success:
                # Log successful email verification request
                AuditLog.log_event(
                    event_type="email_verification_request",
                    request=request,
                    user=request.user,
                    message=f"Email verification requested for {email}",
                    extra_data={
                        "email": email,
                        "token_id": str(verification_token.id),
                    },
                    severity="low",
                )

                return Response(
                    {"message": "Email de verificación enviado exitosamente"},
                    status=status.HTTP_200_OK,
                )
            else:
                return Response(
                    {"error": "Error enviando email de verificación"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def _send_verification_email(self, user, email, token, request):
        """Send email verification email"""
        try:
            # Build verification URL
            protocol = "https" if request.is_secure() else "http"
            domain = request.get_host()
            verification_url = f"{protocol}://{domain}/verify-email?token={token}"

            # Email context
            context = {
                "user": user,
                "email": email,
                "verification_url": verification_url,
                "site_url": f"{protocol}://{domain}",
            }

            # Render email template
            html_message = render_to_string("emails/email_verification.html", context)

            # Send email
            send_mail(
                subject="Verificación de Email - Grupos Estudiantiles",
                message=f"Haz clic en el siguiente enlace para verificar tu email: {verification_url}",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                html_message=html_message,
                fail_silently=False,
            )

            return True

        except Exception as e:
            print(f"Error sending email verification: {e}")
            return False


@extend_schema_view(
    post=extend_schema(
        summary="Confirmar verificación de email",
        description="""
        Confirma la verificación de email usando el token recibido.
        
        - El token debe ser válido y no haber expirado (24 horas de validez)
        - Una vez usado, el token se invalida automáticamente
        - Actualiza el estado de verificación del usuario
        """,
        tags=["Verification"],
        request=EmailVerificationConfirmSerializer,
        responses={
            200: {
                "type": "object",
                "properties": {
                    "message": {
                        "type": "string",
                        "example": "Email verificado exitosamente",
                    }
                },
            }
        },
    )
)
class EmailVerificationConfirmView(APIView):
    """
    Vista para confirmar verificación de email
    """

    permission_classes = [permissions.AllowAny]
    throttle_classes = [IPBasedThrottle]
    throttle_scope = "auth_default"

    def post(self, request):
        serializer = EmailVerificationConfirmSerializer(data=request.data)
        if serializer.is_valid():
            token = serializer.validated_data["token"]

            try:
                verification_token = EmailVerificationToken.objects.get(
                    token=token, is_active=True
                )

                if not verification_token.is_valid:
                    return Response(
                        {"error": "Token inválido o expirado"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                # Mark token as verified
                verification_token.mark_as_verified()

                # Update user verification status
                verification_status, _ = UserVerificationStatus.get_or_create_for_user(
                    verification_token.user
                )
                verification_status.mark_email_verified()

                # Log successful email verification
                AuditLog.log_event(
                    event_type="email_verification_success",
                    request=request,
                    user=verification_token.user,
                    message=f"Email {verification_token.email} verified successfully",
                    extra_data={
                        "email": verification_token.email,
                        "token_id": str(verification_token.id),
                    },
                    severity="low",
                )

                return Response(
                    {"message": "Email verificado exitosamente"},
                    status=status.HTTP_200_OK,
                )

            except EmailVerificationToken.DoesNotExist:
                return Response(
                    {"error": "Token inválido"}, status=status.HTTP_400_BAD_REQUEST
                )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema_view(
    post=extend_schema(
        summary="Solicitar verificación de teléfono",
        description="""
        Solicita la verificación de teléfono enviando un código SMS.
        
        - Se envía un SMS con un código de 6 dígitos válido por 10 minutos
        - Si no se proporciona teléfono, se usa el teléfono actual del usuario
        - Está limitado por tasa (3 SMS por hora por número)
        """,
        tags=["Verification"],
        request=PhoneVerificationRequestSerializer,
        responses={
            200: {
                "type": "object",
                "properties": {
                    "message": {
                        "type": "string",
                        "example": "Código de verificación enviado por SMS",
                    }
                },
            }
        },
    )
)
class PhoneVerificationRequestView(APIView):
    """
    Vista para solicitar verificación de teléfono
    """

    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [SecurityEventThrottle, UserBasedThrottle]
    throttle_scope = "security_event"

    def post(self, request):
        serializer = PhoneVerificationRequestSerializer(data=request.data)
        if serializer.is_valid():
            phone_number = serializer.validated_data.get(
                "phone_number", request.user.phone
            )

            if not phone_number:
                return Response(
                    {"error": "Número de teléfono requerido"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Check SMS rate limit
            can_send, remaining = check_sms_rate_limit(phone_number)
            if not can_send:
                return Response(
                    {"error": "Límite de SMS alcanzado. Intenta de nuevo en una hora."},
                    status=status.HTTP_429_TOO_MANY_REQUESTS,
                )

            # Deactivate existing tokens for this phone
            PhoneVerificationToken.deactivate_user_tokens(request.user, phone_number)

            # Create new verification token
            verification_token = PhoneVerificationToken.objects.create(
                user=request.user,
                phone_number=phone_number,
                ip_address=get_client_ip(request),
                user_agent=request.META.get("HTTP_USER_AGENT", ""),
            )

            # Send SMS
            success, error_message = send_phone_verification_sms(
                phone_number, verification_token.token
            )

            if success:
                # Log successful phone verification request
                AuditLog.log_event(
                    event_type="phone_verification_request",
                    request=request,
                    user=request.user,
                    message=f"Phone verification requested for {phone_number}",
                    extra_data={
                        "phone_number": phone_number,
                        "token_id": str(verification_token.id),
                    },
                    severity="low",
                )

                return Response(
                    {"message": "Código de verificación enviado por SMS"},
                    status=status.HTTP_200_OK,
                )
            else:
                return Response(
                    {"error": error_message or "Error enviando SMS"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema_view(
    post=extend_schema(
        summary="Confirmar verificación de teléfono",
        description="""
        Confirma la verificación de teléfono usando el código SMS recibido.
        
        - El código debe ser válido y no haber expirado (10 minutos de validez)
        - Máximo 3 intentos por token
        - Una vez usado, el token se invalida automáticamente
        """,
        tags=["Verification"],
        request=PhoneVerificationConfirmSerializer,
        responses={
            200: {
                "type": "object",
                "properties": {
                    "message": {
                        "type": "string",
                        "example": "Teléfono verificado exitosamente",
                    }
                },
            }
        },
    )
)
class PhoneVerificationConfirmView(APIView):
    """
    Vista para confirmar verificación de teléfono
    """

    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [SecurityEventThrottle, UserBasedThrottle]
    throttle_scope = "security_event"

    def post(self, request):
        serializer = PhoneVerificationConfirmSerializer(data=request.data)
        if serializer.is_valid():
            phone_number = serializer.validated_data["phone_number"]
            token = serializer.validated_data["token"]

            try:
                verification_token = PhoneVerificationToken.objects.get(
                    user=request.user, phone_number=phone_number, is_active=True
                )

                if verification_token.verify_token(token):
                    # Update user verification status
                    verification_status, _ = (
                        UserVerificationStatus.get_or_create_for_user(request.user)
                    )
                    verification_status.mark_phone_verified()

                    # Log successful phone verification
                    AuditLog.log_event(
                        event_type="phone_verification_success",
                        request=request,
                        user=request.user,
                        message=f"Phone {phone_number} verified successfully",
                        extra_data={
                            "phone_number": phone_number,
                            "token_id": str(verification_token.id),
                        },
                        severity="low",
                    )

                    return Response(
                        {"message": "Teléfono verificado exitosamente"},
                        status=status.HTTP_200_OK,
                    )
                else:
                    # Log failed phone verification
                    AuditLog.log_security_event(
                        event_type="phone_verification_failed",
                        request=request,
                        user=request.user,
                        message=f"Failed phone verification attempt for {phone_number}",
                        extra_data={
                            "phone_number": phone_number,
                            "token_id": str(verification_token.id),
                            "attempts": verification_token.attempts,
                        },
                    )

                    if verification_token.attempts >= verification_token.max_attempts:
                        return Response(
                            {
                                "error": "Máximo número de intentos alcanzado. Solicita un nuevo código."
                            },
                            status=status.HTTP_400_BAD_REQUEST,
                        )
                    else:
                        remaining = (
                            verification_token.max_attempts
                            - verification_token.attempts
                        )
                        return Response(
                            {
                                "error": f"Código incorrecto. Te quedan {remaining} intentos."
                            },
                            status=status.HTTP_400_BAD_REQUEST,
                        )

            except PhoneVerificationToken.DoesNotExist:
                return Response(
                    {"error": "Token de verificación no encontrado"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema_view(
    get=extend_schema(
        summary="Obtener estado de verificación",
        description="Obtiene el estado actual de verificación del usuario autenticado",
        tags=["Verification"],
        responses={200: UserVerificationStatusSerializer},
    ),
    patch=extend_schema(
        summary="Actualizar requerimientos de verificación",
        description="Actualiza los requerimientos de verificación del usuario (solo campos editables)",
        tags=["Verification"],
        request=UserVerificationStatusSerializer,
        responses={200: UserVerificationStatusSerializer},
    ),
)
class UserVerificationStatusView(APIView):
    """
    Vista para obtener y actualizar el estado de verificación del usuario
    """

    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [UserBasedThrottle]
    throttle_scope = "auth_default"

    def get(self, request):
        verification_status, _ = UserVerificationStatus.get_or_create_for_user(
            request.user
        )
        serializer = UserVerificationStatusSerializer(verification_status)
        return Response(serializer.data)

    def patch(self, request):
        verification_status, _ = UserVerificationStatus.get_or_create_for_user(
            request.user
        )
        serializer = UserVerificationStatusSerializer(
            verification_status, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema_view(
    post=extend_schema(
        summary="Verificar requerimientos para operación",
        description="""
        Verifica si el usuario cumple con los requerimientos de verificación para una operación específica.
        
        Retorna información sobre qué tipo de verificación se requiere (si alguna).
        """,
        tags=["Verification"],
        request=VerificationCheckSerializer,
        responses={200: VerificationCheckResponseSerializer},
    )
)
class VerificationCheckView(APIView):
    """
    Vista para verificar requerimientos de verificación para operaciones
    """

    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [UserBasedThrottle]
    throttle_scope = "auth_default"

    def post(self, request):
        serializer = VerificationCheckSerializer(data=request.data)
        if serializer.is_valid():
            operation = serializer.validated_data["operation"]

            # Check verification requirements
            verification_required, verification_type = (
                VerificationRequirement.check_verification_required(
                    operation, request.user
                )
            )

            # Get user verification status
            verification_status, _ = UserVerificationStatus.get_or_create_for_user(
                request.user
            )

            # Generate response message
            if not verification_required:
                message = "No se requiere verificación adicional para esta operación"
            else:
                if verification_type == "email":
                    message = "Se requiere verificación de email para esta operación"
                elif verification_type == "phone":
                    message = "Se requiere verificación de teléfono para esta operación"
                elif verification_type == "account":
                    message = "Se requiere cuenta completamente verificada para esta operación"
                else:
                    message = "Se requiere verificación adicional para esta operación"

            response_data = {
                "verification_required": verification_required,
                "verification_type": verification_type,
                "message": message,
                "user_verification_status": UserVerificationStatusSerializer(
                    verification_status
                ).data,
            }

            return Response(response_data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema_view(
    post=extend_schema(
        summary="Reenviar verificación",
        description="""
        Reenvía un token de verificación (email o SMS).
        
        - Invalida tokens anteriores y genera uno nuevo
        - Respeta límites de tasa para prevenir abuso
        """,
        tags=["Verification"],
        request=ResendVerificationSerializer,
        responses={
            200: {
                "type": "object",
                "properties": {
                    "message": {
                        "type": "string",
                        "example": "Verificación reenviada exitosamente",
                    }
                },
            }
        },
    )
)
class ResendVerificationView(APIView):
    """
    Vista para reenviar verificaciones
    """

    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [SecurityEventThrottle, UserBasedThrottle]
    throttle_scope = "security_event"

    def post(self, request):
        serializer = ResendVerificationSerializer(data=request.data)
        if serializer.is_valid():
            verification_type = serializer.validated_data["verification_type"]

            if verification_type == "email":
                return self._resend_email_verification(
                    request, serializer.validated_data
                )
            elif verification_type == "phone":
                return self._resend_phone_verification(
                    request, serializer.validated_data
                )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def _resend_email_verification(self, request, data):
        """Resend email verification"""
        email = data.get("email", request.user.email)

        # Use the email verification request view logic
        email_view = EmailVerificationRequestView()
        email_view.request = request

        return email_view.post(request)

    def _resend_phone_verification(self, request, data):
        """Resend phone verification"""
        phone_number = data.get("phone_number", request.user.phone)

        if not phone_number:
            return Response(
                {"error": "Número de teléfono requerido"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Use the phone verification request view logic
        phone_view = PhoneVerificationRequestView()
        phone_view.request = request

        # Create request data
        request.data = {"phone_number": phone_number}

        return phone_view.post(request)


@extend_schema_view(
    list=extend_schema(
        summary="Listar requerimientos de verificación",
        description="Lista todos los requerimientos de verificación configurados (solo admin)",
        tags=["Verification - Admin"],
    ),
    create=extend_schema(
        summary="Crear requerimiento de verificación",
        description="Crea un nuevo requerimiento de verificación (solo admin)",
        tags=["Verification - Admin"],
    ),
    retrieve=extend_schema(
        summary="Obtener requerimiento de verificación",
        description="Obtiene un requerimiento de verificación específico (solo admin)",
        tags=["Verification - Admin"],
    ),
    update=extend_schema(
        summary="Actualizar requerimiento de verificación",
        description="Actualiza un requerimiento de verificación (solo admin)",
        tags=["Verification - Admin"],
    ),
    destroy=extend_schema(
        summary="Eliminar requerimiento de verificación",
        description="Elimina un requerimiento de verificación (solo admin)",
        tags=["Verification - Admin"],
    ),
)
class VerificationRequirementViewSet(GenericViewSet):
    """
    ViewSet para gestión de requerimientos de verificación (solo admin)
    """

    queryset = VerificationRequirement.objects.all()
    serializer_class = VerificationRequirementSerializer
    permission_classes = [IsAdminUser]
    throttle_classes = [UserBasedThrottle]
    throttle_scope = "auth_default"

    def list(self, request):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def create(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def retrieve(self, request, pk=None):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def update(self, request, pk=None):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, pk=None):
        instance = self.get_object()
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @extend_schema(
        summary="Crear requerimientos por defecto",
        description="Crea los requerimientos de verificación por defecto del sistema",
        tags=["Verification - Admin"],
        responses={
            200: {
                "type": "object",
                "properties": {
                    "message": {
                        "type": "string",
                        "example": "Requerimientos por defecto creados exitosamente",
                    }
                },
            }
        },
    )
    @action(detail=False, methods=["post"])
    def create_defaults(self, request):
        """Crear requerimientos de verificación por defecto"""
        VerificationRequirement.create_default_requirements()
        return Response({"message": "Requerimientos por defecto creados exitosamente"})

    @extend_schema(
        summary="Actualización masiva de estados de verificación",
        description="Actualiza el estado de verificación de múltiples usuarios (solo admin)",
        tags=["Verification - Admin"],
        request=BulkVerificationStatusSerializer,
        responses={
            200: {
                "type": "object",
                "properties": {
                    "message": {
                        "type": "string",
                        "example": "Estados de verificación actualizados exitosamente",
                    },
                    "updated_count": {"type": "integer", "example": 5},
                },
            }
        },
    )
    @action(detail=False, methods=["post"])
    def bulk_update_status(self, request):
        """Actualización masiva de estados de verificación"""
        serializer = BulkVerificationStatusSerializer(data=request.data)
        if serializer.is_valid():
            user_ids = serializer.validated_data["user_ids"]
            update_fields = {}

            # Prepare update fields
            for field in [
                "email_verified",
                "phone_verified",
                "email_verification_required",
                "phone_verification_required",
            ]:
                if field in serializer.validated_data:
                    update_fields[field] = serializer.validated_data[field]

            # Update verification statuses
            updated_count = 0
            for user_id in user_ids:
                try:
                    user = User.objects.get(id=user_id)
                    verification_status, _ = (
                        UserVerificationStatus.get_or_create_for_user(user)
                    )

                    for field, value in update_fields.items():
                        setattr(verification_status, field, value)

                    verification_status.save()
                    updated_count += 1

                except User.DoesNotExist:
                    continue

            return Response(
                {
                    "message": "Estados de verificación actualizados exitosamente",
                    "updated_count": updated_count,
                }
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
