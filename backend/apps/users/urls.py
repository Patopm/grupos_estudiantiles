from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import UserViewSet

# Router for user management endpoints (admin only)
router = DefaultRouter()
router.register(r"", UserViewSet, basename="user")

app_name = "users"

urlpatterns = [
    # User management endpoints (admin only) according to specifications
    path("", include(router.urls)),  # /api/users/
    # Verification endpoints
    path(
        "verification/", include("apps.users.verification_urls")
    ),  # /api/users/verification/
]
