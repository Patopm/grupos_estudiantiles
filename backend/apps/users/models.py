import uuid

from django.contrib.auth.models import AbstractUser
from django.core.validators import RegexValidator
from django.db import models

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
