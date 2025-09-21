from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from .models import BackupCode, MFAEnforcementPolicy, TOTPDevice

User = get_user_model()


class MFATestCase(TestCase):
    """Test cases for MFA functionality"""

    def setUp(self):
        """Set up test data"""
        self.client = APIClient()

        # Create test user
        self.user = User.objects.create_user(
            username="testuser",
            email="testuser@tecmilenio.mx",
            password="testpass123",
            first_name="Test",
            last_name="User",
            role="student",
        )

        # Create admin user
        self.admin_user = User.objects.create_user(
            username="admin",
            email="admin@tecmilenio.mx",
            password="adminpass123",
            first_name="Admin",
            last_name="User",
            role="admin",
            is_staff=True,
        )

    def test_mfa_status_unauthenticated(self):
        """Test MFA status endpoint requires authentication"""
        url = reverse("auth:mfa:mfa_status")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_mfa_status_authenticated(self):
        """Test MFA status endpoint for authenticated user"""
        self.client.force_authenticate(user=self.user)
        url = reverse("auth:mfa:mfa_status")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("mfa_enabled", response.data)
        self.assertIn("totp_configured", response.data)
        self.assertIn("backup_codes_count", response.data)
        self.assertIn("mfa_required", response.data)

        # For student role, MFA should not be required by default
        self.assertFalse(response.data["mfa_enabled"])
        self.assertFalse(response.data["totp_configured"])
        self.assertEqual(response.data["backup_codes_count"], 0)
        self.assertFalse(response.data["mfa_required"])

    def test_totp_setup_unauthenticated(self):
        """Test TOTP setup requires authentication"""
        url = reverse("auth:mfa:totp_setup")
        response = self.client.post(url, {"name": "Test Device"})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_totp_setup_authenticated(self):
        """Test TOTP setup for authenticated user"""
        self.client.force_authenticate(user=self.user)
        url = reverse("auth:mfa:totp_setup")
        response = self.client.post(url, {"name": "Test Device"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("secret_key", response.data)
        self.assertIn("provisioning_uri", response.data)
        self.assertIn("qr_code", response.data)
        self.assertIn("device", response.data)

        # Check that TOTP device was created
        self.assertTrue(TOTPDevice.objects.filter(user=self.user).exists())
        device = TOTPDevice.objects.get(user=self.user)
        self.assertEqual(device.name, "Test Device")
        self.assertFalse(device.is_active)
        self.assertFalse(device.confirmed)

    def test_mfa_enforcement_policy_creation(self):
        """Test MFA enforcement policy model"""
        # Test default policy behavior
        self.assertFalse(MFAEnforcementPolicy.is_mfa_required_for_role("student"))
        self.assertTrue(MFAEnforcementPolicy.is_mfa_required_for_role("admin"))
        self.assertTrue(MFAEnforcementPolicy.is_mfa_required_for_role("president"))

        # Create custom policy
        policy = MFAEnforcementPolicy.objects.create(
            role="student", mfa_required=True, grace_period_days=14
        )

        # Test custom policy
        self.assertTrue(MFAEnforcementPolicy.is_mfa_required_for_role("student"))
        self.assertEqual(MFAEnforcementPolicy.get_grace_period_for_role("student"), 14)

    def test_backup_code_generation(self):
        """Test backup code generation"""
        codes = BackupCode.generate_codes_for_user(self.user, count=5)

        self.assertEqual(len(codes), 5)
        self.assertEqual(BackupCode.objects.filter(user=self.user).count(), 5)

        # Test code format (8 characters, uppercase)
        for code in codes:
            self.assertEqual(len(code), 8)
            self.assertTrue(code.isupper())

    def test_backup_code_verification(self):
        """Test backup code verification"""
        codes = BackupCode.generate_codes_for_user(self.user, count=3)
        test_code = codes[0]

        # Test valid code
        self.assertTrue(BackupCode.verify_code(self.user, test_code))

        # Test code is marked as used
        backup_code = BackupCode.objects.get(user=self.user, code=test_code)
        self.assertTrue(backup_code.is_used)
        self.assertIsNotNone(backup_code.used_at)

        # Test used code cannot be used again
        self.assertFalse(BackupCode.verify_code(self.user, test_code))

        # Test invalid code
        self.assertFalse(BackupCode.verify_code(self.user, "INVALID1"))

    def test_mfa_policy_admin_endpoints(self):
        """Test MFA policy management endpoints (admin only)"""
        # Test unauthenticated access
        url = reverse("auth:mfa:mfa_policies")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        # Test non-admin access
        self.client.force_authenticate(user=self.user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Test admin access
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)

    def tearDown(self):
        """Clean up test data"""
        User.objects.all().delete()
        TOTPDevice.objects.all().delete()
        BackupCode.objects.all().delete()
        MFAEnforcementPolicy.objects.all().delete()
