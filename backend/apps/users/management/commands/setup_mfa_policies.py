from apps.users.models import MFAEnforcementPolicy
from django.core.management.base import BaseCommand
from django.utils import timezone


class Command(BaseCommand):
    help = 'Setup default MFA enforcement policies'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force update existing policies',
        )

    def handle(self, *args, **options):
        force = options['force']
        
        default_policies = [
            {
                'role': 'admin',
                'mfa_required': True,
                'grace_period_days': 3,
                'description': 'Administrators require MFA with 3-day grace period'
            },
            {
                'role': 'president',
                'mfa_required': True,
                'grace_period_days': 7,
                'description': 'Presidents require MFA with 7-day grace period'
            },
            {
                'role': 'student',
                'mfa_required': False,
                'grace_period_days': 14,
                'description': 'Students do not require MFA by default'
            },
        ]

        created_count = 0
        updated_count = 0

        for policy_data in default_policies:
            role = policy_data['role']
            description = policy_data.pop('description')
            
            try:
                policy = MFAEnforcementPolicy.objects.get(role=role)
                if force:
                    # Update existing policy
                    for key, value in policy_data.items():
                        setattr(policy, key, value)
                    
                    # Set enforcement date if MFA is required
                    if policy.mfa_required and not policy.enforcement_date:
                        policy.enforcement_date = timezone.now()
                    elif not policy.mfa_required:
                        policy.enforcement_date = None
                    
                    policy.save()
                    updated_count += 1
                    self.stdout.write(
                        self.style.SUCCESS(f'Updated MFA policy for {role}: {description}')
                    )
                else:
                    self.stdout.write(
                        self.style.WARNING(f'Policy for {role} already exists. Use --force to update.')
                    )
            except MFAEnforcementPolicy.DoesNotExist:
                # Create new policy
                policy_data['enforcement_date'] = timezone.now() if policy_data['mfa_required'] else None
                MFAEnforcementPolicy.objects.create(**policy_data)
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Created MFA policy for {role}: {description}')
                )

        self.stdout.write(
            self.style.SUCCESS(
                f'\nMFA Policy Setup Complete:\n'
                f'- Created: {created_count} policies\n'
                f'- Updated: {updated_count} policies'
            )
        )