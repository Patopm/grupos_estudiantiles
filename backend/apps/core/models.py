import uuid

from django.contrib.auth import get_user_model
from django.db import models
from django.utils import timezone

User = get_user_model()


class AuditLog(models.Model):
    """
    Model for tracking authentication and security events
    """

    EVENT_TYPES = [
        # Authentication events
        ("login_success", "Login Success"),
        ("login_failed", "Login Failed"),
        ("logout", "Logout"),
        ("token_refresh", "Token Refresh"),
        ("token_refresh_failed", "Token Refresh Failed"),
        ("register_success", "Registration Success"),
        ("register_failed", "Registration Failed"),
        # Password events
        ("password_reset_request", "Password Reset Request"),
        ("password_reset_success", "Password Reset Success"),
        ("password_reset_failed", "Password Reset Failed"),
        ("password_change_success", "Password Change Success"),
        ("password_change_failed", "Password Change Failed"),
        # Permission events
        ("permission_denied", "Permission Denied"),
        ("unauthorized_access", "Unauthorized Access"),
        ("role_escalation_attempt", "Role Escalation Attempt"),
        # Security events
        ("suspicious_activity", "Suspicious Activity"),
        ("account_locked", "Account Locked"),
        ("ip_locked", "IP Address Locked"),
        ("brute_force_attempt", "Brute Force Attempt"),
        ("session_hijack_attempt", "Session Hijack Attempt"),
        ("token_manipulation", "Token Manipulation"),
        # System events
        ("user_created", "User Created"),
        ("user_updated", "User Updated"),
        ("user_deactivated", "User Deactivated"),
        ("role_changed", "Role Changed"),
        # Administrative events
        ("admin_action", "Administrative Action"),
        ("bulk_operation", "Bulk Operation"),
        ("data_export", "Data Export"),
        ("system_configuration_change", "System Configuration Change"),
    ]

    SEVERITY_LEVELS = [
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
        ("critical", "Critical"),
    ]

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text="Unique identifier for the audit log entry",
    )

    event_type = models.CharField(
        max_length=50, choices=EVENT_TYPES, help_text="Type of event being logged"
    )

    severity = models.CharField(
        max_length=20,
        choices=SEVERITY_LEVELS,
        default="medium",
        help_text="Severity level of the event",
    )

    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_logs",
        help_text="User associated with the event (if applicable)",
    )

    username = models.CharField(
        max_length=150,
        blank=True,
        help_text="Username at the time of the event (preserved even if user is deleted)",
    )

    ip_address = models.GenericIPAddressField(
        help_text="IP address from which the event originated"
    )

    user_agent = models.TextField(
        blank=True, help_text="User agent string from the request"
    )

    session_key = models.CharField(
        max_length=40,
        blank=True,
        null=True,
        help_text="Session key associated with the event",
    )

    request_path = models.CharField(
        max_length=500, blank=True, help_text="Request path that triggered the event"
    )

    request_method = models.CharField(
        max_length=10, blank=True, help_text="HTTP method used in the request"
    )

    status_code = models.IntegerField(
        null=True, blank=True, help_text="HTTP status code of the response"
    )

    message = models.TextField(help_text="Detailed message describing the event")

    extra_data = models.JSONField(
        default=dict, blank=True, help_text="Additional data related to the event"
    )

    timestamp = models.DateTimeField(
        default=timezone.now, help_text="When the event occurred"
    )

    fingerprint = models.CharField(
        max_length=64, blank=True, help_text="Unique fingerprint for the client/session"
    )

    geolocation = models.JSONField(
        default=dict, blank=True, help_text="Geolocation data if available"
    )

    resolved = models.BooleanField(
        default=False, help_text="Whether this security event has been resolved"
    )

    resolved_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="resolved_audit_logs",
        help_text="User who resolved this security event",
    )

    resolved_at = models.DateTimeField(
        null=True, blank=True, help_text="When this security event was resolved"
    )

    resolution_notes = models.TextField(
        blank=True, help_text="Notes about how this security event was resolved"
    )

    class Meta:
        db_table = "audit_logs"
        verbose_name = "Audit Log"
        verbose_name_plural = "Audit Logs"
        ordering = ["-timestamp"]
        indexes = [
            models.Index(fields=["event_type"]),
            models.Index(fields=["user"]),
            models.Index(fields=["ip_address"]),
            models.Index(fields=["timestamp"]),
            models.Index(fields=["severity"]),
            models.Index(fields=["resolved"]),
            models.Index(fields=["event_type", "timestamp"]),
            models.Index(fields=["user", "timestamp"]),
            models.Index(fields=["ip_address", "timestamp"]),
        ]

    def __str__(self):
        return f"{self.get_event_type_display()} - {self.username or 'Anonymous'} - {self.timestamp.strftime('%Y-%m-%d %H:%M:%S')}"

    @classmethod
    def log_event(
        cls,
        event_type,
        request=None,
        user=None,
        message="",
        extra_data=None,
        severity="medium",
    ):
        """
        Convenience method to create audit log entries
        """
        from apps.core.security_utils import get_client_fingerprint, get_client_ip

        # Extract request information
        ip_address = get_client_ip(request) if request else None
        user_agent = request.META.get("HTTP_USER_AGENT", "") if request else ""
        session_key = (
            request.session.session_key
            if request and hasattr(request, "session")
            else ""
        )
        request_path = request.path if request else ""
        request_method = request.method if request else ""
        fingerprint = get_client_fingerprint(request) if request else ""

        # Determine user information
        if (
            not user
            and request
            and hasattr(request, "user")
            and request.user.is_authenticated
        ):
            user = request.user

        username = user.username if user else ""

        # Create audit log entry
        audit_log = cls.objects.create(
            event_type=event_type,
            severity=severity,
            user=user,
            username=username,
            ip_address=ip_address or "0.0.0.0",
            user_agent=user_agent,
            session_key=session_key,
            request_path=request_path,
            request_method=request_method,
            message=message,
            extra_data=extra_data or {},
            fingerprint=fingerprint,
        )

        return audit_log

    @classmethod
    def log_authentication_event(
        cls, event_type, request, user=None, success=True, extra_data=None
    ):
        """
        Log authentication-related events
        """
        severity_map = {
            "login_success": "low",
            "login_failed": "medium",
            "logout": "low",
            "token_refresh": "low",
            "token_refresh_failed": "medium",
            "register_success": "low",
            "register_failed": "medium",
        }

        severity = severity_map.get(event_type, "medium")

        message_map = {
            "login_success": f"User {user.username if user else 'unknown'} logged in successfully",
            "login_failed": f"Failed login attempt for user {extra_data.get('username', 'unknown') if extra_data else 'unknown'}",
            "logout": f"User {user.username if user else 'unknown'} logged out",
            "token_refresh": f"Token refreshed for user {user.username if user else 'unknown'}",
            "token_refresh_failed": "Token refresh failed",
            "register_success": f"New user {user.username if user else 'unknown'} registered successfully",
            "register_failed": "User registration failed",
        }

        message = message_map.get(event_type, f"Authentication event: {event_type}")

        return cls.log_event(
            event_type=event_type,
            request=request,
            user=user,
            message=message,
            extra_data=extra_data,
            severity=severity,
        )

    @classmethod
    def log_security_event(
        cls, event_type, request, user=None, message="", extra_data=None
    ):
        """
        Log security-related events with high severity
        """
        severity_map = {
            "permission_denied": "medium",
            "unauthorized_access": "high",
            "role_escalation_attempt": "critical",
            "suspicious_activity": "high",
            "account_locked": "high",
            "ip_locked": "high",
            "brute_force_attempt": "critical",
            "session_hijack_attempt": "critical",
            "token_manipulation": "critical",
        }

        severity = severity_map.get(event_type, "high")

        return cls.log_event(
            event_type=event_type,
            request=request,
            user=user,
            message=message or f"Security event: {event_type}",
            extra_data=extra_data,
            severity=severity,
        )

    @classmethod
    def log_permission_violation(
        cls, request, user=None, resource="", action="", extra_data=None
    ):
        """
        Log permission violations
        """
        message = f"Permission denied for user {user.username if user else 'anonymous'} attempting {action} on {resource}"

        violation_data = {
            "resource": resource,
            "action": action,
            "user_role": user.role if user else None,
            **(extra_data or {}),
        }

        return cls.log_security_event(
            event_type="permission_denied",
            request=request,
            user=user,
            message=message,
            extra_data=violation_data,
        )

    @classmethod
    def get_security_summary(cls, hours=24):
        """
        Get security summary for the last N hours
        """
        from datetime import timedelta

        from django.utils import timezone

        since = timezone.now() - timedelta(hours=hours)

        events = cls.objects.filter(timestamp__gte=since)

        summary = {
            "total_events": events.count(),
            "by_severity": {},
            "by_type": {},
            "unique_ips": events.values("ip_address").distinct().count(),
            "unique_users": events.filter(user__isnull=False)
            .values("user")
            .distinct()
            .count(),
            "unresolved_critical": events.filter(
                severity="critical", resolved=False
            ).count(),
            "unresolved_high": events.filter(severity="high", resolved=False).count(),
        }

        # Count by severity
        for severity, _ in cls.SEVERITY_LEVELS:
            summary["by_severity"][severity] = events.filter(severity=severity).count()

        # Count by event type (top 10)
        from django.db.models import Count

        event_counts = (
            events.values("event_type")
            .annotate(count=Count("event_type"))
            .order_by("-count")[:10]
        )

        for item in event_counts:
            summary["by_type"][item["event_type"]] = item["count"]

        return summary

    def mark_resolved(self, resolved_by, resolution_notes=""):
        """
        Mark this audit log entry as resolved
        """
        self.resolved = True
        self.resolved_by = resolved_by
        self.resolved_at = timezone.now()
        self.resolution_notes = resolution_notes
        self.save(
            update_fields=["resolved", "resolved_by", "resolved_at", "resolution_notes"]
        )
