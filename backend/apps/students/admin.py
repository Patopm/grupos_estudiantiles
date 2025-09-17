from django.contrib import admin

from .models import GroupMembership, StudentGroup


@admin.register(StudentGroup)
class StudentGroupAdmin(admin.ModelAdmin):
    list_display = ('name', 'president_name', 'member_count', 'category',
                    'is_active', 'created_at')

    list_filter = ('category', 'is_active', 'created_at')
    search_fields = ('name', 'description', 'president__first_name',
                     'president__last_name')
    ordering = ('name', )

    fieldsets = (('Información Básica', {
        'fields': ('name', 'description', 'category', 'is_active')
    }), ('Configuración', {
        'fields': ('max_members', 'image')
    }), ('Liderazgo', {
        'fields': ('president', )
    }), ('Fechas', {
        'fields': ('created_at', ),
        'classes': ('collapse', )
    }))

    readonly_fields = ('created_at', )

    def member_count(self, obj):
        return obj.member_count

    member_count.short_description = 'Número de Miembros'

    def president_name(self, obj):
        return obj.president_name

    president_name.short_description = 'Presidente'


@admin.register(GroupMembership)
class GroupMembershipAdmin(admin.ModelAdmin):
    list_display = ('user', 'group', 'status', 'role', 'joined_at')

    list_filter = ('status', 'role', 'joined_at', 'group')

    search_fields = ('user__first_name', 'user__last_name', 'user__email',
                     'group__name')

    ordering = ('-joined_at', )

    fieldsets = (('Información de Membresía', {
        'fields': ('user', 'group', 'status', 'role')
    }), ('Fechas', {
        'fields': ('joined_at', ),
        'classes': ('collapse', )
    }))

    readonly_fields = ('joined_at', )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'group')
