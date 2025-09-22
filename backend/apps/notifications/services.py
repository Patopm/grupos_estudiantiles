import logging
from datetime import timedelta

from django.conf import settings
from django.template.loader import render_to_string
from django.utils import timezone
from django.utils.html import strip_tags

from .models import (
    EmailNotification,
    EmailTemplate,
    EventReminder,
    NotificationPreferences,
)
from .tasks import send_email_notification

logger = logging.getLogger(__name__)


class NotificationService:
    """
    Service class for handling email notifications
    """

    @staticmethod
    def create_notification(
        user, template_type, context_data=None, priority="normal", scheduled_at=None
    ):
        """
        Create an email notification from a template
        """
        try:
            # Get user preferences
            preferences = NotificationPreferences.objects.filter(user=user).first()
            if not preferences:
                # Create default preferences
                preferences = NotificationPreferences.objects.create(user=user)

            # Check if user wants this type of notification
            if not NotificationService._should_send_notification(
                preferences, template_type
            ):
                logger.info(
                    f"User {user.email} has disabled {template_type} notifications"
                )
                return None

            # Get template
            template = EmailTemplate.objects.filter(
                template_type=template_type, is_active=True
            ).first()

            if not template:
                logger.error(f"No active template found for type: {template_type}")
                return None

            # Prepare context
            context = {
                "user": user,
                "site_name": "Grupos Estudiantiles - Tecmilenio",
                "site_url": getattr(settings, "SITE_URL", "http://localhost:3000"),
                **(context_data or {}),
            }

            # Render content
            html_content = render_to_string(
                "emails/base.html", {"template": template, **context}
            )
            text_content = strip_tags(html_content)

            # Handle email frequency preferences
            if preferences.email_frequency != "immediate":
                scheduled_at = NotificationService._calculate_scheduled_time(
                    preferences.email_frequency
                )

            # Create notification
            notification = EmailNotification.objects.create(
                recipient=user,
                template=template,
                subject=template.subject.format(**context),
                html_content=html_content,
                text_content=text_content,
                priority=priority,
                scheduled_at=scheduled_at or timezone.now(),
                context_data=context_data or {},
            )

            # Send immediately if user prefers immediate notifications
            if preferences.email_frequency == "immediate":
                send_email_notification.delay(str(notification.id))

            return notification

        except Exception as e:
            logger.error(f"Failed to create notification for {user.email}: {str(e)}")
            return None

    @staticmethod
    def _should_send_notification(preferences, template_type):
        """
        Check if user wants to receive this type of notification
        """
        notification_map = {
            "event_reminder": preferences.event_reminders,
            "event_created": preferences.event_updates,
            "event_updated": preferences.event_updates,
            "event_cancelled": preferences.event_cancellations,
            "group_request_approved": preferences.group_requests,
            "group_request_rejected": preferences.group_requests,
            "group_new_member": preferences.new_members,
            "group_member_left": preferences.group_updates,
            "2fa_enabled": preferences.security_alerts,
            "2fa_disabled": preferences.security_alerts,
            "account_security": preferences.security_alerts,
            "welcome": True,  # Always send welcome emails
            "password_reset": True,  # Always send password reset emails
        }

        return notification_map.get(template_type, True)

    @staticmethod
    def _calculate_scheduled_time(frequency):
        """
        Calculate when to send the notification based on frequency preference
        """
        now = timezone.now()

        if frequency == "daily":
            # Send at 9 AM next day
            next_day = now.replace(
                hour=9, minute=0, second=0, microsecond=0
            ) + timedelta(days=1)
            return next_day
        elif frequency == "weekly":
            # Send on Monday at 9 AM
            days_until_monday = (7 - now.weekday()) % 7
            if days_until_monday == 0:  # Today is Monday
                days_until_monday = 7
            next_monday = now.replace(
                hour=9, minute=0, second=0, microsecond=0
            ) + timedelta(days=days_until_monday)
            return next_monday

        return now

    # Specific notification methods

    @staticmethod
    def send_welcome_notification(user):
        """Send welcome email to new user"""
        return NotificationService.create_notification(
            user=user,
            template_type="welcome",
            context_data={
                "login_url": f"{getattr(settings, 'SITE_URL', 'http://localhost:3000')}/auth/login"
            },
            priority="normal",
        )

    @staticmethod
    def send_2fa_enabled_notification(user):
        """Send notification when 2FA is enabled"""
        return NotificationService.create_notification(
            user=user,
            template_type="2fa_enabled",
            context_data={
                "enabled_at": timezone.now().isoformat(),
                "settings_url": f"{getattr(settings, 'SITE_URL', 'http://localhost:3000')}/profile/security",
            },
            priority="high",
        )

    @staticmethod
    def send_2fa_disabled_notification(user):
        """Send notification when 2FA is disabled"""
        return NotificationService.create_notification(
            user=user,
            template_type="2fa_disabled",
            context_data={
                "disabled_at": timezone.now().isoformat(),
                "settings_url": f"{getattr(settings, 'SITE_URL', 'http://localhost:3000')}/profile/security",
            },
            priority="high",
        )

    @staticmethod
    def send_event_reminder(user, event, reminder_type):
        """Send event reminder notification"""
        reminder_text = {
            "1_week": "1 semana",
            "3_days": "3 días",
            "1_day": "1 día",
            "2_hours": "2 horas",
            "30_minutes": "30 minutos",
        }

        return NotificationService.create_notification(
            user=user,
            template_type="event_reminder",
            context_data={
                "event": event,
                "reminder_time": reminder_text.get(reminder_type, reminder_type),
                "event_url": f"{getattr(settings, 'SITE_URL', 'http://localhost:3000')}/events/{event.event_id}",
            },
            priority="normal",
        )

    @staticmethod
    def send_event_created_notification(users, event):
        """Send notification when new event is created"""
        notifications = []
        for user in users:
            notification = NotificationService.create_notification(
                user=user,
                template_type="event_created",
                context_data={
                    "event": event,
                    "event_url": f"{getattr(settings, 'SITE_URL', 'http://localhost:3000')}/events/{event.event_id}",
                    "creator": (
                        event.created_by if hasattr(event, "created_by") else None
                    ),
                },
                priority="normal",
            )
            if notification:
                notifications.append(notification)

        return notifications

    @staticmethod
    def send_event_updated_notification(users, event):
        """Send notification when event is updated"""
        notifications = []
        for user in users:
            notification = NotificationService.create_notification(
                user=user,
                template_type="event_updated",
                context_data={
                    "event": event,
                    "event_url": f"{getattr(settings, 'SITE_URL', 'http://localhost:3000')}/events/{event.event_id}",
                    "updated_at": timezone.now().isoformat(),
                },
                priority="normal",
            )
            if notification:
                notifications.append(notification)

        return notifications

    @staticmethod
    def send_event_cancelled_notification(users, event):
        """Send notification when event is cancelled"""
        notifications = []
        for user in users:
            notification = NotificationService.create_notification(
                user=user,
                template_type="event_cancelled",
                context_data={
                    "event": event,
                    "cancelled_at": timezone.now().isoformat(),
                },
                priority="high",
            )
            if notification:
                notifications.append(notification)

        return notifications

    @staticmethod
    def send_group_request_approved_notification(user, group):
        """Send notification when group request is approved"""
        return NotificationService.create_notification(
            user=user,
            template_type="group_request_approved",
            context_data={
                "group": group,
                "group_url": f"{getattr(settings, 'SITE_URL', 'http://localhost:3000')}/groups/{group.group_id}",
                "approved_at": timezone.now().isoformat(),
            },
            priority="normal",
        )

    @staticmethod
    def send_group_request_rejected_notification(user, group, reason=None):
        """Send notification when group request is rejected"""
        return NotificationService.create_notification(
            user=user,
            template_type="group_request_rejected",
            context_data={
                "group": group,
                "reason": reason,
                "rejected_at": timezone.now().isoformat(),
            },
            priority="normal",
        )

    @staticmethod
    def send_new_group_member_notification(users, group, new_member):
        """Send notification to group members about new member"""
        notifications = []
        for user in users:
            if user != new_member:  # Don't send to the new member themselves
                notification = NotificationService.create_notification(
                    user=user,
                    template_type="group_new_member",
                    context_data={
                        "group": group,
                        "new_member": new_member,
                        "group_url": f"{getattr(settings, 'SITE_URL', 'http://localhost:3000')}/groups/{group.group_id}",
                        "joined_at": timezone.now().isoformat(),
                    },
                    priority="low",
                )
                if notification:
                    notifications.append(notification)

        return notifications

    @staticmethod
    def send_member_left_group_notification(users, group, left_member):
        """Send notification to group members when someone leaves"""
        notifications = []
        for user in users:
            if user != left_member:  # Don't send to the member who left
                notification = NotificationService.create_notification(
                    user=user,
                    template_type="group_member_left",
                    context_data={
                        "group": group,
                        "left_member": left_member,
                        "group_url": f"{getattr(settings, 'SITE_URL', 'http://localhost:3000')}/groups/{group.group_id}",
                        "left_at": timezone.now().isoformat(),
                    },
                    priority="low",
                )
                if notification:
                    notifications.append(notification)

        return notifications

    @staticmethod
    def create_event_reminders(event, attendees):
        """Create event reminders for attendees"""
        reminder_times = {
            "1_week": timedelta(weeks=1),
            "3_days": timedelta(days=3),
            "1_day": timedelta(days=1),
            "2_hours": timedelta(hours=2),
            "30_minutes": timedelta(minutes=30),
        }

        reminders_created = 0

        for attendee in attendees:
            # Check user preferences for event reminders
            preferences = NotificationPreferences.objects.filter(user=attendee).first()
            if not preferences or not preferences.event_reminders:
                continue

            for reminder_type, time_delta in reminder_times.items():
                scheduled_time = event.start_datetime - time_delta

                # Only create reminders for future times
                if scheduled_time > timezone.now():
                    reminder, created = EventReminder.objects.get_or_create(
                        event=event,
                        recipient=attendee,
                        reminder_type=reminder_type,
                        defaults={"scheduled_at": scheduled_time},
                    )

                    if created:
                        reminders_created += 1

        logger.info(
            f"Created {reminders_created} event reminders for event {event.title}"
        )
        return reminders_created

    @staticmethod
    def send_daily_digest(user, notifications):
        """Send daily digest email"""
        try:
            # Group notifications by type
            grouped_notifications = {}
            for notification in notifications:
                template_type = (
                    notification.template.template_type
                    if notification.template
                    else "other"
                )
                if template_type not in grouped_notifications:
                    grouped_notifications[template_type] = []
                grouped_notifications[template_type].append(notification)

            # Create digest email
            html_content = render_to_string(
                "emails/daily_digest.html",
                {
                    "user": user,
                    "notifications": grouped_notifications,
                    "date": timezone.now().date(),
                    "site_url": getattr(settings, "SITE_URL", "http://localhost:3000"),
                },
            )

            digest_notification = EmailNotification.objects.create(
                recipient=user,
                subject=f'Resumen diario - {timezone.now().strftime("%d/%m/%Y")}',
                html_content=html_content,
                text_content=strip_tags(html_content),
                priority="low",
            )

            # Send immediately
            send_email_notification.delay(str(digest_notification.id))
            return True

        except Exception as e:
            logger.error(f"Failed to send daily digest to {user.email}: {str(e)}")
            return False

    @staticmethod
    def send_weekly_digest(user, notifications):
        """Send weekly digest email"""
        try:
            # Group notifications by type and date
            grouped_notifications = {}
            for notification in notifications:
                date_key = notification.created_at.date()
                if date_key not in grouped_notifications:
                    grouped_notifications[date_key] = {}

                template_type = (
                    notification.template.template_type
                    if notification.template
                    else "other"
                )
                if template_type not in grouped_notifications[date_key]:
                    grouped_notifications[date_key][template_type] = []

                grouped_notifications[date_key][template_type].append(notification)

            # Create digest email
            html_content = render_to_string(
                "emails/weekly_digest.html",
                {
                    "user": user,
                    "notifications_by_date": grouped_notifications,
                    "week_start": timezone.now().date() - timedelta(days=7),
                    "week_end": timezone.now().date(),
                    "site_url": getattr(settings, "SITE_URL", "http://localhost:3000"),
                },
            )

            digest_notification = EmailNotification.objects.create(
                recipient=user,
                subject=f'Resumen semanal - {timezone.now().strftime("%d/%m/%Y")}',
                html_content=html_content,
                text_content=strip_tags(html_content),
                priority="low",
            )

            # Send immediately
            send_email_notification.delay(str(digest_notification.id))
            return True

        except Exception as e:
            logger.error(f"Failed to send weekly digest to {user.email}: {str(e)}")
            return False
