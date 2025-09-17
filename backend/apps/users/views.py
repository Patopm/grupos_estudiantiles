from django.contrib.auth import get_user_model

from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema, extend_schema_view
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.core.permissions import IsAdminUser, UserManagementPermission

from .serializers import (
    CustomUserSerializer,
    UserCreateSerializer,
    UserProfileSerializer,
    UserRoleUpdateSerializer,
)

User = get_user_model()


@extend_schema_view(
    list=extend_schema(
        summary="Listar usuarios",
        description=
        "Obtiene la lista de todos los usuarios del sistema. Solo accesible por administradores.",
        tags=["Users"]),
    create=extend_schema(
        summary="Crear usuario",
        description=
        "Crea un nuevo usuario en el sistema. Solo accesible por administradores.",
        tags=["Users"]),
    retrieve=extend_schema(
        summary="Obtener usuario",
        description=
        "Obtiene los detalles de un usuario específico. Solo accesible por administradores.",
        tags=["Users"]),
    update=extend_schema(
        summary="Actualizar usuario",
        description=
        "Actualiza completamente la información de un usuario. Solo accesible por administradores.",
        tags=["Users"]),
    partial_update=extend_schema(
        summary="Actualizar parcialmente usuario",
        description=
        "Actualiza parcialmente la información de un usuario. Solo accesible por administradores.",
        tags=["Users"]),
    destroy=extend_schema(
        summary="Eliminar usuario",
        description=
        "Elimina un usuario del sistema. Solo accesible por administradores.",
        tags=["Users"]),
)
class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de usuarios - Solo administradores
    Endpoints: /api/users/
    """

    queryset = User.objects.all()
    serializer_class = CustomUserSerializer
    permission_classes = [UserManagementPermission]

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        return CustomUserSerializer

    @extend_schema(
        summary="Cambiar rol de usuario",
        description=
        "Cambia el rol de un usuario específico. Solo accesible por administradores.",
        request=UserRoleUpdateSerializer,
        responses={200: CustomUserSerializer},
        tags=["Users"])
    @action(detail=True, methods=['put'])
    def role(self, request, pk=None):
        """
        Endpoint para cambiar el rol de un usuario
        PUT /api/users/{id}/role/
        """
        user = self.get_object()
        serializer = UserRoleUpdateSerializer(data=request.data)

        if serializer.is_valid():
            user.role = serializer.validated_data['role']
            user.save()

            response_serializer = self.get_serializer(user)
            return Response(response_serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
