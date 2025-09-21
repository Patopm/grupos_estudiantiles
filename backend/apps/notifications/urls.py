from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (EmailNotificationViewSet, EmailTemplateViewSet,
                    EventReminderViewSet, NotificationPreferencesViewSet)

app_name = 'notifications'

router = DefaultRouter()
router.register(r'templates', EmailTemplateViewSet, basename='email-templates')
router.register(r'emails',
                EmailNotificationViewSet,
                basename='email-notifications')
router.register(r'preferences',
                NotificationPreferencesViewSet,
                basename='notification-preferences')
router.register(r'reminders', EventReminderViewSet, basename='event-reminders')

urlpatterns = [
    path('', include(router.urls)),
]
