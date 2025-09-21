from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.forms import UserChangeForm, UserCreationForm
from django.utils.html import format_html
from django.utils import timezone

from .models import CustomUser, PasswordResetToken


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


@admin.register(PasswordResetToken)
class PasswordResetTokenAdmin(admin.ModelAdmin):
    """Admin interface for password reset tokens"""
    
    list_display = (
        'user_email', 'token_preview', 'status_display', 
        'created_at', 'expires_at', 'used_at', 'ip_address'
    )
    
    list_filter = (
        'is_active', 'created_at', 'expires_at', 'used_at'
    )
    
    search_fields = (
        'user__email', 'user__username', 'user__first_name', 
        'user__last_name', 'token', 'ip_address'
    )
    
    ordering = ('-created_at',)
    
    readonly_fields = (
        'id', 'token', 'created_at', 'expires_at', 'used_at', 
        'ip_address', 'user_agent', 'status_display', 'time_remaining'
    )
    
    fieldsets = (
        ('Token Information', {
            'fields': ('id', 'user', 'token', 'status_display')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'expires_at', 'used_at', 'time_remaining')
        }),
        ('Security Information', {
            'fields': ('ip_address', 'user_agent')
        }),
        ('Status', {
            'fields': ('is_active',)
        })
    )
    
    def user_email(self, obj):
        """Display user email"""
        return obj.user.email
    user_email.short_description = 'User Email'
    user_email.admin_order_field = 'user__email'
    
    def token_preview(self, obj):
        """Display token preview for security"""
        return f"{obj.token[:8]}...{obj.token[-8:]}"
    token_preview.short_description = 'Token Preview'
    
    def status_display(self, obj):
        """Display token status with color coding"""
        if obj.used_at:
            return format_html(
                '<span style="color: #666;">🔒 Used</span>'
            )
        elif not obj.is_active:
            return format_html(
                '<span style="color: #d63384;">❌ Inactive</span>'
            )
        elif obj.is_expired:
            return format_html(
                '<span style="color: #fd7e14;">⏰ Expired</span>'
            )
        else:
            return format_html(
                '<span style="color: #198754;">✅ Active</span>'
            )
    status_display.short_description = 'Status'
    
    def time_remaining(self, obj):
        """Display time remaining until expiration"""
        if obj.used_at:
            return "Token used"
        elif not obj.is_active:
            return "Token inactive"
        elif obj.is_expired:
            return "Expired"
        else:
            remaining = obj.expires_at - timezone.now()
            hours = remaining.total_seconds() // 3600
            minutes = (remaining.total_seconds() % 3600) // 60
            return f"{int(hours)}h {int(minutes)}m remaining"
    time_remaining.short_description = 'Time Remaining'
    
    def has_add_permission(self, request):
        """Disable adding tokens through admin"""
        return False
    
    def has_change_permission(self, request, obj=None):
        """Allow only viewing and deactivating tokens"""
        return request.user.is_superuser
    
    def has_delete_permission(self, request, obj=None):
        """Allow deleting expired tokens"""
        return request.user.is_superuser
    
    actions = ['deactivate_tokens', 'cleanup_expired_tokens']
    
    def deactivate_tokens(self, request, queryset):
        """Deactivate selected tokens"""
        updated = queryset.filter(is_active=True).update(is_active=False)
        self.message_user(
            request, 
            f'Successfully deactivated {updated} password reset tokens.'
        )
    deactivate_tokens.short_description = 'Deactivate selected tokens'
    
    def cleanup_expired_tokens(self, request, queryset):
        """Delete expired tokens"""
        expired_tokens = queryset.filter(expires_at__lt=timezone.now())
        count = expired_tokens.count()
        expired_tokens.delete()
        self.message_user(
            request,
            f'Successfully deleted {count} expired password reset tokens.'
        )
    cleanup_expired_tokens.short_description = 'Delete expired tokens'
