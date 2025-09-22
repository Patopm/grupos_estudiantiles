from django.db import models
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .permissions import IsAdminOrPresident, EventPermission


class TimestampMixin(models.Model):
    """
    Mixin que añade campos de timestamp a los modelos
    """

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class SoftDeleteMixin(models.Model):
    """
    Mixin que añade funcionalidad de soft delete
    """

    is_active = models.BooleanField(default=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        abstract = True

    def soft_delete(self):
        from django.utils import timezone

        self.is_active = False
        self.deleted_at = timezone.now()
        self.save()

    def restore(self):
        self.is_active = True
        self.deleted_at = None
        self.save()


class RoleBasedViewSetMixin:
    """
    Mixin para ViewSets que añade funcionalidad basada en roles
    """

    def get_permissions(self):
        """
        Obtiene permisos basados en la acción y el rol del usuario
        """
        if self.action in ["create", "update", "partial_update", "destroy"]:
            permission_classes = [IsAdminOrPresident]
        else:
            permission_classes = self.permission_classes

        return [permission() for permission in permission_classes]

    def get_queryset(self):
        """
        Filtra el queryset basado en el rol del usuario
        """
        queryset = super().get_queryset()

        if not self.request.user.is_authenticated:
            return queryset.none()

        # Administradores ven todo
        if self.request.user.is_admin:
            return queryset

        # Presidentes ven datos de su grupo
        if self.request.user.is_president and hasattr(self.request.user, "led_group"):
            return self.filter_for_president(queryset)

        # Estudiantes ven datos limitados
        if self.request.user.is_student:
            return self.filter_for_student(queryset)

        return queryset.none()

    def filter_for_president(self, queryset):
        """
        Filtra datos para presidentes - sobrescribir en subclases
        """
        return queryset

    def filter_for_student(self, queryset):
        """
        Filtra datos para estudiantes - sobrescribir en subclases
        """
        return queryset


class EventViewSetMixin:
    """
    Mixin específico para ViewSets de eventos
    """

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[EventPermission],
        url_path="register",
    )
    def register_to_event(self, request, pk=None):
        """
        Permite a un usuario inscribirse a un evento
        """
        event = self.get_object()

        if not event.registration_open:
            return Response(
                {"detail": "Las inscripciones para este evento están cerradas."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from apps.events.models import EventAttendee

        attendee, created = EventAttendee.objects.get_or_create(
            event=event,
            user=request.user,
            defaults={"status": EventAttendee.AttendanceStatus.REGISTERED},
        )

        if not created:
            return Response(
                {"detail": "Ya estás inscrito en este evento."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {"detail": "Te has inscrito exitosamente al evento."},
            status=status.HTTP_201_CREATED,
        )

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[EventPermission],
        url_path="unregister",
    )
    def unregister_from_event(self, request, pk=None):
        """
        Permite a un usuario cancelar su inscripción a un evento
        """
        event = self.get_object()

        from apps.events.models import EventAttendee

        try:
            attendee = EventAttendee.objects.get(event=event, user=request.user)
            attendee.status = EventAttendee.AttendanceStatus.CANCELLED
            attendee.save()

            return Response(
                {"detail": "Has cancelado tu inscripción al evento."},
                status=status.HTTP_200_OK,
            )
        except EventAttendee.DoesNotExist:
            return Response(
                {"detail": "No estás inscrito en este evento."},
                status=status.HTTP_400_BAD_REQUEST,
            )

    @action(
        detail=True,
        methods=["get"],
        permission_classes=[IsAdminOrPresident],
        url_path="attendees",
    )
    def get_attendees(self, request, pk=None):
        """
        Obtiene la lista de asistentes de un evento
        """
        event = self.get_object()
        attendees = event.attendees.select_related("user").all()

        data = [
            {
                "id": attendee.id,
                "user": {
                    "id": attendee.user.id,
                    "name": attendee.user.get_full_name(),
                    "email": attendee.user.email,
                },
                "status": attendee.status,
                "registration_date": attendee.registration_date,
            }
            for attendee in attendees
        ]

        return Response(data, status=status.HTTP_200_OK)
