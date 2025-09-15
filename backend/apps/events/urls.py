from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import EventViewSet, EventAttendeeViewSet

app_name = 'events'

# Router for API endpoints
router = DefaultRouter()
router.register(r'events', EventViewSet, basename='event')
router.register(r'attendees', EventAttendeeViewSet, basename='eventattendee')

urlpatterns = [
    path('api/', include(router.urls)),
]
