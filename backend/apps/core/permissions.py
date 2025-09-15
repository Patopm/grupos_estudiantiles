from rest_framework import permissions


class IsAdminUser(permissions.BasePermission):
    """
    Permission para usuarios con rol de administrador
    """
    
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.is_admin
        )


class IsPresidentUser(permissions.BasePermission):
    """
    Permission para usuarios con rol de presidente
    """
    
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.is_president
        )


class IsStudentUser(permissions.BasePermission):
    """
    Permission para usuarios con rol de estudiante
    """
    
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.is_student
        )


class IsAdminOrPresident(permissions.BasePermission):
    """
    Permission para administradores o presidentes
    """
    
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            (request.user.is_admin or request.user.is_president)
        )


class IsOwnerOrAdminOrPresident(permissions.BasePermission):
    """
    Permission para el propietario del objeto, administradores o presidentes
    """
    
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)
    
    def has_object_permission(self, request, view, obj):
        # Administradores y presidentes tienen acceso completo
        if request.user.is_admin or request.user.is_president:
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
    Permission para presidentes de grupo o administradores
    """
    
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)
    
    def has_object_permission(self, request, view, obj):
        # Administradores tienen acceso completo
        if request.user.is_admin:
            return True
        
        # Presidentes pueden acceder a su grupo
        if request.user.is_president:
            if hasattr(obj, 'group') and hasattr(obj.group, 'president'):
                return obj.group.president == request.user
            elif hasattr(obj, 'president'):
                return obj.president == request.user
        
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


class EventPermission(permissions.BasePermission):
    """
    Permission específica para eventos:
    - Administradores: acceso completo
    - Presidentes: pueden crear/editar eventos de su grupo
    - Estudiantes: solo lectura y inscripción
    """
    
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        
        # Administradores tienen acceso completo
        if request.user.is_admin:
            return True
        
        # Presidentes pueden crear eventos
        if request.user.is_president:
            return True
        
        # Estudiantes solo pueden leer y inscribirse
        if request.user.is_student:
            return request.method in permissions.SAFE_METHODS or view.action in ['register', 'unregister']
        
        return False
    
    def has_object_permission(self, request, view, obj):
        # Administradores tienen acceso completo
        if request.user.is_admin:
            return True
        
        # El organizador puede editar su evento
        if obj.organizer == request.user:
            return True
        
        # Presidentes pueden editar eventos dirigidos a su grupo
        if request.user.is_president and hasattr(request.user, 'led_group'):
            if obj.target_groups.filter(id=request.user.led_group.id).exists():
                return True
        
        # Estudiantes solo pueden leer
        if request.user.is_student and request.method in permissions.SAFE_METHODS:
            return True
        
        return False
