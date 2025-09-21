from django.contrib.auth import get_user_model
from rest_framework import serializers

from .verification_models import (
    EmailVerificationToken,
    PhoneVerificationToken,
    UserVerificationStatus,
    VerificationRequirement,
)

User = get_user_model()


class EmailVerificationRequestSerializer(serializers.Serializer):
    """
    Serializer for email verification request
    """

    email = serializers.EmailField(
        required=False,
        help_text="Email a verificar (opcional, usa el email del usuario si no se proporciona)",
    )

    def validate_email(self, value):
        """Validate email format and domain"""
        if value:
            # Validate Tecmilenio domain
            if not value.endswith("@tecmilenio.mx"):
                raise serializers.ValidationError(
                    "El email debe pertenecer al dominio @tecmilenio.mx"
                )
        return value


class EmailVerificationConfirmSerializer(serializers.Serializer):
    """
    Serializer for email verification confirmation
    """

    token = serializers.CharField(
        max_length=64, help_text="Token de verificación de email"
    )

    def validate_token(self, value):
        """Validate that token exists and is valid"""
        try:
            token_obj = EmailVerificationToken.objects.get(token=value)
            if not token_obj.is_valid:
                raise serializers.ValidationError("Token inválido o expirado")
            return value
        except EmailVerificationToken.DoesNotExist:
            raise serializers.ValidationError("Token inválido")


class PhoneVerificationRequestSerializer(serializers.Serializer):
    """
    Serializer for phone verification request
    """

    phone_number = serializers.CharField(
        max_length=20,
        required=False,
        help_text="Número de teléfono a verificar (opcional, usa el teléfono del usuario si no se proporciona)",
    )

    def validate_phone_number(self, value):
        """Validate phone number format"""
        if value:
            # Remove spaces and special characters
            cleaned = "".join(filter(str.isdigit, value))
            if len(cleaned) < 9 or len(cleaned) > 15:
                raise serializers.ValidationError(
                    "El número de teléfono debe tener entre 9 y 15 dígitos"
                )
        return value


class PhoneVerificationConfirmSerializer(serializers.Serializer):
    """
    Serializer for phone verification confirmation
    """

    phone_number = serializers.CharField(
        max_length=20, help_text="Número de teléfono que se está verificando"
    )
    token = serializers.CharField(
        max_length=6, min_length=6, help_text="Código de verificación de 6 dígitos"
    )

    def validate_token(self, value):
        """Validate token format"""
        if not value.isdigit():
            raise serializers.ValidationError("El código debe contener solo dígitos")
        return value


class UserVerificationStatusSerializer(serializers.ModelSerializer):
    """
    Serializer for user verification status
    """

    verification_progress = serializers.ReadOnlyField()
    is_fully_verified = serializers.ReadOnlyField()

    class Meta:
        model = UserVerificationStatus
        fields = [
            "email_verified",
            "email_verified_at",
            "phone_verified",
            "phone_verified_at",
            "account_verified",
            "account_verified_at",
            "email_verification_required",
            "phone_verification_required",
            "verification_progress",
            "is_fully_verified",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "email_verified",
            "email_verified_at",
            "phone_verified",
            "phone_verified_at",
            "account_verified",
            "account_verified_at",
            "created_at",
            "updated_at",
        ]


class VerificationRequirementSerializer(serializers.ModelSerializer):
    """
    Serializer for verification requirements
    """

    operation_display = serializers.CharField(
        source="get_operation_display", read_only=True
    )
    verification_type_display = serializers.CharField(
        source="get_verification_type_display", read_only=True
    )

    class Meta:
        model = VerificationRequirement
        fields = [
            "id",
            "operation",
            "operation_display",
            "verification_type",
            "verification_type_display",
            "required_for_roles",
            "is_active",
            "description",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]


class VerificationCheckSerializer(serializers.Serializer):
    """
    Serializer for checking verification requirements
    """

    operation = serializers.ChoiceField(
        choices=VerificationRequirement.OPERATION_CHOICES,
        help_text="Operación a verificar",
    )

    def validate_operation(self, value):
        """Validate that operation exists"""
        return value


class VerificationCheckResponseSerializer(serializers.Serializer):
    """
    Serializer for verification check response
    """

    verification_required = serializers.BooleanField(
        help_text="Indica si se requiere verificación"
    )
    verification_type = serializers.CharField(
        allow_null=True, help_text="Tipo de verificación requerida"
    )
    message = serializers.CharField(
        help_text="Mensaje descriptivo del estado de verificación"
    )
    user_verification_status = UserVerificationStatusSerializer(
        help_text="Estado actual de verificación del usuario"
    )


class ResendVerificationSerializer(serializers.Serializer):
    """
    Serializer for resending verification tokens
    """

    VERIFICATION_TYPE_CHOICES = [
        ("email", "Email"),
        ("phone", "Teléfono"),
    ]

    verification_type = serializers.ChoiceField(
        choices=VERIFICATION_TYPE_CHOICES, help_text="Tipo de verificación a reenviar"
    )
    email = serializers.EmailField(
        required=False,
        help_text="Email para verificación (requerido si verification_type es 'email')",
    )
    phone_number = serializers.CharField(
        max_length=20,
        required=False,
        help_text="Teléfono para verificación (requerido si verification_type es 'phone')",
    )

    def validate(self, attrs):
        """Validate required fields based on verification type"""
        verification_type = attrs.get("verification_type")

        if verification_type == "email" and not attrs.get("email"):
            raise serializers.ValidationError(
                {"email": "Email es requerido para verificación de email"}
            )

        if verification_type == "phone" and not attrs.get("phone_number"):
            raise serializers.ValidationError(
                {
                    "phone_number": "Número de teléfono es requerido para verificación de teléfono"
                }
            )

        return attrs

    def validate_email(self, value):
        """Validate email format and domain"""
        if value and not value.endswith("@tecmilenio.mx"):
            raise serializers.ValidationError(
                "El email debe pertenecer al dominio @tecmilenio.mx"
            )
        return value

    def validate_phone_number(self, value):
        """Validate phone number format"""
        if value:
            cleaned = "".join(filter(str.isdigit, value))
            if len(cleaned) < 9 or len(cleaned) > 15:
                raise serializers.ValidationError(
                    "El número de teléfono debe tener entre 9 y 15 dígitos"
                )
        return value


class BulkVerificationStatusSerializer(serializers.Serializer):
    """
    Serializer for bulk verification status updates (admin only)
    """

    user_ids = serializers.ListField(
        child=serializers.UUIDField(), help_text="Lista de IDs de usuarios a actualizar"
    )
    email_verified = serializers.BooleanField(
        required=False, help_text="Marcar email como verificado"
    )
    phone_verified = serializers.BooleanField(
        required=False, help_text="Marcar teléfono como verificado"
    )
    email_verification_required = serializers.BooleanField(
        required=False, help_text="Requerir verificación de email"
    )
    phone_verification_required = serializers.BooleanField(
        required=False, help_text="Requerir verificación de teléfono"
    )

    def validate_user_ids(self, value):
        """Validate that all user IDs exist"""
        if not value:
            raise serializers.ValidationError(
                "Debe proporcionar al menos un ID de usuario"
            )

        existing_users = User.objects.filter(id__in=value).count()
        if existing_users != len(value):
            raise serializers.ValidationError("Algunos IDs de usuario no existen")

        return value

    def validate(self, attrs):
        """Validate that at least one field is being updated"""
        update_fields = [
            "email_verified",
            "phone_verified",
            "email_verification_required",
            "phone_verification_required",
        ]

        if not any(field in attrs for field in update_fields):
            raise serializers.ValidationError(
                "Debe proporcionar al menos un campo para actualizar"
            )

        return attrs
