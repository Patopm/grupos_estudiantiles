from django.db import models
from django.conf import settings
from django.core.validators import RegexValidator


class StudentGroup(models.Model):
    """
    Modelo para representar grupos de estudiantes (ej: Grupo A, Grupo B, etc.)
    """
    
    name = models.CharField(
        max_length=100,
        unique=True,
        help_text="Nombre del grupo (ej: Grupo A, 1er Semestre, etc.)"
    )
    
    description = models.TextField(
        blank=True,
        null=True,
        help_text="Descripción del grupo"
    )
    
    president = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='led_group',
        limit_choices_to={'role': 'president'},
        help_text="Presidente del grupo"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(
        default=True,
        help_text="Indica si el grupo está activo"
    )
    
    class Meta:
        db_table = 'student_groups'
        verbose_name = 'Grupo de Estudiantes'
        verbose_name_plural = 'Grupos de Estudiantes'
        ordering = ['name']
    
    def __str__(self):
        return self.name
    
    @property
    def student_count(self):
        return self.students.filter(is_active=True).count()
    
    @property
    def president_name(self):
        return self.president.get_full_name() if self.president else "Sin presidente"


class Student(models.Model):
    """
    Modelo para representar estudiantes con información académica
    """
    
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='student_profile',
        limit_choices_to={'role': 'student'},
        help_text="Usuario asociado al estudiante"
    )
    
    student_id = models.CharField(
        max_length=20,
        unique=True,
        validators=[
            RegexValidator(
                regex=r'^[A-Z0-9]+$',
                message='El ID de estudiante debe contener solo letras mayúsculas y números'
            )
        ],
        help_text="Número de identificación del estudiante"
    )
    
    group = models.ForeignKey(
        StudentGroup,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='students',
        help_text="Grupo al que pertenece el estudiante"
    )
    
    career = models.CharField(
        max_length=200,
        help_text="Carrera que estudia"
    )
    
    semester = models.PositiveIntegerField(
        help_text="Semestre actual del estudiante"
    )
    
    enrollment_date = models.DateField(
        help_text="Fecha de inscripción"
    )
    
    graduation_date = models.DateField(
        null=True,
        blank=True,
        help_text="Fecha de graduación (si aplica)"
    )
    
    average_grade = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Promedio general del estudiante"
    )
    
    is_active = models.BooleanField(
        default=True,
        help_text="Indica si el estudiante está activo"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'students'
        verbose_name = 'Estudiante'
        verbose_name_plural = 'Estudiantes'
        ordering = ['student_id']
    
    def __str__(self):
        return f"{self.student_id} - {self.user.get_full_name()}"
    
    @property
    def full_name(self):
        return self.user.get_full_name()
    
    @property
    def email(self):
        return self.user.email
    
    @property
    def is_graduated(self):
        return self.graduation_date is not None
    
    def save(self, *args, **kwargs):
        # Ensure the associated user has the correct role
        if self.user.role != 'student':
            self.user.role = 'student'
            self.user.save()
        super().save(*args, **kwargs)