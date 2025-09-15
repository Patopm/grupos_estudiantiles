from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils import timezone
from drf_spectacular.utils import extend_schema_field

from .models import Event, EventAttendee
from apps.students.models import StudentGroup

User = get_user_model()


class EventAttendeeSerializer(serializers.ModelSerializer):
    """
    Serializer for EventAttendee model
    """
    
    user_name = serializers.SerializerMethodField()
    user_email = serializers.SerializerMethodField()
    user_details = serializers.SerializerMethodField()
    
    class Meta:
        model = EventAttendee
        fields = [
            'attendee_id', 'event', 'user', 'user_name', 'user_email', 'user_details',
            'status', 'registration_date', 'notes'
        ]
        read_only_fields = ['attendee_id', 'registration_date']
    
    @extend_schema_field(serializers.CharField)
    def get_user_name(self, obj):
        """Retorna el nombre completo del usuario"""
        return obj.user.get_full_name()
    
    @extend_schema_field(serializers.EmailField)
    def get_user_email(self, obj):
        """Retorna el email del usuario"""
        return obj.user.email
    
    @extend_schema_field(serializers.DictField)
    def get_user_details(self, obj):
        """Retorna detalles del usuario"""
        return {
            'id': obj.user.id,
            'username': obj.user.username,
            'full_name': obj.user.get_full_name(),
            'email': obj.user.email,
            'phone': getattr(obj.user, 'phone', None)
        }


class EventSerializer(serializers.ModelSerializer):
    """
    Serializer for Event model with detailed information
    """
    
    organizer_name = serializers.SerializerMethodField()
    organizer_details = serializers.SerializerMethodField()
    target_group_names = serializers.SerializerMethodField()
    attendee_count = serializers.SerializerMethodField()
    is_past = serializers.SerializerMethodField()
    is_upcoming = serializers.SerializerMethodField()
    is_ongoing = serializers.SerializerMethodField()
    is_full = serializers.SerializerMethodField()
    registration_open = serializers.SerializerMethodField()
    duration_hours = serializers.SerializerMethodField()
    user_registration_status = serializers.SerializerMethodField()
    
    class Meta:
        model = Event
        fields = [
            'event_id', 'title', 'description', 'event_type', 'status', 'organizer',
            'organizer_name', 'organizer_details', 'target_groups', 'target_group_names',
            'start_datetime', 'end_datetime', 'location', 'max_attendees',
            'registration_deadline', 'requires_registration', 'image',
            'attendee_count', 'is_past', 'is_upcoming', 'is_ongoing', 'is_full',
            'registration_open', 'duration_hours', 'user_registration_status',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['event_id', 'created_at', 'updated_at']
    
    @extend_schema_field(serializers.CharField)
    def get_organizer_name(self, obj):
        """Retorna el nombre del organizador"""
        return obj.organizer.get_full_name()
    
    @extend_schema_field(serializers.DictField)
    def get_organizer_details(self, obj):
        """Retorna detalles del organizador"""
        return {
            'id': obj.organizer.id,
            'username': obj.organizer.username,
            'full_name': obj.organizer.get_full_name(),
            'email': obj.organizer.email
        }
    
    @extend_schema_field(serializers.ListField)
    def get_target_group_names(self, obj):
        """Retorna los nombres de los grupos objetivo"""
        return [group.name for group in obj.target_groups.all()]
    
    @extend_schema_field(serializers.IntegerField)
    def get_attendee_count(self, obj):
        """Retorna el número de asistentes confirmados"""
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
    def get_user_registration_status(self, obj):
        """Retorna el estado de inscripción del usuario actual"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            try:
                attendee = obj.attendees.get(user=request.user)
                return attendee.status
            except EventAttendee.DoesNotExist:
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
                    "La fecha de inicio debe ser anterior a la fecha de fin."
                )
        
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
                "La fecha de inicio no puede ser en el pasado."
            )
        
        return data
    
    def create(self, validated_data):
        """Crear evento asignando el organizador automáticamente"""
        validated_data['organizer'] = self.context['request'].user
        return super().create(validated_data)


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
        registration_deadline = data.get('registration_deadline', instance.registration_deadline)
        
        # Validar fechas de inicio y fin
        if start_datetime and end_datetime:
            if start_datetime >= end_datetime:
                raise serializers.ValidationError(
                    "La fecha de inicio debe ser anterior a la fecha de fin."
                )
        
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
    
    organizer_name = serializers.SerializerMethodField()
    target_group_names = serializers.SerializerMethodField()
    attendee_count = serializers.SerializerMethodField()
    is_past = serializers.SerializerMethodField()
    is_upcoming = serializers.SerializerMethodField()
    registration_open = serializers.SerializerMethodField()
    user_registration_status = serializers.SerializerMethodField()
    
    class Meta:
        model = Event
        fields = [
            'event_id', 'title', 'event_type', 'status', 'organizer_name',
            'target_group_names', 'start_datetime', 'end_datetime',
            'location', 'max_attendees', 'attendee_count', 'is_past',
            'is_upcoming', 'registration_open', 'user_registration_status',
            'image'
        ]
    
    @extend_schema_field(serializers.CharField)
    def get_organizer_name(self, obj):
        return obj.organizer.get_full_name()
    
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
    def get_user_registration_status(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            try:
                attendee = obj.attendees.get(user=request.user)
                return attendee.status
            except EventAttendee.DoesNotExist:
                return None
        return None


class EventAttendeeCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating EventAttendee (registration)
    """
    
    class Meta:
        model = EventAttendee
        fields = ['event', 'notes']
    
    def validate_event(self, value):
        """Valida que el evento permita inscripciones"""
        if not value.registration_open:
            raise serializers.ValidationError(
                "Las inscripciones para este evento están cerradas."
            )
        return value
    
    def create(self, validated_data):
        """Crear inscripción asignando el usuario automáticamente"""
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class EventAttendeeUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating EventAttendee status (admin/organizer only)
    """
    
    class Meta:
        model = EventAttendee
        fields = ['status', 'notes']
