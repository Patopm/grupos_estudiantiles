import uuid

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models


class StudentGroup(models.Model):
    """
    Modelo Grupo Estudiantil según especificaciones
    """

    CATEGORY_CHOICES = [
        ("deportivo", "Deportivo"),
        ("cultural", "Cultural"),
        ("academico", "Académico"),
        ("social", "Social"),
        ("tecnologico", "Tecnológico"),
        ("otro", "Otro"),
    ]

    group_id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text="ID único del grupo estudiantil",
    )

    name = models.CharField(
        max_length=200, unique=True, help_text="Nombre del grupo estudiantil"
    )

    description = models.TextField(help_text="Descripción detallada del grupo")

    image = models.ImageField(
        upload_to="groups/images/",
        null=True,
        blank=True,
        help_text="Imagen representativa del grupo",
    )

    president = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="led_groups",
        limit_choices_to={"role": "president"},
        help_text="Presidente del grupo",
    )

    created_at = models.DateTimeField(
        auto_now_add=True, help_text="Fecha de creación del grupo"
    )

    is_active = models.BooleanField(
        default=True, help_text="Indica si el grupo está activo"
    )

    max_members = models.IntegerField(
        validators=[MinValueValidator(1)],
        default=50,
        help_text="Número máximo de miembros permitidos",
    )

    category = models.CharField(
        max_length=20,
        choices=CATEGORY_CHOICES,
        default="otro",
        help_text="Categoría del grupo estudiantil",
    )

    class Meta:
        db_table = "student_groups"
        verbose_name = "Grupo Estudiantil"
        verbose_name_plural = "Grupos Estudiantiles"
        ordering = ["name"]

    def __str__(self):
        return self.name

    @property
    def member_count(self):
        """Número actual de miembros activos"""
        return self.memberships.filter(status="active").count()

    @property
    def pending_requests_count(self):
        """Número de solicitudes pendientes"""
        return self.memberships.filter(status="pending").count()

    @property
    def is_full(self):
        """Verifica si el grupo está lleno"""
        return self.member_count >= self.max_members

    @property
    def president_name(self):
        """Nombre del presidente o mensaje por defecto"""
        return (
            self.president.get_full_name()
            if self.president
            else "Sin presidente asignado"
        )


class GroupMembership(models.Model):
    """
    Modelo Membresía según especificaciones
    """

    STATUS_CHOICES = [
        ("pending", "Pendiente"),
        ("active", "Activo"),
        ("inactive", "Inactivo"),
    ]

    ROLE_CHOICES = [
        ("member", "Miembro"),
        ("president", "Presidente"),
    ]

    membership_id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text="ID único de la membresía",
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="group_memberships",
        help_text="Usuario miembro del grupo",
    )

    group = models.ForeignKey(
        StudentGroup,
        on_delete=models.CASCADE,
        related_name="memberships",
        help_text="Grupo al que pertenece",
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pending",
        help_text="Estado de la membresía",
    )

    joined_at = models.DateTimeField(
        auto_now_add=True, help_text="Fecha de solicitud/ingreso al grupo"
    )

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default="member",
        help_text="Rol dentro del grupo",
    )

    class Meta:
        db_table = "group_memberships"
        verbose_name = "Membresía de Grupo"
        verbose_name_plural = "Membresías de Grupos"
        unique_together = ["user", "group"]
        ordering = ["-joined_at"]

    def __str__(self):
        return f"{self.user.get_full_name()} - {self.group.name} ({self.get_status_display()})"

    def save(self, *args, **kwargs):
        # Si el usuario es presidente del grupo, asegurar que tenga rol de presidente
        if self.group.president == self.user:
            self.role = "president"
        super().save(*args, **kwargs)
