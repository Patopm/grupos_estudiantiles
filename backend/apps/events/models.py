import uuid

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone


class Event(models.Model):
    """
    Modelo Evento según especificaciones exactas del requerimiento
    """

    EVENT_TYPE_CHOICES = [
        ("academic", "Académico"),
        ("social", "Social"),
        ("sports", "Deportivo"),
        ("cultural", "Cultural"),
        ("meeting", "Reunión"),
        ("workshop", "Taller"),
        ("conference", "Conferencia"),
        ("other", "Otro"),
    ]

    STATUS_CHOICES = [
        ("draft", "Borrador"),
        ("published", "Publicado"),
        ("cancelled", "Cancelado"),
        ("completed", "Completado"),
    ]

    event_id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text="ID único del evento",
    )

    title = models.CharField(max_length=200, help_text="Título del evento")

    description = models.TextField(help_text="Descripción detallada del evento")

    event_type = models.CharField(
        max_length=20, choices=EVENT_TYPE_CHOICES, help_text="Tipo de evento"
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="draft",
        help_text="Estado del evento",
    )

    target_groups = models.ManyToManyField(
        "students.StudentGroup",
        blank=True,
        related_name="events",
        help_text="Grupos estudiantiles objetivo del evento",
    )

    start_datetime = models.DateTimeField(help_text="Fecha y hora de inicio del evento")

    end_datetime = models.DateTimeField(help_text="Fecha y hora de fin del evento")

    location = models.CharField(max_length=200, help_text="Ubicación del evento")

    max_attendees = models.PositiveIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1)],
        help_text="Número máximo de asistentes (vacío = sin límite)",
    )

    registration_deadline = models.DateTimeField(
        null=True, blank=True, help_text="Fecha límite de inscripción"
    )

    requires_registration = models.BooleanField(
        default=False, help_text="Indica si el evento requiere inscripción previa"
    )

    image = models.ImageField(
        upload_to="events/images/",
        null=True,
        blank=True,
        help_text="Imagen promocional del evento",
    )

    created_at = models.DateTimeField(
        auto_now_add=True, help_text="Fecha de creación del evento"
    )

    updated_at = models.DateTimeField(
        auto_now=True, help_text="Fecha de última actualización"
    )

    class Meta:
        db_table = "events"
        verbose_name = "Evento"
        verbose_name_plural = "Eventos"
        ordering = ["-start_datetime"]

    def __str__(self):
        return f"{self.title} - {self.start_datetime.strftime('%d/%m/%Y %H:%M')}"

    @property
    def is_past(self):
        """Verifica si el evento ya pasó"""
        return self.end_datetime < timezone.now()

    @property
    def is_upcoming(self):
        """Verifica si el evento es futuro"""
        return self.start_datetime > timezone.now()

    @property
    def is_ongoing(self):
        """Verifica si el evento está en curso"""
        now = timezone.now()
        return self.start_datetime <= now <= self.end_datetime

    @property
    def duration_hours(self):
        """Duración del evento en horas"""
        duration = self.end_datetime - self.start_datetime
        return duration.total_seconds() / 3600

    @property
    def attendee_count(self):
        """Número de asistentes registrados"""
        return self.attendances.filter(
            status__in=["registered", "confirmed", "attended"]
        ).count()

    @property
    def is_full(self):
        """Verifica si el evento está lleno"""
        if not self.max_attendees:
            return False
        return self.attendee_count >= self.max_attendees

    @property
    def registration_open(self):
        """Verifica si la inscripción está abierta"""
        if not self.requires_registration:
            return False
        if self.registration_deadline and timezone.now() > self.registration_deadline:
            return False
        return not self.is_full and self.status == "published"

    def clean(self):
        """Validaciones del modelo"""
        if self.start_datetime and self.end_datetime:
            if self.start_datetime >= self.end_datetime:
                raise ValidationError(
                    "La fecha de inicio debe ser anterior a la fecha de fin."
                )

        if self.registration_deadline and self.start_datetime:
            if self.registration_deadline > self.start_datetime:
                raise ValidationError(
                    "La fecha límite de inscripción debe ser anterior al inicio del evento."
                )


class EventAttendance(models.Model):
    """
    Modelo Asistencia a Evento según especificaciones exactas
    """

    STATUS_CHOICES = [
        ("registered", "Inscrito"),
        ("confirmed", "Confirmado"),
        ("attended", "Asistió"),
        ("no_show", "No asistió"),
        ("cancelled", "Cancelado"),
    ]

    attendance_id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text="ID único de la asistencia",
    )

    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name="attendances",
        help_text="Evento al que asiste",
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="event_attendances",
        help_text="Usuario que asiste al evento",
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="registered",
        help_text="Estado de asistencia",
    )

    registration_date = models.DateTimeField(
        auto_now_add=True, help_text="Fecha de registro inicial"
    )

    notes = models.TextField(
        blank=True, null=True, help_text="Notas adicionales sobre la asistencia"
    )

    updated_at = models.DateTimeField(
        auto_now=True, help_text="Fecha de última actualización del estado"
    )

    registered_at = models.DateTimeField(
        auto_now_add=True, help_text="Fecha de inscripción al evento"
    )

    class Meta:
        db_table = "event_attendances"
        verbose_name = "Asistencia a Evento"
        verbose_name_plural = "Asistencias a Eventos"
        unique_together = ["event", "user"]
        ordering = ["-registration_date"]

    def __str__(self):
        return f"{self.user.get_full_name()} - {self.event.title} ({self.get_status_display()})"
