from apps.users.verification_models import (
    EmailVerificationToken,
    PhoneVerificationToken,
)
from django.core.management.base import BaseCommand
from django.utils import timezone


class Command(BaseCommand):
    help = "Clean up expired verification tokens"

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show what would be deleted without actually deleting",
        )
        parser.add_argument(
            "--verbose",
            action="store_true",
            help="Show detailed output",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        verbose = options["verbose"]

        if dry_run:
            self.stdout.write(
                self.style.WARNING("DRY RUN MODE - No tokens will be deleted")
            )

        # Clean up expired email verification tokens
        expired_email_tokens = EmailVerificationToken.objects.filter(
            expires_at__lt=timezone.now()
        )
        email_count = expired_email_tokens.count()

        if verbose:
            self.stdout.write(f"Found {email_count} expired email verification tokens")

        if not dry_run and email_count > 0:
            deleted_email = expired_email_tokens.delete()
            self.stdout.write(
                self.style.SUCCESS(
                    f"Deleted {deleted_email[0]} expired email verification tokens"
                )
            )
        elif dry_run and email_count > 0:
            self.stdout.write(
                f"Would delete {email_count} expired email verification tokens"
            )

        # Clean up expired phone verification tokens
        expired_phone_tokens = PhoneVerificationToken.objects.filter(
            expires_at__lt=timezone.now()
        )
        phone_count = expired_phone_tokens.count()

        if verbose:
            self.stdout.write(f"Found {phone_count} expired phone verification tokens")

        if not dry_run and phone_count > 0:
            deleted_phone = expired_phone_tokens.delete()
            self.stdout.write(
                self.style.SUCCESS(
                    f"Deleted {deleted_phone[0]} expired phone verification tokens"
                )
            )
        elif dry_run and phone_count > 0:
            self.stdout.write(
                f"Would delete {phone_count} expired phone verification tokens"
            )

        # Clean up old verified tokens (older than 30 days)
        old_verified_email_tokens = EmailVerificationToken.objects.filter(
            verified_at__lt=timezone.now() - timezone.timedelta(days=30)
        )
        old_email_count = old_verified_email_tokens.count()

        if verbose:
            self.stdout.write(f"Found {old_email_count} old verified email tokens")

        if not dry_run and old_email_count > 0:
            deleted_old_email = old_verified_email_tokens.delete()
            self.stdout.write(
                self.style.SUCCESS(
                    f"Deleted {deleted_old_email[0]} old verified email tokens"
                )
            )
        elif dry_run and old_email_count > 0:
            self.stdout.write(
                f"Would delete {old_email_count} old verified email tokens"
            )

        old_verified_phone_tokens = PhoneVerificationToken.objects.filter(
            verified_at__lt=timezone.now() - timezone.timedelta(days=30)
        )
        old_phone_count = old_verified_phone_tokens.count()

        if verbose:
            self.stdout.write(f"Found {old_phone_count} old verified phone tokens")

        if not dry_run and old_phone_count > 0:
            deleted_old_phone = old_verified_phone_tokens.delete()
            self.stdout.write(
                self.style.SUCCESS(
                    f"Deleted {deleted_old_phone[0]} old verified phone tokens"
                )
            )
        elif dry_run and old_phone_count > 0:
            self.stdout.write(
                f"Would delete {old_phone_count} old verified phone tokens"
            )

        total_cleaned = email_count + phone_count + old_email_count + old_phone_count

        if total_cleaned == 0:
            self.stdout.write(
                self.style.SUCCESS("No expired or old verification tokens found")
            )
        elif not dry_run:
            self.stdout.write(
                self.style.SUCCESS(
                    f"Cleanup completed. Total tokens processed: {total_cleaned}"
                )
            )
        else:
            self.stdout.write(
                self.style.WARNING(f"DRY RUN: Would process {total_cleaned} tokens")
            )
