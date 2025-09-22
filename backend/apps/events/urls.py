from django.urls import include, path

from rest_framework.routers import DefaultRouter

from .views import EventAttendanceViewSet, EventViewSet

app_name = "events"

# Router for events endpoints according to specifications
router = DefaultRouter()
router.register(r"", EventViewSet, basename="events")  # /api/events/

urlpatterns = [
    path("", include(router.urls)),
    # Additional endpoints handled by custom actions in EventViewSet:
    # POST /api/events/{id}/attend/
    # POST /api/events/{id}/unattend/ (not in specs but useful)
    # GET /api/events/{id}/attendees/
]
