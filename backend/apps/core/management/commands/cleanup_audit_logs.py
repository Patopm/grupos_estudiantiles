"""
Management command for cleaning up old audit logs
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta

from apps.core.models import AuditLog


class Command(BaseCommand):
    help = "Clean up old audit logs based on retention policies"

    def add_arguments(self, parser):
        parser.add_argument(
            "--days",
            type=int,
            default=90,
            help="Number of days to retain logs (default: 90)",
        )
        parser.add_argument(
            "--keep-critical",
            action="store_true",
            help="Keep critical severity logs regardless of age",
        )
        parser.add_argument(
            "--keep-unresolved",
            action="store_true",
            help="Keep unresolved security events regardless of age",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show what would be deleted without actually deleting",
        )

    def handle(self, *args, **options):
        days = options["days"]
        keep_critical = options["keep_critical"]
        keep_unresolved = options["keep_unresolved"]
        dry_run = options["dry_run"]

        # Calculate cutoff date
        cutoff_date = timezone.now() - timedelta(days=days)

        # Build query for logs to delete
        queryset = AuditLog.objects.filter(timestamp__lt=cutoff_date)

        # Apply retention policies
        if keep_critical:
            queryset = queryset.exclude(severity="critical")

        if keep_unresolved:
            queryset = queryset.exclude(
                resolved=False, severity__in=["high", "critical"]
            )

        # Count logs to be deleted
        total_count = queryset.count()

        if total_count == 0:
            self.stdout.write(self.style.SUCCESS("No audit logs found for cleanup."))
            return

        # Show summary
        self.stdout.write(f"Found {total_count} audit logs older than {days} days")

        # Show breakdown by severity
        severity_breakdown = {}
        for severity, _ in AuditLog.SEVERITY_LEVELS:
            count = queryset.filter(severity=severity).count()
            if count > 0:
                severity_breakdown[severity] = count

        if severity_breakdown:
            self.stdout.write("\nBreakdown by severity:")
            for severity, count in severity_breakdown.items():
                self.stdout.write(f"  {severity.upper()}: {count}")

        # Show breakdown by event type
        from django.db.models import Count

        event_breakdown = (
            queryset.values("event_type")
            .annotate(count=Count("event_type"))
            .order_by("-count")[:10]
        )

        if event_breakdown:
            self.stdout.write("\nTop event types to be deleted:")
            for item in event_breakdown:
                self.stdout.write(f'  {item["event_type"]}: {item["count"]}')

        if dry_run:
            self.stdout.write(
                self.style.WARNING("\nDRY RUN: No logs were actually deleted.")
            )
            return

        # Confirm deletion
        if (
            not options.get("verbosity", 1) == 0
        ):  # Skip confirmation in non-interactive mode
            confirm = input(
                f"\nAre you sure you want to delete {total_count} audit logs? (yes/no): "
            )
            if confirm.lower() != "yes":
                self.stdout.write("Cleanup cancelled.")
                return

        # Perform deletion
        deleted_count, _ = queryset.delete()

        self.stdout.write(
            self.style.SUCCESS(f"Successfully deleted {deleted_count} audit logs.")
        )

        # Show retention summary
        remaining_count = AuditLog.objects.count()
        self.stdout.write(f"Remaining audit logs: {remaining_count}")

        # Show oldest remaining log
        oldest_log = AuditLog.objects.order_by("timestamp").first()
        if oldest_log:
            self.stdout.write(
                f'Oldest remaining log: {oldest_log.timestamp.strftime("%Y-%m-%d %H:%M:%S")}'
            )
