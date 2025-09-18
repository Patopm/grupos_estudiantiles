import logging
from datetime import timedelta

from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils import timezone
from django.utils.html import strip_tags

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def send_email_notification(self, notification_id):
    """
    Send a single email notification
    """
    try:
        from .models import EmailNotification

        notification = EmailNotification.objects.get(id=notification_id)

        # Check if already sent
        if notification.status == 'sent':
            logger.info(f'Notification {notification_id} already sent')
            return f'Notification {notification_id} already sent'

        # Update status to sending
        notification.status = 'sending'
        notification.save(update_fields=['status'])

        # Send email
        success = send_mail(subject=notification.subject,
                            message=notification.text_content
                            or strip_tags(notification.html_content),
                            html_message=notification.html_content,
                            from_email=notification.from_email,
                            recipient_list=[notification.recipient.email],
                            fail_silently=False)

        if success:
            notification.status = 'sent'
            notification.sent_at = timezone.now()
            notification.save(update_fields=['status', 'sent_at'])
            logger.info(f'Successfully sent notification {notification_id}')
            return f'Successfully sent notification {notification_id}'
        else:
            raise Exception('send_mail returned False')

    except EmailNotification.DoesNotExist:
        logger.error(f'Notification {notification_id} does not exist')
        return f'Notification {notification_id} does not exist'

    except Exception as exc:
        logger.error(
            f'Failed to send notification {notification_id}: {str(exc)}')

        # Update notification status
        try:
            notification = EmailNotification.objects.get(id=notification_id)
            notification.status = 'failed'
            notification.failed_at = timezone.now()
            notification.error_message = str(exc)
            notification.save(
                update_fields=['status', 'failed_at', 'error_message'])
        except:
            pass

        # Retry with exponential backoff
        if self.request.retries < self.max_retries:
            countdown = 60 * (2**self.request.retries)  # 60s, 120s, 240s
            logger.info(
                f'Retrying notification {notification_id} in {countdown}s')
            raise self.retry(countdown=countdown, exc=exc)

        return f'Failed to send notification {notification_id}: {str(exc)}'


@shared_task
def send_bulk_notifications(notification_ids):
    """
    Send multiple email notifications
    """
    results = []
    for notification_id in notification_ids:
        try:
            result = send_email_notification.delay(notification_id)
            results.append(f'Queued {notification_id}')
        except Exception as e:
            results.append(f'Failed to queue {notification_id}: {str(e)}')
            logger.error(
                f'Failed to queue notification {notification_id}: {str(e)}')

    return results


@shared_task
def send_event_reminders():
    """
    Send scheduled event reminders
    """
    from .models import EventReminder

    # Get reminders scheduled for now or past due
    now = timezone.now()
    reminders = EventReminder.objects.filter(
        scheduled_at__lte=now,
        sent=False,
        event__status='active'  # Only for active events
    ).select_related('event', 'recipient')

    sent_count = 0
    failed_count = 0

    for reminder in reminders:
        try:
            # Create email notification for reminder
            from .services import NotificationService

            success = NotificationService.send_event_reminder(
                user=reminder.recipient,
                event=reminder.event,
                reminder_type=reminder.reminder_type)

            if success:
                reminder.sent = True
                reminder.sent_at = timezone.now()
                reminder.save(update_fields=['sent', 'sent_at'])
                sent_count += 1
                logger.info(
                    f'Sent reminder {reminder.id} for event {reminder.event.title}'
                )
            else:
                failed_count += 1
                logger.error(f'Failed to send reminder {reminder.id}')

        except Exception as e:
            failed_count += 1
            logger.error(f'Error sending reminder {reminder.id}: {str(e)}')

    logger.info(f'Event reminders: {sent_count} sent, {failed_count} failed')
    return f'Event reminders: {sent_count} sent, {failed_count} failed'


@shared_task
def cleanup_old_notifications():
    """
    Clean up old sent notifications and failed notifications
    """
    from .models import EmailNotification

    now = timezone.now()

    # Delete sent notifications older than 30 days
    sent_cutoff = now - timedelta(days=30)
    sent_deleted = EmailNotification.objects.filter(
        status='sent', sent_at__lt=sent_cutoff).delete()[0]

    # Delete failed notifications older than 7 days
    failed_cutoff = now - timedelta(days=7)
    failed_deleted = EmailNotification.objects.filter(
        status='failed', failed_at__lt=failed_cutoff).delete()[0]

    logger.info(
        f'Cleanup: deleted {sent_deleted} sent and {failed_deleted} failed notifications'
    )
    return f'Cleanup: deleted {sent_deleted} sent and {failed_deleted} failed notifications'


@shared_task
def process_pending_notifications():
    """
    Process pending notifications that are due to be sent
    """
    from .models import EmailNotification

    # Get pending notifications that are scheduled for now or past due
    now = timezone.now()
    pending_notifications = EmailNotification.objects.filter(
        status='pending', scheduled_at__lte=now).order_by(
            'priority', 'scheduled_at')[:100]  # Process in batches

    processed_count = 0

    for notification in pending_notifications:
        try:
            send_email_notification.delay(str(notification.id))
            processed_count += 1
        except Exception as e:
            logger.error(
                f'Failed to queue notification {notification.id}: {str(e)}')

    logger.info(f'Processed {processed_count} pending notifications')
    return f'Processed {processed_count} pending notifications'


@shared_task
def send_daily_digest():
    """
    Send daily digest emails to users who opted for daily frequency
    """
    from django.contrib.auth import get_user_model

    from .models import EmailNotification, NotificationPreferences

    User = get_user_model()

    # Get users with daily email frequency
    daily_users = User.objects.filter(
        notification_preferences__email_frequency='daily').select_related(
            'notification_preferences')

    digest_count = 0

    for user in daily_users:
        try:
            # Get unprocessed notifications from last 24 hours
            yesterday = timezone.now() - timedelta(days=1)
            notifications = EmailNotification.objects.filter(
                recipient=user, created_at__gte=yesterday,
                status='pending').order_by('-created_at')

            if notifications.exists():
                # Create digest email
                from .services import NotificationService
                success = NotificationService.send_daily_digest(
                    user, notifications)

                if success:
                    # Mark individual notifications as sent via digest
                    notifications.update(status='sent', sent_at=timezone.now())
                    digest_count += 1

        except Exception as e:
            logger.error(
                f'Failed to send daily digest to {user.email}: {str(e)}')

    logger.info(f'Sent {digest_count} daily digest emails')
    return f'Sent {digest_count} daily digest emails'


@shared_task
def send_weekly_digest():
    """
    Send weekly digest emails to users who opted for weekly frequency
    """
    from django.contrib.auth import get_user_model

    from .models import EmailNotification, NotificationPreferences

    User = get_user_model()

    # Get users with weekly email frequency
    weekly_users = User.objects.filter(
        notification_preferences__email_frequency='weekly').select_related(
            'notification_preferences')

    digest_count = 0

    for user in weekly_users:
        try:
            # Get unprocessed notifications from last 7 days
            last_week = timezone.now() - timedelta(days=7)
            notifications = EmailNotification.objects.filter(
                recipient=user, created_at__gte=last_week,
                status='pending').order_by('-created_at')

            if notifications.exists():
                # Create digest email
                from .services import NotificationService
                success = NotificationService.send_weekly_digest(
                    user, notifications)

                if success:
                    # Mark individual notifications as sent via digest
                    notifications.update(status='sent', sent_at=timezone.now())
                    digest_count += 1

        except Exception as e:
            logger.error(
                f'Failed to send weekly digest to {user.email}: {str(e)}')

    logger.info(f'Sent {digest_count} weekly digest emails')
    return f'Sent {digest_count} weekly digest emails'
