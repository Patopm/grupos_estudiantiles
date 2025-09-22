from django.contrib import admin
from django.utils import timezone
from django.utils.html import format_html

from .models import Event, EventAttendance


class EventAttendanceInline(admin.TabularInline):
    model = EventAttendance
    extra = 0
    fields = ("user", "status", "registration_date", "notes")
    readonly_fields = ("registration_date",)


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "event_type",
        "status",
        "start_datetime",
        "location",
        "attendee_count",
        "is_full_display",
    )

    list_filter = (
        "event_type",
        "status",
        "requires_registration",
        "start_datetime",
        "created_at",
    )

    search_fields = ("title", "description", "location")

    ordering = ("-start_datetime",)

    fieldsets = (
        (
            "Información Básica",
            {"fields": ("title", "description", "event_type", "status")},
        ),
        (
            "Fecha y Ubicación",
            {"fields": ("start_datetime", "end_datetime", "location")},
        ),
        (
            "Inscripciones",
            {
                "fields": (
                    "requires_registration",
                    "max_attendees",
                    "registration_deadline",
                )
            },
        ),
        ("Grupos Objetivo", {"fields": ("target_groups",), "classes": ("collapse",)}),
        ("Multimedia", {"fields": ("image",), "classes": ("collapse",)}),
        (
            "Metadatos",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    readonly_fields = ("created_at", "updated_at")
    filter_horizontal = ("target_groups",)
    inlines = [EventAttendanceInline]

    def attendee_count(self, obj):
        count = obj.attendee_count
        max_attendees = obj.max_attendees
        if max_attendees:
            return f"{count}/{max_attendees}"
        return str(count)

    attendee_count.short_description = "Asistentes"

    def is_full_display(self, obj):
        if obj.is_full:
            return format_html('<span style="color: red;">Lleno</span>')
        elif obj.max_attendees and obj.attendee_count >= obj.max_attendees * 0.8:
            return format_html('<span style="color: orange;">Casi lleno</span>')
        return format_html('<span style="color: green;">Disponible</span>')

    is_full_display.short_description = "Estado"


@admin.register(EventAttendance)
class EventAttendanceAdmin(admin.ModelAdmin):
    list_display = ("event_title", "user_name", "status", "registration_date")

    list_filter = ("status", "registration_date", "event__event_type", "event__status")

    search_fields = (
        "event__title",
        "user__first_name",
        "user__last_name",
        "user__email",
    )

    ordering = ("-registration_date",)

    fieldsets = (
        ("Información del Evento", {"fields": ("event",)}),
        ("Información del Asistente", {"fields": ("user", "status")}),
        (
            "Detalles",
            {"fields": ("registration_date", "notes", "updated_at", "registered_at")},
        ),
    )

    readonly_fields = ("registration_date", "updated_at", "registered_at")

    def event_title(self, obj):
        return obj.event.title

    event_title.short_description = "Evento"

    def user_name(self, obj):
        return obj.user.get_full_name()

    user_name.short_description = "Asistente"

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("event", "user")
