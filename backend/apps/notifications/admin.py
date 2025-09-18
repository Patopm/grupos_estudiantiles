from django.contrib import admin
from django.urls import reverse
from django.utils.html import format_html
from django.utils.safestring import mark_safe

from .models import (
    EmailNotification,
    EmailTemplate,
    EventReminder,
    NotificationPreferences,
    TOTPDevice,
)


@admin.register(TOTPDevice)
class TOTPDeviceAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'name', 'is_active', 'confirmed', 'created_at', 'last_used_at'
    ]
    list_filter = ['is_active', 'confirmed', 'created_at']
    search_fields = [
        'user__email', 'user__first_name', 'user__last_name', 'name'
    ]
    readonly_fields = ['secret_key', 'created_at', 'last_used_at']

    fieldsets = (('Información del Dispositivo', {
        'fields': ('user', 'name', 'is_active', 'confirmed')
    }), ('Configuración TOTP', {
        'fields': ('secret_key', ),
        'classes': ('collapse', )
    }), ('Fechas', {
        'fields': ('created_at', 'last_used_at'),
        'classes': ('collapse', )
    }))

    def has_change_permission(self, request, obj=None):
        # Only allow changing active/confirmed status
        return request.user.is_superuser

    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser


@admin.register(EmailTemplate)
class EmailTemplateAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'template_type', 'subject', 'is_active', 'created_at'
    ]
    list_filter = ['template_type', 'is_active', 'created_at']
    search_fields = ['name', 'subject', 'template_type']
    readonly_fields = ['created_at', 'updated_at']

    fieldsets = (('Información Básica', {
        'fields': ('name', 'template_type', 'subject', 'is_active')
    }), ('Contenido', {
        'fields': ('html_content', 'text_content'),
        'description': 'Use Django template syntax for dynamic content'
    }), ('Fechas', {
        'fields': ('created_at', 'updated_at'),
        'classes': ('collapse', )
    }))

    def get_readonly_fields(self, request, obj=None):
        readonly = list(self.readonly_fields)
        if obj and not request.user.is_superuser:
            # Non-superusers can't change template_type
            readonly.append('template_type')
        return readonly


@admin.register(EmailNotification)
class EmailNotificationAdmin(admin.ModelAdmin):
    list_display = [
        'recipient', 'subject', 'status', 'priority', 'scheduled_at',
        'sent_at', 'created_at'
    ]
    list_filter = [
        'status', 'priority', 'created_at', 'scheduled_at', 'sent_at'
    ]
    search_fields = [
        'recipient__email', 'recipient__first_name', 'recipient__last_name',
        'subject', 'template__name'
    ]
    readonly_fields = [
        'id', 'sent_at', 'failed_at', 'created_at', 'updated_at',
        'html_preview', 'text_preview'
    ]

    fieldsets = (('Destinatario y Contenido', {
        'fields':
        ('recipient', 'template', 'subject', 'from_email', 'reply_to')
    }), ('Configuración', {
        'fields': ('priority', 'scheduled_at', 'status')
    }), ('Contenido del Email', {
        'fields': ('html_preview', 'text_preview'),
        'classes': ('collapse', )
    }), ('Datos de Contexto', {
        'fields': ('context_data', ),
        'classes': ('collapse', )
    }), ('Estado y Errores', {
        'fields': ('sent_at', 'failed_at', 'error_message'),
        'classes': ('collapse', )
    }), ('Fechas', {
        'fields': ('created_at', 'updated_at'),
        'classes': ('collapse', )
    }))

    actions = ['resend_notifications', 'cancel_notifications']

    def html_preview(self, obj):
        if obj.html_content:
            return format_html(
                '<div style="max-height: 300px; overflow-y: scroll; border: 1px solid #ccc; padding: 10px;">{}</div>',
                obj.html_content)
        return "No hay contenido HTML"

    html_preview.short_description = "Vista previa HTML"

    def text_preview(self, obj):
        if obj.text_content:
            return format_html(
                '<pre style="max-height: 200px; overflow-y: scroll; white-space: pre-wrap;">{}</pre>',
                obj.text_content)
        return "No hay contenido de texto"

    text_preview.short_description = "Vista previa de texto"

    def resend_notifications(self, request, queryset):
        """Resend failed or cancelled notifications"""
        updated = queryset.filter(status__in=['failed', 'cancelled']).update(
            status='pending', error_message='', failed_at=None)

        self.message_user(request,
                          f'{updated} notificaciones marcadas para reenvío.')

    resend_notifications.short_description = "Reenviar notificaciones seleccionadas"

    def cancel_notifications(self, request, queryset):
        """Cancel pending notifications"""
        updated = queryset.filter(status='pending').update(status='cancelled')

        self.message_user(request, f'{updated} notificaciones canceladas.')

    cancel_notifications.short_description = "Cancelar notificaciones pendientes"


@admin.register(NotificationPreferences)
class NotificationPreferencesAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'event_reminders', 'group_requests', 'security_alerts',
        'email_frequency', 'updated_at'
    ]
    list_filter = [
        'event_reminders', 'event_updates', 'group_requests',
        'security_alerts', 'email_frequency', 'updated_at'
    ]
    search_fields = ['user__email', 'user__first_name', 'user__last_name']
    readonly_fields = ['created_at', 'updated_at']

    fieldsets = (('Usuario', {
        'fields': ('user', )
    }), ('Notificaciones de Eventos', {
        'fields': ('event_reminders', 'event_updates', 'event_cancellations')
    }), ('Notificaciones de Grupos', {
        'fields': ('group_requests', 'group_updates', 'new_members')
    }), ('Notificaciones de Seguridad', {
        'fields': ('security_alerts', 'login_notifications')
    }), ('Notificaciones Generales', {
        'fields': ('newsletter', 'promotional_emails', 'email_frequency')
    }), ('Fechas', {
        'fields': ('created_at', 'updated_at'),
        'classes': ('collapse', )
    }))


@admin.register(EventReminder)
class EventReminderAdmin(admin.ModelAdmin):
    list_display = [
        'event', 'recipient', 'reminder_type', 'scheduled_at', 'sent',
        'sent_at', 'created_at'
    ]
    list_filter = ['reminder_type', 'sent', 'created_at', 'scheduled_at']
    search_fields = [
        'event__title', 'recipient__email', 'recipient__first_name',
        'recipient__last_name'
    ]
    readonly_fields = ['sent_at', 'created_at']

    fieldsets = (('Recordatorio', {
        'fields': ('event', 'recipient', 'reminder_type', 'scheduled_at')
    }), ('Estado', {
        'fields': ('sent', 'sent_at')
    }), ('Fechas', {
        'fields': ('created_at', ),
        'classes': ('collapse', )
    }))

    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'event', 'recipient')
