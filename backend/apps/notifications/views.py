from rest_framework import permissions, status
from rest_framework.decorators import action
from rest_framework.mixins import ListModelMixin, RetrieveModelMixin, UpdateModelMixin
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet, ModelViewSet

from apps.core.permissions import IsAdminUser

from .models import (
    EmailNotification,
    EmailTemplate,
    EventReminder,
    NotificationPreferences,
    TOTPDevice,
)
from .serializers import (
    EmailNotificationSerializer,
    EmailTemplateSerializer,
    EventReminderSerializer,
    NotificationPreferencesSerializer,
    TOTPConfirmSerializer,
    TOTPDeviceSerializer,
    TOTPSetupSerializer,
    TOTPVerifySerializer,
)


class TOTPDeviceViewSet(ModelViewSet):
    """ViewSet for TOTP device management"""
    serializer_class = TOTPDeviceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return TOTPDevice.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.action == 'create':
            return TOTPSetupSerializer
        elif self.action == 'verify':
            return TOTPVerifySerializer
        elif self.action == 'confirm':
            return TOTPConfirmSerializer
        return super().get_serializer_class()

    def create(self, request, *args, **kwargs):
        """Create a new TOTP device and return full device data with QR code"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Create the device using the setup serializer
        device = serializer.save()

        # Return the full device data using the main serializer
        device_serializer = TOTPDeviceSerializer(device)
        headers = self.get_success_headers(device_serializer.data)

        return Response(device_serializer.data,
                        status=status.HTTP_201_CREATED,
                        headers=headers)

    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        """Verify TOTP token"""
        device = self.get_object()
        serializer = self.get_serializer(data=request.data)

        if serializer.is_valid():
            token = serializer.validated_data['token']
            if device.verify_token(token):
                return Response({'valid': True, 'message': 'Token válido'})
            else:
                return Response({
                    'valid': False,
                    'message': 'Token inválido'
                },
                                status=status.HTTP_400_BAD_REQUEST)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        """Confirm and activate TOTP device"""
        device = self.get_object()
        serializer = self.get_serializer(data=request.data)

        if serializer.is_valid():
            device.confirmed = True
            device.is_active = True
            device.save()

            return Response({
                'message': '2FA activado correctamente',
                'device': TOTPDeviceSerializer(device).data
            })

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def disable(self, request, pk=None):
        """Disable 2FA"""
        device = self.get_object()
        serializer = TOTPVerifySerializer(data=request.data)

        if serializer.is_valid():
            token = serializer.validated_data['token']
            if device.verify_token(token):
                device.is_active = False
                device.confirmed = False
                device.save()

                return Response({'message': '2FA desactivado correctamente'})
            else:
                return Response({'message': 'Token inválido'},
                                status=status.HTTP_400_BAD_REQUEST)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


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
