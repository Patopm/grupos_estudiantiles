from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from django.utils import timezone
import uuid


class Event(models.Model):
    """
    Modelo para representar eventos estudiantiles
    """
    
    class EventType(models.TextChoices):
        ACADEMIC = 'academic', 'Académico'
        SOCIAL = 'social', 'Social'
        SPORTS = 'sports', 'Deportivo'
        CULTURAL = 'cultural', 'Cultural'
        MEETING = 'meeting', 'Reunión'
        WORKSHOP = 'workshop', 'Taller'
        CONFERENCE = 'conference', 'Conferencia'
        OTHER = 'other', 'Otro'
    
    class Status(models.TextChoices):
        DRAFT = 'draft', 'Borrador'
        PUBLISHED = 'published', 'Publicado'
        CANCELLED = 'cancelled', 'Cancelado'
        COMPLETED = 'completed', 'Completado'
    

    event_id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        help_text="ID del evento"
    )

    title = models.CharField(
        max_length=200,
        help_text="Título del evento"
    )
    
    description = models.TextField(
        help_text="Descripción detallada del evento"
    )
    
    event_type = models.CharField(
        max_length=20,
        choices=EventType.choices,
        default=EventType.OTHER,
        help_text="Tipo de evento"
    )
    
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
        help_text="Estado del evento"
    )
    
    organizer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='organized_events',
        help_text="Usuario que organiza el evento"
    )
    
    target_groups = models.ManyToManyField(
        'students.StudentGroup',
        blank=True,
        related_name='events',
        help_text="Grupos de estudiantes objetivo (vacío = todos los grupos)"
    )
    
    start_datetime = models.DateTimeField(
        help_text="Fecha y hora de inicio del evento"
    )
    
    end_datetime = models.DateTimeField(
        help_text="Fecha y hora de fin del evento"
    )
    
    location = models.CharField(
        max_length=200,
        help_text="Ubicación del evento"
    )
    
    max_attendees = models.PositiveIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1)],
        help_text="Número máximo de asistentes (vacío = sin límite)"
    )
    
    registration_deadline = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Fecha límite de inscripción"
    )
    
    requires_registration = models.BooleanField(
        default=False,
        help_text="Indica si el evento requiere inscripción previa"
    )
    
    image = models.ImageField(
        upload_to='events/images/',
        null=True,
        blank=True,
        help_text="Imagen promocional del evento"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'events'
        verbose_name = 'Evento'
        verbose_name_plural = 'Eventos'
        ordering = ['-start_datetime']
    
    def __str__(self):
        return f"{self.title} - {self.start_datetime.strftime('%d/%m/%Y %H:%M')}"
    
    @property
    def is_past(self):
        return self.end_datetime < timezone.now()
    
    @property
    def is_upcoming(self):
        return self.start_datetime > timezone.now()
    
    @property
    def is_ongoing(self):
        now = timezone.now()
        return self.start_datetime <= now <= self.end_datetime
    
    @property
    def duration_hours(self):
        duration = self.end_datetime - self.start_datetime
        return duration.total_seconds() / 3600
    
    @property
    def attendee_count(self):
        return self.attendees.filter(status='confirmed').count()
    
    @property
    def is_full(self):
        if not self.max_attendees:
            return False
        return self.attendee_count >= self.max_attendees
    
    @property
    def registration_open(self):
        if not self.requires_registration:
            return False
        if self.registration_deadline and timezone.now() > self.registration_deadline:
            return False
        return not self.is_full and self.status == self.Status.PUBLISHED
    
    def clean(self):
        from django.core.exceptions import ValidationError
        
        if self.start_datetime and self.end_datetime:
            if self.start_datetime >= self.end_datetime:
                raise ValidationError('La fecha de inicio debe ser anterior a la fecha de fin.')
        
        if self.registration_deadline and self.start_datetime:
            if self.registration_deadline > self.start_datetime:
                raise ValidationError('La fecha límite de inscripción debe ser anterior al inicio del evento.')


class EventAttendee(models.Model):
    """
    Modelo para representar la asistencia a eventos
    """
    
    class AttendanceStatus(models.TextChoices):
        REGISTERED = 'registered', 'Inscrito'
        CONFIRMED = 'confirmed', 'Confirmado'
        ATTENDED = 'attended', 'Asistió'
        NO_SHOW = 'no_show', 'No asistió'
        CANCELLED = 'cancelled', 'Canceló'
    
    attendee_id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        help_text="ID de la asistencia"
    )

    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name='attendees',
        help_text="Evento al que asiste"
    )
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='event_attendances',
        help_text="Usuario que asiste al evento"
    )
    
    status = models.CharField(
        max_length=20,
        choices=AttendanceStatus.choices,
        default=AttendanceStatus.REGISTERED,
        help_text="Estado de asistencia"
    )
    
    registration_date = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(
        blank=True,
        null=True,
        help_text="Notas adicionales sobre la asistencia"
    )
    
    class Meta:
        db_table = 'event_attendees'
        verbose_name = 'Asistente a Evento'
        verbose_name_plural = 'Asistentes a Eventos'
        unique_together = ['event', 'user']
        ordering = ['registration_date']
    
    def __str__(self):
        return f"{self.user.get_full_name()} - {self.event.title}"