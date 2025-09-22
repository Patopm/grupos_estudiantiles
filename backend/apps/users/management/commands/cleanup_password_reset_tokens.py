from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.users.models import PasswordResetToken


class Command(BaseCommand):
    help = "Clean up expired password reset tokens"

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show what would be deleted without actually deleting",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]

        # Find expired tokens
        expired_tokens = PasswordResetToken.objects.filter(
            expires_at__lt=timezone.now()
        )

        count = expired_tokens.count()

        if dry_run:
            self.stdout.write(
                self.style.WARNING(
                    f"Would delete {count} expired password reset tokens"
                )
            )
            if count > 0:
                self.stdout.write("Expired tokens:")
                for token in expired_tokens[:10]:  # Show first 10
                    self.stdout.write(
                        f"  - {token.user.email} (expired: {token.expires_at})"
                    )
                if count > 10:
                    self.stdout.write(f"  ... and {count - 10} more")
        else:
            deleted_count = PasswordResetToken.cleanup_expired_tokens()
            self.stdout.write(
                self.style.SUCCESS(
                    f"Successfully deleted {deleted_count} expired password reset tokens"
                )
            )
