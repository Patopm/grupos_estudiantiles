"""
Management command for generating audit reports and security summaries
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
import json

from apps.core.models import AuditLog


class Command(BaseCommand):
    help = 'Generate audit reports and security summaries'

    def add_arguments(self, parser):
        parser.add_argument(
            '--hours',
            type=int,
            default=24,
            help='Number of hours to look back for the report (default: 24)')
        parser.add_argument('--format',
                            choices=['json', 'text'],
                            default='text',
                            help='Output format (default: text)')
        parser.add_argument('--severity',
                            choices=['low', 'medium', 'high', 'critical'],
                            help='Filter by severity level')
        parser.add_argument('--event-type',
                            help='Filter by specific event type')
        parser.add_argument('--user', help='Filter by username')
        parser.add_argument('--ip', help='Filter by IP address')
        parser.add_argument('--unresolved-only',
                            action='store_true',
                            help='Show only unresolved security events')

    def handle(self, *args, **options):
        hours = options['hours']
        output_format = options['format']

        # Calculate time range
        since = timezone.now() - timedelta(hours=hours)

        # Build query
        queryset = AuditLog.objects.filter(timestamp__gte=since)

        # Apply filters
        if options['severity']:
            queryset = queryset.filter(severity=options['severity'])

        if options['event_type']:
            queryset = queryset.filter(event_type=options['event_type'])

        if options['user']:
            queryset = queryset.filter(username__icontains=options['user'])

        if options['ip']:
            queryset = queryset.filter(ip_address=options['ip'])

        if options['unresolved_only']:
            queryset = queryset.filter(resolved=False,
                                       severity__in=['high', 'critical'])

        # Generate report
        if output_format == 'json':
            self._generate_json_report(queryset, hours)
        else:
            self._generate_text_report(queryset, hours)

    def _generate_text_report(self, queryset, hours):
        """Generate a human-readable text report"""
        self.stdout.write(
            self.style.SUCCESS(
                f'\n=== AUDIT REPORT - Last {hours} hours ===\n'))

        # Summary statistics
        summary = AuditLog.get_security_summary(hours)

        self.stdout.write(self.style.WARNING('SUMMARY:'))
        self.stdout.write(f'Total Events: {summary["total_events"]}')
        self.stdout.write(f'Unique IPs: {summary["unique_ips"]}')
        self.stdout.write(f'Unique Users: {summary["unique_users"]}')
        self.stdout.write(
            f'Unresolved Critical: {summary["unresolved_critical"]}')
        self.stdout.write(f'Unresolved High: {summary["unresolved_high"]}')

        # Events by severity
        self.stdout.write(self.style.WARNING('\nEVENTS BY SEVERITY:'))
        for severity, count in summary['by_severity'].items():
            if count > 0:
                color = self._get_severity_color(severity)
                self.stdout.write(f'{severity.upper()}: {count}', color)

        # Top event types
        self.stdout.write(self.style.WARNING('\nTOP EVENT TYPES:'))
        for event_type, count in summary['by_type'].items():
            self.stdout.write(f'{event_type}: {count}')

        # Recent critical/high severity events
        critical_events = queryset.filter(
            severity__in=['critical', 'high']).order_by('-timestamp')[:10]

        if critical_events:
            self.stdout.write(
                self.style.ERROR('\nRECENT HIGH/CRITICAL EVENTS:'))
            for event in critical_events:
                status = '❌ UNRESOLVED' if not event.resolved else '✅ RESOLVED'
                self.stdout.write(
                    f'[{event.timestamp.strftime("%Y-%m-%d %H:%M:%S")}] '
                    f'{event.get_severity_display().upper()} - '
                    f'{event.get_event_type_display()} - '
                    f'{event.username or "Anonymous"} - '
                    f'{event.ip_address} - '
                    f'{status}', self._get_severity_color(event.severity))
                if event.message:
                    self.stdout.write(f'  Message: {event.message}')
                self.stdout.write('')

        # Authentication failures
        auth_failures = queryset.filter(event_type__in=[
            'login_failed', 'token_refresh_failed', 'password_reset_failed'
        ]).count()

        if auth_failures > 0:
            self.stdout.write(
                self.style.WARNING(
                    f'\nAUTHENTICATION FAILURES: {auth_failures}'))

            # Top failing IPs
            from django.db.models import Count
            failing_ips = queryset.filter(
                event_type__in=['login_failed', 'token_refresh_failed']
            ).values('ip_address').annotate(
                count=Count('ip_address')).order_by('-count')[:5]

            if failing_ips:
                self.stdout.write('Top failing IPs:')
                for ip_data in failing_ips:
                    self.stdout.write(
                        f'  {ip_data["ip_address"]}: {ip_data["count"]} failures'
                    )

        # Permission violations
        permission_violations = queryset.filter(
            event_type='permission_denied').count()
        if permission_violations > 0:
            self.stdout.write(
                self.style.WARNING(
                    f'\nPERMISSION VIOLATIONS: {permission_violations}'))

        # Suspicious activities
        suspicious_activities = queryset.filter(
            event_type='suspicious_activity').count()
        if suspicious_activities > 0:
            self.stdout.write(
                self.style.ERROR(
                    f'\nSUSPICIOUS ACTIVITIES: {suspicious_activities}'))

    def _generate_json_report(self, queryset, hours):
        """Generate a JSON report"""
        summary = AuditLog.get_security_summary(hours)

        # Get recent events
        recent_events = []
        for event in queryset.order_by('-timestamp')[:100]:
            recent_events.append({
                'id': str(event.id),
                'event_type': event.event_type,
                'severity': event.severity,
                'username': event.username,
                'ip_address': event.ip_address,
                'timestamp': event.timestamp.isoformat(),
                'message': event.message,
                'resolved': event.resolved,
                'extra_data': event.extra_data,
            })

        report = {
            'report_generated': timezone.now().isoformat(),
            'time_range_hours': hours,
            'summary': summary,
            'recent_events': recent_events,
        }

        self.stdout.write(json.dumps(report, indent=2))

    def _get_severity_color(self, severity):
        """Get appropriate color for severity level"""
        colors = {
            'low': self.style.SUCCESS,
            'medium': self.style.WARNING,
            'high': self.style.ERROR,
            'critical': self.style.ERROR,
        }
        return colors.get(severity, self.style.SUCCESS)
