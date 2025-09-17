from django.contrib.auth import get_user_model
from django.utils import timezone

from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from apps.students.models import StudentGroup

from .models import Event, EventAttendance

User = get_user_model()


class EventAttendanceSerializer(serializers.ModelSerializer):
    """
    Serializer for EventAttendance model according to specifications
    """

    user_details = serializers.SerializerMethodField()
    event_details = serializers.SerializerMethodField()

    class Meta:
        model = EventAttendance
        fields = [
            'attendance_id', 'event', 'user', 'status', 'registration_date',
            'notes', 'updated_at', 'registered_at', 'user_details',
            'event_details'
        ]
        read_only_fields = [
            'attendance_id', 'registration_date', 'updated_at', 'registered_at'
        ]

    @extend_schema_field(serializers.DictField)
    def get_user_details(self, obj):
        """Retorna detalles del usuario"""
        return {
            'id': obj.user.id,
            'full_name': obj.user.get_full_name(),
            'email': obj.user.email,
            'student_id': obj.user.student_id,
            'phone': obj.user.phone
        }

    @extend_schema_field(serializers.DictField)
    def get_event_details(self, obj):
        """Retorna detalles del evento"""
        return {
            'event_id': str(obj.event.event_id),
            'title': obj.event.title,
            'start_datetime': obj.event.start_datetime,
            'location': obj.event.location
        }


class EventSerializer(serializers.ModelSerializer):
    """
    Serializer for Event model with detailed information according to specifications
    """

    target_group_details = serializers.SerializerMethodField()
    attendee_count = serializers.SerializerMethodField()
    is_past = serializers.SerializerMethodField()
    is_upcoming = serializers.SerializerMethodField()
    is_ongoing = serializers.SerializerMethodField()
    is_full = serializers.SerializerMethodField()
    registration_open = serializers.SerializerMethodField()
    duration_hours = serializers.SerializerMethodField()
    user_attendance_status = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            'event_id', 'title', 'description', 'event_type', 'status',
            'target_groups', 'target_group_details', 'start_datetime',
            'end_datetime', 'location', 'max_attendees',
            'registration_deadline', 'requires_registration', 'image',
            'created_at', 'updated_at', 'attendee_count', 'is_past',
            'is_upcoming', 'is_ongoing', 'is_full', 'registration_open',
            'duration_hours', 'user_attendance_status'
        ]
        read_only_fields = ['event_id', 'created_at', 'updated_at']

    @extend_schema_field(serializers.ListField)
    def get_target_group_details(self, obj):
        """Retorna detalles de los grupos objetivo"""
        return [{
            'group_id': str(group.group_id),
            'name': group.name,
            'category': group.category
        } for group in obj.target_groups.all()]

    @extend_schema_field(serializers.IntegerField)
    def get_attendee_count(self, obj):
        """Retorna el número de asistentes"""
        return obj.attendee_count

    @extend_schema_field(serializers.BooleanField)
    def get_is_past(self, obj):
        """Retorna si el evento ya pasó"""
        return obj.is_past

    @extend_schema_field(serializers.BooleanField)
    def get_is_upcoming(self, obj):
        """Retorna si el evento es futuro"""
        return obj.is_upcoming

    @extend_schema_field(serializers.BooleanField)
    def get_is_ongoing(self, obj):
        """Retorna si el evento está en curso"""
        return obj.is_ongoing

    @extend_schema_field(serializers.BooleanField)
    def get_is_full(self, obj):
        """Retorna si el evento está lleno"""
        return obj.is_full

    @extend_schema_field(serializers.BooleanField)
    def get_registration_open(self, obj):
        """Retorna si las inscripciones están abiertas"""
        return obj.registration_open

    @extend_schema_field(serializers.FloatField)
    def get_duration_hours(self, obj):
        """Retorna la duración del evento en horas"""
        return obj.duration_hours

    @extend_schema_field(serializers.CharField)
    def get_user_attendance_status(self, obj):
        """Retorna el estado de asistencia del usuario actual"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            try:
                attendance = obj.attendances.get(user=request.user)
                return attendance.status
            except EventAttendance.DoesNotExist:
                return None
        return None


class EventCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating Event
    """

    class Meta:
        model = Event
        fields = [
            'title', 'description', 'event_type', 'target_groups',
            'start_datetime', 'end_datetime', 'location', 'max_attendees',
            'registration_deadline', 'requires_registration', 'image'
        ]

    def validate(self, data):
        """Validaciones personalizadas"""
        start_datetime = data.get('start_datetime')
        end_datetime = data.get('end_datetime')
        registration_deadline = data.get('registration_deadline')

        # Validar fechas de inicio y fin
        if start_datetime and end_datetime:
            if start_datetime >= end_datetime:
                raise serializers.ValidationError(
                    "La fecha de inicio debe ser anterior a la fecha de fin.")

        # Validar fecha límite de inscripción
        if registration_deadline and start_datetime:
            if registration_deadline > start_datetime:
                raise serializers.ValidationError(
                    "La fecha límite de inscripción debe ser anterior al inicio del evento."
                )

        # Validar que las fechas no sean en el pasado
        now = timezone.now()
        if start_datetime and start_datetime < now:
            raise serializers.ValidationError(
                "La fecha de inicio no puede ser en el pasado.")

        return data


class EventUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating Event
    """

    class Meta:
        model = Event
        fields = [
            'title', 'description', 'event_type', 'status', 'target_groups',
            'start_datetime', 'end_datetime', 'location', 'max_attendees',
            'registration_deadline', 'requires_registration', 'image'
        ]

    def validate(self, data):
        """Validaciones personalizadas para actualización"""
        instance = self.instance
        start_datetime = data.get('start_datetime', instance.start_datetime)
        end_datetime = data.get('end_datetime', instance.end_datetime)
        registration_deadline = data.get('registration_deadline',
                                         instance.registration_deadline)

        # Validar fechas de inicio y fin
        if start_datetime and end_datetime:
            if start_datetime >= end_datetime:
                raise serializers.ValidationError(
                    "La fecha de inicio debe ser anterior a la fecha de fin.")

        # Validar fecha límite de inscripción
        if registration_deadline and start_datetime:
            if registration_deadline > start_datetime:
                raise serializers.ValidationError(
                    "La fecha límite de inscripción debe ser anterior al inicio del evento."
                )

        return data


class EventListSerializer(serializers.ModelSerializer):
    """
    Serializer simplificado para listar eventos
    """

    target_group_names = serializers.SerializerMethodField()
    attendee_count = serializers.SerializerMethodField()
    is_past = serializers.SerializerMethodField()
    is_upcoming = serializers.SerializerMethodField()
    registration_open = serializers.SerializerMethodField()
    user_attendance_status = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            'event_id', 'title', 'event_type', 'status', 'target_group_names',
            'start_datetime', 'end_datetime', 'location', 'max_attendees',
            'attendee_count', 'is_past', 'is_upcoming', 'registration_open',
            'user_attendance_status', 'image'
        ]

    @extend_schema_field(serializers.ListField)
    def get_target_group_names(self, obj):
        return [group.name for group in obj.target_groups.all()]

    @extend_schema_field(serializers.IntegerField)
    def get_attendee_count(self, obj):
        return obj.attendee_count

    @extend_schema_field(serializers.BooleanField)
    def get_is_past(self, obj):
        return obj.is_past

    @extend_schema_field(serializers.BooleanField)
    def get_is_upcoming(self, obj):
        return obj.is_upcoming

    @extend_schema_field(serializers.BooleanField)
    def get_registration_open(self, obj):
        return obj.registration_open

    @extend_schema_field(serializers.CharField)
    def get_user_attendance_status(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            try:
                attendance = obj.attendances.get(user=request.user)
                return attendance.status
            except EventAttendance.DoesNotExist:
                return None
        return None


class EventAttendanceCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating EventAttendance (registration)
    """

    class Meta:
        model = EventAttendance
        fields = ['notes']

    def validate(self, attrs):
        """Valida que el usuario pueda inscribirse al evento"""
        user = self.context['request'].user
        event = self.context['event']

        # Verificar si ya está inscrito
        if EventAttendance.objects.filter(user=user, event=event).exists():
            raise serializers.ValidationError(
                "Ya estás inscrito en este evento")

        # Verificar si las inscripciones están abiertas
        if not event.registration_open:
            raise serializers.ValidationError(
                "Las inscripciones para este evento están cerradas")

        return attrs

    def create(self, validated_data):
        """Crear inscripción asignando el usuario y evento automáticamente"""
        validated_data['user'] = self.context['request'].user
        validated_data['event'] = self.context['event']
        return super().create(validated_data)


class EventAttendanceUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating EventAttendance status
    """

    class Meta:
        model = EventAttendance
        fields = ['status', 'notes']

    def validate_status(self, value):
        """Valida que el estado sea válido"""
        valid_statuses = [
            'registered', 'confirmed', 'attended', 'no_show', 'cancelled'
        ]
        if value not in valid_statuses:
            raise serializers.ValidationError(
                f"Estado inválido. Debe ser uno de: {valid_statuses}")
        return value


class EventAttendeesListSerializer(serializers.ModelSerializer):
    """
    Serializer for listing event attendees
    """

    user_details = serializers.SerializerMethodField()

    class Meta:
        model = EventAttendance
        fields = [
            'attendance_id', 'status', 'registration_date', 'notes',
            'updated_at', 'user_details'
        ]

    @extend_schema_field(serializers.DictField)
    def get_user_details(self, obj):
        """Retorna detalles del usuario asistente"""
        return {
            'id': obj.user.id,
            'full_name': obj.user.get_full_name(),
            'email': obj.user.email,
            'student_id': obj.user.student_id,
            'phone': obj.user.phone,
            'is_active_student': obj.user.is_active_student
        }
