from django.contrib import admin
from .models import Student, StudentGroup


@admin.register(StudentGroup)
class StudentGroupAdmin(admin.ModelAdmin):
    list_display = (
        'name',
        'president_name',
        'student_count',
        'is_active',
        'created_at'
    )
    
    list_filter = ('is_active', 'created_at')
    search_fields = ('name', 'description', 'president__first_name', 'president__last_name')
    ordering = ('name',)
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('name', 'description', 'is_active')
        }),
        ('Liderazgo', {
            'fields': ('president',)
        }),
        ('Fechas', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    readonly_fields = ('created_at', 'updated_at')
    
    def student_count(self, obj):
        return obj.student_count
    student_count.short_description = 'Número de Estudiantes'
    
    def president_name(self, obj):
        return obj.president_name
    president_name.short_description = 'Presidente'


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = (
        'tuition_number',
        'full_name',
        'email',
        'career',
        'semester',
        'group',
        'average_grade',
        'is_active'
    )
    
    list_filter = (
        'career',
        'semester',
        'group',
        'is_active',
        'enrollment_date',
        'graduation_date'
    )
    
    search_fields = (
        'tuition_number',
        'user__first_name',
        'user__last_name',
        'user__email',
        'career'
    )
    
    ordering = ('tuition_number',)
    
    fieldsets = (
        ('Información del Usuario', {
            'fields': ('user',)
        }),
        ('Información Académica', {
            'fields': (
                'tuition_number',
                'career',
                'semester',
                'group',
                'average_grade'
            )
        }),
        ('Fechas Importantes', {
            'fields': (
                'enrollment_date',
                'graduation_date'
            )
        }),
        ('Estado', {
            'fields': ('is_active',)
        }),
        ('Metadatos', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    readonly_fields = ('created_at', 'updated_at')
    
    def full_name(self, obj):
        return obj.full_name
    full_name.short_description = 'Nombre Completo'
    
    def email(self, obj):
        return obj.email
    email.short_description = 'Correo Electrónico'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'group')