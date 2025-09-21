from apps.core.models import AuditLog
from apps.core.permissions import IsAdminUser
from apps.core.throttles import SecurityEventThrottle, UserBasedThrottle
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.utils import timezone
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView

from .mfa_serializers import (
    BackupCodeSerializer,
    BackupCodeVerifySerializer,
    MFAEnforcementSerializer,
    MFAStatusSerializer,
    TOTPConfirmSerializer,
    TOTPDeviceSerializer,
    TOTPSetupSerializer,
    TOTPVerifySerializer,
)
from .models import BackupCode, MFAEnforcementPolicy, TOTPDevice

User = get_user_model()


@extend_schema(
    summary="Obtener estado de MFA",
    description="""
    Obtiene el estado actual de la autenticación multifactor para el usuario autenticado.
    
    Incluye información sobre:
    - Si MFA está habilitado
    - Si TOTP está configurado
    - Número de códigos de respaldo disponibles
    - Si MFA es requerido para el rol del usuario
    """,
    tags=["MFA"],
    responses={
        200: MFAStatusSerializer,
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
class MFAStatusView(APIView):
    """
    Vista para obtener el estado de MFA del usuario
    """

    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [UserBasedThrottle]
    throttle_scope = "auth_default"

    def get(self, request):
        user = request.user

        try:
            totp_device = user.totp_device
            totp_configured = totp_device.confirmed
            mfa_enabled = totp_device.is_active and totp_device.confirmed
        except TOTPDevice.DoesNotExist:
            totp_configured = False
            mfa_enabled = False

        backup_codes_count = BackupCode.objects.filter(user=user, is_used=False).count()

        # Check if MFA is required for user's role
        mfa_required = MFAEnforcementPolicy.is_mfa_required_for_role(user.role)

        data = {
            "mfa_enabled": mfa_enabled,
            "totp_configured": totp_configured,
            "backup_codes_count": backup_codes_count,
            "mfa_required": mfa_required,
        }

        serializer = MFAStatusSerializer(data)
        return Response(serializer.data)


@extend_schema(
    summary="Iniciar configuración de TOTP",
    description="""
    Inicia la configuración de TOTP para el usuario autenticado.
    
    Genera un nuevo dispositivo TOTP con:
    - Clave secreta única
    - URI de aprovisionamiento para códigos QR
    - Código QR en formato base64
    
    El dispositivo no se activa hasta que se confirme con un token válido.
    """,
    tags=["MFA"],
    request=TOTPSetupSerializer,
    responses={
        200: {
            "type": "object",
            "properties": {
                "secret_key": {
                    "type": "string",
                    "description": "Clave secreta para configurar la aplicación TOTP",
                },
                "provisioning_uri": {
                    "type": "string",
                    "description": "URI de aprovisionamiento para códigos QR",
                },
                "qr_code": {
                    "type": "string",
                    "description": "Código QR en formato base64",
                },
                "device": {"$ref": "#/components/schemas/TOTPDevice"},
            },
        },
        400: {
            "type": "object",
            "properties": {
                "error": {
                    "type": "string",
                    "example": "TOTP ya está configurado para este usuario",
                }
            },
        },
    },
)
class TOTPSetupView(APIView):
    """
    Vista para iniciar la configuración de TOTP
    """

    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [UserBasedThrottle]
    throttle_scope = "auth_default"

    def post(self, request):
        serializer = TOTPSetupSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user

            # Check if user already has a confirmed TOTP device
            try:
                existing_device = user.totp_device
                if existing_device.confirmed:
                    # Log attempt to setup TOTP when already configured
                    AuditLog.log_event(
                        event_type="totp_setup_attempt",
                        request=request,
                        user=user,
                        message=f"User {user.username} attempted to setup TOTP when already configured",
                        extra_data={
                            "existing_device_id": str(existing_device.id),
                            "existing_device_confirmed": existing_device.confirmed,
                        },
                        severity="low",
                    )
                    return Response(
                        {"error": "TOTP ya está configurado para este usuario"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                else:
                    # Delete unconfirmed device and create new one
                    existing_device.delete()
            except TOTPDevice.DoesNotExist:
                pass

            # Create new TOTP device
            device_name = serializer.validated_data.get("name", "Tecmilenio 2FA")
            totp_device = TOTPDevice.objects.create(
                user=user,
                name=device_name,
                is_active=False,  # Will be activated after confirmation
                confirmed=False,
            )

            # Log TOTP setup initiation
            AuditLog.log_event(
                event_type="totp_setup_initiated",
                request=request,
                user=user,
                message=f"TOTP setup initiated for user {user.username}",
                extra_data={
                    "device_id": str(totp_device.id),
                    "device_name": device_name,
                },
                severity="medium",
            )

            # Return setup information
            response_data = {
                "secret_key": totp_device.secret_key,
                "provisioning_uri": totp_device.get_provisioning_uri(),
                "qr_code": totp_device.get_qr_code(),
                "device": TOTPDeviceSerializer(totp_device).data,
            }

            return Response(response_data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(
    summary="Confirmar configuración de TOTP",
    description="""
    Confirma la configuración de TOTP verificando un token generado por la aplicación.
    
    Una vez confirmado:
    - El dispositivo TOTP se activa
    - Se generan códigos de respaldo automáticamente
    - MFA queda habilitado para el usuario
    """,
    tags=["MFA"],
    request=TOTPConfirmSerializer,
    responses={
        200: {
            "type": "object",
            "properties": {
                "message": {
                    "type": "string",
                    "example": "TOTP configurado exitosamente",
                },
                "backup_codes": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Códigos de respaldo generados",
                },
            },
        },
        400: {
            "type": "object",
            "properties": {
                "error": {"type": "string", "example": "Token TOTP inválido"}
            },
        },
    },
)
class TOTPConfirmView(APIView):
    """
    Vista para confirmar la configuración de TOTP
    """

    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [UserBasedThrottle, SecurityEventThrottle]
    throttle_scope = "security_event"

    def post(self, request):
        serializer = TOTPConfirmSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            token = serializer.validated_data["token"]

            try:
                totp_device = user.totp_device

                if totp_device.confirmed:
                    return Response(
                        {"error": "TOTP ya está confirmado para este usuario"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                # Verify the token
                if totp_device.verify_token(token):
                    # Activate and confirm the device
                    totp_device.is_active = True
                    totp_device.confirmed = True
                    totp_device.save(update_fields=["is_active", "confirmed"])

                    # Generate backup codes
                    backup_codes = BackupCode.generate_codes_for_user(user)

                    # Log successful TOTP confirmation
                    AuditLog.log_event(
                        event_type="totp_confirmed",
                        request=request,
                        user=user,
                        message=f"TOTP successfully confirmed for user {user.username}",
                        extra_data={
                            "device_id": str(totp_device.id),
                            "backup_codes_generated": len(backup_codes),
                        },
                        severity="medium",
                    )

                    return Response(
                        {
                            "message": "TOTP configurado exitosamente",
                            "backup_codes": backup_codes,
                        },
                        status=status.HTTP_200_OK,
                    )
                else:
                    # Log failed TOTP confirmation
                    AuditLog.log_security_event(
                        event_type="totp_confirmation_failed",
                        request=request,
                        user=user,
                        message=f"Failed TOTP confirmation for user {user.username}",
                        extra_data={
                            "device_id": str(totp_device.id),
                            "token_provided": token[:2]
                            + "****",  # Partial token for debugging
                        },
                    )
                    return Response(
                        {"error": "Token TOTP inválido"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

            except TOTPDevice.DoesNotExist:
                # Log attempt to confirm non-existent TOTP
                AuditLog.log_security_event(
                    event_type="totp_confirmation_failed",
                    request=request,
                    user=user,
                    message=f"TOTP confirmation attempted without setup for user {user.username}",
                    extra_data={
                        "error": "no_totp_device",
                    },
                )
                return Response(
                    {"error": "No hay dispositivo TOTP configurado"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(
    summary="Verificar token TOTP",
    description="""
    Verifica un token TOTP para autenticación multifactor.
    
    Acepta tokens TOTP de 6 dígitos generados por aplicaciones como:
    - Google Authenticator
    - Authy
    - Microsoft Authenticator
    """,
    tags=["MFA"],
    request=TOTPVerifySerializer,
    responses={
        200: {
            "type": "object",
            "properties": {
                "valid": {"type": "boolean", "example": True},
                "message": {"type": "string", "example": "Token TOTP válido"},
            },
        },
        400: {
            "type": "object",
            "properties": {
                "error": {"type": "string", "example": "Token TOTP inválido"}
            },
        },
    },
)
class TOTPVerifyView(APIView):
    """
    Vista para verificar tokens TOTP
    """

    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [UserBasedThrottle, SecurityEventThrottle]
    throttle_scope = "security_event"

    def post(self, request):
        serializer = TOTPVerifySerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            token = serializer.validated_data["token"]

            try:
                totp_device = user.totp_device

                if not totp_device.is_active or not totp_device.confirmed:
                    return Response(
                        {"error": "TOTP no está configurado o activado"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                # Verify the token
                if totp_device.verify_token(token):
                    # Log successful TOTP verification
                    AuditLog.log_event(
                        event_type="totp_verified",
                        request=request,
                        user=user,
                        message=f"TOTP token successfully verified for user {user.username}",
                        extra_data={
                            "device_id": str(totp_device.id),
                        },
                        severity="low",
                    )

                    return Response(
                        {"valid": True, "message": "Token TOTP válido"},
                        status=status.HTTP_200_OK,
                    )
                else:
                    # Log failed TOTP verification
                    AuditLog.log_security_event(
                        event_type="totp_verification_failed",
                        request=request,
                        user=user,
                        message=f"Failed TOTP verification for user {user.username}",
                        extra_data={
                            "device_id": str(totp_device.id),
                            "token_provided": token[:2] + "****",
                        },
                    )
                    return Response(
                        {"valid": False, "error": "Token TOTP inválido"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

            except TOTPDevice.DoesNotExist:
                return Response(
                    {"error": "No hay dispositivo TOTP configurado"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(
    summary="Deshabilitar TOTP",
    description="""
    Deshabilita TOTP para el usuario autenticado.
    
    Requiere verificación con token TOTP actual.
    También elimina todos los códigos de respaldo asociados.
    """,
    tags=["MFA"],
    request=TOTPVerifySerializer,
    responses={
        200: {
            "type": "object",
            "properties": {
                "message": {
                    "type": "string",
                    "example": "TOTP deshabilitado exitosamente",
                }
            },
        },
        400: {
            "type": "object",
            "properties": {
                "error": {"type": "string", "example": "Token TOTP inválido"}
            },
        },
    },
)
class TOTPDisableView(APIView):
    """
    Vista para deshabilitar TOTP
    """

    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [UserBasedThrottle, SecurityEventThrottle]
    throttle_scope = "security_event"

    def post(self, request):
        serializer = TOTPVerifySerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            token = serializer.validated_data["token"]

            try:
                totp_device = user.totp_device

                if not totp_device.is_active or not totp_device.confirmed:
                    return Response(
                        {"error": "TOTP no está configurado o activado"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                # Verify the token before disabling
                if totp_device.verify_token(token):
                    # Delete the TOTP device
                    device_id = str(totp_device.id)
                    totp_device.delete()

                    # Delete all backup codes
                    backup_codes_deleted = BackupCode.objects.filter(user=user).count()
                    BackupCode.objects.filter(user=user).delete()

                    # Log TOTP disable
                    AuditLog.log_event(
                        event_type="totp_disabled",
                        request=request,
                        user=user,
                        message=f"TOTP disabled for user {user.username}",
                        extra_data={
                            "device_id": device_id,
                            "backup_codes_deleted": backup_codes_deleted,
                        },
                        severity="medium",
                    )

                    return Response(
                        {"message": "TOTP deshabilitado exitosamente"},
                        status=status.HTTP_200_OK,
                    )
                else:
                    # Log failed TOTP disable attempt
                    AuditLog.log_security_event(
                        event_type="totp_disable_failed",
                        request=request,
                        user=user,
                        message=f"Failed TOTP disable attempt for user {user.username}",
                        extra_data={
                            "device_id": str(totp_device.id),
                            "reason": "invalid_token",
                        },
                    )
                    return Response(
                        {"error": "Token TOTP inválido"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

            except TOTPDevice.DoesNotExist:
                return Response(
                    {"error": "No hay dispositivo TOTP configurado"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(
    summary="Obtener códigos de respaldo",
    description="""
    Obtiene los códigos de respaldo disponibles para el usuario autenticado.
    
    Requiere verificación con token TOTP actual.
    Solo muestra códigos no utilizados.
    """,
    tags=["MFA"],
    request=TOTPVerifySerializer,
    responses={
        200: {
            "type": "object",
            "properties": {
                "backup_codes": {
                    "type": "array",
                    "items": {"$ref": "#/components/schemas/BackupCode"},
                }
            },
        },
        400: {
            "type": "object",
            "properties": {
                "error": {"type": "string", "example": "Token TOTP inválido"}
            },
        },
    },
)
class BackupCodesView(APIView):
    """
    Vista para obtener códigos de respaldo
    """

    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [UserBasedThrottle, SecurityEventThrottle]
    throttle_scope = "security_event"

    def post(self, request):
        serializer = TOTPVerifySerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            token = serializer.validated_data["token"]

            try:
                totp_device = user.totp_device

                if not totp_device.is_active or not totp_device.confirmed:
                    return Response(
                        {"error": "TOTP no está configurado o activado"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                # Verify the token
                if totp_device.verify_token(token):
                    # Get unused backup codes
                    backup_codes = BackupCode.objects.filter(
                        user=user, is_used=False
                    ).order_by("created_at")

                    # Log backup codes access
                    AuditLog.log_event(
                        event_type="backup_codes_accessed",
                        request=request,
                        user=user,
                        message=f"Backup codes accessed by user {user.username}",
                        extra_data={
                            "codes_count": backup_codes.count(),
                        },
                        severity="medium",
                    )

                    serializer = BackupCodeSerializer(backup_codes, many=True)
                    return Response(
                        {"backup_codes": serializer.data}, status=status.HTTP_200_OK
                    )
                else:
                    return Response(
                        {"error": "Token TOTP inválido"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

            except TOTPDevice.DoesNotExist:
                return Response(
                    {"error": "No hay dispositivo TOTP configurado"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(
    summary="Regenerar códigos de respaldo",
    description="""
    Regenera todos los códigos de respaldo para el usuario autenticado.
    
    Requiere verificación con token TOTP actual.
    Invalida todos los códigos existentes y genera nuevos.
    """,
    tags=["MFA"],
    request=TOTPVerifySerializer,
    responses={
        200: {
            "type": "object",
            "properties": {
                "message": {
                    "type": "string",
                    "example": "Códigos de respaldo regenerados exitosamente",
                },
                "backup_codes": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Nuevos códigos de respaldo",
                },
            },
        },
        400: {
            "type": "object",
            "properties": {
                "error": {"type": "string", "example": "Token TOTP inválido"}
            },
        },
    },
)
class BackupCodesRegenerateView(APIView):
    """
    Vista para regenerar códigos de respaldo
    """

    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [UserBasedThrottle, SecurityEventThrottle]
    throttle_scope = "security_event"

    def post(self, request):
        serializer = TOTPVerifySerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            token = serializer.validated_data["token"]

            try:
                totp_device = user.totp_device

                if not totp_device.is_active or not totp_device.confirmed:
                    return Response(
                        {"error": "TOTP no está configurado o activado"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                # Verify the token
                if totp_device.verify_token(token):
                    # Count existing codes before deletion
                    old_codes_count = BackupCode.objects.filter(user=user).count()

                    # Generate new backup codes (this deletes old ones)
                    backup_codes = BackupCode.generate_codes_for_user(user)

                    # Log backup codes regeneration
                    AuditLog.log_event(
                        event_type="backup_codes_regenerated",
                        request=request,
                        user=user,
                        message=f"Backup codes regenerated for user {user.username}",
                        extra_data={
                            "old_codes_count": old_codes_count,
                            "new_codes_count": len(backup_codes),
                        },
                        severity="medium",
                    )

                    return Response(
                        {
                            "message": "Códigos de respaldo regenerados exitosamente",
                            "backup_codes": backup_codes,
                        },
                        status=status.HTTP_200_OK,
                    )
                else:
                    return Response(
                        {"error": "Token TOTP inválido"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

            except TOTPDevice.DoesNotExist:
                return Response(
                    {"error": "No hay dispositivo TOTP configurado"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(
    summary="Verificar código de respaldo",
    description="""
    Verifica un código de respaldo para autenticación multifactor.
    
    Los códigos de respaldo son de un solo uso y se marcan como utilizados
    después de una verificación exitosa.
    """,
    tags=["MFA"],
    request=BackupCodeVerifySerializer,
    responses={
        200: {
            "type": "object",
            "properties": {
                "valid": {"type": "boolean", "example": True},
                "message": {"type": "string", "example": "Código de respaldo válido"},
                "remaining_codes": {
                    "type": "integer",
                    "description": "Códigos de respaldo restantes",
                },
            },
        },
        400: {
            "type": "object",
            "properties": {
                "error": {"type": "string", "example": "Código de respaldo inválido"}
            },
        },
    },
)
class BackupCodeVerifyView(APIView):
    """
    Vista para verificar códigos de respaldo
    """

    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [UserBasedThrottle, SecurityEventThrottle]
    throttle_scope = "security_event"

    def post(self, request):
        serializer = BackupCodeVerifySerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            code = serializer.validated_data["code"]

            # Verify the backup code
            if BackupCode.verify_code(user, code):
                # Count remaining codes
                remaining_codes = BackupCode.objects.filter(
                    user=user, is_used=False
                ).count()

                # Log successful backup code verification
                AuditLog.log_event(
                    event_type="backup_code_verified",
                    request=request,
                    user=user,
                    message=f"Backup code successfully verified for user {user.username}",
                    extra_data={
                        "code_used": code[:2] + "****",
                        "remaining_codes": remaining_codes,
                    },
                    severity="medium",
                )

                return Response(
                    {
                        "valid": True,
                        "message": "Código de respaldo válido",
                        "remaining_codes": remaining_codes,
                    },
                    status=status.HTTP_200_OK,
                )
            else:
                # Log failed backup code verification
                AuditLog.log_security_event(
                    event_type="backup_code_verification_failed",
                    request=request,
                    user=user,
                    message=f"Failed backup code verification for user {user.username}",
                    extra_data={
                        "code_attempted": code[:2] + "****",
                    },
                )
                return Response(
                    {"valid": False, "error": "Código de respaldo inválido"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(
    summary="Obtener políticas de aplicación MFA",
    description="""
    Obtiene las políticas de aplicación MFA para todos los roles.
    
    Solo disponible para administradores.
    """,
    tags=["MFA Admin"],
    responses={
        200: {
            "type": "array",
            "items": {"$ref": "#/components/schemas/MFAEnforcementPolicy"},
        },
        403: {
            "type": "object",
            "properties": {
                "detail": {
                    "type": "string",
                    "example": "You do not have permission to perform this action.",
                }
            },
        },
    },
)
class MFAEnforcementPolicyListView(APIView):
    """
    Vista para listar políticas de aplicación MFA
    """

    permission_classes = [IsAdminUser]
    throttle_classes = [UserBasedThrottle]
    throttle_scope = "auth_default"

    def get(self, request):
        policies = MFAEnforcementPolicy.objects.all().order_by("role")

        # If no policies exist, create default ones
        if not policies.exists():
            self._create_default_policies()
            policies = MFAEnforcementPolicy.objects.all().order_by("role")

        data = []
        for policy in policies:
            data.append(
                {
                    "role": policy.role,
                    "mfa_required": policy.mfa_required,
                    "grace_period_days": policy.grace_period_days,
                    "enforcement_date": policy.enforcement_date,
                    "is_enforcement_active": policy.is_enforcement_active(),
                    "created_at": policy.created_at,
                    "updated_at": policy.updated_at,
                }
            )

        return Response(data, status=status.HTTP_200_OK)

    def _create_default_policies(self):
        """Create default MFA enforcement policies"""
        default_policies = [
            {"role": "admin", "mfa_required": True, "grace_period_days": 3},
            {"role": "president", "mfa_required": True, "grace_period_days": 7},
            {"role": "student", "mfa_required": False, "grace_period_days": 14},
        ]

        for policy_data in default_policies:
            MFAEnforcementPolicy.objects.get_or_create(
                role=policy_data["role"], defaults=policy_data
            )


@extend_schema(
    summary="Actualizar política de aplicación MFA",
    description="""
    Actualiza la política de aplicación MFA para un rol específico.
    
    Solo disponible para administradores.
    """,
    tags=["MFA Admin"],
    request=MFAEnforcementSerializer,
    responses={
        200: {
            "type": "object",
            "properties": {
                "message": {
                    "type": "string",
                    "example": "Política MFA actualizada exitosamente",
                },
                "policy": {"$ref": "#/components/schemas/MFAEnforcementPolicy"},
            },
        },
        400: {
            "type": "object",
            "properties": {
                "error": {"type": "string", "example": "Datos de política inválidos"}
            },
        },
        403: {
            "type": "object",
            "properties": {
                "detail": {
                    "type": "string",
                    "example": "You do not have permission to perform this action.",
                }
            },
        },
    },
)
class MFAEnforcementPolicyUpdateView(APIView):
    """
    Vista para actualizar políticas de aplicación MFA
    """

    permission_classes = [IsAdminUser]
    throttle_classes = [UserBasedThrottle, SecurityEventThrottle]
    throttle_scope = "security_event"

    def post(self, request):
        serializer = MFAEnforcementSerializer(data=request.data)
        if serializer.is_valid():
            role = serializer.validated_data["role"]
            mfa_required = serializer.validated_data["mfa_required"]
            grace_period_days = serializer.validated_data["grace_period_days"]

            # Get or create policy
            policy, created = MFAEnforcementPolicy.objects.get_or_create(
                role=role,
                defaults={
                    "mfa_required": mfa_required,
                    "grace_period_days": grace_period_days,
                    "enforcement_date": timezone.now() if mfa_required else None,
                },
            )

            if not created:
                # Update existing policy
                old_mfa_required = policy.mfa_required
                policy.mfa_required = mfa_required
                policy.grace_period_days = grace_period_days

                # Set enforcement date if MFA is being enabled
                if not old_mfa_required and mfa_required:
                    policy.enforcement_date = timezone.now()
                elif not mfa_required:
                    policy.enforcement_date = None

                policy.save()

            # Log policy change
            AuditLog.log_event(
                event_type="mfa_policy_updated",
                request=request,
                user=request.user,
                message=f"MFA policy updated for role {role} by admin {request.user.username}",
                extra_data={
                    "role": role,
                    "mfa_required": mfa_required,
                    "grace_period_days": grace_period_days,
                    "policy_created": created,
                    "enforcement_date": (
                        policy.enforcement_date.isoformat()
                        if policy.enforcement_date
                        else None
                    ),
                },
                severity="high",
            )

            policy_data = {
                "role": policy.role,
                "mfa_required": policy.mfa_required,
                "grace_period_days": policy.grace_period_days,
                "enforcement_date": policy.enforcement_date,
                "is_enforcement_active": policy.is_enforcement_active(),
                "created_at": policy.created_at,
                "updated_at": policy.updated_at,
            }

            return Response(
                {
                    "message": "Política MFA actualizada exitosamente",
                    "policy": policy_data,
                },
                status=status.HTTP_200_OK,
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
