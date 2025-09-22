from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError

from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

User = get_user_model()


class CustomUserSerializer(serializers.ModelSerializer):
    """
    Serializer for CustomUser model with all required fields
    """

    full_name = serializers.SerializerMethodField()
    role_display = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "role_display",
            "full_name",
            "student_id",
            "phone",
            "is_active_student",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
        extra_kwargs = {
            "password": {"write_only": True},
            "email": {"required": True},
        }

    @extend_schema_field(serializers.CharField)
    def get_full_name(self, obj):
        """Retorna el nombre completo del usuario"""
        return obj.get_full_name()

    @extend_schema_field(serializers.CharField)
    def get_role_display(self, obj):
        """Retorna el nombre legible del rol"""
        return obj.get_role_display()


class UserCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new users
    """

    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "student_id",
            "phone",
            "password",
            "password_confirm",
        ]
        extra_kwargs = {
            "password": {"write_only": True},
            "email": {"required": True},
        }

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError("Las contraseñas no coinciden")

        # Validate student_id is required for students
        if attrs.get("role") == "student" and not attrs.get("student_id"):
            raise serializers.ValidationError(
                "La matrícula es requerida para estudiantes"
            )

        return attrs

    def create(self, validated_data):
        validated_data.pop("password_confirm")
        password = validated_data.pop("password")
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for user profile (own information)
    """

    full_name = serializers.SerializerMethodField()
    role_display = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "role_display",
            "full_name",
            "student_id",
            "phone",
            "is_active_student",
            "created_at",
        ]
        read_only_fields = ["id", "username", "role", "student_id", "created_at"]

    @extend_schema_field(serializers.CharField)
    def get_full_name(self, obj):
        return obj.get_full_name()

    @extend_schema_field(serializers.CharField)
    def get_role_display(self, obj):
        return obj.get_role_display()


class LoginSerializer(serializers.Serializer):
    """
    Serializer for user authentication
    """

    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        username = attrs.get("username")
        password = attrs.get("password")

        if username and password:
            user = authenticate(username=username, password=password)

            if not user:
                raise serializers.ValidationError("Credenciales inválidas")

            if not user.is_active:
                raise serializers.ValidationError("Cuenta desactivada")

            attrs["user"] = user
            return attrs
        else:
            raise serializers.ValidationError("Debe incluir username y password")


class UserRoleUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating user roles (admin only)
    """

    class Meta:
        model = User
        fields = ["role"]

    def validate_role(self, value):
        valid_roles = ["admin", "president", "student"]
        if value not in valid_roles:
            raise serializers.ValidationError(
                f"Rol inválido. Debe ser uno de: {valid_roles}"
            )
        return value


class PasswordResetRequestSerializer(serializers.Serializer):
    """
    Serializer for password reset request
    """

    email = serializers.EmailField(
        help_text="Correo electrónico del usuario que solicita el restablecimiento"
    )

    def validate_email(self, value):
        """Validate that the email exists in the system"""
        # Note: We don't raise an error if email doesn't exist to prevent user enumeration
        # The validation is handled in the view
        return value.lower()


class PasswordResetConfirmSerializer(serializers.Serializer):
    """
    Serializer for password reset confirmation
    """

    token = serializers.CharField(
        max_length=64, help_text="Token de restablecimiento de contraseña"
    )
    new_password = serializers.CharField(
        min_length=8,
        write_only=True,
        help_text="Nueva contraseña (mínimo 8 caracteres)",
    )
    confirm_password = serializers.CharField(
        min_length=8, write_only=True, help_text="Confirmación de la nueva contraseña"
    )

    def validate(self, attrs):
        """Validate password confirmation and strength"""
        new_password = attrs.get("new_password")
        confirm_password = attrs.get("confirm_password")

        if new_password != confirm_password:
            raise serializers.ValidationError(
                {"confirm_password": "Las contraseñas no coinciden"}
            )

        # Validate password strength using Django's validators
        try:
            validate_password(new_password)
        except ValidationError as e:
            raise serializers.ValidationError({"new_password": list(e.messages)})

        return attrs


class PasswordChangeSerializer(serializers.Serializer):
    """
    Serializer for password change (authenticated users)
    """

    current_password = serializers.CharField(
        write_only=True, help_text="Contraseña actual del usuario"
    )
    new_password = serializers.CharField(
        min_length=8,
        write_only=True,
        help_text="Nueva contraseña (mínimo 8 caracteres)",
    )
    confirm_password = serializers.CharField(
        min_length=8, write_only=True, help_text="Confirmación de la nueva contraseña"
    )

    def validate_current_password(self, value):
        """Validate current password"""
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("La contraseña actual es incorrecta")
        return value

    def validate(self, attrs):
        """Validate password confirmation and strength"""
        new_password = attrs.get("new_password")
        confirm_password = attrs.get("confirm_password")

        if new_password != confirm_password:
            raise serializers.ValidationError(
                {"confirm_password": "Las contraseñas no coinciden"}
            )

        # Validate password strength using Django's validators
        try:
            user = self.context["request"].user
            validate_password(new_password, user)
        except ValidationError as e:
            raise serializers.ValidationError({"new_password": list(e.messages)})

        return attrs
