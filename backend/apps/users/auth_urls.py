from django.urls import path

from rest_framework_simplejwt.views import TokenRefreshView

from .auth_views import (
    CustomTokenRefreshView,
    LoginView,
    LogoutView,
    MeView,
    RegisterView,
)

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
]
