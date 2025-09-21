from apps.core.permissions import IsAdminUser
from rest_framework import permissions, status
from rest_framework.decorators import action
from rest_framework.mixins import (ListModelMixin, RetrieveModelMixin,
                                   UpdateModelMixin)
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet, ModelViewSet

from .models import (EmailNotification, EmailTemplate, EventReminder,
                     NotificationPreferences)
from .serializers import (EmailNotificationSerializer, EmailTemplateSerializer,
                          EventReminderSerializer,
                          NotificationPreferencesSerializer)


class EmailTemplateViewSet(ModelViewSet):
    """ViewSet for email template management"""
    queryset = EmailTemplate.objects.all()
    serializer_class = EmailTemplateSerializer
    permission_classes = [IsAdminUser]
    filterset_fields = ['template_type', 'is_active']
    search_fields = ['name', 'subject']
    ordering = ['-created_at']


class EmailNotificationViewSet(ListModelMixin, RetrieveModelMixin,
                               GenericViewSet):
    """ViewSet for email notification management"""
    serializer_class = EmailNotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['status', 'priority']
    search_fields = ['subject', 'recipient__email']
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return EmailNotification.objects.all()
        else:
            return EmailNotification.objects.filter(recipient=user)

    @action(detail=True, methods=['post'])
    def resend(self, request, pk=None):
        """Resend failed email notification"""
        notification = self.get_object()

        if notification.status == 'sent':
            return Response({'message': 'La notificación ya fue enviada'},
                            status=status.HTTP_400_BAD_REQUEST)

        # Reset status and send
        notification.status = 'pending'
        notification.error_message = ''
        notification.failed_at = None
        notification.save()

        return Response(
            {'message': 'Notificación agregada a la cola de envío'})


class NotificationPreferencesViewSet(RetrieveModelMixin, UpdateModelMixin,
                                     GenericViewSet):
    """ViewSet for notification preferences management"""
    serializer_class = NotificationPreferencesSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        """Get or create notification preferences for current user"""
        preferences, created = NotificationPreferences.objects.get_or_create(
            user=self.request.user)
        return preferences


class EventReminderViewSet(ListModelMixin, GenericViewSet):
    """ViewSet for event reminders"""
    serializer_class = EventReminderSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['reminder_type', 'sent']
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return EventReminder.objects.all()
        else:
            return EventReminder.objects.filter(recipient=user)
