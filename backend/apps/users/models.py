import base64
import secrets
import uuid
from datetime import timedelta
from io import BytesIO

import pyotp
import qrcode
from django.contrib.auth.models import AbstractUser
from django.core.validators import RegexValidator
from django.db import models
from django.utils import timezone

# Import verification models to register them with Django
from .verification_models import (
    EmailVerificationToken,  # noqa: F401
    PhoneVerificationToken,
    UserVerificationStatus,
    VerificationRequirement,
)

USER_ROLES = [
    ("admin", "Administrador"),
    ("president", "Presidente"),
    ("student", "Estudiante"),
]


class CustomUser(AbstractUser):
    """
    Custom User model extending Django's AbstractUser with role-based permissions
    """

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text="ID único del usuario",
    )

    role = models.CharField(
        max_length=20,
        choices=USER_ROLES,
        default="student",
        help_text="Rol del usuario en el sistema",
    )

    student_id = models.CharField(
        max_length=10,
        unique=True,
        blank=True,
        null=True,
        validators=[
            RegexValidator(
                regex=r"^AL[0-9]{8}$",
                message="La matrícula debe tener el formato AL seguido de 8 dígitos",
                code="invalid_student_id",
            )
        ],
        help_text="Matrícula del estudiante (requerida solo para estudiantes y presidentes)",
    )

    email = models.EmailField(
        unique=True,
        help_text="Correo electrónico del usuario",
        validators=[
            RegexValidator(
                regex=r"^[a-zA-Z0-9.]+@tecmilenio.mx$",
                message="El correo electrónico debe ser válido y pertenecer a Tecmilenio",
                code="invalid_email",
            )
        ],
    )

    phone = models.CharField(
        max_length=20, blank=True, null=True, help_text="Número de teléfono del usuario"
    )

    is_active_student = models.BooleanField(
        default=True, help_text="Indica si el estudiante está activo en el sistema"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "users"
        verbose_name = "Usuario"
        verbose_name_plural = "Usuarios"
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.get_full_name()} ({self.get_role_display()})"

    @property
    def is_admin(self):
        return self.role == "admin"

    @property
    def is_president(self):
        return self.role == "president"

    @property
    def is_student(self):
        return self.role == "student"

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    def get_role_display(self):
        role_dict = dict(USER_ROLES)
        return role_dict.get(self.role, self.role)


class PasswordResetToken(models.Model):
    """
    Model for managing password reset tokens
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        "CustomUser",
        on_delete=models.CASCADE,
        related_name="password_reset_tokens",
        help_text="Usuario asociado al token de restablecimiento",
    )
    token = models.CharField(
        max_length=64,
        unique=True,
        help_text="Token único para el restablecimiento de contraseña",
    )
    created_at = models.DateTimeField(
        auto_now_add=True, help_text="Fecha y hora de creación del token"
    )
    expires_at = models.DateTimeField(help_text="Fecha y hora de expiración del token")
    used_at = models.DateTimeField(
        null=True, blank=True, help_text="Fecha y hora cuando se usó el token"
    )
    is_active = models.BooleanField(
        default=True, help_text="Indica si el token está activo"
    )
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        help_text="Dirección IP desde donde se solicitó el restablecimiento",
    )
    user_agent = models.TextField(
        blank=True,
        help_text="User agent del navegador que solicitó el restablecimiento",
    )

    class Meta:
        db_table = "password_reset_tokens"
        verbose_name = "Token de Restablecimiento de Contraseña"
        verbose_name_plural = "Tokens de Restablecimiento de Contraseña"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["token"]),
            models.Index(fields=["user", "is_active"]),
            models.Index(fields=["expires_at"]),
        ]

    def __str__(self):
        return f"Token para {self.user.email} - {self.created_at.strftime('%Y-%m-%d %H:%M')}"

    def save(self, *args, **kwargs):
        if not self.expires_at:
            # Token expires in 1 hour by default
            self.expires_at = timezone.now() + timedelta(hours=1)
        super().save(*args, **kwargs)

    @property
    def is_expired(self):
        """Check if the token has expired"""
        return timezone.now() > self.expires_at

    @property
    def is_valid(self):
        """Check if the token is valid (active and not expired)"""
        return self.is_active and not self.is_expired and not self.used_at

    def mark_as_used(self):
        """Mark the token as used"""
        self.used_at = timezone.now()
        self.is_active = False
        self.save(update_fields=["used_at", "is_active"])

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
    def deactivate_user_tokens(cls, user):
        """Deactivate all active tokens for a user"""
        cls.objects.filter(user=user, is_active=True).update(is_active=False)


class MFAEnforcementPolicy(models.Model):
    """
    Model for MFA enforcement policies by user role
    """

    role = models.CharField(
        max_length=20,
        choices=USER_ROLES,
        unique=True,
        help_text="Rol de usuario al que aplica la política",
    )
    mfa_required = models.BooleanField(
        default=False, help_text="Si MFA es requerido para este rol"
    )
    grace_period_days = models.IntegerField(
        default=7,
        help_text="Días de gracia para configurar MFA después de que se haga requerido",
    )
    enforcement_date = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Fecha desde la cual se aplica la política (null = inmediato)",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "mfa_enforcement_policies"
        verbose_name = "Política de Aplicación MFA"
        verbose_name_plural = "Políticas de Aplicación MFA"
        ordering = ["role"]

    def __str__(self):
        return f"MFA Policy for {self.get_role_display()}: {'Required' if self.mfa_required else 'Optional'}"

    @classmethod
    def is_mfa_required_for_role(cls, role):
        """Check if MFA is required for a specific role"""
        try:
            policy = cls.objects.get(role=role)
            if not policy.mfa_required:
                return False

            # Check if enforcement date has passed
            if policy.enforcement_date and timezone.now() < policy.enforcement_date:
                return False

            return True
        except cls.DoesNotExist:
            # Default policies if not configured
            default_requirements = {
                "admin": True,  # Admins always require MFA
                "president": True,  # Presidents require MFA
                "student": False,  # Students don't require MFA by default
            }
            return default_requirements.get(role, False)

    @classmethod
    def get_grace_period_for_role(cls, role):
        """Get grace period days for a specific role"""
        try:
            policy = cls.objects.get(role=role)
            return policy.grace_period_days
        except cls.DoesNotExist:
            return 7  # Default 7 days grace period

    @classmethod
    def is_user_in_grace_period(cls, user):
        """Check if user is still in grace period for MFA setup"""
        if not cls.is_mfa_required_for_role(user.role):
            return False

        try:
            policy = cls.objects.get(role=user.role)
            if not policy.enforcement_date:
                # If no enforcement date, grace period starts from user creation
                grace_end = user.created_at + timedelta(days=policy.grace_period_days)
            else:
                # Grace period starts from enforcement date
                grace_end = policy.enforcement_date + timedelta(
                    days=policy.grace_period_days
                )

            return timezone.now() < grace_end
        except cls.DoesNotExist:
            # Default grace period from user creation
            grace_end = user.created_at + timedelta(days=7)
            return timezone.now() < grace_end

    def is_enforcement_active(self):
        """Check if the enforcement is currently active"""
        if not self.mfa_required:
            return False
        if not self.enforcement_date:
            return True
        return timezone.now() >= self.enforcement_date


class TOTPDevice(models.Model):
    """
    Model to store TOTP devices for 2FA/MFA
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        "CustomUser", on_delete=models.CASCADE, related_name="totp_device"
    )
    name = models.CharField(max_length=100, default="Tecmilenio 2FA")
    secret_key = models.CharField(max_length=32, unique=True)
    is_active = models.BooleanField(default=False)
    confirmed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    last_used_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Dispositivo TOTP"
        verbose_name_plural = "Dispositivos TOTP"

    def __str__(self):
        return f"TOTP Device for {self.user.email}"

    def save(self, *args, **kwargs):
        if not self.secret_key:
            self.secret_key = pyotp.random_base32()
        super().save(*args, **kwargs)

    def get_totp(self):
        """Get TOTP instance for this device"""
        return pyotp.TOTP(self.secret_key)

    def verify_token(self, token):
        """Verify a TOTP token"""
        totp = self.get_totp()
        is_valid = totp.verify(token, valid_window=1)  # Allow 1 time step tolerance

        if is_valid:
            self.last_used_at = timezone.now()
            self.save(update_fields=["last_used_at"])

        return is_valid

    def get_provisioning_uri(self):
        """Get provisioning URI for QR code"""
        totp = self.get_totp()
        return totp.provisioning_uri(
            name=self.user.email, issuer_name="Grupos Estudiantiles - Tecmilenio"
        )

    def get_qr_code(self):
        """Generate QR code as base64 string"""
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(self.get_provisioning_uri())
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white")
        buffer = BytesIO()
        img.save(buffer, format="PNG")
        buffer.seek(0)

        return base64.b64encode(buffer.getvalue()).decode()


class BackupCode(models.Model):
    """
    Model to store backup codes for MFA recovery
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        "CustomUser", on_delete=models.CASCADE, related_name="backup_codes"
    )
    code = models.CharField(max_length=16, unique=True)
    is_used = models.BooleanField(default=False)
    used_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Código de Respaldo"
        verbose_name_plural = "Códigos de Respaldo"
        indexes = [
            models.Index(fields=["user", "is_used"]),
            models.Index(fields=["code"]),
        ]

    def __str__(self):
        return f'Backup Code for {self.user.email} - {"Used" if self.is_used else "Active"}'

    def save(self, *args, **kwargs):
        if not self.code:
            # Generate a secure 8-character backup code
            self.code = secrets.token_hex(4).upper()
        super().save(*args, **kwargs)

    def use_code(self):
        """Mark the backup code as used"""
        self.is_used = True
        self.used_at = timezone.now()
        self.save(update_fields=["is_used", "used_at"])

    @classmethod
    def generate_codes_for_user(cls, user, count=10):
        """Generate backup codes for a user"""
        # Deactivate existing codes
        cls.objects.filter(user=user).delete()

        codes = []
        for _ in range(count):
            code = cls.objects.create(user=user)
            codes.append(code.code)

        return codes

    @classmethod
    def verify_code(cls, user, code):
        """Verify and use a backup code"""
        try:
            backup_code = cls.objects.get(user=user, code=code.upper(), is_used=False)
            backup_code.use_code()
            return True
        except cls.DoesNotExist:
            return False
