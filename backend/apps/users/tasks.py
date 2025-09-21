from celery import shared_task
from django.utils import timezone

from .models import PasswordResetToken
from .verification_models import EmailVerificationToken, PhoneVerificationToken


@shared_task
def cleanup_expired_password_reset_tokens():
    """
    Celery task to clean up expired password reset tokens
    """
    try:
        deleted_count = PasswordResetToken.cleanup_expired_tokens()
        return {
            "status": "success",
            "deleted_count": deleted_count,
            "message": f"Successfully cleaned up {deleted_count} expired password reset tokens",
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Error cleaning up expired tokens: {str(e)}",
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
            "status": "success",
            "message": f"Successfully deactivated all password reset tokens for user {user.email}",
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Error deactivating user tokens: {str(e)}",
        }


@shared_task
def cleanup_expired_verification_tokens():
    """
    Celery task to clean up expired verification tokens
    """
    try:
        email_deleted = EmailVerificationToken.cleanup_expired_tokens()
        phone_deleted = PhoneVerificationToken.cleanup_expired_tokens()

        total_deleted = email_deleted + phone_deleted

        return {
            "status": "success",
            "email_tokens_deleted": email_deleted,
            "phone_tokens_deleted": phone_deleted,
            "total_deleted": total_deleted,
            "message": f"Successfully cleaned up {total_deleted} expired verification tokens",
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Error cleaning up expired verification tokens: {str(e)}",
        }


@shared_task
def send_verification_email(user_id, email, token, site_url):
    """
    Celery task to send verification email asynchronously
    """
    try:
        from django.conf import settings
        from django.contrib.auth import get_user_model
        from django.core.mail import send_mail
        from django.template.loader import render_to_string

        User = get_user_model()
        user = User.objects.get(id=user_id)

        verification_url = f"{site_url}/verify-email?token={token}"

        context = {
            "user": user,
            "email": email,
            "verification_url": verification_url,
            "site_url": site_url,
        }

        html_message = render_to_string("emails/email_verification.html", context)

        send_mail(
            subject="Verificación de Email - Grupos Estudiantiles",
            message=f"Haz clic en el siguiente enlace para verificar tu email: {verification_url}",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            html_message=html_message,
            fail_silently=False,
        )

        return {
            "status": "success",
            "message": f"Verification email sent successfully to {email}",
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Error sending verification email: {str(e)}",
        }


@shared_task
def send_verification_sms(phone_number, code):
    """
    Celery task to send verification SMS asynchronously
    """
    try:
        from .sms_service import send_phone_verification_sms

        success, error_message = send_phone_verification_sms(phone_number, code)

        if success:
            return {
                "status": "success",
                "message": f"Verification SMS sent successfully to {phone_number}",
            }
        else:
            return {"status": "error", "message": error_message or "Failed to send SMS"}
    except Exception as e:
        return {
            "status": "error",
            "message": f"Error sending verification SMS: {str(e)}",
        }
