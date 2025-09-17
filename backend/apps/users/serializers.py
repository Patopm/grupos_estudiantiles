from django.contrib.auth import authenticate, get_user_model

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
            'id', 'username', 'email', 'first_name', 'last_name', 'role',
            'role_display', 'full_name', 'student_id', 'phone',
            'is_active_student', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
        extra_kwargs = {
            'password': {
                'write_only': True
            },
            'email': {
                'required': True
            },
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
            'username', 'email', 'first_name', 'last_name', 'role',
            'student_id', 'phone', 'password', 'password_confirm'
        ]
        extra_kwargs = {
            'password': {
                'write_only': True
            },
            'email': {
                'required': True
            },
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Las contraseñas no coinciden")

        # Validate student_id is required for students
        if attrs.get('role') == 'student' and not attrs.get('student_id'):
            raise serializers.ValidationError(
                "La matrícula es requerida para estudiantes")

        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
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
            'id', 'username', 'email', 'first_name', 'last_name', 'role',
            'role_display', 'full_name', 'student_id', 'phone',
            'is_active_student', 'created_at'
        ]
        read_only_fields = [
            'id', 'username', 'role', 'student_id', 'created_at'
        ]

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
        username = attrs.get('username')
        password = attrs.get('password')

        if username and password:
            user = authenticate(username=username, password=password)

            if not user:
                raise serializers.ValidationError('Credenciales inválidas')

            if not user.is_active:
                raise serializers.ValidationError('Cuenta desactivada')

            attrs['user'] = user
            return attrs
        else:
            raise serializers.ValidationError(
                'Debe incluir username y password')


class UserRoleUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating user roles (admin only)
    """

    class Meta:
        model = User
        fields = ['role']

    def validate_role(self, value):
        valid_roles = ['admin', 'president', 'student']
        if value not in valid_roles:
            raise serializers.ValidationError(
                f'Rol inválido. Debe ser uno de: {valid_roles}')
        return value
