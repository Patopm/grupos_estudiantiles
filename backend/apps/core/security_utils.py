"""
Security utilities for rate limiting and monitoring
"""

import time
import hashlib
from django.core.cache import cache
from django.conf import settings
from django.http import JsonResponse


def get_client_ip(request):
    """
    Get client IP address from request
    """
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
    if forwarded:
        ip = forwarded.split(",")[0].strip()
    else:
        ip = request.META.get("REMOTE_ADDR", "")
    return ip


def get_client_fingerprint(request):
    """
    Generate a unique fingerprint for the client
    Combines IP, User-Agent, and other headers
    """
    ip = get_client_ip(request)
    user_agent = request.META.get("HTTP_USER_AGENT", "")
    accept_language = request.META.get("HTTP_ACCEPT_LANGUAGE", "")

    # Create fingerprint
    fingerprint_data = f"{ip}:{user_agent}:{accept_language}"
    return hashlib.md5(fingerprint_data.encode()).hexdigest()


def is_ip_locked(ip):
    """
    Check if IP address is locked
    """
    lockout_key = f"security:lockout:ip:{ip}"
    return bool(cache.get(lockout_key))


def is_user_locked(user_identifier):
    """
    Check if user is locked
    """
    lockout_key = f"security:lockout:user:{user_identifier}"
    return bool(cache.get(lockout_key))


def lock_ip(ip, duration=None):
    """
    Lock IP address for specified duration
    """
    if duration is None:
        duration = getattr(settings, "SECURITY_SETTINGS", {}).get(
            "IP_LOCKOUT_DURATION", 3600
        )

    lockout_key = f"security:lockout:ip:{ip}"
    cache.set(lockout_key, True, duration)


def lock_user(user_identifier, duration=None):
    """
    Lock user for specified duration
    """
    if duration is None:
        duration = getattr(settings, "SECURITY_SETTINGS", {}).get(
            "USER_LOCKOUT_DURATION", 1800
        )

    lockout_key = f"security:lockout:user:{user_identifier}"
    cache.set(lockout_key, True, duration)


def unlock_ip(ip):
    """
    Unlock IP address
    """
    lockout_key = f"security:lockout:ip:{ip}"
    cache.delete(lockout_key)


def unlock_user(user_identifier):
    """
    Unlock user
    """
    lockout_key = f"security:lockout:user:{user_identifier}"
    cache.delete(lockout_key)


def increment_failure_count(identifier, failure_type="ip"):
    """
    Increment failure count for IP or user
    """
    failure_key = f"security:failures:{failure_type}:{identifier}"
    current_count = cache.get(failure_key, 0)
    new_count = current_count + 1

    # Set expiry to 1 hour
    cache.set(failure_key, new_count, 3600)

    return new_count


def get_failure_count(identifier, failure_type="ip"):
    """
    Get current failure count for IP or user
    """
    failure_key = f"security:failures:{failure_type}:{identifier}"
    return cache.get(failure_key, 0)


def reset_failure_count(identifier, failure_type="ip"):
    """
    Reset failure count for IP or user
    """
    failure_key = f"security:failures:{failure_type}:{identifier}"
    cache.delete(failure_key)


def log_security_event(request, event_type, extra_data=None):
    """
    Log security event for monitoring
    """
    event_data = {
        "event_type": event_type,
        "ip_address": get_client_ip(request),
        "user_agent": request.META.get("HTTP_USER_AGENT", ""),
        "path": request.path,
        "method": request.method,
        "timestamp": time.time(),
        "fingerprint": get_client_fingerprint(request),
    }

    if extra_data:
        event_data.update(extra_data)

    if hasattr(request, "user") and request.user.is_authenticated:
        event_data["user_id"] = str(request.user.id)
        event_data["username"] = request.user.username

    # Store event in cache
    event_key = (
        f"security:events:{int(time.time() * 1000)}"  # Use milliseconds for uniqueness
    )
    cache.set(event_key, event_data, 86400)  # 24 hours


def check_suspicious_patterns(request):
    """
    Check for suspicious request patterns
    """
    ip = get_client_ip(request)
    fingerprint = get_client_fingerprint(request)

    # Check rapid requests from same IP
    request_key = f"security:requests:{ip}"
    requests = cache.get(request_key, [])
    now = time.time()

    # Remove old requests (older than 1 minute)
    requests = [req_time for req_time in requests if now - req_time < 60]
    requests.append(now)
    cache.set(request_key, requests, 300)  # 5 minutes

    # Check for too many requests
    if len(requests) > 100:  # More than 100 requests per minute
        log_security_event(
            request, "rapid_requests", {"requests_per_minute": len(requests)}
        )
        return True

    # Check for suspicious user agents
    user_agent = request.META.get("HTTP_USER_AGENT", "").lower()
    suspicious_agents = ["bot", "crawler", "spider", "scraper", "curl", "wget"]
    if any(agent in user_agent for agent in suspicious_agents):
        log_security_event(request, "suspicious_user_agent", {"user_agent": user_agent})
        return True

    # Check for missing common headers
    if not request.META.get("HTTP_ACCEPT"):
        log_security_event(request, "missing_headers", {"missing_header": "Accept"})
        return True

    return False


def get_progressive_delay(violations):
    """
    Calculate progressive delay based on violation count
    """
    security_settings = getattr(settings, "SECURITY_SETTINGS", {})
    base = security_settings.get("PROGRESSIVE_DELAY_BASE", 2)
    max_delay = security_settings.get("MAX_PROGRESSIVE_DELAY", 3600)

    delay = min(base**violations, max_delay)
    return delay


def create_security_response(message, status_code=429, extra_data=None):
    """
    Create standardized security response
    """
    response_data = {
        "error": message,
        "timestamp": int(time.time()),
    }

    if extra_data:
        response_data.update(extra_data)

    return JsonResponse(response_data, status=status_code)


def validate_request_integrity(request):
    """
    Validate request integrity and detect tampering
    """
    # Check for common attack patterns in headers
    dangerous_headers = [
        "HTTP_X_FORWARDED_HOST",
        "HTTP_X_ORIGINAL_URL",
        "HTTP_X_REWRITE_URL",
    ]

    for header in dangerous_headers:
        if header in request.META:
            log_security_event(
                request,
                "dangerous_header",
                {"header": header, "value": request.META[header]},
            )
            return False

    # Check for SQL injection patterns in query parameters
    sql_patterns = ["union", "select", "drop", "insert", "update", "delete", "--", ";"]
    query_string = request.META.get("QUERY_STRING", "").lower()

    for pattern in sql_patterns:
        if pattern in query_string:
            log_security_event(
                request,
                "sql_injection_attempt",
                {"query_string": query_string, "pattern": pattern},
            )
            return False

    return True


class SecurityMonitor:
    """
    Context manager for monitoring security events
    """

    def __init__(self, request, operation_type):
        self.request = request
        self.operation_type = operation_type
        self.start_time = time.time()

    def __enter__(self):
        log_security_event(self.request, f"{self.operation_type}_start")
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        duration = time.time() - self.start_time

        if exc_type:
            log_security_event(
                self.request,
                f"{self.operation_type}_error",
                {"error_type": exc_type.__name__, "duration": duration},
            )
        else:
            log_security_event(
                self.request, f"{self.operation_type}_success", {"duration": duration}
            )

        return False  # Don't suppress exceptions
