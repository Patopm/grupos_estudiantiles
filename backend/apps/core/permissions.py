from rest_framework import permissions


class IsAdminUser(permissions.BasePermission):
    """
    Permission para usuarios con rol de administrador
    """

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated
                    and request.user.is_admin)


class IsPresidentUser(permissions.BasePermission):
    """
    Permission para usuarios con rol de presidente
    """

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated
                    and request.user.is_president)


class IsStudentUser(permissions.BasePermission):
    """
    Permission para usuarios con rol de estudiante
    """

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated
                    and request.user.is_student)


class IsAdminOrPresident(permissions.BasePermission):
    """
    Permission para administradores o presidentes
    """

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated
                    and (request.user.is_admin or request.user.is_president))


class IsOwnerOrAdminOrPresident(permissions.BasePermission):
    """
    Permission para el propietario del objeto, administradores o presidentes
    """

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        # Administradores tienen acceso completo
        if request.user.is_admin:
            return True

        # Presidentes tienen acceso a objetos de su grupo
        if request.user.is_president:
            return True

        # El propietario puede acceder a sus propios objetos
        if hasattr(obj, 'user'):
            return obj.user == request.user
        elif hasattr(obj, 'organizer'):
            return obj.organizer == request.user
        elif hasattr(obj, 'owner'):
            return obj.owner == request.user

        return False


class IsGroupPresidentOrAdmin(permissions.BasePermission):
    """
    Permission para presidentes de grupo específico o administradores
    """

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        # Administradores tienen acceso completo
        if request.user.is_admin:
            return True

        # Presidentes pueden acceder a su grupo
        if request.user.is_president:
            # Para objetos StudentGroup
            if hasattr(obj, 'president'):
                return obj.president == request.user
            # Para objetos relacionados con grupo (como membresías)
            elif hasattr(obj, 'group') and hasattr(obj.group, 'president'):
                return obj.group.president == request.user

        return False


class GroupMembershipPermission(permissions.BasePermission):
    """
    Permission específica para membresías de grupos:
    - Administradores: acceso completo
    - Presidentes: pueden gestionar solicitudes de su grupo
    - Estudiantes: pueden crear solicitudes y ver sus propias membresías
    """

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False

        # Administradores tienen acceso completo
        if request.user.is_admin:
            return True

        # Presidentes pueden gestionar solicitudes
        if request.user.is_president:
            return True

        # Estudiantes pueden crear solicitudes y ver las suyas
        if request.user.is_student:
            return view.action in [
                'create', 'list', 'retrieve'
            ] or request.method in permissions.SAFE_METHODS

        return False

    def has_object_permission(self, request, view, obj):
        # Administradores tienen acceso completo
        if request.user.is_admin:
            return True

        # Presidente del grupo puede gestionar todas las membresías del grupo
        if request.user.is_president and obj.group.president == request.user:
            return True

        # Usuario puede ver/gestionar su propia membresía
        if obj.user == request.user:
            return True

        return False


class EventPermission(permissions.BasePermission):
    """
    Permission específica para eventos:
    - Administradores: acceso completo
    - Presidentes: pueden crear/editar eventos
    - Estudiantes: solo lectura y gestión de asistencia
    """

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False

        # Administradores tienen acceso completo
        if request.user.is_admin:
            return True

        # Presidentes pueden crear/editar eventos
        if request.user.is_president:
            return True

        # Estudiantes solo pueden leer y gestionar asistencia
        if request.user.is_student:
            return (request.method in permissions.SAFE_METHODS or view.action
                    in ['attend', 'unattend', 'list', 'retrieve'])

        return False

    def has_object_permission(self, request, view, obj):
        # Administradores tienen acceso completo
        if request.user.is_admin:
            return True

        # Presidentes pueden editar eventos dirigidos a sus grupos
        if request.user.is_president:
            # Verificar si el usuario es presidente de algún grupo objetivo del evento
            user_groups = obj.target_groups.filter(president=request.user)
            if user_groups.exists():
                return True

        # Estudiantes solo pueden leer
        if request.user.is_student and request.method in permissions.SAFE_METHODS:
            return True

        return False


class EventAttendancePermission(permissions.BasePermission):
    """
    Permission específica para asistencia a eventos:
    - Administradores: acceso completo
    - Presidentes: pueden gestionar asistencias de eventos de sus grupos
    - Estudiantes: pueden gestionar su propia asistencia
    """

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False

        # Administradores tienen acceso completo
        if request.user.is_admin:
            return True

        # Presidentes pueden gestionar asistencias
        if request.user.is_president:
            return True

        # Estudiantes pueden gestionar su asistencia
        if request.user.is_student:
            return True

        return False

    def has_object_permission(self, request, view, obj):
        # Administradores tienen acceso completo
        if request.user.is_admin:
            return True

        # Presidentes pueden gestionar asistencias de eventos de sus grupos
        if request.user.is_president:
            user_groups = obj.event.target_groups.filter(
                president=request.user)
            if user_groups.exists():
                return True

        # Usuario puede gestionar su propia asistencia
        if obj.user == request.user:
            return True

        return False


class ReadOnlyForStudents(permissions.BasePermission):
    """
    Permission que permite lectura para estudiantes y escritura para admin/presidente
    """

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False

        # Administradores y presidentes tienen acceso completo
        if request.user.is_admin or request.user.is_president:
            return True

        # Estudiantes solo pueden leer
        if request.user.is_student:
            return request.method in permissions.SAFE_METHODS

        return False


class DashboardPermission(permissions.BasePermission):
    """
    Permission para endpoints de dashboard - cada usuario solo puede acceder a su propio dashboard
    """

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)


class UserManagementPermission(permissions.BasePermission):
    """
    Permission para gestión de usuarios - solo administradores
    """

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated
                    and request.user.is_admin)

    def has_object_permission(self, request, view, obj):
        # Solo administradores pueden gestionar usuarios
        return request.user.is_admin
