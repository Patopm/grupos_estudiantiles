from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import status


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom JWT serializer that includes user information in the token response
    """
    
    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Add extra user information to the response
        data['user'] = {
            'id': self.user.id,
            'email': self.user.email,
            'username': self.user.username,
            'first_name': self.user.first_name,
            'last_name': self.user.last_name,
            'role': self.user.role,
            'role_display': self.user.get_role_display(),
        }
        
        return data


@extend_schema_view(
    post=extend_schema(
        summary="Iniciar sesión",
        description="""
        Autentica un usuario y devuelve tokens JWT (access y refresh) junto con información del usuario.
        
        El token de acceso debe incluirse en el header Authorization como:
        `Authorization: Bearer <access_token>`
        
        El token de acceso expira en 60 minutos, usa el refresh token para obtener uno nuevo.
        """,
        tags=["Authentication"],
        responses={
            200: {
                "type": "object",
                "properties": {
                    "access": {
                        "type": "string",
                        "description": "Token JWT de acceso"
                    },
                    "refresh": {
                        "type": "string", 
                        "description": "Token JWT de renovación"
                    },
                    "user": {
                        "type": "object",
                        "properties": {
                            "id": {"type": "integer"},
                            "email": {"type": "string"},
                            "username": {"type": "string"},
                            "first_name": {"type": "string"},
                            "last_name": {"type": "string"},
                            "role": {"type": "string", "enum": ["admin", "president", "student"]},
                            "role_display": {"type": "string"}
                        }
                    }
                }
            },
            401: {
                "type": "object",
                "properties": {
                    "detail": {
                        "type": "string",
                        "example": "No active account found with the given credentials"
                    }
                }
            }
        }
    )
)
class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom JWT login view with enhanced documentation
    """
    serializer_class = CustomTokenObtainPairSerializer
