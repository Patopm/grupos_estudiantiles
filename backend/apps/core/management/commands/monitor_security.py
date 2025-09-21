"""
Management command to monitor security events and rate limiting
"""
import time
from django.core.management.base import BaseCommand
from django.core.cache import cache
from django.conf import settings


class Command(BaseCommand):
    help = 'Monitor security events and rate limiting status'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear-locks',
            action='store_true',
            help='Clear all security locks',
        )
        parser.add_argument(
            '--show-events',
            action='store_true',
            help='Show recent security events',
        )
        parser.add_argument(
            '--show-limits',
            action='store_true',
            help='Show current rate limit status',
        )
        parser.add_argument(
            '--ip',
            type=str,
            help='Show information for specific IP address',
        )

    def handle(self, *args, **options):
        if options['clear_locks']:
            self.clear_security_locks()
        
        if options['show_events']:
            self.show_security_events()
        
        if options['show_limits']:
            self.show_rate_limits(options.get('ip'))
        
        if not any([options['clear_locks'], options['show_events'], options['show_limits']]):
            self.show_security_summary()

    def clear_security_locks(self):
        """Clear all security locks"""
        self.stdout.write("Clearing security locks...")
        
        # Get all cache keys
        try:
            # This is Redis-specific - might need adjustment for other cache backends
            from django.core.cache.backends.redis import RedisCache
            if isinstance(cache, RedisCache):
                redis_client = cache._cache.get_client(1)
                
                # Clear IP lockouts
                ip_lockout_keys = redis_client.keys("security:lockout:ip:*")
                if ip_lockout_keys:
                    redis_client.delete(*ip_lockout_keys)
                    self.stdout.write(f"Cleared {len(ip_lockout_keys)} IP lockouts")
                
                # Clear user lockouts
                user_lockout_keys = redis_client.keys("security:lockout:user:*")
                if user_lockout_keys:
                    redis_client.delete(*user_lockout_keys)
                    self.stdout.write(f"Cleared {len(user_lockout_keys)} user lockouts")
                
                # Clear failure counters
                failure_keys = redis_client.keys("security:failures:*")
                if failure_keys:
                    redis_client.delete(*failure_keys)
                    self.stdout.write(f"Cleared {len(failure_keys)} failure counters")
                
                self.stdout.write(self.style.SUCCESS("Security locks cleared successfully"))
            else:
                self.stdout.write(self.style.WARNING("Cache backend not supported for bulk operations"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error clearing locks: {e}"))

    def show_security_events(self):
        """Show recent security events"""
        self.stdout.write("Recent Security Events:")
        self.stdout.write("-" * 50)
        
        try:
            from django.core.cache.backends.redis import RedisCache
            if isinstance(cache, RedisCache):
                redis_client = cache._cache.get_client(1)
                
                # Get security event keys
                event_keys = redis_client.keys("security:events:*")
                events = []
                
                for key in event_keys:
                    event_data = cache.get(key.decode() if isinstance(key, bytes) else key)
                    if event_data:
                        events.append(event_data)
                
                # Sort by timestamp
                events.sort(key=lambda x: x.get('timestamp', 0), reverse=True)
                
                # Show last 20 events
                for event in events[:20]:
                    timestamp = time.strftime('%Y-%m-%d %H:%M:%S', 
                                           time.localtime(event.get('timestamp', 0)))
                    self.stdout.write(
                        f"{timestamp} - {event.get('event_type', 'unknown')} - "
                        f"IP: {event.get('ip_address', 'unknown')} - "
                        f"Path: {event.get('path', 'unknown')}"
                    )
                
                if not events:
                    self.stdout.write("No recent security events found")
            else:
                self.stdout.write(self.style.WARNING("Cache backend not supported for event listing"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error showing events: {e}"))

    def show_rate_limits(self, specific_ip=None):
        """Show current rate limit status"""
        self.stdout.write("Rate Limit Status:")
        self.stdout.write("-" * 50)
        
        try:
            from django.core.cache.backends.redis import RedisCache
            if isinstance(cache, RedisCache):
                redis_client = cache._cache.get_client(1)
                
                if specific_ip:
                    # Show specific IP information
                    self._show_ip_info(specific_ip)
                else:
                    # Show general throttle information
                    throttle_keys = redis_client.keys("throttle:*")
                    
                    if throttle_keys:
                        self.stdout.write(f"Found {len(throttle_keys)} active rate limits")
                        
                        # Group by scope
                        scopes = {}
                        for key in throttle_keys:
                            key_str = key.decode() if isinstance(key, bytes) else key
                            parts = key_str.split(':')
                            if len(parts) >= 2:
                                scope = parts[1]
                                if scope not in scopes:
                                    scopes[scope] = 0
                                scopes[scope] += 1
                        
                        for scope, count in scopes.items():
                            self.stdout.write(f"  {scope}: {count} active limits")
                    else:
                        self.stdout.write("No active rate limits found")
            else:
                self.stdout.write(self.style.WARNING("Cache backend not supported for rate limit listing"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error showing rate limits: {e}"))

    def _show_ip_info(self, ip):
        """Show detailed information for specific IP"""
        self.stdout.write(f"Information for IP: {ip}")
        self.stdout.write("-" * 30)
        
        # Check lockout status
        ip_lockout_key = f"security:lockout:ip:{ip}"
        if cache.get(ip_lockout_key):
            self.stdout.write(self.style.ERROR("IP is currently LOCKED"))
        else:
            self.stdout.write(self.style.SUCCESS("IP is not locked"))
        
        # Check failure count
        ip_failures_key = f"security:failures:ip:{ip}"
        failures = cache.get(ip_failures_key, 0)
        self.stdout.write(f"Failed attempts: {failures}")
        
        # Check rate limits
        try:
            from django.core.cache.backends.redis import RedisCache
            if isinstance(cache, RedisCache):
                redis_client = cache._cache.get_client(1)
                
                # Find throttle keys for this IP
                throttle_pattern = f"throttle:*:{ip}*"
                throttle_keys = redis_client.keys(throttle_pattern)
                
                if throttle_keys:
                    self.stdout.write("Active rate limits:")
                    for key in throttle_keys:
                        key_str = key.decode() if isinstance(key, bytes) else key
                        count = cache.get(key_str, 0)
                        self.stdout.write(f"  {key_str}: {count}")
                else:
                    self.stdout.write("No active rate limits for this IP")
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error checking throttles: {e}"))

    def show_security_summary(self):
        """Show general security summary"""
        self.stdout.write("Security System Summary:")
        self.stdout.write("=" * 50)
        
        try:
            from django.core.cache.backends.redis import RedisCache
            if isinstance(cache, RedisCache):
                redis_client = cache._cache.get_client(1)
                
                # Count different types of security data
                ip_lockouts = len(redis_client.keys("security:lockout:ip:*"))
                user_lockouts = len(redis_client.keys("security:lockout:user:*"))
                ip_failures = len(redis_client.keys("security:failures:ip:*"))
                user_failures = len(redis_client.keys("security:failures:user:*"))
                events = len(redis_client.keys("security:events:*"))
                throttles = len(redis_client.keys("throttle:*"))
                
                self.stdout.write(f"IP Lockouts: {ip_lockouts}")
                self.stdout.write(f"User Lockouts: {user_lockouts}")
                self.stdout.write(f"IP Failure Counters: {ip_failures}")
                self.stdout.write(f"User Failure Counters: {user_failures}")
                self.stdout.write(f"Security Events: {events}")
                self.stdout.write(f"Active Rate Limits: {throttles}")
                
                # Show rate limit configuration
                self.stdout.write("\nRate Limit Configuration:")
                rate_limits = getattr(settings, 'RATE_LIMITS', {})
                for scope, config in rate_limits.items():
                    self.stdout.write(f"  {scope}: {config['requests']} requests per {config['window']}s")
                
            else:
                self.stdout.write(self.style.WARNING("Cache backend not supported for summary"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error generating summary: {e}"))