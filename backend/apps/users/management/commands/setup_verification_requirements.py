from apps.users.verification_models import VerificationRequirement
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Set up default verification requirements"

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Reset all existing requirements and create defaults",
        )
        parser.add_argument(
            "--verbose",
            action="store_true",
            help="Show detailed output",
        )

    def handle(self, *args, **options):
        reset = options["reset"]
        verbose = options["verbose"]

        if reset:
            self.stdout.write(
                self.style.WARNING(
                    "Resetting all existing verification requirements..."
                )
            )
            deleted_count = VerificationRequirement.objects.all().delete()[0]
            if verbose:
                self.stdout.write(f"Deleted {deleted_count} existing requirements")

        # Create default requirements
        self.stdout.write("Creating default verification requirements...")

        defaults = [
            {
                "operation": "password_change",
                "verification_type": "email",
                "required_for_roles": ["admin", "president", "student"],
                "description": "Verificación de email requerida para cambio de contraseña",
            },
            {
                "operation": "email_change",
                "verification_type": "both",
                "required_for_roles": ["admin", "president", "student"],
                "description": "Verificación completa requerida para cambio de email",
            },
            {
                "operation": "phone_change",
                "verification_type": "email",
                "required_for_roles": ["admin", "president", "student"],
                "description": "Verificación de email requerida para cambio de teléfono",
            },
            {
                "operation": "role_change",
                "verification_type": "account",
                "required_for_roles": ["admin"],
                "description": "Cuenta completamente verificada requerida para cambio de rol",
            },
            {
                "operation": "admin_operations",
                "verification_type": "account",
                "required_for_roles": ["admin"],
                "description": "Cuenta completamente verificada requerida para operaciones administrativas",
            },
            {
                "operation": "group_management",
                "verification_type": "email",
                "required_for_roles": ["president"],
                "description": "Verificación de email requerida para gestión de grupos",
            },
            {
                "operation": "event_management",
                "verification_type": "email",
                "required_for_roles": ["president", "admin"],
                "description": "Verificación de email requerida para gestión de eventos",
            },
            {
                "operation": "user_management",
                "verification_type": "account",
                "required_for_roles": ["admin"],
                "description": "Cuenta completamente verificada requerida para gestión de usuarios",
            },
            {
                "operation": "sensitive_data_access",
                "verification_type": "both",
                "required_for_roles": ["admin", "president"],
                "description": "Verificación completa requerida para acceso a datos sensibles",
            },
            {
                "operation": "financial_operations",
                "verification_type": "account",
                "required_for_roles": ["admin"],
                "description": "Cuenta completamente verificada requerida para operaciones financieras",
            },
        ]

        created_count = 0
        updated_count = 0

        for default in defaults:
            requirement, created = VerificationRequirement.objects.get_or_create(
                operation=default["operation"], defaults=default
            )

            if created:
                created_count += 1
                if verbose:
                    self.stdout.write(
                        f"Created requirement: {requirement.get_operation_display()}"
                    )
            else:
                # Update existing requirement if reset was not used
                if not reset:
                    for key, value in default.items():
                        if key != "operation":
                            setattr(requirement, key, value)
                    requirement.save()
                    updated_count += 1
                    if verbose:
                        self.stdout.write(
                            f"Updated requirement: {requirement.get_operation_display()}"
                        )

        self.stdout.write(
            self.style.SUCCESS(
                f"Setup completed. Created: {created_count}, Updated: {updated_count}"
            )
        )

        # Show summary
        total_requirements = VerificationRequirement.objects.count()
        self.stdout.write(
            self.style.SUCCESS(
                f"Total verification requirements in system: {total_requirements}"
            )
        )

        if verbose:
            self.stdout.write("\nCurrent verification requirements:")
            for req in VerificationRequirement.objects.all().order_by("operation"):
                roles_str = (
                    ", ".join(req.required_for_roles)
                    if req.required_for_roles
                    else "All roles"
                )
                self.stdout.write(
                    f"  - {req.get_operation_display()}: {req.get_verification_type_display()} "
                    f'(Roles: {roles_str}) {"[ACTIVE]" if req.is_active else "[INACTIVE]"}'
                )
