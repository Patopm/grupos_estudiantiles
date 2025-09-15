from rest_framework import serializers
from django.contrib.auth import get_user_model
from drf_spectacular.utils import extend_schema_field

from .models import Student, StudentGroup

User = get_user_model()


class StudentGroupSerializer(serializers.ModelSerializer):
    """
    Serializer for StudentGroup model
    """
    
    president_name = serializers.SerializerMethodField()
    student_count = serializers.SerializerMethodField()
    president_details = serializers.SerializerMethodField()
    
    class Meta:
        model = StudentGroup
        fields = [
            'id', 'name', 'description', 'president', 'president_name',
            'president_details', 'student_count', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'student_count']
    
    @extend_schema_field(serializers.CharField)
    def get_president_name(self, obj):
        """Retorna el nombre del presidente del grupo"""
        return obj.president_name
    
    @extend_schema_field(serializers.IntegerField)
    def get_student_count(self, obj):
        """Retorna el número de estudiantes activos en el grupo"""
        return obj.student_count
    
    @extend_schema_field(serializers.DictField)
    def get_president_details(self, obj):
        """Retorna detalles del presidente si existe"""
        if obj.president:
            return {
                'id': obj.president.id,
                'full_name': obj.president.get_full_name(),
                'email': obj.president.email
            }
        return None


class StudentGroupCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating StudentGroup
    """
    
    class Meta:
        model = StudentGroup
        fields = ['name', 'description', 'president']
    
    def validate_president(self, value):
        """Valida que el presidente tenga el rol correcto"""
        if value and not value.is_president:
            raise serializers.ValidationError(
                "El usuario seleccionado debe tener rol de presidente"
            )
        return value


class StudentSerializer(serializers.ModelSerializer):
    """
    Serializer for Student model with user information
    """
    
    full_name = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()
    user_details = serializers.SerializerMethodField()
    group_name = serializers.SerializerMethodField()
    is_graduated = serializers.SerializerMethodField()
    
    class Meta:
        model = Student
        fields = [
            'user', 'tuition_number', 'group', 'group_name',
            'career', 'semester', 'enrollment_date', 'graduation_date',
            'average_grade', 'is_active', 'full_name', 'email',
            'user_details', 'is_graduated', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    @extend_schema_field(serializers.CharField)
    def get_full_name(self, obj):
        """Retorna el nombre completo del estudiante"""
        return obj.full_name
    
    @extend_schema_field(serializers.EmailField)
    def get_email(self, obj):
        """Retorna el email del estudiante"""
        return obj.email
    
    @extend_schema_field(serializers.CharField)
    def get_group_name(self, obj):
        """Retorna el nombre del grupo"""
        return obj.group.name if obj.group else None
    
    @extend_schema_field(serializers.BooleanField)
    def get_is_graduated(self, obj):
        """Retorna si el estudiante está graduado"""
        return obj.is_graduated
    
    @extend_schema_field(serializers.DictField)
    def get_user_details(self, obj):
        """Retorna detalles del usuario asociado"""
        return {
            'id': obj.user.id,
            'username': obj.user.username,
            'full_name': obj.user.get_full_name(),
            'email': obj.user.email,
            'phone': obj.user.phone
        }


class StudentCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating Student
    """
    
    class Meta:
        model = Student
        fields = [
            'user', 'tuition_number', 'group', 'career',
            'semester', 'enrollment_date', 'average_grade'
        ]
    
    def validate_user(self, value):
        """Valida que el usuario tenga el rol correcto"""
        if not value.is_student:
            raise serializers.ValidationError(
                "El usuario seleccionado debe tener rol de estudiante"
            )
        return value
    
    def validate_tuition_number(self, value):
        """Valida que el ID de estudiante sea único"""
        if Student.objects.filter(tuition_number=value).exists():
            raise serializers.ValidationError(
                "Ya existe un estudiante con esta matrícula"
            )
        return value


class StudentUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating Student information
    """
    
    class Meta:
        model = Student
        fields = [
            'group', 'career', 'semester', 'graduation_date',
            'average_grade', 'is_active'
        ]


class StudentProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for student's own profile view
    """
    
    full_name = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()
    group_name = serializers.SerializerMethodField()
    is_graduated = serializers.SerializerMethodField()
    
    class Meta:
        model = Student
        fields = [
            'tuition_number', 'group_name', 'career', 'semester',
            'enrollment_date', 'graduation_date', 'average_grade',
            'full_name', 'email', 'is_graduated', 'created_at'
        ]
        read_only_fields = [
            'tuition_number', 'enrollment_date', 'created_at'
        ]
    
    @extend_schema_field(serializers.CharField)
    def get_full_name(self, obj):
        return obj.full_name
    
    @extend_schema_field(serializers.EmailField)
    def get_email(self, obj):
        return obj.email
    
    @extend_schema_field(serializers.CharField)
    def get_group_name(self, obj):
        return obj.group.name if obj.group else None
    
    @extend_schema_field(serializers.BooleanField)
    def get_is_graduated(self, obj):
        return obj.is_graduated
