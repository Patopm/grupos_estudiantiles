from datetime import timedelta

from apps.events.models import Event, EventAttendance
from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from .models import GroupMembership, StudentGroup

User = get_user_model()


class GroupDetailedEndpointTest(APITestCase):
    """
    Test cases for the new detailed groups API endpoints
    """

    def setUp(self):
        """Set up test data"""
        # Create test users
        self.admin_user = User.objects.create_user(
            username="admin",
            email="admin@tecmilenio.mx",
            password="testpass123",
            role="admin",
            first_name="Admin",
            last_name="User",
            student_id="AL12345678",
        )

        self.president_user = User.objects.create_user(
            username="president",
            email="president@tecmilenio.mx",
            password="testpass123",
            role="president",
            first_name="President",
            last_name="User",
            student_id="AL87654321",
        )

        self.student_user = User.objects.create_user(
            username="student",
            email="student@tecmilenio.mx",
            password="testpass123",
            role="student",
            first_name="Student",
            last_name="User",
            student_id="AL11111111",
        )

        # Create test group
        self.test_group = StudentGroup.objects.create(
            name="Test Group",
            description="A test group for testing",
            president=self.president_user,
            category="academico",
            max_members=10,
        )

        # Create group memberships
        GroupMembership.objects.create(
            user=self.president_user,
            group=self.test_group,
            status="active",
            role="president",
        )

        GroupMembership.objects.create(
            user=self.student_user,
            group=self.test_group,
            status="active",
            role="member",
        )

        # Create test event
        self.test_event = Event.objects.create(
            title="Test Event",
            description="A test event",
            event_type="academic",
            status="published",
            start_datetime=timezone.now() + timedelta(days=7),
            end_datetime=timezone.now() + timedelta(days=7, hours=2),
            location="Test Location",
            requires_registration=True,
        )
        self.test_event.target_groups.add(self.test_group)

    def test_detailed_endpoint_authenticated_user(self):
        """Test that authenticated users can access detailed group information"""
        self.client.force_authenticate(user=self.student_user)
        url = reverse("groups:groups-detailed", kwargs={"pk": self.test_group.group_id})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("members", response.data)
        self.assertIn("upcoming_events", response.data)
        self.assertIn("statistics", response.data)
        self.assertEqual(len(response.data["members"]), 2)  # President + student
        self.assertEqual(len(response.data["upcoming_events"]), 1)  # Test event

    def test_statistics_endpoint_authenticated_user(self):
        """Test that authenticated users can access group statistics"""
        self.client.force_authenticate(user=self.student_user)
        url = reverse(
            "groups:groups-statistics", kwargs={"pk": self.test_group.group_id}
        )
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("total_members", response.data)
        self.assertIn("active_members", response.data)
        self.assertIn("total_events", response.data)
        self.assertEqual(response.data["active_members"], 2)
        self.assertEqual(response.data["total_events"], 1)

    def test_detailed_endpoint_unauthenticated_user(self):
        """Test that unauthenticated users cannot access detailed group information"""
        url = reverse("groups:groups-detailed", kwargs={"pk": self.test_group.group_id})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_statistics_endpoint_unauthenticated_user(self):
        """Test that unauthenticated users cannot access group statistics"""
        url = reverse(
            "groups:groups-statistics", kwargs={"pk": self.test_group.group_id}
        )
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_detailed_endpoint_nonexistent_group(self):
        """Test that requesting details for nonexistent group returns 404"""
        self.client.force_authenticate(user=self.student_user)
        url = reverse(
            "groups:groups-detailed",
            kwargs={"pk": "00000000-0000-0000-0000-000000000000"},
        )
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
