from apps.core.permissions import (
    GroupMembershipPermission,
    IsAdminUser,
    IsGroupPresidentOrAdmin,
    ReadOnlyForStudents,
)
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import GroupMembership, StudentGroup
from .serializers import (
    GroupDetailedSerializer,
    GroupMembershipCreateSerializer,
    GroupMembershipSerializer,
    GroupMembershipUpdateSerializer,
    GroupMembersListSerializer,
    GroupStatisticsSerializer,
    StudentGroupCreateSerializer,
    StudentGroupSerializer,
)

User = get_user_model()


@extend_schema_view(
    list=extend_schema(
        summary="Listar grupos estudiantiles",
        description="Obtiene la lista pública de grupos estudiantiles disponibles.",
        tags=["Groups"],
    ),
    create=extend_schema(
        summary="Crear grupo estudiantil",
        description="Crea un nuevo grupo estudiantil. Solo accesible por administradores.",
        tags=["Groups"],
    ),
    retrieve=extend_schema(
        summary="Obtener detalles de grupo",
        description="Obtiene los detalles de un grupo estudiantil específico.",
        tags=["Groups"],
    ),
    update=extend_schema(
        summary="Actualizar grupo",
        description="Actualiza la información de un grupo estudiantil. Solo administradores o presidente del grupo.",
        tags=["Groups"],
    ),
    partial_update=extend_schema(
        summary="Actualizar parcialmente grupo",
        description="Actualiza parcialmente la información de un grupo estudiantil. Solo administradores o presidente del grupo.",
        tags=["Groups"],
    ),
    destroy=extend_schema(
        summary="Eliminar grupo",
        description="Elimina un grupo estudiantil. Solo accesible por administradores.",
        tags=["Groups"],
    ),
)
class StudentGroupViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de grupos estudiantiles
    Endpoints base: /api/groups/
    """

    queryset = StudentGroup.objects.filter(is_active=True)
    serializer_class = StudentGroupSerializer

    def get_serializer_class(self):
        if self.action == "create":
            return StudentGroupCreateSerializer
        return StudentGroupSerializer

    def get_permissions(self):
        """Permisos basados en la acción"""
        if self.action in ["create", "destroy"]:
            permission_classes = [IsAdminUser]
        elif self.action in ["update", "partial_update"]:
            permission_classes = [IsGroupPresidentOrAdmin]
        elif self.action in ["join", "leave"]:
            permission_classes = [permissions.IsAuthenticated]
        elif self.action in [
            "requests",
            "approve_request",
            "reject_request",
        ]:
            permission_classes = [IsGroupPresidentOrAdmin]
        elif self.action in [
            "members",
            "detailed",
            "statistics",
        ]:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [permissions.AllowAny]  # list, retrieve son públicos

        return [permission() for permission in permission_classes]

    @extend_schema(
        summary="Solicitar ingreso a grupo",
        description="Permite a un estudiante solicitar ingreso a un grupo estudiantil.",
        request=None,
        responses={
            201: GroupMembershipSerializer,
            400: {"type": "object", "properties": {"error": {"type": "string"}}},
        },
        tags=["Groups"],
    )
    @action(detail=True, methods=["post"])
    def join(self, request, pk=None):
        """
        Endpoint para solicitar ingreso a un grupo
        POST /api/groups/{id}/join/
        """
        group = self.get_object()

        # Verificar que el usuario sea estudiante
        if not request.user.is_student:
            return Response(
                {"error": "Solo los estudiantes pueden solicitar ingreso a grupos"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Verificar que no tenga ya una membresía
        if GroupMembership.objects.filter(user=request.user, group=group).exists():
            return Response(
                {"error": "Ya tienes una solicitud o membresía en este grupo"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Verificar que el grupo no esté lleno
        if group.is_full:
            return Response(
                {"error": "El grupo está lleno"}, status=status.HTTP_400_BAD_REQUEST
            )

        # Crear la membresía pendiente
        membership = GroupMembership.objects.create(
            user=request.user, group=group, status="pending"
        )

        serializer = GroupMembershipSerializer(membership)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @extend_schema(
        summary="Salirse de grupo",
        description="Permite a un miembro salirse de un grupo estudiantil.",
        request=None,
        responses={
            200: {"type": "object", "properties": {"message": {"type": "string"}}},
            404: {"type": "object", "properties": {"error": {"type": "string"}}},
        },
        tags=["Groups"],
    )
    @action(detail=True, methods=["post"])
    def leave(self, request, pk=None):
        """
        Endpoint para salirse de un grupo
        POST /api/groups/{id}/leave/
        """
        group = self.get_object()

        try:
            membership = GroupMembership.objects.get(
                user=request.user, group=group, status="active"
            )
            membership.status = "inactive"
            membership.save()

            return Response(
                {"message": "Te has salido del grupo exitosamente"},
                status=status.HTTP_200_OK,
            )
        except GroupMembership.DoesNotExist:
            return Response(
                {"error": "No eres miembro de este grupo"},
                status=status.HTTP_404_NOT_FOUND,
            )

    @extend_schema(
        summary="Ver solicitudes pendientes",
        description="Obtiene las solicitudes de ingreso pendientes del grupo. Solo presidente del grupo o administradores.",
        responses={200: GroupMembershipSerializer(many=True)},
        tags=["Groups"],
    )
    @action(detail=True, methods=["get"])
    def requests(self, request, pk=None):
        """
        Endpoint para ver solicitudes pendientes
        GET /api/groups/{id}/requests/
        """
        group = self.get_object()
        pending_requests = GroupMembership.objects.filter(group=group, status="pending")

        serializer = GroupMembershipSerializer(pending_requests, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Aprobar solicitud de ingreso",
        description="Aprueba una solicitud de ingreso al grupo. Solo presidente del grupo o administradores.",
        request=None,
        responses={
            200: GroupMembershipSerializer,
            404: {"type": "object", "properties": {"error": {"type": "string"}}},
        },
        tags=["Groups"],
    )
    @action(
        detail=True, methods=["post"], url_path="requests/(?P<user_id>[^/.]+)/approve"
    )
    def approve_request(self, request, pk=None, user_id=None):
        """
        Endpoint para aprobar solicitud de ingreso
        POST /api/groups/{id}/requests/{user_id}/approve/
        """
        group = self.get_object()

        try:
            membership = GroupMembership.objects.get(
                group=group, user_id=user_id, status="pending"
            )

            # Verificar que el grupo no esté lleno
            if group.is_full:
                return Response(
                    {"error": "El grupo está lleno"}, status=status.HTTP_400_BAD_REQUEST
                )

            membership.status = "active"
            membership.save()

            serializer = GroupMembershipSerializer(membership)
            return Response(serializer.data)

        except GroupMembership.DoesNotExist:
            return Response(
                {"error": "Solicitud no encontrada"}, status=status.HTTP_404_NOT_FOUND
            )

    @extend_schema(
        summary="Rechazar solicitud de ingreso",
        description="Rechaza una solicitud de ingreso al grupo. Solo presidente del grupo o administradores.",
        request=None,
        responses={
            200: {"type": "object", "properties": {"message": {"type": "string"}}},
            404: {"type": "object", "properties": {"error": {"type": "string"}}},
        },
        tags=["Groups"],
    )
    @action(
        detail=True, methods=["post"], url_path="requests/(?P<user_id>[^/.]+)/reject"
    )
    def reject_request(self, request, pk=None, user_id=None):
        """
        Endpoint para rechazar solicitud de ingreso
        POST /api/groups/{id}/requests/{user_id}/reject/
        """
        group = self.get_object()

        try:
            membership = GroupMembership.objects.get(
                group=group, user_id=user_id, status="pending"
            )

            membership.delete()

            return Response(
                {"message": "Solicitud rechazada exitosamente"},
                status=status.HTTP_200_OK,
            )

        except GroupMembership.DoesNotExist:
            return Response(
                {"error": "Solicitud no encontrada"}, status=status.HTTP_404_NOT_FOUND
            )

    @extend_schema(
        summary="Ver miembros del grupo",
        description="Obtiene la lista de miembros activos del grupo.",
        responses={200: GroupMembersListSerializer(many=True)},
        tags=["Groups"],
    )
    @action(detail=True, methods=["get"])
    def members(self, request, pk=None):
        """
        Endpoint para ver miembros del grupo
        GET /api/groups/{id}/members/
        """
        group = self.get_object()
        members = GroupMembership.objects.filter(group=group, status="active")

        serializer = GroupMembersListSerializer(members, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Obtener información detallada del grupo",
        description="Obtiene información completa del grupo incluyendo miembros, eventos y estadísticas.",
        responses={200: GroupDetailedSerializer},
        tags=["Groups"],
    )
    @action(detail=True, methods=["get"])
    def detailed(self, request, pk=None):
        """
        Endpoint para obtener información detallada del grupo
        GET /api/groups/{id}/detailed/
        """
        group = self.get_object()
        serializer = GroupDetailedSerializer(group, context={"request": request})
        return Response(serializer.data)

    @extend_schema(
        summary="Obtener estadísticas del grupo",
        description="Obtiene estadísticas y métricas del grupo incluyendo miembros, eventos y actividad.",
        responses={200: GroupStatisticsSerializer},
        tags=["Groups"],
    )
    @action(detail=True, methods=["get"])
    def statistics(self, request, pk=None):
        """
        Endpoint para obtener estadísticas del grupo
        GET /api/groups/{id}/statistics/
        """
        group = self.get_object()
        detailed_serializer = GroupDetailedSerializer(
            group, context={"request": request}
        )
        statistics_data = detailed_serializer.get_statistics(group)

        serializer = GroupStatisticsSerializer(data=statistics_data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.data)


@extend_schema_view(
    list=extend_schema(
        summary="Listar membresías del usuario",
        description="Obtiene las membresías del usuario autenticado.",
        tags=["Memberships"],
    ),
    create=extend_schema(
        summary="Crear solicitud de membresía",
        description="Crea una nueva solicitud de membresía a un grupo.",
        tags=["Memberships"],
    ),
    retrieve=extend_schema(
        summary="Obtener detalles de membresía",
        description="Obtiene los detalles de una membresía específica.",
        tags=["Memberships"],
    ),
    update=extend_schema(
        summary="Actualizar membresía",
        description="Actualiza el estado de una membresía. Solo presidentes del grupo o administradores.",
        tags=["Memberships"],
    ),
    destroy=extend_schema(
        summary="Eliminar membresía",
        description="Elimina una membresía (salirse del grupo).",
        tags=["Memberships"],
    ),
)
class GroupMembershipViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de membresías de grupos
    Endpoints base: /api/memberships/
    """

    serializer_class = GroupMembershipSerializer
    permission_classes = [GroupMembershipPermission]

    def get_queryset(self):
        """Filtrar membresías según el usuario y rol"""
        user = self.request.user

        if user.is_admin:
            return GroupMembership.objects.all()
        elif user.is_president:
            # Presidentes ven membresías de sus grupos
            return GroupMembership.objects.filter(group__president=user)
        else:
            # Estudiantes solo ven sus propias membresías
            return GroupMembership.objects.filter(user=user)

    def get_serializer_class(self):
        if self.action == "create":
            return GroupMembershipCreateSerializer
        elif self.action in ["update", "partial_update"]:
            return GroupMembershipUpdateSerializer
        return GroupMembershipSerializer
