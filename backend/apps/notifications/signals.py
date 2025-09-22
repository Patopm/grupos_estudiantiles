import logging

from django.contrib.auth import get_user_model
from django.db.models.signals import m2m_changed, post_delete, post_save
from django.dispatch import receiver

from apps.events.models import Event, EventAttendance
from apps.students.models import GroupMembership, StudentGroup

from .services import NotificationService

User = get_user_model()
logger = logging.getLogger(__name__)


@receiver(post_save, sender=User)
def send_welcome_email(sender, instance, created, **kwargs):
    """
    Send welcome email to new users
    """
    if created:
        try:
            NotificationService.send_welcome_notification(instance)
            logger.info(f"Welcome notification sent to {instance.email}")
        except Exception as e:
            logger.error(
                f"Failed to send welcome notification to {instance.email}: {str(e)}"
            )


@receiver(post_save, sender=GroupMembership)
def handle_group_membership_changes(sender, instance, created, **kwargs):
    """
    Handle group membership changes
    """
    try:
        if created and instance.status == "active":
            # New member joined group
            group_members = User.objects.filter(
                memberships__group=instance.group, memberships__status="active"
            ).exclude(id=instance.user.id)

            NotificationService.send_new_group_member_notification(
                users=group_members, group=instance.group, new_member=instance.user
            )

            logger.info(
                f"New member notification sent for {instance.user.email} joining {instance.group.name}"
            )

        elif not created and instance.status == "inactive":
            # Member left group
            group_members = User.objects.filter(
                memberships__group=instance.group, memberships__status="active"
            )

            NotificationService.send_member_left_group_notification(
                users=group_members, group=instance.group, left_member=instance.user
            )

            logger.info(
                f"Member left notification sent for {instance.user.email} leaving {instance.group.name}"
            )

    except Exception as e:
        logger.error(f"Failed to handle group membership change: {str(e)}")


@receiver(post_save, sender=Event)
def handle_event_creation_and_updates(sender, instance, created, **kwargs):
    """
    Handle event creation and updates
    """
    try:
        if created:
            # New event created
            # Get all members of target groups
            target_users = User.objects.filter(
                memberships__group__in=instance.target_groups.all(),
                memberships__status="active",
            ).distinct()

            NotificationService.send_event_created_notification(
                users=target_users, event=instance
            )

            logger.info(f"Event created notifications sent for event: {instance.title}")

        else:
            # Event updated
            # Only send notifications if it's a significant update
            if instance.status == "active":
                target_users = User.objects.filter(
                    memberships__group__in=instance.target_groups.all(),
                    memberships__status="active",
                ).distinct()

                NotificationService.send_event_updated_notification(
                    users=target_users, event=instance
                )

                logger.info(
                    f"Event updated notifications sent for event: {instance.title}"
                )

            elif instance.status == "cancelled":
                # Event cancelled
                attendees = User.objects.filter(
                    event_attendances__event=instance,
                    event_attendances__status__in=["registered", "confirmed"],
                ).distinct()

                NotificationService.send_event_cancelled_notification(
                    users=attendees, event=instance
                )

                logger.info(
                    f"Event cancelled notifications sent for event: {instance.title}"
                )

    except Exception as e:
        logger.error(f"Failed to handle event changes: {str(e)}")


@receiver(post_save, sender=EventAttendance)
def handle_event_attendance_changes(sender, instance, created, **kwargs):
    """
    Handle event attendance changes to create reminders
    """
    try:
        if created and instance.status in ["registered", "confirmed"]:
            # User registered for event, create reminders
            NotificationService.create_event_reminders(
                event=instance.event, attendees=[instance.user]
            )

            logger.info(
                f"Event reminders created for {instance.user.email} attending {instance.event.title}"
            )

    except Exception as e:
        logger.error(f"Failed to create event reminders: {str(e)}")


@receiver(m2m_changed, sender=Event.target_groups.through)
def handle_event_target_groups_changes(sender, instance, action, pk_set, **kwargs):
    """
    Handle changes to event target groups
    """
    try:
        if action == "post_add" and pk_set:
            # New groups added to event
            new_groups = StudentGroup.objects.filter(pk__in=pk_set)
            new_users = User.objects.filter(
                memberships__group__in=new_groups, memberships__status="active"
            ).distinct()

            if new_users.exists():
                NotificationService.send_event_created_notification(
                    users=new_users, event=instance
                )

                logger.info(
                    f"Event notifications sent to new target groups for event: {instance.title}"
                )

    except Exception as e:
        logger.error(f"Failed to handle event target groups changes: {str(e)}")


# Custom signal handlers for group request approvals/rejections
def send_group_request_approved(user, group):
    """
    Send notification when group request is approved
    """
    try:
        NotificationService.send_group_request_approved_notification(user, group)
        logger.info(
            f"Group request approved notification sent to {user.email} for {group.name}"
        )
    except Exception as e:
        logger.error(f"Failed to send group request approved notification: {str(e)}")


def send_group_request_rejected(user, group, reason=None):
    """
    Send notification when group request is rejected
    """
    try:
        NotificationService.send_group_request_rejected_notification(
            user, group, reason
        )
        logger.info(
            f"Group request rejected notification sent to {user.email} for {group.name}"
        )
    except Exception as e:
        logger.error(f"Failed to send group request rejected notification: {str(e)}")


# Custom signal for 2FA status changes
def send_2fa_status_notification(user, enabled=True):
    """
    Send notification when 2FA status changes
    """
    try:
        if enabled:
            NotificationService.send_2fa_enabled_notification(user)
        else:
            NotificationService.send_2fa_disabled_notification(user)

        logger.info(
            f"2FA status notification sent to {user.email} (enabled: {enabled})"
        )
    except Exception as e:
        logger.error(f"Failed to send 2FA status notification: {str(e)}")
