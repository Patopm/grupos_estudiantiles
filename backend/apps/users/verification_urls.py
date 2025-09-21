from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .verification_views import (
    EmailVerificationConfirmView,
    EmailVerificationRequestView,
    PhoneVerificationConfirmView,
    PhoneVerificationRequestView,
    ResendVerificationView,
    UserVerificationStatusView,
    VerificationCheckView,
    VerificationRequirementViewSet,
)

# Create router for viewsets
router = DefaultRouter()
router.register(
    r"requirements",
    VerificationRequirementViewSet,
    basename="verification-requirements",
)

urlpatterns = [
    # Email verification
    path(
        "email/request/",
        EmailVerificationRequestView.as_view(),
        name="email-verification-request",
    ),
    path(
        "email/confirm/",
        EmailVerificationConfirmView.as_view(),
        name="email-verification-confirm",
    ),
    # Phone verification
    path(
        "phone/request/",
        PhoneVerificationRequestView.as_view(),
        name="phone-verification-request",
    ),
    path(
        "phone/confirm/",
        PhoneVerificationConfirmView.as_view(),
        name="phone-verification-confirm",
    ),
    # User verification status
    path("status/", UserVerificationStatusView.as_view(), name="verification-status"),
    # Verification checks
    path("check/", VerificationCheckView.as_view(), name="verification-check"),
    # Resend verification
    path("resend/", ResendVerificationView.as_view(), name="resend-verification"),
    # Admin endpoints (via router)
    path("admin/", include(router.urls)),
]
