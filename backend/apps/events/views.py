from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.db.models import Q, Prefetch
from django.utils import timezone
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter
from drf_spectacular.types import OpenApiTypes

from apps.core.permissions import EventPermission, IsAdminUser, IsAdminOrPresident
from apps.core.mixins import RoleBasedViewSetMixin, EventViewSetMixin
from .models import Event, EventAttendee
from .serializers import (
    EventSerializer, EventCreateSerializer, EventUpdateSerializer,
    EventListSerializer, EventAttendeeSerializer, EventAttendeeCreateSerializer,
    EventAttendeeUpdateSerializer
)

User = get_user_model()


@extend_schema_view(
    list=extend_schema(
        summary="Listar eventos",
        description="Obtiene la lista de eventos con filtros opcionales.",
        tags=["Events"]
    ),
    create=extend_schema(
        summary="Crear evento",
        description="Crea un nuevo evento. Solo accesible por administradores y presidentes.",
        tags=["Events"]
    ),
    retrieve=extend_schema(
        summary="Obtener evento",
        description="Obtiene los detalles completos de un evento específico.",
        tags=["Events"]
    )
)
class EventViewSet(RoleBasedViewSetMixin, EventViewSetMixin, viewsets.ModelViewSet):
    """ViewSet para gestión completa de eventos"""
    
    queryset = Event.objects.select_related('organizer').prefetch_related(
        'target_groups',
        Prefetch('attendees', queryset=EventAttendee.objects.select_related('user'))
    )
    permission_classes = [EventPermission]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return EventListSerializer
        elif self.action == 'create':
            return EventCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return EventUpdateSerializer
        return EventSerializer
    
    def get_queryset(self):
        """Filtra el queryset basado en parámetros y permisos"""
        queryset = super().get_queryset()
        
        if not self.request.user.is_authenticated:
            return queryset.none()
        
        # Aplicar filtros de consulta
        queryset = self._apply_query_filters(queryset)
        
        # Aplicar filtros basados en rol
        if self.request.user.is_admin:
            return queryset
        elif self.request.user.is_president:
            return self.filter_for_president(queryset)
        elif self.request.user.is_student:
            return self.filter_for_student(queryset)
        
        return queryset.none()
    
    def _apply_query_filters(self, queryset):
        """Aplica filtros basados en parámetros de consulta"""
        status_filter = self.request.query_params.get('status')
        event_type_filter = self.request.query_params.get('event_type')
        upcoming = self.request.query_params.get('upcoming')
        my_events = self.request.query_params.get('my_events')
        registered = self.request.query_params.get('registered')
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        if event_type_filter:
            queryset = queryset.filter(event_type=event_type_filter)
        
        if upcoming == 'true':
            queryset = queryset.filter(start_datetime__gt=timezone.now())
        
        if my_events == 'true':
            queryset = queryset.filter(organizer=self.request.user)
        
        if registered == 'true':
            queryset = queryset.filter(
                attendees__user=self.request.user,
                attendees__status__in=[
                    EventAttendee.AttendanceStatus.REGISTERED,
                    EventAttendee.AttendanceStatus.CONFIRMED
                ]
            )
        
        return queryset
    
    def filter_for_president(self, queryset):
        """Filtra eventos para presidentes"""
        user_group = getattr(self.request.user, 'led_group', None)
        if user_group:
            return queryset.filter(
                Q(organizer=self.request.user) |
                Q(target_groups=user_group) |
                Q(target_groups__isnull=True)
            ).distinct()
        else:
            return queryset.filter(organizer=self.request.user)
    
    def filter_for_student(self, queryset):
        """Filtra eventos para estudiantes"""
        user_student = getattr(self.request.user, 'student_profile', None)
        base_queryset = queryset.filter(status=Event.Status.PUBLISHED)
        
        if user_student and user_student.group:
            return base_queryset.filter(
                Q(target_groups=user_student.group) |
                Q(target_groups__isnull=True)
            ).distinct()
        else:
            return base_queryset.filter(target_groups__isnull=True)
    
    @action(detail=True, methods=['post'], url_path='register')
    def register(self, request, pk=None):
        """Permite a un usuario inscribirse a un evento"""
        event = self.get_object()
        
        if EventAttendee.objects.filter(event=event, user=request.user).exists():
            return Response(
                {'detail': 'Ya estás inscrito en este evento.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = EventAttendeeCreateSerializer(
            data={'event': event.id, 'notes': request.data.get('notes', '')},
            context={'request': request}
        )
        
        if serializer.is_valid():
            attendee = serializer.save()
            response_serializer = EventAttendeeSerializer(attendee)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'], url_path='unregister')
    def unregister(self, request, pk=None):
        """Permite a un usuario cancelar su inscripción"""
        event = self.get_object()
        
        try:
            attendee = EventAttendee.objects.get(event=event, user=request.user)
            attendee.status = EventAttendee.AttendanceStatus.CANCELLED
            attendee.save()
            
            return Response(
                {'detail': 'Has cancelado tu inscripción al evento.'},
                status=status.HTTP_200_OK
            )
        except EventAttendee.DoesNotExist:
            return Response(
                {'detail': 'No estás inscrito en este evento.'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['get'], url_path='attendees')
    def attendees(self, request, pk=None):
        """Lista los asistentes de un evento"""
        event = self.get_object()
        attendees = event.attendees.select_related('user').all()
        serializer = EventAttendeeSerializer(attendees, many=True)
        return Response(serializer.data)


@extend_schema_view(
    list=extend_schema(
        summary="Listar asistencias a eventos",
        description="Obtiene la lista de asistencias a eventos.",
        tags=["Event Attendees"]
    ),
    create=extend_schema(
        summary="Crear asistencia",
        description="Inscribe a un usuario en un evento.",
        tags=["Event Attendees"]
    ),
    retrieve=extend_schema(
        summary="Obtener asistencia",
        description="Obtiene los detalles de una asistencia específica.",
        tags=["Event Attendees"]
    )
)
class EventAttendeeViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de asistencias a eventos"""
    
    queryset = EventAttendee.objects.select_related('event', 'user')
    serializer_class = EventAttendeeSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        """Retorna el serializer apropiado según la acción"""
        if self.action == 'create':
            return EventAttendeeCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return EventAttendeeUpdateSerializer
        return EventAttendeeSerializer
    
    def get_queryset(self):
        """Filtra el queryset basado en permisos"""
        queryset = super().get_queryset()
        
        if not self.request.user.is_authenticated:
            return queryset.none()
        
        # Administradores ven todas las asistencias
        if self.request.user.is_admin:
            return queryset
        
        # Presidentes ven asistencias de eventos que organizan o de su grupo
        if self.request.user.is_president:
            user_group = getattr(self.request.user, 'led_group', None)
            if user_group:
                return queryset.filter(
                    Q(event__organizer=self.request.user) |
                    Q(event__target_groups=user_group)
                ).distinct()
            else:
                return queryset.filter(event__organizer=self.request.user)
        
        # Estudiantes solo ven sus propias asistencias
        if self.request.user.is_student:
            return queryset.filter(user=self.request.user)
        
        return queryset.none()
    
    def perform_create(self, serializer):
        """Asigna el usuario actual al crear una asistencia"""
        serializer.save(user=self.request.user)