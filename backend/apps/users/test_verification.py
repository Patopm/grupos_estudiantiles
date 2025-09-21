from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from .verification_models import (
    EmailVerificationToken,
    PhoneVerificationToken,
    UserVerificationStatus,
    VerificationRequirement,
)

User = get_user_model()


class VerificationSystemTestCase(TestCase):
    """
    Test cases for the verification system
    """

    def setUp(self):
        self.client = APIClient()

        # Create test user
        self.user = User.objects.create_user(
            username="testuser",
            email="test@tecmilenio.mx",
            password="testpass123",
            first_name="Test",
            last_name="User",
            role="student",
        )

        # Create verification requirements
        VerificationRequirement.create_default_requirements()

    def test_user_verification_status_creation(self):
        """Test that verification status is created for user"""
        verification_status, created = UserVerificationStatus.get_or_create_for_user(
            self.user
        )

        self.assertTrue(created)
        self.assertFalse(verification_status.email_verified)
        self.assertFalse(verification_status.phone_verified)
        self.assertFalse(verification_status.account_verified)
        self.assertTrue(verification_status.email_verification_required)
        self.assertFalse(
            verification_status.phone_verification_required
        )  # Student doesn't require phone

    def test_email_verification_request(self):
        """Test email verification request"""
        self.client.force_authenticate(user=self.user)

        url = reverse("users:email-verification-request")
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("message", response.data)

        # Check that token was created
        token = EmailVerificationToken.objects.filter(user=self.user).first()
        self.assertIsNotNone(token)
        self.assertEqual(token.email, self.user.email)
        self.assertTrue(token.is_valid)

    def test_email_verification_confirm(self):
        """Test email verification confirmation"""
        # Create verification token
        token = EmailVerificationToken.objects.create(
            user=self.user, email=self.user.email
        )

        url = reverse("users:email-verification-confirm")
        response = self.client.post(url, {"token": token.token})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("message", response.data)

        # Check that token was marked as verified
        token.refresh_from_db()
        self.assertIsNotNone(token.verified_at)
        self.assertFalse(token.is_active)

        # Check that user verification status was updated
        verification_status = UserVerificationStatus.objects.get(user=self.user)
        self.assertTrue(verification_status.email_verified)
        self.assertIsNotNone(verification_status.email_verified_at)

    def test_phone_verification_request(self):
        """Test phone verification request"""
        self.user.phone = "+1234567890"
        self.user.save()

        self.client.force_authenticate(user=self.user)

        url = reverse("users:phone-verification-request")
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("message", response.data)

        # Check that token was created
        token = PhoneVerificationToken.objects.filter(user=self.user).first()
        self.assertIsNotNone(token)
        self.assertEqual(token.phone_number, self.user.phone)
        self.assertTrue(token.is_valid)

    def test_phone_verification_confirm(self):
        """Test phone verification confirmation"""
        phone_number = "+1234567890"
        self.user.phone = phone_number
        self.user.save()

        # Create verification token
        token = PhoneVerificationToken.objects.create(
            user=self.user, phone_number=phone_number
        )

        self.client.force_authenticate(user=self.user)

        url = reverse("users:phone-verification-confirm")
        response = self.client.post(
            url, {"phone_number": phone_number, "token": token.token}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("message", response.data)

        # Check that token was marked as verified
        token.refresh_from_db()
        self.assertIsNotNone(token.verified_at)
        self.assertFalse(token.is_active)

        # Check that user verification status was updated
        verification_status = UserVerificationStatus.objects.get(user=self.user)
        self.assertTrue(verification_status.phone_verified)
        self.assertIsNotNone(verification_status.phone_verified_at)

    def test_verification_requirement_check(self):
        """Test verification requirement checking"""
        # Test password change requirement
        verification_required, verification_type = (
            VerificationRequirement.check_verification_required(
                "password_change", self.user
            )
        )

        self.assertTrue(verification_required)
        self.assertEqual(verification_type, "email")

        # Verify email and test again
        verification_status, _ = UserVerificationStatus.get_or_create_for_user(
            self.user
        )
        verification_status.mark_email_verified()

        # Refresh user from database to ensure the relationship is updated
        self.user.refresh_from_db()

        # Also refresh the verification status to ensure we have the latest data
        verification_status.refresh_from_db()

        verification_required, verification_type = (
            VerificationRequirement.check_verification_required(
                "password_change", self.user
            )
        )

        self.assertFalse(verification_required)
        self.assertIsNone(verification_type)

    def test_verification_status_endpoint(self):
        """Test verification status endpoint"""
        self.client.force_authenticate(user=self.user)

        url = reverse("users:verification-status")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("email_verified", response.data)
        self.assertIn("phone_verified", response.data)
        self.assertIn("account_verified", response.data)
        self.assertIn("verification_progress", response.data)
        self.assertIn("is_fully_verified", response.data)

    def test_verification_check_endpoint(self):
        """Test verification check endpoint"""
        self.client.force_authenticate(user=self.user)

        url = reverse("users:verification-check")
        response = self.client.post(url, {"operation": "password_change"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("verification_required", response.data)
        self.assertIn("verification_type", response.data)
        self.assertIn("message", response.data)
        self.assertIn("user_verification_status", response.data)

        self.assertTrue(response.data["verification_required"])
        self.assertEqual(response.data["verification_type"], "email")

    def test_admin_verification_requirements(self):
        """Test admin user verification requirements"""
        admin_user = User.objects.create_user(
            username="admin",
            email="admin@tecmilenio.mx",
            password="adminpass123",
            role="admin",
        )

        # Admin should require phone verification
        verification_status, _ = UserVerificationStatus.get_or_create_for_user(
            admin_user
        )
        self.assertTrue(verification_status.phone_verification_required)

        # Admin operations should require full account verification
        verification_required, verification_type = (
            VerificationRequirement.check_verification_required(
                "admin_operations", admin_user
            )
        )

        self.assertTrue(verification_required)
        self.assertEqual(verification_type, "account")

    def test_president_verification_requirements(self):
        """Test president user verification requirements"""
        president_user = User.objects.create_user(
            username="president",
            email="president@tecmilenio.mx",
            password="presidentpass123",
            role="president",
            student_id="AL12345678",
        )

        # President should require phone verification
        verification_status, _ = UserVerificationStatus.get_or_create_for_user(
            president_user
        )
        self.assertTrue(verification_status.phone_verification_required)

        # Group management should require email verification
        verification_required, verification_type = (
            VerificationRequirement.check_verification_required(
                "group_management", president_user
            )
        )

        self.assertTrue(verification_required)
        self.assertEqual(verification_type, "email")

    def test_token_expiration(self):
        """Test token expiration"""
        from datetime import timedelta

        from django.utils import timezone

        # Create expired email token
        expired_token = EmailVerificationToken.objects.create(
            user=self.user,
            email=self.user.email,
            expires_at=timezone.now() - timedelta(hours=1),
        )

        self.assertTrue(expired_token.is_expired)
        self.assertFalse(expired_token.is_valid)

        # Try to verify with expired token
        url = reverse("users:email-verification-confirm")
        response = self.client.post(url, {"token": expired_token.token})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        # Check for validation error (could be in 'error' or 'token' field)
        self.assertTrue("error" in response.data or "token" in response.data)

    def test_cleanup_expired_tokens(self):
        """Test cleanup of expired tokens"""
        from datetime import timedelta

        from django.utils import timezone

        # Create expired tokens
        EmailVerificationToken.objects.create(
            user=self.user,
            email=self.user.email,
            expires_at=timezone.now() - timedelta(hours=1),
        )

        PhoneVerificationToken.objects.create(
            user=self.user,
            phone_number="+1234567890",
            expires_at=timezone.now() - timedelta(minutes=30),
        )

        # Run cleanup
        email_deleted = EmailVerificationToken.cleanup_expired_tokens()
        phone_deleted = PhoneVerificationToken.cleanup_expired_tokens()

        self.assertEqual(email_deleted, 1)
        self.assertEqual(phone_deleted, 1)

        # Verify tokens were deleted
        self.assertEqual(EmailVerificationToken.objects.count(), 0)
        self.assertEqual(PhoneVerificationToken.objects.count(), 0)
