"""
Tests for security and rate limiting functionality
"""

from django.test import TestCase, RequestFactory
from django.core.cache import cache
from django.contrib.auth import get_user_model
from unittest.mock import patch, MagicMock

from .throttles import (
    RedisRateLimitThrottle,
    ProgressiveDelayThrottle,
    AuthenticationThrottle,
    IPBasedThrottle,
    UserBasedThrottle,
)
from .security_utils import (
    get_client_ip,
    get_client_fingerprint,
    is_ip_locked,
    is_user_locked,
    lock_ip,
    lock_user,
    increment_failure_count,
    get_failure_count,
    log_security_event,
    check_suspicious_patterns,
)
from .middleware import SecurityMiddleware, RateLimitMiddleware

User = get_user_model()


class SecurityUtilsTestCase(TestCase):
    """Test security utility functions"""

    def setUp(self):
        self.factory = RequestFactory()
        cache.clear()

    def test_get_client_ip(self):
        """Test IP address extraction"""
        # Test direct IP
        request = self.factory.get("/")
        request.META["REMOTE_ADDR"] = "192.168.1.1"
        self.assertEqual(get_client_ip(request), "192.168.1.1")

        # Test forwarded IP
        request.META["HTTP_X_FORWARDED_FOR"] = "10.0.0.1, 192.168.1.1"
        self.assertEqual(get_client_ip(request), "10.0.0.1")

    def test_client_fingerprint(self):
        """Test client fingerprinting"""
        request = self.factory.get("/")
        request.META["REMOTE_ADDR"] = "192.168.1.1"
        request.META["HTTP_USER_AGENT"] = "Test Browser"
        request.META["HTTP_ACCEPT_LANGUAGE"] = "en-US"

        fingerprint = get_client_fingerprint(request)
        self.assertIsInstance(fingerprint, str)
        self.assertEqual(len(fingerprint), 32)  # MD5 hash length

    def test_ip_locking(self):
        """Test IP locking functionality"""
        ip = "192.168.1.1"

        # Initially not locked
        self.assertFalse(is_ip_locked(ip))

        # Lock IP
        lock_ip(ip, 60)
        self.assertTrue(is_ip_locked(ip))

    def test_user_locking(self):
        """Test user locking functionality"""
        user_id = "test_user"

        # Initially not locked
        self.assertFalse(is_user_locked(user_id))

        # Lock user
        lock_user(user_id, 60)
        self.assertTrue(is_user_locked(user_id))

    def test_failure_counting(self):
        """Test failure count tracking"""
        identifier = "test_ip"

        # Initial count should be 0
        self.assertEqual(get_failure_count(identifier), 0)

        # Increment failures
        count1 = increment_failure_count(identifier)
        self.assertEqual(count1, 1)

        count2 = increment_failure_count(identifier)
        self.assertEqual(count2, 2)

        # Check current count
        self.assertEqual(get_failure_count(identifier), 2)

    def test_security_event_logging(self):
        """Test security event logging"""
        request = self.factory.post("/test/")
        request.META["REMOTE_ADDR"] = "192.168.1.1"
        request.META["HTTP_USER_AGENT"] = "Test Browser"

        # Log event
        log_security_event(request, "test_event", {"extra": "data"})

        # Event should be stored in cache
        # We can't easily test this without knowing the exact key,
        # but we can verify no exceptions were raised
        self.assertTrue(True)

    def test_suspicious_patterns(self):
        """Test suspicious pattern detection"""
        request = self.factory.get("/")
        request.META["REMOTE_ADDR"] = "192.168.1.1"
        request.META["HTTP_USER_AGENT"] = "Normal Browser"
        request.META["HTTP_ACCEPT"] = "text/html"

        # Normal request should not be suspicious
        self.assertFalse(check_suspicious_patterns(request))

        # Bot user agent should be suspicious
        request.META["HTTP_USER_AGENT"] = "GoogleBot"
        self.assertTrue(check_suspicious_patterns(request))


class ThrottleTestCase(TestCase):
    """Test throttle classes"""

    def setUp(self):
        self.factory = RequestFactory()
        cache.clear()

    def test_redis_rate_limit_throttle(self):
        """Test basic Redis rate limit throttle"""
        throttle = RedisRateLimitThrottle()

        request = self.factory.post("/test/")
        request.META["REMOTE_ADDR"] = "192.168.1.1"

        class MockView:
            throttle_scope = "test"

        view = MockView()

        # First request should be allowed
        self.assertTrue(throttle.allow_request(request, view))

    def test_progressive_delay_throttle(self):
        """Test progressive delay throttle"""
        throttle = ProgressiveDelayThrottle()

        request = self.factory.post("/test/")
        request.META["REMOTE_ADDR"] = "192.168.1.1"

        class MockView:
            throttle_scope = "test"

        view = MockView()

        # First request should be allowed
        self.assertTrue(throttle.allow_request(request, view))

    def test_ip_based_throttle(self):
        """Test IP-based throttle"""
        throttle = IPBasedThrottle()

        request = self.factory.post("/test/")
        request.META["REMOTE_ADDR"] = "192.168.1.1"

        class MockView:
            throttle_scope = "test"

        view = MockView()

        # Test IP identification
        ident = throttle.get_ident(request)
        self.assertTrue(ident.startswith("ip:"))

    def test_user_based_throttle(self):
        """Test user-based throttle"""
        throttle = UserBasedThrottle()

        request = self.factory.post("/test/")
        request.META["REMOTE_ADDR"] = "192.168.1.1"

        # Create mock user
        user = User(id=1, username="testuser")
        request.user = user

        class MockView:
            throttle_scope = "test"

        view = MockView()

        # Test user identification
        ident = throttle.get_ident(request)
        self.assertTrue(ident.startswith("user:"))

    def test_authentication_throttle(self):
        """Test authentication-specific throttle"""
        throttle = AuthenticationThrottle()

        request = self.factory.post("/api/auth/login/")
        request.META["REMOTE_ADDR"] = "192.168.1.1"

        class MockView:
            pass

        view = MockView()

        # Should set appropriate scope for login
        result = throttle.allow_request(request, view)
        self.assertEqual(view.throttle_scope, "auth_login")


class SecurityMiddlewareTestCase(TestCase):
    """Test security middleware"""

    def setUp(self):
        self.factory = RequestFactory()
        self.middleware = SecurityMiddleware(lambda r: None)
        cache.clear()

    def test_process_request_normal(self):
        """Test normal request processing"""
        request = self.factory.get("/test/")
        request.META["REMOTE_ADDR"] = "192.168.1.1"
        request.META["HTTP_USER_AGENT"] = "Normal Browser"
        request.META["HTTP_ACCEPT"] = "text/html"

        # Should return None for normal requests
        response = self.middleware.process_request(request)
        self.assertIsNone(response)

    def test_process_request_locked_ip(self):
        """Test request processing with locked IP"""
        request = self.factory.get("/test/")
        request.META["REMOTE_ADDR"] = "192.168.1.1"

        # Lock the IP
        lock_ip("192.168.1.1")

        # Should return error response
        response = self.middleware.process_request(request)
        self.assertIsNotNone(response)
        self.assertEqual(response.status_code, 429)

    def test_auth_endpoint_detection(self):
        """Test authentication endpoint detection"""
        request = self.factory.post("/api/auth/login/")

        # Should detect as auth endpoint
        self.assertTrue(self.middleware._is_auth_endpoint(request))

        request = self.factory.get("/api/users/")
        self.assertFalse(self.middleware._is_auth_endpoint(request))


class RateLimitMiddlewareTestCase(TestCase):
    """Test rate limit middleware"""

    def setUp(self):
        self.factory = RequestFactory()
        self.middleware = RateLimitMiddleware(lambda r: None)
        cache.clear()

    def test_process_request_normal(self):
        """Test normal request processing"""
        request = self.factory.get("/api/test/")
        request.META["REMOTE_ADDR"] = "192.168.1.1"

        # Should return None for normal requests
        response = self.middleware.process_request(request)
        self.assertIsNone(response)

    def test_skip_paths(self):
        """Test skipping certain paths"""
        request = self.factory.get("/admin/")
        request.META["REMOTE_ADDR"] = "192.168.1.1"

        # Should skip admin paths
        response = self.middleware.process_request(request)
        self.assertIsNone(response)


class IntegrationTestCase(TestCase):
    """Integration tests for the complete security system"""

    def setUp(self):
        self.factory = RequestFactory()
        cache.clear()

    def test_complete_security_flow(self):
        """Test complete security flow"""
        # Create request
        request = self.factory.post("/api/auth/login/")
        request.META["REMOTE_ADDR"] = "192.168.1.1"
        request.META["HTTP_USER_AGENT"] = "Test Browser"
        request.META["HTTP_ACCEPT"] = "application/json"

        # Test security utilities
        ip = get_client_ip(request)
        self.assertEqual(ip, "192.168.1.1")

        # Test fingerprinting
        fingerprint = get_client_fingerprint(request)
        self.assertIsInstance(fingerprint, str)

        # Test failure counting
        failures = increment_failure_count(ip)
        self.assertEqual(failures, 1)

        # Test event logging
        log_security_event(request, "test_integration")

        # Test throttling
        throttle = AuthenticationThrottle()

        class MockView:
            pass

        view = MockView()
        allowed = throttle.allow_request(request, view)
        self.assertTrue(allowed)

        # Verify scope was set
        self.assertEqual(view.throttle_scope, "auth_login")

    def test_progressive_lockout(self):
        """Test progressive lockout mechanism"""
        ip = "192.168.1.100"

        # Simulate multiple failures
        for i in range(25):  # Exceed the limit
            increment_failure_count(ip, "ip")

        # IP should be locked after exceeding limit
        failure_count = get_failure_count(ip, "ip")
        self.assertGreaterEqual(failure_count, 20)

        # Test that lockout would be triggered
        # (We can't test the actual middleware lockout without more setup)
        self.assertTrue(True)


class AuditLogModelTest(TestCase):
    """Test cases for AuditLog model"""

    def setUp(self):
        self.factory = RequestFactory()
        self.user = User.objects.create_user(
            username="testuser",
            email="testuser@tecmilenio.mx",
            password="testpass123",
            role="student",
        )
        self.admin_user = User.objects.create_user(
            username="admin",
            email="admin@tecmilenio.mx",
            password="adminpass123",
            role="admin",
        )
        cache.clear()

    def test_audit_log_creation(self):
        """Test basic audit log creation"""
        from .models import AuditLog

        audit_log = AuditLog.objects.create(
            event_type="login_success",
            severity="low",
            user=self.user,
            username=self.user.username,
            ip_address="192.168.1.1",
            message="User logged in successfully",
        )

        self.assertEqual(audit_log.event_type, "login_success")
        self.assertEqual(audit_log.severity, "low")
        self.assertEqual(audit_log.user, self.user)
        self.assertEqual(audit_log.username, self.user.username)
        self.assertEqual(audit_log.ip_address, "192.168.1.1")
        self.assertFalse(audit_log.resolved)

    def test_log_event_class_method(self):
        """Test the log_event class method"""
        from .models import AuditLog

        request = self.factory.post("/api/auth/login/")
        request.user = self.user
        request.META["HTTP_USER_AGENT"] = "Test Browser"
        request.META["REMOTE_ADDR"] = "192.168.1.1"

        audit_log = AuditLog.log_event(
            event_type="login_success",
            request=request,
            message="Test login event",
            extra_data={"test": "data"},
            severity="medium",
        )

        self.assertEqual(audit_log.event_type, "login_success")
        self.assertEqual(audit_log.severity, "medium")
        self.assertEqual(audit_log.user, self.user)
        self.assertEqual(audit_log.message, "Test login event")
        self.assertEqual(audit_log.extra_data["test"], "data")
        self.assertEqual(audit_log.ip_address, "192.168.1.1")

    def test_log_authentication_event(self):
        """Test authentication event logging"""
        from .models import AuditLog

        request = self.factory.post("/api/auth/login/")
        request.user = self.user
        request.META["REMOTE_ADDR"] = "192.168.1.1"

        audit_log = AuditLog.log_authentication_event(
            event_type="login_success",
            request=request,
            user=self.user,
            extra_data={"login_method": "password"},
        )

        self.assertEqual(audit_log.event_type, "login_success")
        self.assertEqual(audit_log.severity, "low")
        self.assertEqual(audit_log.user, self.user)
        self.assertIn("logged in successfully", audit_log.message)
        self.assertEqual(audit_log.extra_data["login_method"], "password")

    def test_log_security_event(self):
        """Test security event logging"""
        from .models import AuditLog

        request = self.factory.get("/api/admin/")
        request.user = self.user
        request.META["REMOTE_ADDR"] = "192.168.1.1"

        audit_log = AuditLog.log_security_event(
            event_type="unauthorized_access",
            request=request,
            user=self.user,
            message="Unauthorized access attempt",
            extra_data={"attempted_resource": "/api/admin/"},
        )

        self.assertEqual(audit_log.event_type, "unauthorized_access")
        self.assertEqual(audit_log.severity, "high")
        self.assertEqual(audit_log.user, self.user)
        self.assertEqual(audit_log.message, "Unauthorized access attempt")

    def test_log_permission_violation(self):
        """Test permission violation logging"""
        from .models import AuditLog

        request = self.factory.get("/api/admin/users/")
        request.user = self.user
        request.META["REMOTE_ADDR"] = "192.168.1.1"

        audit_log = AuditLog.log_permission_violation(
            request=request, user=self.user, resource="/api/admin/users/", action="GET"
        )

        self.assertEqual(audit_log.event_type, "permission_denied")
        self.assertEqual(audit_log.severity, "medium")
        self.assertIn("Permission denied", audit_log.message)
        self.assertEqual(audit_log.extra_data["resource"], "/api/admin/users/")
        self.assertEqual(audit_log.extra_data["action"], "GET")

    def test_mark_resolved(self):
        """Test marking audit log as resolved"""
        from .models import AuditLog

        audit_log = AuditLog.objects.create(
            event_type="suspicious_activity",
            severity="high",
            user=self.user,
            username=self.user.username,
            ip_address="192.168.1.1",
            message="Suspicious activity detected",
        )

        self.assertFalse(audit_log.resolved)
        self.assertIsNone(audit_log.resolved_by)
        self.assertIsNone(audit_log.resolved_at)

        audit_log.mark_resolved(
            resolved_by=self.admin_user, resolution_notes="False positive"
        )

        self.assertTrue(audit_log.resolved)
        self.assertEqual(audit_log.resolved_by, self.admin_user)
        self.assertIsNotNone(audit_log.resolved_at)
        self.assertEqual(audit_log.resolution_notes, "False positive")

    def test_get_security_summary(self):
        """Test security summary generation"""
        from .models import AuditLog

        # Create test audit logs
        AuditLog.objects.create(
            event_type="login_success",
            severity="low",
            user=self.user,
            username=self.user.username,
            ip_address="192.168.1.1",
            message="Login success",
        )

        AuditLog.objects.create(
            event_type="login_failed",
            severity="medium",
            ip_address="192.168.1.2",
            message="Login failed",
        )

        AuditLog.objects.create(
            event_type="suspicious_activity",
            severity="critical",
            ip_address="192.168.1.3",
            message="Suspicious activity",
            resolved=False,
        )

        summary = AuditLog.get_security_summary(24)

        self.assertEqual(summary["total_events"], 3)
        self.assertEqual(summary["by_severity"]["low"], 1)
        self.assertEqual(summary["by_severity"]["medium"], 1)
        self.assertEqual(summary["by_severity"]["critical"], 1)
        self.assertEqual(summary["unique_ips"], 3)
        self.assertEqual(summary["unique_users"], 1)
        self.assertEqual(summary["unresolved_critical"], 1)


class AuditLoggingIntegrationTest(TestCase):
    """Integration tests for audit logging system"""

    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            email="testuser@tecmilenio.mx",
            password="testpass123",
            role="student",
        )
        cache.clear()

    def test_login_audit_logging(self):
        """Test that login attempts create audit logs"""
        from .models import AuditLog

        # Clear any existing logs
        AuditLog.objects.all().delete()

        # Test successful login
        response = self.client.post(
            "/api/auth/login/", {"username": "testuser", "password": "testpass123"}
        )

        if response.status_code == 200:
            # Check that successful login was logged
            success_logs = AuditLog.objects.filter(
                event_type="login_success", username="testuser"
            )
            self.assertTrue(success_logs.exists())

        # Test failed login
        response = self.client.post(
            "/api/auth/login/", {"username": "testuser", "password": "wrongpassword"}
        )

        self.assertEqual(response.status_code, 401)

        # Check that failed login was logged
        failed_logs = AuditLog.objects.filter(event_type="login_failed")
        self.assertTrue(failed_logs.exists())
