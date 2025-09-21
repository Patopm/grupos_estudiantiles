import uuid

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.db import models
from django.template.loader import render_to_string
from django.utils import timezone
from django.utils.html import strip_tags

User = get_user_model()


class EmailTemplate(models.Model):
    """
    Email templates for different notification types
    """

    TEMPLATE_TYPES = [
        ("welcome", "Bienvenida"),
        ("2fa_enabled", "2FA Habilitado"),
        ("2fa_disabled", "2FA Deshabilitado"),
        ("event_reminder", "Recordatorio de Evento"),
        ("event_created", "Evento Creado"),
        ("event_updated", "Evento Actualizado"),
        ("event_cancelled", "Evento Cancelado"),
        ("group_request_approved", "Solicitud de Grupo Aprobada"),
        ("group_request_rejected", "Solicitud de Grupo Rechazada"),
        ("group_new_member", "Nuevo Miembro en Grupo"),
        ("group_member_left", "Miembro Abandonó Grupo"),
        ("password_reset", "Restablecimiento de Contraseña"),
        ("account_security", "Seguridad de Cuenta"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    template_type = models.CharField(max_length=50, choices=TEMPLATE_TYPES, unique=True)
    subject = models.CharField(max_length=200)
    html_content = models.TextField(
        help_text="HTML template with Django template syntax"
    )
    text_content = models.TextField(help_text="Plain text version", blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Plantilla de Email"
        verbose_name_plural = "Plantillas de Email"

    def __str__(self):
        return f"{self.name} ({self.get_template_type_display()})"


class EmailNotification(models.Model):
    """
    Email notification queue and history
    """

    STATUS_CHOICES = [
        ("pending", "Pendiente"),
        ("sending", "Enviando"),
        ("sent", "Enviado"),
        ("failed", "Fallido"),
        ("cancelled", "Cancelado"),
    ]

    PRIORITY_CHOICES = [
        ("low", "Baja"),
        ("normal", "Normal"),
        ("high", "Alta"),
        ("urgent", "Urgente"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="email_notifications"
    )
    template = models.ForeignKey(
        EmailTemplate, on_delete=models.SET_NULL, null=True, blank=True
    )
    subject = models.CharField(max_length=200)
    html_content = models.TextField()
    text_content = models.TextField(blank=True)

    # Email metadata
    from_email = models.EmailField(default=settings.DEFAULT_FROM_EMAIL)
    reply_to = models.EmailField(blank=True)

    # Scheduling and priority
    priority = models.CharField(
        max_length=10, choices=PRIORITY_CHOICES, default="normal"
    )
    scheduled_at = models.DateTimeField(default=timezone.now)

    # Status tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    sent_at = models.DateTimeField(null=True, blank=True)
    failed_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(blank=True)

    # Context data for template rendering
    context_data = models.JSONField(default=dict, blank=True)

    # Tracking
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Notificación por Email"
        verbose_name_plural = "Notificaciones por Email"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Email to {self.recipient.email}: {self.subject}"

    def send(self):
        """Send the email notification"""
        try:
            self.status = "sending"
            self.save(update_fields=["status"])

            success = send_mail(
                subject=self.subject,
                message=self.text_content or strip_tags(self.html_content),
                html_message=self.html_content,
                from_email=self.from_email,
                recipient_list=[self.recipient.email],
                fail_silently=False,
            )

            if success:
                self.status = "sent"
                self.sent_at = timezone.now()
                self.save(update_fields=["status", "sent_at"])
                return True
            else:
                self.status = "failed"
                self.failed_at = timezone.now()
                self.error_message = "Email sending returned False"
                self.save(update_fields=["status", "failed_at", "error_message"])
                return False

        except Exception as e:
            self.status = "failed"
            self.failed_at = timezone.now()
            self.error_message = str(e)
            self.save(update_fields=["status", "failed_at", "error_message"])
            return False


class NotificationPreferences(models.Model):
    """
    User preferences for email notifications
    """

    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="notification_preferences"
    )

    # Event notifications
    event_reminders = models.BooleanField(
        default=True, verbose_name="Recordatorios de eventos"
    )
    event_updates = models.BooleanField(
        default=True, verbose_name="Actualizaciones de eventos"
    )
    event_cancellations = models.BooleanField(
        default=True, verbose_name="Cancelaciones de eventos"
    )

    # Group notifications
    group_requests = models.BooleanField(
        default=True, verbose_name="Solicitudes de grupo"
    )
    group_updates = models.BooleanField(
        default=True, verbose_name="Actualizaciones de grupo"
    )
    new_members = models.BooleanField(default=True, verbose_name="Nuevos miembros")

    # Security notifications
    security_alerts = models.BooleanField(
        default=True, verbose_name="Alertas de seguridad"
    )
    login_notifications = models.BooleanField(
        default=False, verbose_name="Notificaciones de inicio de sesión"
    )

    # General preferences
    newsletter = models.BooleanField(default=False, verbose_name="Boletín informativo")
    promotional_emails = models.BooleanField(
        default=False, verbose_name="Emails promocionales"
    )

    # Timing preferences
    email_frequency = models.CharField(
        max_length=20,
        choices=[
            ("immediate", "Inmediato"),
            ("daily", "Diario"),
            ("weekly", "Semanal"),
        ],
        default="immediate",
        verbose_name="Frecuencia de emails",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Preferencias de Notificación"
        verbose_name_plural = "Preferencias de Notificación"

    def __str__(self):
        return f"Preferencias de {self.user.email}"


class EventReminder(models.Model):
    """
    Scheduled reminders for events
    """

    REMINDER_TYPES = [
        ("1_week", "1 semana antes"),
        ("3_days", "3 días antes"),
        ("1_day", "1 día antes"),
        ("2_hours", "2 horas antes"),
        ("30_minutes", "30 minutos antes"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event = models.ForeignKey(
        "events.Event", on_delete=models.CASCADE, related_name="reminders"
    )
    recipient = models.ForeignKey(User, on_delete=models.CASCADE)
    reminder_type = models.CharField(max_length=20, choices=REMINDER_TYPES)
    scheduled_at = models.DateTimeField()
    sent = models.BooleanField(default=False)
    sent_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Recordatorio de Evento"
        verbose_name_plural = "Recordatorios de Evento"
        unique_together = ["event", "recipient", "reminder_type"]

    def __str__(self):
        return f"Recordatorio {self.get_reminder_type_display()} - {self.event.title}"
