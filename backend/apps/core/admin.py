from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
import json

from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    """
    Admin interface for AuditLog model
    """

    list_display = [
        "timestamp",
        "event_type",
        "severity",
        "username",
        "ip_address",
        "status_indicator",
        "message_preview",
    ]
    list_filter = [
        "event_type",
        "severity",
        "resolved",
        "timestamp",
        ("user", admin.RelatedOnlyFieldListFilter),
    ]
    search_fields = ["username", "ip_address", "message", "request_path", "user_agent"]
    readonly_fields = [
        "id",
        "timestamp",
        "event_type",
        "severity",
        "user",
        "username",
        "ip_address",
        "user_agent",
        "session_key",
        "request_path",
        "request_method",
        "status_code",
        "message",
        "extra_data_formatted",
        "fingerprint",
        "geolocation",
    ]
    fields = [
        "id",
        "timestamp",
        "event_type",
        "severity",
        "user",
        "username",
        "ip_address",
        "user_agent",
        "session_key",
        "request_path",
        "request_method",
        "status_code",
        "message",
        "extra_data_formatted",
        "fingerprint",
        "geolocation",
        "resolved",
        "resolved_by",
        "resolved_at",
        "resolution_notes",
    ]
    date_hierarchy = "timestamp"
    ordering = ["-timestamp"]
    list_per_page = 50

    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        return super().get_queryset(request).select_related("user", "resolved_by")

    def status_indicator(self, obj):
        """Display status with color coding"""
        if obj.severity == "critical":
            color = "red"
            icon = "🔴"
        elif obj.severity == "high":
            color = "orange"
            icon = "🟠"
        elif obj.severity == "medium":
            color = "yellow"
            icon = "🟡"
        else:
            color = "green"
            icon = "🟢"

        status = "✅ Resolved" if obj.resolved else "❌ Unresolved"

        return format_html(
            '<span style="color: {};">{} {}</span><br/><small>{}</small>',
            color,
            icon,
            obj.get_severity_display(),
            status,
        )

    status_indicator.short_description = "Status"

    def message_preview(self, obj):
        """Display truncated message"""
        if len(obj.message) > 100:
            return obj.message[:100] + "..."
        return obj.message

    message_preview.short_description = "Message"

    def extra_data_formatted(self, obj):
        """Display formatted extra data"""
        if obj.extra_data:
            try:
                formatted = json.dumps(obj.extra_data, indent=2)
                return format_html("<pre>{}</pre>", formatted)
            except:
                return str(obj.extra_data)
        return "No extra data"

    extra_data_formatted.short_description = "Extra Data"

    def has_add_permission(self, request):
        """Disable adding audit logs through admin"""
        return False

    def has_delete_permission(self, request, obj=None):
        """Only allow superusers to delete audit logs"""
        return request.user.is_superuser

    def has_change_permission(self, request, obj=None):
        """Allow changing only resolution fields"""
        return True

    def get_readonly_fields(self, request, obj=None):
        """Make most fields readonly, allow editing resolution fields"""
        readonly = list(self.readonly_fields)
        if obj and not obj.resolved:
            # Allow editing resolution fields for unresolved events
            readonly = [
                f
                for f in readonly
                if f
                not in ["resolved", "resolved_by", "resolved_at", "resolution_notes"]
            ]
        return readonly

    actions = ["mark_resolved", "export_selected"]

    def mark_resolved(self, request, queryset):
        """Mark selected audit logs as resolved"""
        updated = 0
        for audit_log in queryset.filter(resolved=False):
            audit_log.mark_resolved(
                resolved_by=request.user,
                resolution_notes=f"Resolved by {request.user.username} via admin interface",
            )
            updated += 1

        self.message_user(
            request, f"Successfully marked {updated} audit log(s) as resolved."
        )

    mark_resolved.short_description = "Mark selected logs as resolved"

    def export_selected(self, request, queryset):
        """Export selected audit logs"""
        # This would typically generate a CSV or JSON export
        # For now, just show a message
        self.message_user(
            request,
            f"Export functionality would export {queryset.count()} audit log(s).",
        )

    export_selected.short_description = "Export selected logs"
