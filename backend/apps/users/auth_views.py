from django.contrib.auth import authenticate, get_user_model

from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .serializers import CustomUserSerializer, LoginSerializer, UserCreateSerializer

User = get_user_model()


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
            'full_name': self.user.get_full_name(),
            'role': self.user.role,
            'role_display': self.user.get_role_display(),
            'student_id': self.user.student_id,
            'phone': self.user.phone,
            'is_active_student': self.user.is_active_student,
        }

        return data


@extend_schema_view(post=extend_schema(
    summary="Iniciar sesión",
    description="""
        Autentica un usuario y devuelve tokens JWT (access y refresh) junto con información del usuario.
        
        El token de acceso debe incluirse en el header Authorization como:
        `Authorization: Bearer <access_token>`
        
        El token de acceso expira en 60 minutos, usa el refresh token para obtener uno nuevo.
        """,
    tags=["Authentication"],
    request=LoginSerializer,
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
                        "id": {
                            "type": "integer"
                        },
                        "email": {
                            "type": "string"
                        },
                        "username": {
                            "type": "string"
                        },
                        "first_name": {
                            "type": "string"
                        },
                        "last_name": {
                            "type": "string"
                        },
                        "full_name": {
                            "type": "string"
                        },
                        "role": {
                            "type": "string",
                            "enum": ["admin", "president", "student"]
                        },
                        "role_display": {
                            "type": "string"
                        },
                        "student_id": {
                            "type": "string"
                        },
                        "phone": {
                            "type": "string"
                        },
                        "is_active_student": {
                            "type": "boolean"
                        }
                    }
                }
            }
        },
        401: {
            "type": "object",
            "properties": {
                "detail": {
                    "type": "string",
                    "example":
                    "No active account found with the given credentials"
                }
            }
        }
    }))
class LoginView(TokenObtainPairView):
    """
    Vista de login personalizada con información de usuario
    """
    serializer_class = CustomTokenObtainPairSerializer


@extend_schema(summary="Registrar usuario",
               description="""
    Registra un nuevo usuario en el sistema.
    
    Los campos requeridos varían según el rol:
    - Estudiantes: requieren student_id (matrícula)
    - Presidentes y Administradores: student_id es opcional
    """,
               tags=["Authentication"],
               request=UserCreateSerializer,
               responses={
                   201: CustomUserSerializer,
                   400: {
                       "type": "object",
                       "properties": {
                           "field_errors": {
                               "type": "object",
                               "description": "Errores específicos de campos"
                           },
                           "non_field_errors": {
                               "type": "array",
                               "items": {
                                   "type": "string"
                               },
                               "description": "Errores generales"
                           }
                       }
                   }
               })
class RegisterView(APIView):
    """
    Vista para registro de nuevos usuarios
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = UserCreateSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            user_serializer = CustomUserSerializer(user)
            return Response(user_serializer.data,
                            status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(summary="Cerrar sesión",
               description="""
    Cierra la sesión del usuario invalidando el refresh token.
    
    Requiere el refresh token en el cuerpo de la petición.
    """,
               tags=["Authentication"],
               request={
                   "type": "object",
                   "properties": {
                       "refresh": {
                           "type": "string",
                           "description": "Refresh token a invalidar"
                       }
                   },
                   "required": ["refresh"]
               },
               responses={
                   200: {
                       "type": "object",
                       "properties": {
                           "message": {
                               "type": "string",
                               "example": "Sesión cerrada exitosamente"
                           }
                       }
                   },
                   400: {
                       "type": "object",
                       "properties": {
                           "error": {
                               "type": "string",
                               "example": "Token inválido"
                           }
                       }
                   }
               })
class LogoutView(APIView):
    """
    Vista para cerrar sesión
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if not refresh_token:
                return Response({'error': 'Refresh token es requerido'},
                                status=status.HTTP_400_BAD_REQUEST)

            token = RefreshToken(refresh_token)
            token.blacklist()

            return Response({'message': 'Sesión cerrada exitosamente'},
                            status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': 'Token inválido'},
                            status=status.HTTP_400_BAD_REQUEST)


@extend_schema(summary="Obtener información del usuario actual",
               description="""
    Obtiene la información completa del usuario autenticado.
    
    Requiere token de autenticación válido.
    """,
               tags=["Authentication"],
               responses={
                   200: CustomUserSerializer,
                   401: {
                       "type": "object",
                       "properties": {
                           "detail": {
                               "type":
                               "string",
                               "example":
                               "Authentication credentials were not provided."
                           }
                       }
                   }
               })
class MeView(APIView):
    """
    Vista para obtener información del usuario actual
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = CustomUserSerializer(request.user)
        return Response(serializer.data)


@extend_schema_view(post=extend_schema(
    summary="Renovar token de acceso",
    description="""
        Renueva el token de acceso usando el refresh token.
        
        Cuando el access token expira, usa este endpoint para obtener uno nuevo
        sin necesidad de volver a hacer login.
        """,
    tags=["Authentication"],
))
class CustomTokenRefreshView(TokenRefreshView):
    """
    Vista personalizada para renovar tokens
    """
    pass
