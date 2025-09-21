from django.urls import include, path
from rest_framework_simplejwt.views import TokenRefreshView

from .auth_views import (CustomTokenRefreshView, LoginView, LogoutView, MeView,
                         PasswordChangeView, PasswordResetConfirmView,
                         PasswordResetRequestView, RegisterView)

app_name = 'auth'

urlpatterns = [
    # Authentication endpoints according to specifications
    path('login/', LoginView.as_view(), name='login'),  # POST /api/auth/login/
    path('register/', RegisterView.as_view(),
         name='register'),  # POST /api/auth/register/
    path('logout/', LogoutView.as_view(),
         name='logout'),  # POST /api/auth/logout/
    path('me/', MeView.as_view(), name='me'),  # GET /api/auth/me/
    path('refresh/', CustomTokenRefreshView.as_view(),
         name='token_refresh'),  # POST /api/auth/refresh/
    
    # Password reset endpoints
    path('password-reset/', PasswordResetRequestView.as_view(),
         name='password_reset_request'),  # POST /api/auth/password-reset/
    path('password-reset-confirm/', PasswordResetConfirmView.as_view(),
         name='password_reset_confirm'),  # POST /api/auth/password-reset-confirm/
    path('password-change/', PasswordChangeView.as_view(),
         name='password_change'),  # POST /api/auth/password-change/
    
    # MFA endpoints
    path('mfa/', include('apps.users.mfa_urls')),  # /api/auth/mfa/
]
