from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.forms import UserChangeForm, UserCreationForm
from django.utils import timezone
from django.utils.html import format_html

from .models import (
    BackupCode,
    CustomUser,
    MFAEnforcementPolicy,
    PasswordResetToken,
    TOTPDevice,
)


class CustomUserCreationForm(UserCreationForm):

    class Meta(UserCreationForm.Meta):
        model = CustomUser
        fields = ("email", "username", "first_name", "last_name", "role", "student_id")


class CustomUserChangeForm(UserChangeForm):

    class Meta(UserChangeForm.Meta):
        model = CustomUser
        fields = "__all__"


@admin.register(CustomUser)
class UserAdmin(BaseUserAdmin):
    form = CustomUserChangeForm
    add_form = CustomUserCreationForm

    list_display = (
        "email",
        "username",
        "first_name",
        "last_name",
        "role",
        "is_active",
        "is_staff",
        "created_at",
    )

    list_filter = ("role", "is_active", "is_staff", "is_superuser", "created_at")

    search_fields = ("email", "username", "first_name", "last_name")

    ordering = ("-created_at",)

    fieldsets = BaseUserAdmin.fieldsets + (
        (
            "Información Adicional",
            {
                "fields": (
                    "role",
                    "student_id",
                    "phone",
                    "is_active_student",
                    "created_at",
                    "updated_at",
                )
            },
        ),
    )

    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        (
            "Información Adicional",
            {
                "fields": (
                    "email",
                    "first_name",
                    "last_name",
                    "role",
                    "student_id",
                    "phone",
                )
            },
        ),
    )

    readonly_fields = ("created_at", "updated_at")

    def get_readonly_fields(self, request, obj=None):
        readonly_fields = super().get_readonly_fields(request, obj)
        if obj and not request.user.is_superuser:
            readonly_fields = readonly_fields + ("is_superuser", "user_permissions")
        return readonly_fields


@admin.register(PasswordResetToken)
class PasswordResetTokenAdmin(admin.ModelAdmin):
    """Admin interface for password reset tokens"""

    list_display = (
        "user_email",
        "token_preview",
        "status_display",
        "created_at",
        "expires_at",
        "used_at",
        "ip_address",
    )

    list_filter = ("is_active", "created_at", "expires_at", "used_at")

    search_fields = (
        "user__email",
        "user__username",
        "user__first_name",
        "user__last_name",
        "token",
        "ip_address",
    )

    ordering = ("-created_at",)

    readonly_fields = (
        "id",
        "token",
        "created_at",
        "expires_at",
        "used_at",
        "ip_address",
        "user_agent",
        "status_display",
        "time_remaining",
    )

    fieldsets = (
        ("Token Information", {"fields": ("id", "user", "token", "status_display")}),
        (
            "Timestamps",
            {"fields": ("created_at", "expires_at", "used_at", "time_remaining")},
        ),
        ("Security Information", {"fields": ("ip_address", "user_agent")}),
        ("Status", {"fields": ("is_active",)}),
    )

    def user_email(self, obj):
        """Display user email"""
        return obj.user.email

    user_email.short_description = "User Email"
    user_email.admin_order_field = "user__email"

    def token_preview(self, obj):
        """Display token preview for security"""
        return f"{obj.token[:8]}...{obj.token[-8:]}"

    token_preview.short_description = "Token Preview"

    def status_display(self, obj):
        """Display token status with color coding"""
        if obj.used_at:
            return format_html('<span style="color: #666;">🔒 Used</span>')
        elif not obj.is_active:
            return format_html('<span style="color: #d63384;">❌ Inactive</span>')
        elif obj.is_expired:
            return format_html('<span style="color: #fd7e14;">⏰ Expired</span>')
        else:
            return format_html('<span style="color: #198754;">✅ Active</span>')

    status_display.short_description = "Status"

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

    time_remaining.short_description = "Time Remaining"

    def has_add_permission(self, request):
        """Disable adding tokens through admin"""
        return False

    def has_change_permission(self, request, obj=None):
        """Allow only viewing and deactivating tokens"""
        return request.user.is_superuser

    def has_delete_permission(self, request, obj=None):
        """Allow deleting expired tokens"""
        return request.user.is_superuser

    actions = ["deactivate_tokens", "cleanup_expired_tokens"]

    def deactivate_tokens(self, request, queryset):
        """Deactivate selected tokens"""
        updated = queryset.filter(is_active=True).update(is_active=False)
        self.message_user(
            request, f"Successfully deactivated {updated} password reset tokens."
        )

    deactivate_tokens.short_description = "Deactivate selected tokens"

    def cleanup_expired_tokens(self, request, queryset):
        """Delete expired tokens"""
        expired_tokens = queryset.filter(expires_at__lt=timezone.now())
        count = expired_tokens.count()
        expired_tokens.delete()
        self.message_user(
            request, f"Successfully deleted {count} expired password reset tokens."
        )

    cleanup_expired_tokens.short_description = "Delete expired tokens"


@admin.register(MFAEnforcementPolicy)
class MFAEnforcementPolicyAdmin(admin.ModelAdmin):
    """Admin interface for MFA enforcement policies"""

    list_display = (
        "role",
        "role_display",
        "mfa_required",
        "grace_period_days",
        "enforcement_status",
        "enforcement_date",
        "updated_at",
    )

    list_filter = ("mfa_required", "role", "created_at", "updated_at")

    search_fields = ("role",)

    ordering = ("role",)

    readonly_fields = ("created_at", "updated_at", "enforcement_status")

    fieldsets = (
        (
            "Policy Configuration",
            {"fields": ("role", "mfa_required", "grace_period_days")},
        ),
        ("Enforcement", {"fields": ("enforcement_date", "enforcement_status")}),
        ("Timestamps", {"fields": ("created_at", "updated_at")}),
    )

    def role_display(self, obj):
        """Display role in Spanish"""
        return obj.get_role_display()

    role_display.short_description = "Rol"
    role_display.admin_order_field = "role"

    def enforcement_status(self, obj):
        """Display enforcement status with color coding"""
        if not obj.mfa_required:
            return format_html('<span style="color: #666;">🔓 No requerido</span>')
        elif obj.is_enforcement_active():
            return format_html('<span style="color: #198754;">🔒 Activo</span>')
        else:
            return format_html('<span style="color: #fd7e14;">⏳ Pendiente</span>')

    enforcement_status.short_description = "Estado de Aplicación"

    def save_model(self, request, obj, form, change):
        """Set enforcement date when MFA is enabled"""
        if not change or ("mfa_required" in form.changed_data and obj.mfa_required):
            if obj.mfa_required and not obj.enforcement_date:
                obj.enforcement_date = timezone.now()
        elif not obj.mfa_required:
            obj.enforcement_date = None
        super().save_model(request, obj, form, change)

    actions = ["enable_mfa_for_role", "disable_mfa_for_role"]

    def enable_mfa_for_role(self, request, queryset):
        """Enable MFA for selected roles"""
        updated = 0
        for policy in queryset:
            if not policy.mfa_required:
                policy.mfa_required = True
                policy.enforcement_date = timezone.now()
                policy.save()
                updated += 1

        self.message_user(request, f"Successfully enabled MFA for {updated} roles.")

    enable_mfa_for_role.short_description = "Enable MFA for selected roles"

    def disable_mfa_for_role(self, request, queryset):
        """Disable MFA for selected roles"""
        updated = queryset.filter(mfa_required=True).update(
            mfa_required=False, enforcement_date=None
        )

        self.message_user(request, f"Successfully disabled MFA for {updated} roles.")

    disable_mfa_for_role.short_description = "Disable MFA for selected roles"


@admin.register(TOTPDevice)
class TOTPDeviceAdmin(admin.ModelAdmin):
    """Admin interface for TOTP devices"""

    list_display = [
        "user",
        "name",
        "is_active",
        "confirmed",
        "created_at",
        "last_used_at",
    ]
    list_filter = ["is_active", "confirmed", "created_at"]
    search_fields = ["user__email", "user__first_name", "user__last_name", "name"]
    readonly_fields = ["secret_key", "created_at", "last_used_at"]

    fieldsets = (
        (
            "Información del Dispositivo",
            {"fields": ("user", "name", "is_active", "confirmed")},
        ),
        ("Configuración TOTP", {"fields": ("secret_key",), "classes": ("collapse",)}),
        (
            "Fechas",
            {"fields": ("created_at", "last_used_at"), "classes": ("collapse",)},
        ),
    )

    def has_change_permission(self, request, obj=None):
        # Only allow changing active/confirmed status
        return request.user.is_superuser

    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser


@admin.register(BackupCode)
class BackupCodeAdmin(admin.ModelAdmin):
    """Admin interface for backup codes"""

    list_display = ["user", "code_preview", "is_used", "used_at", "created_at"]
    list_filter = ["is_used", "created_at", "used_at"]
    search_fields = ["user__email", "user__first_name", "user__last_name", "code"]
    readonly_fields = ["id", "code", "created_at", "used_at"]

    fieldsets = (
        ("Código de Respaldo", {"fields": ("user", "code", "is_used")}),
        ("Fechas", {"fields": ("created_at", "used_at"), "classes": ("collapse",)}),
    )

    def code_preview(self, obj):
        """Display code preview for security"""
        return f"{obj.code[:2]}****{obj.code[-2:]}"

    code_preview.short_description = "Código"
    code_preview.admin_order_field = "code"

    def has_add_permission(self, request):
        """Disable adding codes through admin"""
        return False

    def has_change_permission(self, request, obj=None):
        """Allow only viewing codes"""
        return request.user.is_superuser

    def has_delete_permission(self, request, obj=None):
        """Allow deleting used codes"""
        return request.user.is_superuser

    actions = ["mark_as_used", "delete_used_codes"]

    def mark_as_used(self, request, queryset):
        """Mark selected codes as used"""
        updated = queryset.filter(is_used=False).update(
            is_used=True, used_at=timezone.now()
        )
        self.message_user(
            request, f"Successfully marked {updated} backup codes as used."
        )

    mark_as_used.short_description = "Mark selected codes as used"

    def delete_used_codes(self, request, queryset):
        """Delete used backup codes"""
        used_codes = queryset.filter(is_used=True)
        count = used_codes.count()
        used_codes.delete()
        self.message_user(request, f"Successfully deleted {count} used backup codes.")

    delete_used_codes.short_description = "Delete used backup codes"
