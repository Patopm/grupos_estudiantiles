from celery import shared_task
from django.utils import timezone

from .models import PasswordResetToken


@shared_task
def cleanup_expired_password_reset_tokens():
    """
    Celery task to clean up expired password reset tokens
    """
    try:
        deleted_count = PasswordResetToken.cleanup_expired_tokens()
        return {
            'status': 'success',
            'deleted_count': deleted_count,
            'message': f'Successfully cleaned up {deleted_count} expired password reset tokens'
        }
    except Exception as e:
        return {
            'status': 'error',
            'message': f'Error cleaning up expired tokens: {str(e)}'
        }


@shared_task
def deactivate_user_password_reset_tokens(user_id):
    """
    Celery task to deactivate all password reset tokens for a specific user
    """
    try:
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        user = User.objects.get(id=user_id)
        PasswordResetToken.deactivate_user_tokens(user)
        
        return {
            'status': 'success',
            'message': f'Successfully deactivated all password reset tokens for user {user.email}'
        }
    except Exception as e:
        return {
            'status': 'error',
            'message': f'Error deactivating user tokens: {str(e)}'
        }