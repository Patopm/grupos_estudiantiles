"""
Custom decorators for rate limiting and security
"""

import functools
from django.http import JsonResponse
from django.core.cache import cache
from django_ratelimit.decorators import ratelimit
from django_ratelimit.exceptions import Ratelimited

from .security_utils import (
    get_client_ip,
    log_security_event,
    get_progressive_delay,
    create_security_response,
)


def enhanced_ratelimit(group=None, key=None, rate=None, method=None, block=True):
    """
    Enhanced rate limiting decorator with progressive delays
    """

    def decorator(func):
        # Apply django-ratelimit first
        ratelimited_func = ratelimit(
            group=group, key=key, rate=rate, method=method, block=block
        )(func)

        @functools.wraps(func)
        def wrapper(request, *args, **kwargs):
            try:
                return ratelimited_func(request, *args, **kwargs)
            except Ratelimited:
                # Handle rate limit exceeded with progressive delay
                ip = get_client_ip(request)

                # Track violations for progressive delay
                violations_key = f"ratelimit:violations:{group}:{ip}"
                violations = cache.get(violations_key, 0) + 1
                cache.set(violations_key, violations, 3600)  # 1 hour

                # Calculate progressive delay
                delay = get_progressive_delay(violations)

                # Log rate limit violation
                log_security_event(
                    request,
                    "rate_limit_exceeded",
                    {
                        "group": group,
                        "rate": rate,
                        "violations": violations,
                        "delay": delay,
                    },
                )

                return create_security_response(
                    f"Rate limit exceeded. Please wait {int(delay)} seconds before trying again.",
                    extra_data={"retry_after": int(delay), "violations": violations},
                )

        return wrapper

    return decorator


def auth_ratelimit(rate="10/5m"):
    """
    Rate limiting decorator specifically for authentication endpoints
    """
    return enhanced_ratelimit(group="auth", key="ip", rate=rate, method=["POST"])


def security_ratelimit(rate="5/5m"):
    """
    Rate limiting decorator for security-sensitive operations
    """
    return enhanced_ratelimit(
        group="security", key="ip", rate=rate, method=["POST", "PUT", "PATCH", "DELETE"]
    )


def user_ratelimit(rate="100/h"):
    """
    Rate limiting decorator based on authenticated user
    """

    def get_user_key(group, request):
        if hasattr(request, "user") and request.user.is_authenticated:
            return f"user:{request.user.id}"
        return get_client_ip(request)

    return enhanced_ratelimit(group="user_action", key=get_user_key, rate=rate)


def ip_ratelimit(rate="1000/h"):
    """
    Rate limiting decorator based on IP address
    """
    return enhanced_ratelimit(group="ip_global", key="ip", rate=rate)


def combined_ratelimit(ip_rate="1000/h", user_rate="100/h", auth_rate="10/5m"):
    """
    Combined rate limiting decorator with multiple limits
    """

    def decorator(func):
        # Apply multiple rate limits
        func = ip_ratelimit(ip_rate)(func)
        func = user_ratelimit(user_rate)(func)

        # Apply auth rate limit if it's an auth endpoint
        if "auth" in func.__name__.lower() or "login" in func.__name__.lower():
            func = auth_ratelimit(auth_rate)(func)

        return func

    return decorator


def monitor_security_events(event_type=None):
    """
    Decorator to monitor and log security events
    """

    def decorator(func):
        @functools.wraps(func)
        def wrapper(request, *args, **kwargs):
            # Determine event type
            if event_type:
                current_event_type = event_type
            else:
                current_event_type = f"{func.__name__}_access"

            # Log access attempt
            log_security_event(request, f"{current_event_type}_attempt")

            try:
                result = func(request, *args, **kwargs)

                # Log successful access
                log_security_event(request, f"{current_event_type}_success")

                return result
            except Exception as e:
                # Log failed access
                log_security_event(
                    request,
                    f"{current_event_type}_error",
                    {"error": str(e), "error_type": type(e).__name__},
                )
                raise

        return wrapper

    return decorator


def require_secure_request(func):
    """
    Decorator to ensure request meets security requirements
    """

    @functools.wraps(func)
    def wrapper(request, *args, **kwargs):
        # Check if request is over HTTPS in production
        if not request.is_secure() and not getattr(request, "is_development", False):
            log_security_event(request, "insecure_request")
            return JsonResponse(
                {"error": "This endpoint requires a secure connection (HTTPS)"},
                status=400,
            )

        # Check for required headers
        required_headers = ["HTTP_USER_AGENT", "HTTP_ACCEPT"]
        for header in required_headers:
            if not request.META.get(header):
                log_security_event(
                    request, "missing_required_header", {"missing_header": header}
                )
                return JsonResponse({"error": "Missing required headers"}, status=400)

        return func(request, *args, **kwargs)

    return wrapper


def progressive_delay_on_failure(max_attempts=5, base_delay=1):
    """
    Decorator to implement progressive delays on repeated failures
    """

    def decorator(func):
        @functools.wraps(func)
        def wrapper(request, *args, **kwargs):
            ip = get_client_ip(request)
            failure_key = f"progressive_delay:{func.__name__}:{ip}"

            # Get current failure count
            failures = cache.get(failure_key, 0)

            # Check if we should apply delay
            if failures > 0:
                delay = base_delay * (2**failures)

                # Check if enough time has passed
                last_attempt_key = f"last_attempt:{func.__name__}:{ip}"
                last_attempt = cache.get(last_attempt_key, 0)

                import time

                if time.time() - last_attempt < delay:
                    remaining_delay = delay - (time.time() - last_attempt)
                    return create_security_response(
                        f"Please wait {int(remaining_delay)} seconds before trying again.",
                        extra_data={"retry_after": int(remaining_delay)},
                    )

            # Record attempt time
            import time

            cache.set(f"last_attempt:{func.__name__}:{ip}", time.time(), 3600)

            try:
                result = func(request, *args, **kwargs)

                # Reset failure count on success
                cache.delete(failure_key)

                return result
            except Exception as e:
                # Increment failure count
                if failures < max_attempts:
                    cache.set(failure_key, failures + 1, 3600)  # 1 hour

                raise

        return wrapper

    return decorator
