from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter
from drf_spectacular.types import OpenApiTypes

from apps.core.permissions import IsAdminUser, IsOwnerOrAdminOrPresident
from .serializers import UserSerializer, UserCreateSerializer, UserProfileSerializer

User = get_user_model()


@extend_schema_view(
    list=extend_schema(
        summary="Listar usuarios",
        description="Obtiene la lista de todos los usuarios del sistema. Solo accesible por administradores.",
        tags=["Users"]
    ),
    create=extend_schema(
        summary="Crear usuario",
        description="Crea un nuevo usuario en el sistema. Solo accesible por administradores.",
        tags=["Users"]
    ),
    retrieve=extend_schema(
        summary="Obtener usuario",
        description="Obtiene los detalles de un usuario específico.",
        tags=["Users"]
    ),
    update=extend_schema(
        summary="Actualizar usuario",
        description="Actualiza completamente la información de un usuario.",
        tags=["Users"]
    ),
    partial_update=extend_schema(
        summary="Actualizar parcialmente usuario",
        description="Actualiza parcialmente la información de un usuario.",
        tags=["Users"]
    ),
    destroy=extend_schema(
        summary="Eliminar usuario",
        description="Elimina un usuario del sistema. Solo accesible por administradores.",
        tags=["Users"]
    ),
)
class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de usuarios con permisos basados en roles
    """
    
    queryset = User.objects.all()
    serializer_class = UserSerializer
    
    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        elif self.action == 'profile':
            return UserProfileSerializer
        return UserSerializer
    
    def get_permissions(self):
        """
        Permisos basados en la acción
        """
        if self.action in ['list', 'create', 'destroy']:
            permission_classes = [IsAdminUser]
        elif self.action in ['retrieve', 'update', 'partial_update']:
            permission_classes = [IsOwnerOrAdminOrPresident]
        else:
            permission_classes = [permissions.IsAuthenticated]
        
        return [permission() for permission in permission_classes]
    
    @extend_schema(
        summary="Obtener perfil propio",
        description="Obtiene la información del perfil del usuario autenticado.",
        responses={200: UserProfileSerializer},
        tags=["Users"]
    )
    @action(detail=False, methods=['get'])
    def profile(self, request):
        """
        Endpoint para obtener el perfil del usuario autenticado
        """
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    @extend_schema(
        summary="Actualizar perfil propio",
        description="Actualiza la información del perfil del usuario autenticado.",
        request=UserProfileSerializer,
        responses={200: UserProfileSerializer},
        tags=["Users"]
    )
    @action(detail=False, methods=['patch'])
    def update_profile(self, request):
        """
        Endpoint para actualizar el perfil del usuario autenticado
        """
        serializer = self.get_serializer(
            request.user, 
            data=request.data, 
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
    
    @extend_schema(
        summary="Cambiar rol de usuario",
        description="Cambia el rol de un usuario específico. Solo accesible por administradores.",
        parameters=[
            OpenApiParameter(
                name='role',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                required=True,
                description='Nuevo rol para el usuario',
                enum=['admin', 'president', 'student']
            )
        ],
        responses={200: UserSerializer},
        tags=["Users"]
    )
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def change_role(self, request, pk=None):
        """
        Endpoint para cambiar el rol de un usuario
        """
        user = self.get_object()
        new_role = request.query_params.get('role')
        
        if new_role not in [choice[0] for choice in User.Role.choices]:
            return Response(
                {'error': 'Rol inválido'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.role = new_role
        user.save()
        
        serializer = self.get_serializer(user)
        return Response(serializer.data)
    
    @extend_schema(
        summary="Activar/Desactivar usuario",
        description="Activa o desactiva un usuario del sistema. Solo accesible por administradores.",
        responses={200: UserSerializer},
        tags=["Users"]
    )
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def toggle_active(self, request, pk=None):
        """
        Endpoint para activar/desactivar un usuario
        """
        user = self.get_object()
        user.is_active = not user.is_active
        user.save()
        
        serializer = self.get_serializer(user)
        return Response(serializer.data)
