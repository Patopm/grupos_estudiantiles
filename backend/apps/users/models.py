import uuid
from datetime import timedelta

from django.contrib.auth.models import AbstractUser
from django.core.validators import RegexValidator
from django.db import models
from django.utils import timezone

USER_ROLES = [
    ('admin', 'Administrador'),
    ('president', 'Presidente'),
    ('student', 'Estudiante'),
]


class CustomUser(AbstractUser):
    """
    Custom User model extending Django's AbstractUser with role-based permissions
    """

    id = models.UUIDField(primary_key=True,
                          default=uuid.uuid4,
                          editable=False,
                          help_text="ID único del usuario")

    role = models.CharField(max_length=20,
                            choices=USER_ROLES,
                            default='student',
                            help_text="Rol del usuario en el sistema")

    student_id = models.CharField(
        max_length=10,
        unique=True,
        blank=True,
        null=True,
        validators=[
            RegexValidator(
                regex=r'^AL[0-9]{8}$',
                message=
                'La matrícula debe tener el formato AL seguido de 8 dígitos',
                code='invalid_student_id')
        ],
        help_text=
        "Matrícula del estudiante (requerida solo para estudiantes y presidentes)"
    )

    email = models.EmailField(
        unique=True,
        help_text="Correo electrónico del usuario",
        validators=[
            RegexValidator(
                regex=r'^[a-zA-Z0-9.]+@tecmilenio.mx$',
                message=
                'El correo electrónico debe ser válido y pertenecer a Tecmilenio',
                code='invalid_email')
        ])

    phone = models.CharField(max_length=20,
                             blank=True,
                             null=True,
                             help_text="Número de teléfono del usuario")

    is_active_student = models.BooleanField(
        default=True,
        help_text="Indica si el estudiante está activo en el sistema")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'users'
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'
        ordering = ['created_at']

    def __str__(self):
        return f"{self.get_full_name()} ({self.get_role_display()})"

    @property
    def is_admin(self):
        return self.role == 'admin'

    @property
    def is_president(self):
        return self.role == 'president'

    @property
    def is_student(self):
        return self.role == 'student'

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
        'CustomUser',
        on_delete=models.CASCADE,
        related_name='password_reset_tokens',
        help_text="Usuario asociado al token de restablecimiento"
    )
    token = models.CharField(
        max_length=64,
        unique=True,
        help_text="Token único para el restablecimiento de contraseña"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Fecha y hora de creación del token"
    )
    expires_at = models.DateTimeField(
        help_text="Fecha y hora de expiración del token"
    )
    used_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Fecha y hora cuando se usó el token"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Indica si el token está activo"
    )
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        help_text="Dirección IP desde donde se solicitó el restablecimiento"
    )
    user_agent = models.TextField(
        blank=True,
        help_text="User agent del navegador que solicitó el restablecimiento"
    )

    class Meta:
        db_table = 'password_reset_tokens'
        verbose_name = 'Token de Restablecimiento de Contraseña'
        verbose_name_plural = 'Tokens de Restablecimiento de Contraseña'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['token']),
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['expires_at']),
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
        self.save(update_fields=['used_at', 'is_active'])

    def deactivate(self):
        """Deactivate the token"""
        self.is_active = False
        self.save(update_fields=['is_active'])

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
