"""
Custom middleware for security and rate limiting with comprehensive audit logging
"""

import time
import json
from django.core.cache import cache
from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin
from django.conf import settings

from .security_utils import (
    get_client_ip,
    is_ip_locked,
    is_user_locked,
    lock_ip,
    lock_user,
    increment_failure_count,
    get_failure_count,
    log_security_event,
    check_suspicious_patterns,
    validate_request_integrity,
    create_security_response,
)
from .models import AuditLog


class SecurityMiddleware(MiddlewareMixin):
    """
    Middleware for security monitoring and rate limiting
    """

    def __init__(self, get_response):
        self.get_response = get_response
        super().__init__(get_response)

    def process_request(self, request):
        """
        Process incoming requests for security checks
        """
        # Validate request integrity
        if not validate_request_integrity(request):
            AuditLog.log_security_event(
                event_type="suspicious_activity",
                request=request,
                message="Request validation failed - potential attack attempt",
                extra_data={
                    "validation_failure": True,
                    "request_path": request.path,
                    "request_method": request.method,
                },
            )
            return create_security_response(
                "Request validation failed", status_code=400
            )

        # Check for suspicious patterns
        if check_suspicious_patterns(request):
            log_security_event(request, "suspicious_request")
            AuditLog.log_security_event(
                event_type="suspicious_activity",
                request=request,
                message="Suspicious request pattern detected",
                extra_data={
                    "pattern_type": "general_suspicious",
                    "request_path": request.path,
                },
            )

        # Check for account lockout
        ip = get_client_ip(request)
        if is_ip_locked(ip):
            AuditLog.log_security_event(
                event_type="ip_locked",
                request=request,
                message=f"Request blocked from locked IP address: {ip}",
                extra_data={
                    "ip_address": ip,
                    "lockout_active": True,
                },
            )
            return create_security_response(
                "IP address temporarily locked due to security reasons. Please try again later."
            )

        # Check user lockout if authenticated
        if hasattr(request, "user") and request.user.is_authenticated:
            if is_user_locked(str(request.user.id)):
                AuditLog.log_security_event(
                    event_type="account_locked",
                    request=request,
                    user=request.user,
                    message=f"Request blocked from locked user account: {request.user.username}",
                    extra_data={
                        "user_id": str(request.user.id),
                        "lockout_active": True,
                    },
                )
                return create_security_response(
                    "Account temporarily locked due to security reasons. Please try again later."
                )

        return None

    def process_response(self, request, response):
        """
        Process responses for security monitoring
        """
        # Monitor failed authentication attempts
        if self._is_auth_endpoint(request) and response.status_code in [401, 403]:
            self._handle_failed_auth(request, response)

        # Monitor successful authentication
        if self._is_auth_endpoint(request) and response.status_code == 200:
            self._handle_successful_auth(request)

        # Monitor permission violations
        if response.status_code == 403 and not self._is_auth_endpoint(request):
            self._handle_permission_violation(request, response)

        # Monitor unauthorized access attempts
        if response.status_code == 401 and not self._is_auth_endpoint(request):
            self._handle_unauthorized_access(request, response)

        return response

    def _is_auth_endpoint(self, request):
        """
        Check if request is to an authentication endpoint
        """
        auth_paths = [
            "/api/auth/login/",
            "/api/auth/register/",
            "/api/auth/password-reset/",
        ]
        return any(path in request.path for path in auth_paths)

    def _handle_failed_auth(self, request, response):
        """
        Handle failed authentication attempts
        """
        ip = get_client_ip(request)

        # Increment IP failure count
        ip_failures = increment_failure_count(ip, "ip")

        # Track failed attempts per user if login attempt
        if "login" in request.path:
            try:
                # Try to get username from request body
                username = None
                if hasattr(request, "data") and "username" in request.data:
                    username = request.data.get("username")
                elif hasattr(request, "POST") and "username" in request.POST:
                    username = request.POST.get("username")

                if username:
                    user_failures = increment_failure_count(username, "user")

                    # Lock user account after too many failures
                    security_settings = getattr(settings, "SECURITY_SETTINGS", {})
                    max_user_attempts = security_settings.get(
                        "MAX_LOGIN_ATTEMPTS_PER_USER", 10
                    )

                    if user_failures >= max_user_attempts:
                        lock_user(username)
                        log_security_event(
                            request,
                            "user_locked",
                            {"username": username, "failure_count": user_failures},
                        )
            except Exception as e:
                log_security_event(request, "auth_monitoring_error", {"error": str(e)})

        # Lock IP after too many failures
        security_settings = getattr(settings, "SECURITY_SETTINGS", {})
        max_ip_attempts = security_settings.get("MAX_LOGIN_ATTEMPTS_PER_IP", 20)

        if ip_failures >= max_ip_attempts:
            lock_ip(ip)
            log_security_event(
                request, "ip_locked", {"ip": ip, "failure_count": ip_failures}
            )

        # Log failed authentication event
        log_security_event(
            request,
            "failed_auth",
            {
                "ip_failures": ip_failures,
                "status_code": response.status_code,
                "path": request.path,
            },
        )

    def _handle_successful_auth(self, request):
        """
        Handle successful authentication attempts
        """
        ip = get_client_ip(request)

        # Reset failure counters on successful auth
        from .security_utils import reset_failure_count

        reset_failure_count(ip, "ip")

        if hasattr(request, "user") and request.user.is_authenticated:
            reset_failure_count(str(request.user.id), "user")
            reset_failure_count(request.user.username, "user")

        # Log successful authentication
        log_security_event(request, "successful_auth", {"path": request.path})

    def _handle_permission_violation(self, request, response):
        """
        Handle permission violations (403 errors)
        """
        user = (
            request.user
            if hasattr(request, "user") and request.user.is_authenticated
            else None
        )

        # Determine the resource and action being attempted
        resource = request.path
        action = request.method

        # Log permission violation
        AuditLog.log_permission_violation(
            request=request,
            user=user,
            resource=resource,
            action=action,
            extra_data={
                "status_code": response.status_code,
                "user_role": user.role if user else None,
                "attempted_resource": resource,
                "attempted_action": action,
            },
        )

        # Check for potential role escalation attempts
        if user and self._is_potential_escalation(request, user):
            AuditLog.log_security_event(
                event_type="role_escalation_attempt",
                request=request,
                user=user,
                message=f"Potential role escalation attempt by {user.username}",
                extra_data={
                    "user_role": user.role,
                    "attempted_resource": resource,
                    "attempted_action": action,
                },
            )

    def _handle_unauthorized_access(self, request, response):
        """
        Handle unauthorized access attempts (401 errors)
        """
        # Log unauthorized access attempt
        AuditLog.log_security_event(
            event_type="unauthorized_access",
            request=request,
            message="Unauthorized access attempt to protected resource",
            extra_data={
                "status_code": response.status_code,
                "attempted_resource": request.path,
                "attempted_action": request.method,
                "has_auth_header": "HTTP_AUTHORIZATION" in request.META,
            },
        )

        # Check for potential token manipulation
        if "HTTP_AUTHORIZATION" in request.META:
            auth_header = request.META["HTTP_AUTHORIZATION"]
            if auth_header.startswith("Bearer "):
                AuditLog.log_security_event(
                    event_type="token_manipulation",
                    request=request,
                    message="Invalid or manipulated token detected",
                    extra_data={
                        "token_prefix": auth_header[:20] + "...",  # Log partial token
                        "attempted_resource": request.path,
                    },
                )

    def _is_potential_escalation(self, request, user):
        """
        Check if the request might be a role escalation attempt
        """
        # Define admin-only paths
        admin_paths = ["/admin/", "/api/admin/", "/api/users/"]

        # Check if non-admin user is trying to access admin resources
        if user.role != "admin" and any(
            request.path.startswith(path) for path in admin_paths
        ):
            return True

        # Check if student is trying to access president resources
        president_paths = ["/api/groups/", "/api/events/create/"]
        if user.role == "student" and any(
            request.path.startswith(path) for path in president_paths
        ):
            return True

        return False


class RateLimitMiddleware(MiddlewareMixin):
    """
    Middleware for global rate limiting
    """

    def __init__(self, get_response):
        self.get_response = get_response
        super().__init__(get_response)

    def process_request(self, request):
        """
        Apply global rate limiting
        """
        # Skip rate limiting for certain paths
        skip_paths = ["/admin/", "/static/", "/media/"]
        if any(request.path.startswith(path) for path in skip_paths):
            return None

        # Apply global rate limit
        if not self._check_global_rate_limit(request):
            return JsonResponse(
                {"error": "Rate limit exceeded. Please slow down your requests."},
                status=429,
            )

        return None

    def _check_global_rate_limit(self, request):
        """
        Check global rate limit per IP
        """
        ip = self._get_client_ip(request)
        rate_key = f"global_rate:{ip}"

        # Get current count
        current_count = cache.get(rate_key, 0)

        # Global limit: 1000 requests per hour per IP
        if current_count >= 1000:
            return False

        # Increment counter
        cache.set(rate_key, current_count + 1, 3600)  # 1 hour
        return True

    def _get_client_ip(self, request):
        """Get client IP address from request"""
        return get_client_ip(request)


class AuditLoggingMiddleware(MiddlewareMixin):
    """
    Middleware for comprehensive audit logging of authentication and security events
    """

    def __init__(self, get_response):
        self.get_response = get_response
        super().__init__(get_response)

    def process_request(self, request):
        """
        Log incoming requests to sensitive endpoints
        """
        # Store request start time for performance monitoring
        request._audit_start_time = time.time()

        # Log access to sensitive endpoints
        if self._is_sensitive_endpoint(request):
            AuditLog.log_event(
                event_type=(
                    "admin_action"
                    if self._is_admin_endpoint(request)
                    else "unauthorized_access"
                ),
                request=request,
                message=f"Access attempt to sensitive endpoint: {request.path}",
                extra_data={
                    "endpoint_type": self._get_endpoint_type(request),
                    "request_method": request.method,
                    "is_authenticated": hasattr(request, "user")
                    and request.user.is_authenticated,
                },
                severity="medium" if self._is_admin_endpoint(request) else "high",
            )

        return None

    def process_response(self, request, response):
        """
        Log response information for audit trail
        """
        # Calculate request duration
        duration = time.time() - getattr(request, "_audit_start_time", time.time())

        # Log slow requests as potential security issues
        if duration > 5.0:  # Requests taking more than 5 seconds
            AuditLog.log_security_event(
                event_type="suspicious_activity",
                request=request,
                message=f"Slow request detected: {request.path}",
                extra_data={
                    "duration": duration,
                    "status_code": response.status_code,
                    "potential_dos": duration > 10.0,
                },
            )

        # Log bulk operations
        if self._is_bulk_operation(request, response):
            user = (
                request.user
                if hasattr(request, "user") and request.user.is_authenticated
                else None
            )
            AuditLog.log_event(
                event_type="bulk_operation",
                request=request,
                user=user,
                message=f"Bulk operation performed: {request.path}",
                extra_data={
                    "operation_type": self._get_bulk_operation_type(request),
                    "status_code": response.status_code,
                    "duration": duration,
                },
                severity="medium",
            )

        return response

    def _is_sensitive_endpoint(self, request):
        """
        Check if the endpoint is considered sensitive
        """
        sensitive_paths = [
            "/admin/",
            "/api/admin/",
            "/api/users/",
            "/api/auth/register/",
            "/api/auth/password-reset/",
        ]
        return any(request.path.startswith(path) for path in sensitive_paths)

    def _is_admin_endpoint(self, request):
        """
        Check if the endpoint is admin-only
        """
        admin_paths = ["/admin/", "/api/admin/"]
        return any(request.path.startswith(path) for path in admin_paths)

    def _get_endpoint_type(self, request):
        """
        Determine the type of endpoint being accessed
        """
        if request.path.startswith("/admin/"):
            return "django_admin"
        elif request.path.startswith("/api/admin/"):
            return "api_admin"
        elif request.path.startswith("/api/auth/"):
            return "authentication"
        elif request.path.startswith("/api/users/"):
            return "user_management"
        else:
            return "general"

    def _is_bulk_operation(self, request, response):
        """
        Check if this was a bulk operation
        """
        # Check for bulk endpoints
        bulk_indicators = [
            "/bulk/",
            "/batch/",
            "bulk" in request.path.lower(),
            "batch" in request.path.lower(),
        ]

        # Check request method and response size
        is_bulk_method = request.method in ["POST", "PUT", "PATCH", "DELETE"]

        # Check if response indicates multiple items were processed
        try:
            if hasattr(response, "content") and response.content:
                content_length = len(response.content)
                # Consider responses larger than 10KB as potential bulk operations
                is_large_response = content_length > 10240
            else:
                is_large_response = False
        except:
            is_large_response = False

        return any(bulk_indicators) or (is_bulk_method and is_large_response)

    def _get_bulk_operation_type(self, request):
        """
        Determine the type of bulk operation
        """
        if "user" in request.path.lower():
            return "user_bulk"
        elif "event" in request.path.lower():
            return "event_bulk"
        elif "group" in request.path.lower():
            return "group_bulk"
        else:
            return "general_bulk"
