"""
Custom throttle classes for advanced rate limiting
"""
import time
from django.core.cache import cache
from django.conf import settings
from rest_framework.throttling import BaseThrottle
from rest_framework.exceptions import Throttled


class RedisRateLimitThrottle(BaseThrottle):
    """
    Redis-based rate limiting throttle with progressive delays
    """
    
    def __init__(self):
        self.cache = cache
        self.rate_limits = getattr(settings, 'RATE_LIMITS', {})
    
    def allow_request(self, request, view):
        """
        Implement the rate limiting logic
        """
        # Get client identifier (IP + User if authenticated)
        ident = self.get_ident(request)
        
        # Get rate limit configuration for this view
        view_name = getattr(view, 'throttle_scope', 'default')
        rate_config = self.rate_limits.get(view_name, {'requests': 60, 'window': 60})
        
        # Check rate limit
        return self._check_rate_limit(ident, view_name, rate_config, request)
    
    def _check_rate_limit(self, ident, scope, config, request):
        """
        Check if request should be rate limited
        """
        requests_limit = config['requests']
        window = config['window']
        
        # Create cache keys
        count_key = f"throttle:{scope}:{ident}:count"
        window_key = f"throttle:{scope}:{ident}:window"
        
        # Get current count and window start
        current_count = self.cache.get(count_key, 0)
        window_start = self.cache.get(window_key)
        
        now = time.time()
        
        # Initialize or reset window if expired
        if window_start is None or (now - window_start) >= window:
            self.cache.set(count_key, 1, window)
            self.cache.set(window_key, now, window)
            return True
        
        # Check if limit exceeded
        if current_count >= requests_limit:
            # Calculate wait time
            wait_time = window - (now - window_start)
            self.wait = wait_time
            return False
        
        # Increment counter
        self.cache.set(count_key, current_count + 1, window)
        return True
    
    def get_ident(self, request):
        """
        Get unique identifier for rate limiting
        Combines IP address and user ID if authenticated
        """
        # Get IP address
        forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
        if forwarded:
            ip = forwarded.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR', '')
        
        # Add user ID if authenticated
        if hasattr(request, 'user') and request.user.is_authenticated:
            return f"{ip}:user:{request.user.id}"
        
        return f"{ip}:anon"
    
    def wait(self):
        """
        Return the recommended next request time in seconds
        """
        return getattr(self, 'wait', None)


class ProgressiveDelayThrottle(RedisRateLimitThrottle):
    """
    Throttle with progressive delays for repeated violations
    """
    
    def _check_rate_limit(self, ident, scope, config, request):
        """
        Enhanced rate limiting with progressive delays
        """
        requests_limit = config['requests']
        window = config['window']
        
        # Create cache keys
        count_key = f"throttle:{scope}:{ident}:count"
        window_key = f"throttle:{scope}:{ident}:window"
        violations_key = f"throttle:{scope}:{ident}:violations"
        
        # Get current values
        current_count = self.cache.get(count_key, 0)
        window_start = self.cache.get(window_key)
        violations = self.cache.get(violations_key, 0)
        
        now = time.time()
        
        # Initialize or reset window if expired
        if window_start is None or (now - window_start) >= window:
            self.cache.set(count_key, 1, window)
            self.cache.set(window_key, now, window)
            return True
        
        # Check if limit exceeded
        if current_count >= requests_limit:
            # Increment violations counter
            violations += 1
            violation_window = 3600  # 1 hour
            self.cache.set(violations_key, violations, violation_window)
            
            # Calculate progressive delay
            base_delay = window - (now - window_start)
            progressive_delay = min(base_delay * (2 ** violations), 3600)  # Max 1 hour
            
            self.wait = progressive_delay
            return False
        
        # Increment counter
        self.cache.set(count_key, current_count + 1, window)
        return True


class IPBasedThrottle(RedisRateLimitThrottle):
    """
    IP-based rate limiting throttle
    """
    
    def get_ident(self, request):
        """
        Get IP address only for identification
        """
        forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
        if forwarded:
            ip = forwarded.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR', '')
        
        return f"ip:{ip}"


class UserBasedThrottle(RedisRateLimitThrottle):
    """
    User-based rate limiting throttle
    """
    
    def get_ident(self, request):
        """
        Get user ID for identification (requires authentication)
        """
        if hasattr(request, 'user') and request.user.is_authenticated:
            return f"user:{request.user.id}"
        
        # Fall back to IP if not authenticated
        return super().get_ident(request)


class AuthenticationThrottle(ProgressiveDelayThrottle):
    """
    Specialized throttle for authentication endpoints
    """
    
    def allow_request(self, request, view):
        """
        Enhanced authentication rate limiting
        """
        # Different limits for different authentication actions
        if hasattr(view, 'action'):
            action = view.action
        else:
            action = request.method.lower()
        
        # Get appropriate rate limit
        if action in ['login', 'post'] and 'login' in request.path:
            scope = 'auth_login'
        elif action in ['register', 'post'] and 'register' in request.path:
            scope = 'auth_register'
        elif 'password-reset' in request.path:
            scope = 'password_reset'
        else:
            scope = 'auth_default'
        
        # Set the scope for rate limiting
        view.throttle_scope = scope
        
        return super().allow_request(request, view)


class SecurityEventThrottle(RedisRateLimitThrottle):
    """
    Throttle for security-sensitive operations
    """
    
    def allow_request(self, request, view):
        """
        Strict rate limiting for security events
        """
        view.throttle_scope = 'security_event'
        return super().allow_request(request, view)