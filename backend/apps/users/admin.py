from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.forms import UserChangeForm, UserCreationForm

from .models import CustomUser


class CustomUserCreationForm(UserCreationForm):

    class Meta(UserCreationForm.Meta):
        model = CustomUser
        fields = ('email', 'username', 'first_name', 'last_name', 'role',
                  'student_id')


class CustomUserChangeForm(UserChangeForm):

    class Meta(UserChangeForm.Meta):
        model = CustomUser
        fields = '__all__'


@admin.register(CustomUser)
class UserAdmin(BaseUserAdmin):
    form = CustomUserChangeForm
    add_form = CustomUserCreationForm

    list_display = ('email', 'username', 'first_name', 'last_name', 'role',
                    'is_active', 'is_staff', 'created_at')

    list_filter = ('role', 'is_active', 'is_staff', 'is_superuser',
                   'created_at')

    search_fields = ('email', 'username', 'first_name', 'last_name')

    ordering = ('-created_at', )

    fieldsets = BaseUserAdmin.fieldsets + (('Información Adicional', {
        'fields': ('role', 'student_id', 'phone', 'is_active_student',
                   'created_at', 'updated_at')
    }), )

    add_fieldsets = BaseUserAdmin.add_fieldsets + (('Información Adicional', {
        'fields':
        ('email', 'first_name', 'last_name', 'role', 'student_id', 'phone')
    }), )

    readonly_fields = ('created_at', 'updated_at')

    def get_readonly_fields(self, request, obj=None):
        readonly_fields = super().get_readonly_fields(request, obj)
        if obj and not request.user.is_superuser:
            readonly_fields = readonly_fields + ('is_superuser',
                                                 'user_permissions')
        return readonly_fields
