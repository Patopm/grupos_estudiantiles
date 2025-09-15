from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.db.models import Q
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter
from drf_spectacular.types import OpenApiTypes

from apps.core.permissions import (
    IsAdminUser, IsOwnerOrAdminOrPresident, IsAdminOrPresident,
    IsGroupPresidentOrAdmin, ReadOnlyForStudents
)
from .models import Student, StudentGroup
from .serializers import (
    StudentSerializer, StudentCreateSerializer, StudentUpdateSerializer,
    StudentProfileSerializer, StudentGroupSerializer, StudentGroupCreateSerializer
)

User = get_user_model()


@extend_schema_view(
    list=extend_schema(
        summary="Listar grupos de estudiantes",
        description="Obtiene la lista de todos los grupos de estudiantes.",
        tags=["Student Groups"]
    ),
    create=extend_schema(
        summary="Crear grupo de estudiantes",
        description="Crea un nuevo grupo de estudiantes. Solo accesible por administradores.",
        tags=["Student Groups"]
    ),
    retrieve=extend_schema(
        summary="Obtener grupo de estudiantes",
        description="Obtiene los detalles de un grupo específico.",
        tags=["Student Groups"]
    ),
    update=extend_schema(
        summary="Actualizar grupo de estudiantes",
        description="Actualiza completamente la información de un grupo.",
        tags=["Student Groups"]
    ),
    partial_update=extend_schema(
        summary="Actualizar parcialmente grupo de estudiantes",
        description="Actualiza parcialmente la información de un grupo.",
        tags=["Student Groups"]
    ),
    destroy=extend_schema(
        summary="Eliminar grupo de estudiantes",
        description="Elimina un grupo del sistema. Solo accesible por administradores.",
        tags=["Student Groups"]
    ),
)
class StudentGroupViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de grupos de estudiantes
    """
    
    queryset = StudentGroup.objects.all()
    serializer_class = StudentGroupSerializer
    
    def get_serializer_class(self):
        if self.action == 'create':
            return StudentGroupCreateSerializer
        return StudentGroupSerializer
    
    def get_permissions(self):
        """
        Permisos basados en la acción
        """
        if self.action in ['create', 'destroy']:
            permission_classes = [IsAdminUser]
        elif self.action in ['update', 'partial_update']:
            permission_classes = [IsGroupPresidentOrAdmin]
        else:
            permission_classes = [permissions.IsAuthenticated]
        
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """
        Filtra los grupos basado en el usuario
        """
        queryset = StudentGroup.objects.all()
        
        # Los administradores ven todos los grupos
        if self.request.user.is_admin:
            return queryset
        
        # Los presidentes ven solo su grupo
        if self.request.user.is_president:
            return queryset.filter(president=self.request.user)
        
        # Los estudiantes ven grupos activos
        return queryset.filter(is_active=True)
    
    @extend_schema(
        summary="Obtener estudiantes del grupo",
        description="Obtiene la lista de estudiantes pertenecientes al grupo.",
        responses={200: StudentSerializer(many=True)},
        tags=["Student Groups"]
    )
    @action(detail=True, methods=['get'])
    def students(self, request, pk=None):
        """
        Endpoint para obtener los estudiantes de un grupo
        """
        group = self.get_object()
        students = group.students.filter(is_active=True)
        serializer = StudentSerializer(students, many=True)
        return Response(serializer.data)
    
    @extend_schema(
        summary="Activar/Desactivar grupo",
        description="Activa o desactiva un grupo de estudiantes. Solo accesible por administradores.",
        responses={200: StudentGroupSerializer},
        tags=["Student Groups"]
    )
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def toggle_active(self, request, pk=None):
        """
        Endpoint para activar/desactivar un grupo
        """
        group = self.get_object()
        group.is_active = not group.is_active
        group.save()
        
        serializer = self.get_serializer(group)
        return Response(serializer.data)


@extend_schema_view(
    list=extend_schema(
        summary="Listar estudiantes",
        description="Obtiene la lista de estudiantes con filtros opcionales.",
        parameters=[
            OpenApiParameter(
                name='group',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                description='Filtrar por ID de grupo'
            ),
            OpenApiParameter(
                name='career',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Filtrar por carrera'
            ),
            OpenApiParameter(
                name='semester',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                description='Filtrar por semestre'
            ),
            OpenApiParameter(
                name='is_graduated',
                type=OpenApiTypes.BOOL,
                location=OpenApiParameter.QUERY,
                description='Filtrar por estudiantes graduados'
            ),
            OpenApiParameter(
                name='search',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Buscar por nombre, email o matrícula'
            )
        ],
        tags=["Students"]
    ),
    create=extend_schema(
        summary="Crear estudiante",
        description="Crea un nuevo estudiante en el sistema. Solo accesible por administradores.",
        tags=["Students"]
    ),
    retrieve=extend_schema(
        summary="Obtener estudiante",
        description="Obtiene los detalles de un estudiante específico.",
        tags=["Students"]
    ),
    update=extend_schema(
        summary="Actualizar estudiante",
        description="Actualiza completamente la información de un estudiante.",
        tags=["Students"]
    ),
    partial_update=extend_schema(
        summary="Actualizar parcialmente estudiante",
        description="Actualiza parcialmente la información de un estudiante.",
        tags=["Students"]
    ),
    destroy=extend_schema(
        summary="Eliminar estudiante",
        description="Elimina un estudiante del sistema. Solo accesible por administradores.",
        tags=["Students"]
    ),
)
class StudentViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de estudiantes con permisos basados en roles
    """
    
    queryset = Student.objects.select_related('user', 'group').all()
    serializer_class = StudentSerializer
    
    def get_serializer_class(self):
        if self.action == 'create':
            return StudentCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return StudentUpdateSerializer
        elif self.action == 'profile':
            return StudentProfileSerializer
        return StudentSerializer
    
    def get_permissions(self):
        """
        Permisos basados en la acción
        """
        if self.action in ['create', 'destroy']:
            permission_classes = [IsAdminUser]
        elif self.action in ['list']:
            permission_classes = [ReadOnlyForStudents]
        elif self.action in ['retrieve', 'update', 'partial_update']:
            permission_classes = [IsOwnerOrAdminOrPresident]
        else:
            permission_classes = [permissions.IsAuthenticated]
        
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """
        Filtra los estudiantes basado en el usuario y parámetros de consulta
        """
        queryset = Student.objects.select_related('user', 'group').all()
        
        # Filtros por parámetros de consulta
        group_id = self.request.query_params.get('group')
        career = self.request.query_params.get('career')
        semester = self.request.query_params.get('semester')
        is_graduated = self.request.query_params.get('is_graduated')
        search = self.request.query_params.get('search')
        
        if group_id:
            queryset = queryset.filter(group_id=group_id)
        
        if career:
            queryset = queryset.filter(career__icontains=career)
        
        if semester:
            queryset = queryset.filter(semester=semester)
        
        if is_graduated is not None:
            if is_graduated.lower() == 'true':
                queryset = queryset.filter(graduation_date__isnull=False)
            else:
                queryset = queryset.filter(graduation_date__isnull=True)
        
        if search:
            queryset = queryset.filter(
                Q(user__first_name__icontains=search) |
                Q(user__last_name__icontains=search) |
                Q(user__email__icontains=search) |
                Q(tuition_number__icontains=search)
            )
        
        # Filtros basados en el rol del usuario
        if not self.request.user.is_admin:
            # Los presidentes ven estudiantes de su grupo
            if self.request.user.is_president and hasattr(self.request.user, 'led_group'):
                queryset = queryset.filter(group=self.request.user.led_group)
            # Los estudiantes ven solo estudiantes activos
            elif self.request.user.is_student:
                queryset = queryset.filter(is_active=True)
        
        return queryset
    
    @extend_schema(
        summary="Obtener perfil propio de estudiante",
        description="Obtiene la información del perfil del estudiante autenticado.",
        responses={200: StudentProfileSerializer},
        tags=["Students"]
    )
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def profile(self, request):
        """
        Endpoint para obtener el perfil del estudiante autenticado
        """
        try:
            student = Student.objects.select_related('user', 'group').get(user=request.user)
            serializer = self.get_serializer(student)
            return Response(serializer.data)
        except Student.DoesNotExist:
            return Response(
                {'error': 'No se encontró perfil de estudiante para este usuario'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @extend_schema(
        summary="Actualizar perfil propio de estudiante",
        description="Actualiza la información del perfil del estudiante autenticado.",
        request=StudentProfileSerializer,
        responses={200: StudentProfileSerializer},
        tags=["Students"]
    )
    @action(detail=False, methods=['patch'], permission_classes=[permissions.IsAuthenticated])
    def update_profile(self, request):
        """
        Endpoint para actualizar el perfil del estudiante autenticado
        """
        try:
            student = Student.objects.select_related('user', 'group').get(user=request.user)
            serializer = self.get_serializer(
                student,
                data=request.data,
                partial=True
            )
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        except Student.DoesNotExist:
            return Response(
                {'error': 'No se encontró perfil de estudiante para este usuario'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @extend_schema(
        summary="Marcar como graduado",
        description="Marca un estudiante como graduado estableciendo la fecha de graduación. Solo accesible por administradores.",
        parameters=[
            OpenApiParameter(
                name='graduation_date',
                type=OpenApiTypes.DATE,
                location=OpenApiParameter.QUERY,
                required=False,
                description='Fecha de graduación (formato YYYY-MM-DD). Si no se proporciona, se usa la fecha actual.'
            )
        ],
        responses={200: StudentSerializer},
        tags=["Students"]
    )
    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrPresident])
    def graduate(self, request, pk=None):
        """
        Endpoint para marcar un estudiante como graduado
        """
        from datetime import date
        
        student = self.get_object()
        graduation_date = request.query_params.get('graduation_date')
        
        if graduation_date:
            try:
                from datetime import datetime
                graduation_date = datetime.strptime(graduation_date, '%Y-%m-%d').date()
            except ValueError:
                return Response(
                    {'error': 'Formato de fecha inválido. Use YYYY-MM-DD'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            graduation_date = date.today()
        
        student.graduation_date = graduation_date
        student.save()
        
        serializer = self.get_serializer(student)
        return Response(serializer.data)
    
    @extend_schema(
        summary="Activar/Desactivar estudiante",
        description="Activa o desactiva un estudiante del sistema. Solo accesible por administradores.",
        responses={200: StudentSerializer},
        tags=["Students"]
    )
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def toggle_active(self, request, pk=None):
        """
        Endpoint para activar/desactivar un estudiante
        """
        student = self.get_object()
        student.is_active = not student.is_active
        student.save()
        
        serializer = self.get_serializer(student)
        return Response(serializer.data)
