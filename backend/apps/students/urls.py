from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import StudentViewSet, StudentGroupViewSet

app_name = 'students'

# Router for API endpoints
router = DefaultRouter()
router.register(r'students', StudentViewSet)
router.register(r'groups', StudentGroupViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
]
