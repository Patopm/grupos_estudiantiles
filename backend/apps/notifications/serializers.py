from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import (
    EmailNotification,
    EmailTemplate,
    EventReminder,
    NotificationPreferences,
)

User = get_user_model()


class EmailTemplateSerializer(serializers.ModelSerializer):
    """Serializer for email templates"""

    class Meta:
        model = EmailTemplate
        fields = [
            "id",
            "name",
            "template_type",
            "subject",
            "html_content",
            "text_content",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class EmailNotificationSerializer(serializers.ModelSerializer):
    """Serializer for email notifications"""

    recipient_email = serializers.EmailField(source="recipient.email", read_only=True)
    recipient_name = serializers.CharField(
        source="recipient.get_full_name", read_only=True
    )
    template_name = serializers.CharField(source="template.name", read_only=True)

    class Meta:
        model = EmailNotification
        fields = [
            "id",
            "recipient_email",
            "recipient_name",
            "template_name",
            "subject",
            "priority",
            "status",
            "scheduled_at",
            "sent_at",
            "failed_at",
            "error_message",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "recipient_email",
            "recipient_name",
            "template_name",
            "sent_at",
            "failed_at",
            "error_message",
            "created_at",
        ]


class NotificationPreferencesSerializer(serializers.ModelSerializer):
    """Serializer for notification preferences"""

    class Meta:
        model = NotificationPreferences
        fields = [
            "event_reminders",
            "event_updates",
            "event_cancellations",
            "group_requests",
            "group_updates",
            "new_members",
            "security_alerts",
            "login_notifications",
            "newsletter",
            "promotional_emails",
            "email_frequency",
            "updated_at",
        ]
        read_only_fields = ["updated_at"]

    def update(self, instance, validated_data):
        """Update notification preferences"""
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class EventReminderSerializer(serializers.ModelSerializer):
    """Serializer for event reminders"""

    event_title = serializers.CharField(source="event.title", read_only=True)
    event_start_datetime = serializers.DateTimeField(
        source="event.start_datetime", read_only=True
    )
    recipient_email = serializers.EmailField(source="recipient.email", read_only=True)

    class Meta:
        model = EventReminder
        fields = [
            "id",
            "event_title",
            "event_start_datetime",
            "recipient_email",
            "reminder_type",
            "scheduled_at",
            "sent",
            "sent_at",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "event_title",
            "event_start_datetime",
            "recipient_email",
            "sent",
            "sent_at",
            "created_at",
        ]


class SendNotificationSerializer(serializers.Serializer):
    """Serializer for sending custom notifications"""

    template_type = serializers.ChoiceField(choices=EmailTemplate.TEMPLATE_TYPES)
    recipients = serializers.ListField(
        child=serializers.EmailField(), allow_empty=False, max_length=100
    )
    context_data = serializers.JSONField(default=dict)
    priority = serializers.ChoiceField(
        choices=EmailNotification.PRIORITY_CHOICES, default="normal"
    )
    scheduled_at = serializers.DateTimeField(required=False)

    def validate_recipients(self, value):
        """Validate that all recipients exist in the system"""
        existing_emails = set(
            User.objects.filter(email__in=value).values_list("email", flat=True)
        )
        invalid_emails = set(value) - existing_emails

        if invalid_emails:
            raise serializers.ValidationError(
                f'Los siguientes emails no existen en el sistema: {", ".join(invalid_emails)}'
            )

        return value

    def validate_template_type(self, value):
        """Validate that template exists and is active"""
        try:
            template = EmailTemplate.objects.get(template_type=value, is_active=True)
        except EmailTemplate.DoesNotExist:
            raise serializers.ValidationError(
                f"No existe una plantilla activa para el tipo: {value}"
            )

        return value


class BulkEmailSerializer(serializers.Serializer):
    """Serializer for bulk email operations"""

    action = serializers.ChoiceField(choices=["resend", "cancel", "delete"])
    notification_ids = serializers.ListField(
        child=serializers.UUIDField(), allow_empty=False, max_length=100
    )

    def validate_notification_ids(self, value):
        """Validate that all notification IDs exist"""
        existing_ids = set(
            EmailNotification.objects.filter(id__in=value).values_list("id", flat=True)
        )
        invalid_ids = set(value) - existing_ids

        if invalid_ids:
            raise serializers.ValidationError(
                f"Las siguientes notificaciones no existen: {invalid_ids}"
            )

        return value
