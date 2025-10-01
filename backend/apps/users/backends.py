"""
Custom authentication backends for the user system
"""

from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend

User = get_user_model()


class EmailBackend(ModelBackend):
    """
    Custom authentication backend that allows users to authenticate using their email
    instead of username
    """

    def authenticate(self, request, username=None, password=None, **kwargs):
        if username is None or password is None:
            return None

        try:
            # Try to find user by email first
            user = User.objects.get(email=username)
        except User.DoesNotExist:
            # If not found by email, try by username
            try:
                user = User.objects.get(username=username)
            except User.DoesNotExist:
                return None

        # Check if the user can authenticate
        if user.check_password(password) and self.user_can_authenticate(user):
            return user

        return None

    def user_can_authenticate(self, user):
        """
        Reject users with is_active=False. Custom user models that don't have
        is_active are allowed.
        """
        is_active = getattr(user, 'is_active', None)
        return is_active or is_active is None

    def get_user(self, user_id):
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None
