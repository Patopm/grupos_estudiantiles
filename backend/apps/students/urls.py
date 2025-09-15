from django.urls import path, include
from rest_framework.routers import DefaultRouter

app_name = 'students'

# Router for API endpoints
router = DefaultRouter()
# Add your student viewsets here when created

urlpatterns = [
    path('api/', include(router.urls)),
]
