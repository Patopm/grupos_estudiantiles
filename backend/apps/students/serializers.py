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


class GroupStatisticsSerializer(serializers.Serializer):
    """
    Serializer for group statistics data
    """

    total_members = serializers.IntegerField(help_text="Total number of members")
    active_members = serializers.IntegerField(help_text="Number of active members")
    pending_requests = serializers.IntegerField(help_text="Number of pending requests")
    total_events = serializers.IntegerField(
        help_text="Total events created by this group"
    )
    upcoming_events = serializers.IntegerField(help_text="Number of upcoming events")
    past_events = serializers.IntegerField(help_text="Number of past events")
    average_event_attendance = serializers.FloatField(
        help_text="Average attendance per event"
    )
    membership_growth_rate = serializers.FloatField(
        help_text="Membership growth rate (last 30 days)"
    )
    most_popular_event_type = serializers.CharField(
        help_text="Most popular event type", allow_null=True
    )
    last_activity_date = serializers.DateTimeField(
        help_text="Date of last group activity", allow_null=True
    )


class GroupDetailedSerializer(serializers.ModelSerializer):
    """
    Serializer for detailed group information including members and events
    """

    president_name = serializers.SerializerMethodField()
    member_count = serializers.SerializerMethodField()
    pending_requests_count = serializers.SerializerMethodField()
    president_details = serializers.SerializerMethodField()
    is_full = serializers.SerializerMethodField()
    members = serializers.SerializerMethodField()
    upcoming_events = serializers.SerializerMethodField()
    past_events = serializers.SerializerMethodField()
    membership_history = serializers.SerializerMethodField()
    statistics = serializers.SerializerMethodField()

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
            "members",
            "upcoming_events",
            "past_events",
            "membership_history",
            "statistics",
        ]
        read_only_fields = [
            "group_id",
            "created_at",
            "member_count",
            "pending_requests_count",
            "is_full",
            "members",
            "upcoming_events",
            "past_events",
            "membership_history",
            "statistics",
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

    @extend_schema_field(GroupMembersListSerializer(many=True))
    def get_members(self, obj):
        """Retorna la lista de miembros activos del grupo"""
        active_members = obj.memberships.filter(status="active").order_by("-joined_at")
        return GroupMembersListSerializer(active_members, many=True).data

    @extend_schema_field(serializers.ListField)
    def get_upcoming_events(self, obj):
        """Retorna eventos futuros del grupo"""
        from apps.events.models import Event
        from django.utils import timezone

        upcoming_events = Event.objects.filter(
            target_groups=obj, start_datetime__gt=timezone.now(), status="published"
        ).order_by("start_datetime")[
            :5
        ]  # Limit to 5 upcoming events

        return [
            {
                "event_id": str(event.event_id),
                "title": event.title,
                "event_type": event.event_type,
                "start_datetime": event.start_datetime,
                "end_datetime": event.end_datetime,
                "location": event.location,
                "attendee_count": event.attendee_count,
                "max_attendees": event.max_attendees,
                "registration_open": event.registration_open,
                "image": event.image.url if event.image else None,
            }
            for event in upcoming_events
        ]

    @extend_schema_field(serializers.ListField)
    def get_past_events(self, obj):
        """Retorna eventos pasados del grupo (últimos 5)"""
        from apps.events.models import Event
        from django.utils import timezone

        past_events = Event.objects.filter(
            target_groups=obj,
            end_datetime__lt=timezone.now(),
            status__in=["published", "completed"],
        ).order_by("-end_datetime")[
            :5
        ]  # Limit to 5 recent past events

        return [
            {
                "event_id": str(event.event_id),
                "title": event.title,
                "event_type": event.event_type,
                "start_datetime": event.start_datetime,
                "end_datetime": event.end_datetime,
                "location": event.location,
                "attendee_count": event.attendee_count,
                "status": event.status,
                "image": event.image.url if event.image else None,
            }
            for event in past_events
        ]

    @extend_schema_field(serializers.ListField)
    def get_membership_history(self, obj):
        """Retorna historial reciente de membresías (últimas 10 actividades)"""
        recent_memberships = obj.memberships.order_by("-joined_at")[:10]

        return [
            {
                "membership_id": str(membership.membership_id),
                "user_name": membership.user.get_full_name(),
                "status": membership.status,
                "role": membership.role,
                "joined_at": membership.joined_at,
                "action": (
                    "joined" if membership.status == "active" else membership.status
                ),
            }
            for membership in recent_memberships
        ]

    @extend_schema_field(GroupStatisticsSerializer)
    def get_statistics(self, obj):
        """Retorna estadísticas del grupo"""
        from datetime import timedelta

        from apps.events.models import Event, EventAttendance
        from django.db.models import Avg, Count
        from django.utils import timezone

        # Basic member statistics
        total_members = obj.memberships.count()
        active_members = obj.memberships.filter(status="active").count()
        pending_requests = obj.memberships.filter(status="pending").count()

        # Event statistics
        all_events = Event.objects.filter(target_groups=obj)
        total_events = all_events.count()

        now = timezone.now()
        upcoming_events = all_events.filter(
            start_datetime__gt=now, status="published"
        ).count()
        past_events = all_events.filter(end_datetime__lt=now).count()

        # Average attendance calculation
        event_attendances = EventAttendance.objects.filter(
            event__target_groups=obj, status__in=["registered", "confirmed", "attended"]
        )

        if total_events > 0:
            avg_attendance = event_attendances.count() / total_events
        else:
            avg_attendance = 0.0

        # Membership growth rate (last 30 days)
        thirty_days_ago = now - timedelta(days=30)
        recent_members = obj.memberships.filter(
            joined_at__gte=thirty_days_ago, status="active"
        ).count()

        if active_members > 0:
            growth_rate = (recent_members / active_members) * 100
        else:
            growth_rate = 0.0

        # Most popular event type
        popular_event_type = (
            all_events.values("event_type")
            .annotate(count=Count("event_type"))
            .order_by("-count")
            .first()
        )

        most_popular_type = (
            popular_event_type["event_type"] if popular_event_type else None
        )

        # Last activity date (most recent event or membership)
        last_event = all_events.order_by("-created_at").first()
        last_membership = obj.memberships.order_by("-joined_at").first()

        last_activity = None
        if last_event and last_membership:
            last_activity = max(last_event.created_at, last_membership.joined_at)
        elif last_event:
            last_activity = last_event.created_at
        elif last_membership:
            last_activity = last_membership.joined_at

        return {
            "total_members": total_members,
            "active_members": active_members,
            "pending_requests": pending_requests,
            "total_events": total_events,
            "upcoming_events": upcoming_events,
            "past_events": past_events,
            "average_event_attendance": round(avg_attendance, 2),
            "membership_growth_rate": round(growth_rate, 2),
            "most_popular_event_type": most_popular_type,
            "last_activity_date": last_activity,
        }
