from django.contrib.auth import get_user_model

from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from .models import GroupMembership, StudentGroup

User = get_user_model()


class StudentGroupSerializer(serializers.ModelSerializer):
    """
    Serializer for StudentGroup model according to specifications
    """

    president_name = serializers.SerializerMethodField()
    member_count = serializers.SerializerMethodField()
    pending_requests_count = serializers.SerializerMethodField()
    president_details = serializers.SerializerMethodField()
    is_full = serializers.SerializerMethodField()

    class Meta:
        model = StudentGroup
        fields = [
            "group_id",
            "name",
            "description",
            "image",
            "president",
            "president_name",
            "president_details",
            "created_at",
            "is_active",
            "max_members",
            "category",
            "member_count",
            "pending_requests_count",
            "is_full",
        ]
        read_only_fields = [
            "group_id",
            "created_at",
            "member_count",
            "pending_requests_count",
            "is_full",
        ]

    @extend_schema_field(serializers.CharField)
    def get_president_name(self, obj):
        """Retorna el nombre del presidente del grupo"""
        return obj.president_name

    @extend_schema_field(serializers.IntegerField)
    def get_member_count(self, obj):
        """Retorna el número de miembros activos en el grupo"""
        return obj.member_count

    @extend_schema_field(serializers.IntegerField)
    def get_pending_requests_count(self, obj):
        """Retorna el número de solicitudes pendientes"""
        return obj.pending_requests_count

    @extend_schema_field(serializers.BooleanField)
    def get_is_full(self, obj):
        """Retorna si el grupo está lleno"""
        return obj.is_full

    @extend_schema_field(serializers.DictField)
    def get_president_details(self, obj):
        """Retorna detalles del presidente si existe"""
        if obj.president:
            return {
                "id": obj.president.id,
                "full_name": obj.president.get_full_name(),
                "email": obj.president.email,
                "student_id": obj.president.student_id,
            }
        return None


class StudentGroupCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating StudentGroup
    """

    class Meta:
        model = StudentGroup
        fields = [
            "name",
            "description",
            "image",
            "president",
            "max_members",
            "category",
        ]

    def validate_president(self, value):
        """Valida que el presidente tenga el rol correcto"""
        if value and not value.is_president:
            raise serializers.ValidationError(
                "El usuario seleccionado debe tener rol de presidente"
            )
        return value


class GroupMembershipSerializer(serializers.ModelSerializer):
    """
    Serializer for GroupMembership model
    """

    user_details = serializers.SerializerMethodField()
    group_details = serializers.SerializerMethodField()

    class Meta:
        model = GroupMembership
        fields = [
            "membership_id",
            "user",
            "group",
            "status",
            "joined_at",
            "role",
            "user_details",
            "group_details",
        ]
        read_only_fields = ["membership_id", "joined_at"]

    @extend_schema_field(serializers.DictField)
    def get_user_details(self, obj):
        """Retorna detalles del usuario"""
        return {
            "id": obj.user.id,
            "full_name": obj.user.get_full_name(),
            "email": obj.user.email,
            "student_id": obj.user.student_id,
            "phone": obj.user.phone,
        }

    @extend_schema_field(serializers.DictField)
    def get_group_details(self, obj):
        """Retorna detalles del grupo"""
        return {
            "group_id": str(obj.group.group_id),
            "name": obj.group.name,
            "category": obj.group.category,
        }


class GroupMembershipCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating GroupMembership (join request)
    """

    class Meta:
        model = GroupMembership
        fields = ["group"]

    def validate_group(self, value):
        """Valida que el grupo esté activo y no esté lleno"""
        if not value.is_active:
            raise serializers.ValidationError("El grupo no está activo")

        if value.is_full:
            raise serializers.ValidationError("El grupo está lleno")

        return value

    def validate(self, attrs):
        """Valida que el usuario no tenga ya una membresía en el grupo"""
        user = self.context["request"].user
        group = attrs["group"]

        if GroupMembership.objects.filter(user=user, group=group).exists():
            raise serializers.ValidationError(
                "Ya tienes una solicitud o membresía en este grupo"
            )

        return attrs

    def create(self, validated_data):
        """Crea la membresía con el usuario del request"""
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)


class GroupMembershipUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating GroupMembership status (approve/reject)
    """

    class Meta:
        model = GroupMembership
        fields = ["status"]

    def validate_status(self, value):
        """Valida que el estado sea válido para la transición"""
        valid_statuses = ["active", "inactive"]
        if value not in valid_statuses:
            raise serializers.ValidationError(
                f"Estado inválido. Debe ser uno de: {valid_statuses}"
            )
        return value


class GroupMembersListSerializer(serializers.ModelSerializer):
    """
    Serializer for listing group members
    """

    user_details = serializers.SerializerMethodField()

    class Meta:
        model = GroupMembership
        fields = ["membership_id", "status", "joined_at", "role", "user_details"]

    @extend_schema_field(serializers.DictField)
    def get_user_details(self, obj):
        """Retorna detalles del usuario miembro"""
        return {
            "id": obj.user.id,
            "full_name": obj.user.get_full_name(),
            "email": obj.user.email,
            "student_id": obj.user.student_id,
            "phone": obj.user.phone,
            "is_active_student": obj.user.is_active_student,
        }
