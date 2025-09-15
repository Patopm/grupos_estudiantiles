from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import RegexValidator


class User(AbstractUser):
    """
    Custom User model with role-based permissions
    """
    
    class Role(models.TextChoices):
        ADMIN = 'admin', 'Administrador'
        PRESIDENT = 'president', 'Presidente'
        STUDENT = 'student', 'Estudiante'
    
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.STUDENT,
        help_text="Rol del usuario en el sistema"
    )
    
    email = models.EmailField(
        unique=True,
        help_text="Correo electrónico único del usuario",
        validators=[
            RegexValidator(
                regex=r'^AL[0-9]{8}+@tecmilenio.mx$',
                message='El correo electrónico debe ser válido y pertenecer a Tecmilenio',
                code='invalid_email'
            )
        ]
    )
    
    phone = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        help_text="Número de teléfono del usuario"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Use email as the primary identifier for authentication
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']
    
    class Meta:
        db_table = 'users'
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'
        ordering = ['created_at']
    
    def __str__(self):
        return f"{self.get_full_name()} ({self.get_role_display()})"
    
    @property
    def is_admin(self):
        return self.role == self.Role.ADMIN
    
    @property
    def is_president(self):
        return self.role == self.Role.PRESIDENT
    
    @property
    def is_student(self):
        return self.role == self.Role.STUDENT
    
    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip()