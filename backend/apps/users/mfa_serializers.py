from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import BackupCode, TOTPDevice

User = get_user_model()


class TOTPSetupSerializer(serializers.Serializer):
    """
    Serializer for TOTP setup initiation
    """

    name = serializers.CharField(
        max_length=100,
        default="Tecmilenio 2FA",
        help_text="Nombre del dispositivo TOTP",
    )

    def validate_name(self, value):
        """Validate device name"""
        if not value.strip():
            raise serializers.ValidationError(
                "El nombre del dispositivo no puede estar vacío"
            )
        return value.strip()


class TOTPVerifySerializer(serializers.Serializer):
    """
    Serializer for TOTP token verification
    """

    token = serializers.CharField(
        min_length=6, max_length=6, help_text="Código TOTP de 6 dígitos"
    )

    def validate_token(self, value):
        """Validate TOTP token format"""
        if not value.isdigit():
            raise serializers.ValidationError("El token debe contener solo dígitos")
        if len(value) != 6:
            raise serializers.ValidationError(
                "El token debe tener exactamente 6 dígitos"
            )
        return value


class TOTPConfirmSerializer(serializers.Serializer):
    """
    Serializer for TOTP setup confirmation
    """

    token = serializers.CharField(
        min_length=6,
        max_length=6,
        help_text="Código TOTP de 6 dígitos para confirmar la configuración",
    )

    def validate_token(self, value):
        """Validate TOTP token format"""
        if not value.isdigit():
            raise serializers.ValidationError("El token debe contener solo dígitos")
        if len(value) != 6:
            raise serializers.ValidationError(
                "El token debe tener exactamente 6 dígitos"
            )
        return value


class TOTPDeviceSerializer(serializers.ModelSerializer):
    """
    Serializer for TOTP device information
    """

    class Meta:
        model = TOTPDevice
        fields = ["id", "name", "is_active", "confirmed", "created_at", "last_used_at"]
        read_only_fields = ["id", "created_at", "last_used_at"]


class BackupCodeSerializer(serializers.ModelSerializer):
    """
    Serializer for backup codes
    """

    class Meta:
        model = BackupCode
        fields = ["code", "is_used", "used_at", "created_at"]
        read_only_fields = ["code", "is_used", "used_at", "created_at"]


class MFAStatusSerializer(serializers.Serializer):
    """
    Serializer for MFA status information
    """

    mfa_enabled = serializers.BooleanField(read_only=True)
    totp_configured = serializers.BooleanField(read_only=True)
    backup_codes_count = serializers.IntegerField(read_only=True)
    mfa_required = serializers.BooleanField(read_only=True)


class MFALoginSerializer(serializers.Serializer):
    """
    Serializer for MFA-enabled login
    """

    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    mfa_token = serializers.CharField(
        required=False,
        min_length=6,
        max_length=16,
        help_text="Código TOTP de 6 dígitos o código de respaldo",
    )

    def validate_mfa_token(self, value):
        """Validate MFA token format"""
        if value:
            value = value.strip().upper()
            # TOTP tokens are 6 digits, backup codes are 8 characters
            if not (value.isdigit() and len(value) == 6) and not (len(value) == 8):
                raise serializers.ValidationError(
                    "El token MFA debe ser un código TOTP de 6 dígitos o un código de respaldo de 8 caracteres"
                )
        return value


class BackupCodeVerifySerializer(serializers.Serializer):
    """
    Serializer for backup code verification
    """

    code = serializers.CharField(
        min_length=8, max_length=8, help_text="Código de respaldo de 8 caracteres"
    )

    def validate_code(self, value):
        """Validate backup code format"""
        value = value.strip().upper()
        if len(value) != 8:
            raise serializers.ValidationError(
                "El código de respaldo debe tener exactamente 8 caracteres"
            )
        return value


class MFAEnforcementSerializer(serializers.Serializer):
    """
    Serializer for MFA enforcement policies
    """

    role = serializers.ChoiceField(
        choices=[
            ("admin", "Administrador"),
            ("president", "Presidente"),
            ("student", "Estudiante"),
        ],
        help_text="Rol de usuario",
    )
    mfa_required = serializers.BooleanField(
        help_text="Si MFA es requerido para este rol"
    )
    grace_period_days = serializers.IntegerField(
        min_value=0,
        max_value=30,
        default=7,
        help_text="Días de gracia para configurar MFA",
    )
