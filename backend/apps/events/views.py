from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404

from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.core.permissions import EventAttendancePermission, EventPermission

from .models import Event, EventAttendance
from .serializers import (
    EventAttendanceCreateSerializer,
    EventAttendanceSerializer,
    EventAttendanceUpdateSerializer,
    EventAttendeesListSerializer,
    EventCreateSerializer,
    EventListSerializer,
    EventSerializer,
    EventUpdateSerializer,
)

User = get_user_model()


@extend_schema_view(
    list=extend_schema(
        summary="Listar eventos",
        description=
        "Obtiene la lista de eventos disponibles. Filtros opcionales por estado, tipo, etc.",
        tags=["Events"],
    ),
    create=extend_schema(
        summary="Crear evento",
        description=
        "Crea un nuevo evento. Solo presidentes pueden crear eventos.",
        tags=["Events"],
    ),
    retrieve=extend_schema(
        summary="Obtener detalles de evento",
        description="Obtiene los detalles de un evento específico.",
        tags=["Events"],
    ),
    update=extend_schema(
        summary="Actualizar evento",
        description=
        "Actualiza completamente un evento. Solo el creador, presidentes de grupos objetivo o administradores.",
        tags=["Events"],
    ),
    partial_update=extend_schema(
        summary="Actualizar parcialmente evento",
        description=
        "Actualiza parcialmente un evento. Solo el creador, presidentes de grupos objetivo o administradores.",
        tags=["Events"],
    ),
    destroy=extend_schema(
        summary="Eliminar evento",
        description="Elimina un evento. Solo el creador o administradores.",
        tags=["Events"],
    ),
)
class EventViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de eventos
    Endpoints base: /api/events/
    """

    queryset = Event.objects.all()
    permission_classes = [EventPermission]

    def get_serializer_class(self):
        if self.action == "list":
            return EventListSerializer
        elif self.action == "create":
            return EventCreateSerializer
        elif self.action in ["update", "partial_update"]:
            return EventUpdateSerializer
        elif self.action == "attendees":
            return EventAttendeesListSerializer
        return EventSerializer

    def get_queryset(self):
        """Filtrar eventos según parámetros de consulta"""
        queryset = Event.objects.filter(status="published")

        # Filtros opcionales
        event_type = self.request.query_params.get("type", None)
        if event_type:
            queryset = queryset.filter(event_type=event_type)

        status_filter = self.request.query_params.get("status", None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        # Para administradores, mostrar todos los eventos
        if self.request.user.is_authenticated and self.request.user.is_admin:
            queryset = Event.objects.all()

        return queryset.order_by("-start_datetime")

    def perform_create(self, serializer):
        """Asignar el usuario actual como organizador del evento"""
        # Nota: Los eventos no tienen organizador directo en el modelo actual
        # El presidente que crea el evento será identificado por los grupos objetivo
        serializer.save()

    @extend_schema(
        summary="Confirmar asistencia a evento",
        description="Permite a un usuario confirmar su asistencia a un evento.",
        request=EventAttendanceCreateSerializer,
        responses={
            201: EventAttendanceSerializer,
            400: {
                "type": "object",
                "properties": {
                    "error": {
                        "type": "string"
                    }
                }
            },
        },
        tags=["Events"],
    )
    @action(detail=True, methods=["post"])
    def attend(self, request, pk=None):
        """
        Endpoint para confirmar asistencia a evento
        POST /api/events/{id}/attend/
        
        Reglas de negocio:
        - Si el usuario es miembro de algún grupo objetivo del evento: inscripción automática
        - Si no es miembro: debe enviar solicitud al presidente del grupo
        """
        event = self.get_object()

        # Verificar si ya está inscrito
        if EventAttendance.objects.filter(user=request.user,
                                          event=event).exists():
            return Response(
                {"error": "Ya estás inscrito en este evento"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Verificar si las inscripciones están abiertas
        if event.requires_registration and not event.registration_open:
            return Response(
                {"error": "Las inscripciones para este evento están cerradas"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Verificar si el usuario es miembro de algún grupo objetivo del evento
        from apps.students.models import GroupMembership
        user_groups = GroupMembership.objects.filter(
            user=request.user,
            group__in=event.target_groups.all(),
            status='active').values_list('group_id', flat=True)

        if user_groups:
            # Usuario es miembro de un grupo objetivo - inscripción automática
            serializer = EventAttendanceCreateSerializer(data=request.data,
                                                         context={
                                                             "request":
                                                             request,
                                                             "event": event
                                                         })

            if serializer.is_valid():
                attendance = serializer.save()
                response_serializer = EventAttendanceSerializer(attendance)
                return Response(
                    {
                        "message": "Te has inscrito automáticamente al evento",
                        "attendance": response_serializer.data
                    },
                    status=status.HTTP_201_CREATED)

            return Response(serializer.errors,
                            status=status.HTTP_400_BAD_REQUEST)
        else:
            # Usuario no es miembro - debe enviar solicitud
            return Response(
                {
                    "error":
                    "No eres miembro de los grupos objetivo de este evento",
                    "message":
                    "Debes solicitar permiso al presidente del grupo para unirte",
                    "requires_request":
                    True,
                    "target_groups": [{
                        "group_id":
                        str(group.group_id),
                        "name":
                        group.name,
                        "president_id":
                        group.president.id if group.president else None,
                        "president_name":
                        group.president.get_full_name()
                        if group.president else "Sin presidente"
                    } for group in event.target_groups.all()]
                },
                status=status.HTTP_403_FORBIDDEN)

    @extend_schema(
        summary="Solicitar asistencia a evento",
        description=
        "Permite a un usuario no miembro solicitar asistencia a un evento del grupo.",
        request=EventAttendanceCreateSerializer,
        responses={
            201: {
                "type": "object",
                "properties": {
                    "message": {
                        "type": "string"
                    }
                }
            },
            400: {
                "type": "object",
                "properties": {
                    "error": {
                        "type": "string"
                    }
                }
            },
        },
        tags=["Events"],
    )
    @action(detail=True, methods=["post"])
    def request_attendance(self, request, pk=None):
        """
        Endpoint para solicitar asistencia a evento (para no miembros)
        POST /api/events/{id}/request_attendance/
        """
        event = self.get_object()

        # Verificar si ya está inscrito
        if EventAttendance.objects.filter(user=request.user,
                                          event=event).exists():
            return Response(
                {"error": "Ya estás inscrito en este evento"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Verificar si las inscripciones están abiertas
        if event.requires_registration and not event.registration_open:
            return Response(
                {"error": "Las inscripciones para este evento están cerradas"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Verificar que el usuario NO sea miembro de ningún grupo objetivo
        from apps.students.models import GroupMembership
        user_groups = GroupMembership.objects.filter(
            user=request.user,
            group__in=event.target_groups.all(),
            status='active').exists()

        if user_groups:
            return Response(
                {
                    "error":
                    "Ya eres miembro de un grupo objetivo. Usa el endpoint /attend/ en su lugar"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Crear solicitud de asistencia (estado "pending" para aprobación del presidente)
        serializer = EventAttendanceCreateSerializer(data=request.data,
                                                     context={
                                                         "request": request,
                                                         "event": event
                                                     })

        if serializer.is_valid():
            attendance = serializer.save()
            # Cambiar estado a "pending" para solicitudes de no miembros
            attendance.status = "pending"
            attendance.save()

            # Enviar notificación al presidente del grupo
            from apps.notifications.services import NotificationService
            notification_service = NotificationService()

            for group in event.target_groups.all():
                if group.president:
                    notification_service.create_notification(
                        user=group.president,
                        title="Nueva solicitud de asistencia a evento",
                        message=
                        f"{request.user.get_full_name()} solicita asistir al evento '{event.title}'",
                        notification_type="event_request",
                        data={
                            "event_id": str(event.event_id),
                            "event_title": event.title,
                            "requester_id": request.user.id,
                            "requester_name": request.user.get_full_name(),
                            "attendance_id": str(attendance.attendance_id)
                        })

            return Response(
                {
                    "message":
                    "Solicitud enviada. El presidente del grupo revisará tu solicitud.",
                    "attendance_id": str(attendance.attendance_id),
                    "status": "pending"
                },
                status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        summary="Aprobar/Rechazar solicitud de asistencia",
        description=
        "Permite al presidente del grupo aprobar o rechazar solicitudes de asistencia.",
        request={
            "type": "object",
            "properties": {
                "action": {
                    "type": "string",
                    "enum": ["approve", "reject"]
                }
            }
        },
        responses={
            200: {
                "type": "object",
                "properties": {
                    "message": {
                        "type": "string"
                    }
                }
            },
            400: {
                "type": "object",
                "properties": {
                    "error": {
                        "type": "string"
                    }
                }
            },
            403: {
                "type": "object",
                "properties": {
                    "error": {
                        "type": "string"
                    }
                }
            },
        },
        tags=["Events"],
    )
    @action(detail=True,
            methods=["post"],
            permission_classes=[EventAttendancePermission])
    def handle_attendance_request(self, request, pk=None):
        """
        Endpoint para aprobar/rechazar solicitudes de asistencia
        POST /api/events/{id}/handle_attendance_request/
        """
        event = self.get_object()
        action = request.data.get('action')
        attendance_id = request.data.get('attendance_id')

        if not action or action not in ['approve', 'reject']:
            return Response(
                {"error": "Acción inválida. Debe ser 'approve' o 'reject'"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not attendance_id:
            return Response(
                {"error": "attendance_id es requerido"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            attendance = EventAttendance.objects.get(
                attendance_id=attendance_id, event=event, status='pending')
        except EventAttendance.DoesNotExist:
            return Response(
                {"error": "Solicitud de asistencia no encontrada"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Verificar que el usuario actual sea presidente de algún grupo objetivo
        user_groups = event.target_groups.filter(president=request.user)
        if not user_groups.exists():
            return Response(
                {
                    "error":
                    "No tienes permisos para manejar solicitudes de este evento"
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        if action == 'approve':
            attendance.status = 'registered'
            attendance.save()

            # Enviar notificación al usuario
            from apps.notifications.services import NotificationService
            notification_service = NotificationService()
            notification_service.create_notification(
                user=attendance.user,
                title="Solicitud de evento aprobada",
                message=
                f"Tu solicitud para asistir al evento '{event.title}' ha sido aprobada",
                notification_type="event_approval",
                data={
                    "event_id": str(event.event_id),
                    "event_title": event.title,
                    "attendance_id": str(attendance.attendance_id)
                })

            return Response(
                {
                    "message":
                    f"Solicitud de {attendance.user.get_full_name()} aprobada exitosamente"
                },
                status=status.HTTP_200_OK)

        else:  # reject
            attendance.status = 'cancelled'
            attendance.save()

            # Enviar notificación al usuario
            from apps.notifications.services import NotificationService
            notification_service = NotificationService()
            notification_service.create_notification(
                user=attendance.user,
                title="Solicitud de evento rechazada",
                message=
                f"Tu solicitud para asistir al evento '{event.title}' ha sido rechazada",
                notification_type="event_rejection",
                data={
                    "event_id": str(event.event_id),
                    "event_title": event.title,
                    "attendance_id": str(attendance.attendance_id)
                })

            return Response(
                {
                    "message":
                    f"Solicitud de {attendance.user.get_full_name()} rechazada"
                },
                status=status.HTTP_200_OK)

    @extend_schema(
        summary="Cancelar asistencia a evento",
        description="Permite a un usuario cancelar su asistencia a un evento.",
        request=None,
        responses={
            200: {
                "type": "object",
                "properties": {
                    "message": {
                        "type": "string"
                    }
                }
            },
            404: {
                "type": "object",
                "properties": {
                    "error": {
                        "type": "string"
                    }
                }
            },
        },
        tags=["Events"],
    )
    @action(detail=True, methods=["post"])
    def unattend(self, request, pk=None):
        """
        Endpoint para cancelar asistencia a evento
        POST /api/events/{id}/unattend/
        """
        event = self.get_object()

        try:
            attendance = EventAttendance.objects.get(user=request.user,
                                                     event=event)

            # Cambiar estado a cancelado en lugar de eliminar
            attendance.status = "cancelled"
            attendance.save()

            return Response(
                {"message": "Asistencia cancelada exitosamente"},
                status=status.HTTP_200_OK,
            )
        except EventAttendance.DoesNotExist:
            return Response(
                {"error": "No estás inscrito en este evento"},
                status=status.HTTP_404_NOT_FOUND,
            )

    @extend_schema(
        summary="Ver asistentes del evento",
        description=
        "Obtiene la lista de asistentes del evento. Solo presidentes de grupos objetivo o administradores.",
        responses={200: EventAttendeesListSerializer(many=True)},
        tags=["Events"],
    )
    @action(detail=True,
            methods=["get"],
            permission_classes=[EventAttendancePermission])
    def attendees(self, request, pk=None):
        """
        Endpoint para ver asistentes del evento
        GET /api/events/{id}/attendees/
        """
        event = self.get_object()
        attendees = EventAttendance.objects.filter(
            event=event, status__in=["registered", "confirmed", "attended"])

        serializer = EventAttendeesListSerializer(attendees, many=True)
        return Response(serializer.data)


@extend_schema_view(
    list=extend_schema(
        summary="Listar asistencias del usuario",
        description=
        "Obtiene las asistencias a eventos del usuario autenticado.",
        tags=["Event Attendance"],
    ),
    create=extend_schema(
        summary="Crear asistencia a evento",
        description="Registra la asistencia del usuario a un evento.",
        tags=["Event Attendance"],
    ),
    retrieve=extend_schema(
        summary="Obtener detalles de asistencia",
        description="Obtiene los detalles de una asistencia específica.",
        tags=["Event Attendance"],
    ),
    update=extend_schema(
        summary="Actualizar asistencia",
        description=
        "Actualiza el estado de una asistencia. Solo presidentes de grupos objetivo o administradores.",
        tags=["Event Attendance"],
    ),
    destroy=extend_schema(
        summary="Eliminar asistencia",
        description="Elimina una asistencia (cancelar inscripción).",
        tags=["Event Attendance"],
    ),
)
class EventAttendanceViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de asistencias a eventos
    Endpoints base: /api/event-attendances/
    """

    serializer_class = EventAttendanceSerializer
    permission_classes = [EventAttendancePermission]

    def get_queryset(self):
        """Filtrar asistencias según el usuario y rol"""
        user = self.request.user

        if user.is_admin:
            return EventAttendance.objects.all()
        elif user.is_president:
            # Presidentes ven asistencias de eventos de sus grupos
            return EventAttendance.objects.filter(
                event__target_groups__president=user).distinct()
        else:
            # Estudiantes solo ven sus propias asistencias
            return EventAttendance.objects.filter(user=user)

    def get_serializer_class(self):
        if self.action == "create":
            return EventAttendanceCreateSerializer
        elif self.action in ["update", "partial_update"]:
            return EventAttendanceUpdateSerializer
        return EventAttendanceSerializer

    def perform_create(self, serializer):
        """Asignar el usuario actual a la asistencia"""
        event_id = self.request.data.get("event")
        event = get_object_or_404(Event, pk=event_id)
        serializer.save(user=self.request.user, event=event)
