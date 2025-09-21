import secrets
import uuid
from datetime import timedelta

from django.conf import settings
from django.core.validators import RegexValidator
from django.db import models
from django.utils import timezone


class EmailVerificationToken(models.Model):
    """
    Model for managing email verification tokens
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="email_verification_tokens",
        help_text="Usuario asociado al token de verificación de email",
    )
    token = models.CharField(
        max_length=64,
        unique=True,
        help_text="Token único para la verificación de email",
    )
    email = models.EmailField(
        help_text="Email a verificar (puede ser diferente al actual del usuario)"
    )
    created_at = models.DateTimeField(
        auto_now_add=True, help_text="Fecha y hora de creación del token"
    )
    expires_at = models.DateTimeField(help_text="Fecha y hora de expiración del token")
    verified_at = models.DateTimeField(
        null=True, blank=True, help_text="Fecha y hora cuando se verificó el email"
    )
    is_active = models.BooleanField(
        default=True, help_text="Indica si el token está activo"
    )
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        help_text="Dirección IP desde donde se solicitó la verificación",
    )
    user_agent = models.TextField(
        blank=True, help_text="User agent del navegador que solicitó la verificación"
    )

    class Meta:
        db_table = "email_verification_tokens"
        verbose_name = "Token de Verificación de Email"
        verbose_name_plural = "Tokens de Verificación de Email"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["token"]),
            models.Index(fields=["user", "is_active"]),
            models.Index(fields=["expires_at"]),
            models.Index(fields=["email"]),
        ]

    def __str__(self):
        return f"Email verification for {self.email} - {self.created_at.strftime('%Y-%m-%d %H:%M')}"

    def save(self, *args, **kwargs):
        if not self.token:
            self.token = secrets.token_urlsafe(32)
        if not self.expires_at:
            # Token expires in 24 hours by default
            self.expires_at = timezone.now() + timedelta(hours=24)
        super().save(*args, **kwargs)

    @property
    def is_expired(self):
        """Check if the token has expired"""
        return timezone.now() > self.expires_at

    @property
    def is_valid(self):
        """Check if the token is valid (active, not expired, not verified)"""
        return self.is_active and not self.is_expired and not self.verified_at

    def mark_as_verified(self):
        """Mark the token as verified"""
        self.verified_at = timezone.now()
        self.is_active = False
        self.save(update_fields=["verified_at", "is_active"])

    def deactivate(self):
        """Deactivate the token"""
        self.is_active = False
        self.save(update_fields=["is_active"])

    @classmethod
    def cleanup_expired_tokens(cls):
        """Remove expired tokens from the database"""
        expired_tokens = cls.objects.filter(expires_at__lt=timezone.now())
        count = expired_tokens.count()
        expired_tokens.delete()
        return count

    @classmethod
    def deactivate_user_tokens(cls, user, email=None):
        """Deactivate all active tokens for a user and optionally specific email"""
        queryset = cls.objects.filter(user=user, is_active=True)
        if email:
            queryset = queryset.filter(email=email)
        queryset.update(is_active=False)


class PhoneVerificationToken(models.Model):
    """
    Model for managing phone number verification tokens (SMS)
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="phone_verification_tokens",
        help_text="Usuario asociado al token de verificación de teléfono",
    )
    token = models.CharField(
        max_length=6, help_text="Código de verificación de 6 dígitos"
    )
    phone_number = models.CharField(
        max_length=20,
        validators=[
            RegexValidator(
                regex=r"^\+?1?\d{9,15}$",
                message="El número de teléfono debe tener entre 9 y 15 dígitos",
            )
        ],
        help_text="Número de teléfono a verificar",
    )
    created_at = models.DateTimeField(
        auto_now_add=True, help_text="Fecha y hora de creación del token"
    )
    expires_at = models.DateTimeField(help_text="Fecha y hora de expiración del token")
    verified_at = models.DateTimeField(
        null=True, blank=True, help_text="Fecha y hora cuando se verificó el teléfono"
    )
    is_active = models.BooleanField(
        default=True, help_text="Indica si el token está activo"
    )
    attempts = models.IntegerField(
        default=0, help_text="Número de intentos de verificación"
    )
    max_attempts = models.IntegerField(
        default=3, help_text="Número máximo de intentos permitidos"
    )
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        help_text="Dirección IP desde donde se solicitó la verificación",
    )
    user_agent = models.TextField(
        blank=True, help_text="User agent del navegador que solicitó la verificación"
    )

    class Meta:
        db_table = "phone_verification_tokens"
        verbose_name = "Token de Verificación de Teléfono"
        verbose_name_plural = "Tokens de Verificación de Teléfono"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["token"]),
            models.Index(fields=["user", "is_active"]),
            models.Index(fields=["expires_at"]),
            models.Index(fields=["phone_number"]),
        ]

    def __str__(self):
        return f"Phone verification for {self.phone_number} - {self.created_at.strftime('%Y-%m-%d %H:%M')}"

    def save(self, *args, **kwargs):
        if not self.token:
            # Generate a 6-digit numeric code
            self.token = f"{secrets.randbelow(1000000):06d}"
        if not self.expires_at:
            # Token expires in 10 minutes by default
            self.expires_at = timezone.now() + timedelta(minutes=10)
        super().save(*args, **kwargs)

    @property
    def is_expired(self):
        """Check if the token has expired"""
        return timezone.now() > self.expires_at

    @property
    def is_valid(self):
        """Check if the token is valid (active, not expired, not verified, attempts not exceeded)"""
        return (
            self.is_active
            and not self.is_expired
            and not self.verified_at
            and self.attempts < self.max_attempts
        )

    def verify_token(self, provided_token):
        """Verify the provided token"""
        self.attempts += 1
        self.save(update_fields=["attempts"])

        if not self.is_valid:
            return False

        if self.token == provided_token:
            self.mark_as_verified()
            return True

        # If max attempts reached, deactivate token
        if self.attempts >= self.max_attempts:
            self.deactivate()

        return False

    def mark_as_verified(self):
        """Mark the token as verified"""
        self.verified_at = timezone.now()
        self.is_active = False
        self.save(update_fields=["verified_at", "is_active"])

    def deactivate(self):
        """Deactivate the token"""
        self.is_active = False
        self.save(update_fields=["is_active"])

    @classmethod
    def cleanup_expired_tokens(cls):
        """Remove expired tokens from the database"""
        expired_tokens = cls.objects.filter(expires_at__lt=timezone.now())
        count = expired_tokens.count()
        expired_tokens.delete()
        return count

    @classmethod
    def deactivate_user_tokens(cls, user, phone_number=None):
        """Deactivate all active tokens for a user and optionally specific phone"""
        queryset = cls.objects.filter(user=user, is_active=True)
        if phone_number:
            queryset = queryset.filter(phone_number=phone_number)
        queryset.update(is_active=False)


class UserVerificationStatus(models.Model):
    """
    Model to track user verification status
    """

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="verification_status",
        help_text="Usuario asociado al estado de verificación",
    )

    # Email verification
    email_verified = models.BooleanField(
        default=False, help_text="Indica si el email del usuario está verificado"
    )
    email_verified_at = models.DateTimeField(
        null=True, blank=True, help_text="Fecha y hora cuando se verificó el email"
    )

    # Phone verification
    phone_verified = models.BooleanField(
        default=False, help_text="Indica si el teléfono del usuario está verificado"
    )
    phone_verified_at = models.DateTimeField(
        null=True, blank=True, help_text="Fecha y hora cuando se verificó el teléfono"
    )

    # Account verification (overall status)
    account_verified = models.BooleanField(
        default=False, help_text="Indica si la cuenta está completamente verificada"
    )
    account_verified_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Fecha y hora cuando se verificó completamente la cuenta",
    )

    # Verification requirements
    email_verification_required = models.BooleanField(
        default=True, help_text="Indica si la verificación de email es requerida"
    )
    phone_verification_required = models.BooleanField(
        default=False, help_text="Indica si la verificación de teléfono es requerida"
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "user_verification_status"
        verbose_name = "Estado de Verificación de Usuario"
        verbose_name_plural = "Estados de Verificación de Usuario"

    def __str__(self):
        return f"Verification status for {self.user.email}"

    def mark_email_verified(self):
        """Mark email as verified"""
        self.email_verified = True
        self.email_verified_at = timezone.now()
        self._update_account_verification_status()
        self.save()

    def mark_phone_verified(self):
        """Mark phone as verified"""
        self.phone_verified = True
        self.phone_verified_at = timezone.now()
        self._update_account_verification_status()
        self.save()

    def _update_account_verification_status(self):
        """Update overall account verification status"""
        email_ok = not self.email_verification_required or self.email_verified
        phone_ok = not self.phone_verification_required or self.phone_verified

        if email_ok and phone_ok and not self.account_verified:
            self.account_verified = True
            self.account_verified_at = timezone.now()

    @property
    def is_fully_verified(self):
        """Check if account is fully verified based on requirements"""
        email_ok = not self.email_verification_required or self.email_verified
        phone_ok = not self.phone_verification_required or self.phone_verified
        return email_ok and phone_ok

    @property
    def verification_progress(self):
        """Get verification progress as percentage"""
        total_required = 0
        completed = 0

        if self.email_verification_required:
            total_required += 1
            if self.email_verified:
                completed += 1

        if self.phone_verification_required:
            total_required += 1
            if self.phone_verified:
                completed += 1

        if total_required == 0:
            return 100

        return int((completed / total_required) * 100)

    @classmethod
    def get_or_create_for_user(cls, user):
        """Get or create verification status for user"""
        status, created = cls.objects.get_or_create(
            user=user,
            defaults={
                "email_verification_required": True,
                "phone_verification_required": cls._should_require_phone_verification(
                    user
                ),
            },
        )
        return status, created

    @classmethod
    def _should_require_phone_verification(cls, user):
        """Determine if phone verification should be required for user"""
        # Require phone verification for admins and presidents
        return user.role in ["admin", "president"]


class VerificationRequirement(models.Model):
    """
    Model to define verification requirements for different operations
    """

    OPERATION_CHOICES = [
        ("password_change", "Cambio de Contraseña"),
        ("email_change", "Cambio de Email"),
        ("phone_change", "Cambio de Teléfono"),
        ("role_change", "Cambio de Rol"),
        ("sensitive_data_access", "Acceso a Datos Sensibles"),
        ("admin_operations", "Operaciones Administrativas"),
        ("group_management", "Gestión de Grupos"),
        ("event_management", "Gestión de Eventos"),
        ("user_management", "Gestión de Usuarios"),
        ("financial_operations", "Operaciones Financieras"),
    ]

    VERIFICATION_TYPE_CHOICES = [
        ("email", "Verificación de Email"),
        ("phone", "Verificación de Teléfono"),
        ("both", "Ambas Verificaciones"),
        ("account", "Cuenta Completamente Verificada"),
    ]

    operation = models.CharField(
        max_length=50,
        choices=OPERATION_CHOICES,
        unique=True,
        help_text="Operación que requiere verificación",
    )
    verification_type = models.CharField(
        max_length=20,
        choices=VERIFICATION_TYPE_CHOICES,
        help_text="Tipo de verificación requerida",
    )
    required_for_roles = models.JSONField(
        default=list, help_text="Lista de roles que requieren esta verificación"
    )
    is_active = models.BooleanField(
        default=True, help_text="Indica si el requerimiento está activo"
    )
    description = models.TextField(
        blank=True, help_text="Descripción del requerimiento de verificación"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "verification_requirements"
        verbose_name = "Requerimiento de Verificación"
        verbose_name_plural = "Requerimientos de Verificación"

    def __str__(self):
        return (
            f"{self.get_operation_display()} - {self.get_verification_type_display()}"
        )

    @classmethod
    def check_verification_required(cls, operation, user):
        """Check if verification is required for a specific operation and user"""
        try:
            requirement = cls.objects.get(operation=operation, is_active=True)

            # Check if user's role requires verification
            if (
                requirement.required_for_roles
                and user.role not in requirement.required_for_roles
            ):
                return False, None

            # Get user's verification status
            verification_status, _ = UserVerificationStatus.get_or_create_for_user(user)

            # Check verification type requirements
            if requirement.verification_type == "email":
                if not verification_status.email_verified:
                    return True, "email"
                return False, None
            elif requirement.verification_type == "phone":
                if not verification_status.phone_verified:
                    return True, "phone"
                return False, None
            elif requirement.verification_type == "both":
                if not verification_status.email_verified:
                    return True, "email"
                elif not verification_status.phone_verified:
                    return True, "phone"
                return False, None
            elif requirement.verification_type == "account":
                if not verification_status.is_fully_verified:
                    return True, "account"
                return False, None

        except cls.DoesNotExist:
            # No requirement defined, allow operation
            return False, None

        return False, None

    @classmethod
    def create_default_requirements(cls):
        """Create default verification requirements"""
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
                "operation": "user_management",
                "verification_type": "account",
                "required_for_roles": ["admin"],
                "description": "Cuenta completamente verificada requerida para gestión de usuarios",
            },
        ]

        for default in defaults:
            cls.objects.get_or_create(operation=default["operation"], defaults=default)
