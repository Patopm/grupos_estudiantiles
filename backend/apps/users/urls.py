from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenRefreshView,
    TokenVerifyView,
)
from drf_spectacular.utils import extend_schema, extend_schema_view

from .auth_views import CustomTokenObtainPairView
from .views import UserViewSet

# Router for API endpoints
router = DefaultRouter()

router.register(r'', UserViewSet, basename='user')

# Create decorated views for JWT endpoints
RefreshTokenView = extend_schema_view(
    post=extend_schema(
        summary="Renovar token",
        description="Renueva el token de acceso usando el refresh token",
        tags=["Authentication"]
    )
)(TokenRefreshView)

VerifyTokenView = extend_schema_view(
    post=extend_schema(
        summary="Verificar token", 
        description="Verifica si un token JWT es válido",
        tags=["Authentication"]
    )
)(TokenVerifyView)

urlpatterns = [
    # JWT Authentication endpoints
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', RefreshTokenView.as_view(), name='token_refresh'),
    path('auth/verify/', VerifyTokenView.as_view(), name='token_verify'),
    
    # API endpoints
    path('api/', include(router.urls)),
]
