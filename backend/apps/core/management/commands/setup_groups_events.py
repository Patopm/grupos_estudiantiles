"""
Management command to setup groups, events, and users for the system
Creates 6 groups (one per category), 2 events per group, presidents, and users for each role
"""

from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.events.models import Event
from apps.students.models import GroupMembership, StudentGroup

User = get_user_model()


class Command(BaseCommand):
    help = 'Setup groups, events, and users for the system'

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Reset existing data before creating new setup',
        )
        parser.add_argument(
            '--verbose',
            action='store_true',
            help='Show detailed output',
        )

    def handle(self, *args, **options):
        reset = options['reset']
        verbose = options['verbose']

        if reset:
            self.stdout.write(self.style.WARNING('Resetting existing data...'))
            self.reset_data()

        self.stdout.write('Setting up groups, events, and users...')

        # Create users for each role
        users = self.create_users(verbose)

        # Create groups for each category
        groups = self.create_groups(users['presidents'], verbose)

        # Create events for each group
        self.create_events(groups, verbose)

        self.stdout.write(self.style.SUCCESS('Setup completed successfully!'))

    def reset_data(self):
        """Reset existing data"""
        Event.objects.all().delete()
        GroupMembership.objects.all().delete()
        StudentGroup.objects.all().delete()
        User.objects.filter(role__in=['president', 'student']).delete()

    def create_users(self, verbose):
        """Create users for each role"""
        users = {'admin': None, 'presidents': [], 'students': []}

        # Create admin user
        admin_user, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@tecmilenio.mx',
                'first_name': 'Admin',
                'last_name': 'System',
                'role': 'admin',
                'is_staff': True,
                'is_superuser': True,
            })
        if created:
            admin_user.set_password('Admin123#')
            admin_user.save()
            if verbose:
                self.stdout.write(f'Created admin user: {admin_user.username}')

        users['admin'] = admin_user

        # Create president users (one for each group category)
        president_data = [
            {
                'username': 'pres_deportivo',
                'email': 'pres.deportivo@tecmilenio.mx',
                'first_name': 'Carlos',
                'last_name': 'Deportivo',
                'student_id': 'AL00000001',
            },
            {
                'username': 'pres_cultural',
                'email': 'pres.cultural@tecmilenio.mx',
                'first_name': 'María',
                'last_name': 'Cultural',
                'student_id': 'AL00000002',
            },
            {
                'username': 'pres_academico',
                'email': 'pres.academico@tecmilenio.mx',
                'first_name': 'José',
                'last_name': 'Académico',
                'student_id': 'AL00000003',
            },
            {
                'username': 'pres_social',
                'email': 'pres.social@tecmilenio.mx',
                'first_name': 'Ana',
                'last_name': 'Social',
                'student_id': 'AL00000004',
            },
            {
                'username': 'pres_tecnologico',
                'email': 'pres.tecnologico@tecmilenio.mx',
                'first_name': 'Luis',
                'last_name': 'Tecnológico',
                'student_id': 'AL00000005',
            },
            {
                'username': 'pres_otro',
                'email': 'pres.otro@tecmilenio.mx',
                'first_name': 'Sofia',
                'last_name': 'Otro',
                'student_id': 'AL00000006',
            },
        ]

        for data in president_data:
            user, created = User.objects.get_or_create(
                username=data['username'],
                defaults={
                    'email': data['email'],
                    'first_name': data['first_name'],
                    'last_name': data['last_name'],
                    'role': 'president',
                    'student_id': data['student_id'],
                })
            if created:
                user.set_password('President123#')
                user.save()
                if verbose:
                    self.stdout.write(
                        f'Created president user: {user.username}')
            users['presidents'].append(user)

        # Create student users
        student_data = [
            {
                'username': 'student1',
                'email': 'student1@tecmilenio.mx',
                'first_name': 'Juan',
                'last_name': 'Pérez',
                'student_id': 'AL00000007',
            },
            {
                'username': 'student2',
                'email': 'student2@tecmilenio.mx',
                'first_name': 'Laura',
                'last_name': 'García',
                'student_id': 'AL00000008',
            },
            {
                'username': 'student3',
                'email': 'student3@tecmilenio.mx',
                'first_name': 'Miguel',
                'last_name': 'Rodríguez',
                'student_id': 'AL00000009',
            },
        ]

        for data in student_data:
            user, created = User.objects.get_or_create(
                username=data['username'],
                defaults={
                    'email': data['email'],
                    'first_name': data['first_name'],
                    'last_name': data['last_name'],
                    'role': 'student',
                    'student_id': data['student_id'],
                })
            if created:
                user.set_password('Student123#')
                user.save()
                if verbose:
                    self.stdout.write(f'Created student user: {user.username}')
            users['students'].append(user)

        return users

    def create_groups(self, presidents, verbose):
        """Create groups for each category"""
        categories = [
            'deportivo',
            'cultural',
            'academico',
            'social',
            'tecnologico',
            'otro',
        ]

        group_data = [
            {
                'name': 'Equipo Representativo de Futbol',
                'description':
                'Equipo representativo de futbol que representa a la universidad en competencias nacionales.',
                'category': 'deportivo',
            },
            {
                'name': 'Grupo Estudiantil de Canto',
                'description':
                'Grupo estudiantil dedicado a promover el canto y la cultura.',
                'category': 'cultural',
            },
            {
                'name': 'Grupo Estudiantil de Comercio Internacional',
                'description':
                'Grupo estudiantil enfocado en actividades académicas y de investigación en el área de comercio internacional.',
                'category': 'academico',
            },
            {
                'name': 'Grupo Social Tecmilenio',
                'description':
                'Grupo estudiantil dedicado a actividades sociales y de integración.',
                'category': 'social',
            },
            {
                'name': 'Grupo Estudiantil de Software',
                'description':
                'Grupo estudiantil enfocado en tecnología e innovación en el área de software.',
                'category': 'tecnologico',
            },
            {
                'name': 'Grupo General Tecmilenio',
                'description':
                'Grupo estudiantil para actividades generales y diversas.',
                'category': 'otro',
            },
        ]

        groups = []
        for i, data in enumerate(group_data):
            group, created = StudentGroup.objects.get_or_create(
                name=data['name'],
                defaults={
                    'description': data['description'],
                    'category': data['category'],
                    'president': presidents[i],
                    'max_members': 50,
                    'is_active': True,
                })
            if created:
                if verbose:
                    self.stdout.write(f'Created group: {group.name}')

                # Create group membership for the president
                GroupMembership.objects.get_or_create(user=presidents[i],
                                                      group=group,
                                                      defaults={
                                                          'role': 'president',
                                                          'status': 'active',
                                                      })
                if verbose:
                    self.stdout.write(
                        f'Added president {presidents[i].username} to group {group.name}'
                    )

            groups.append(group)

        return groups

    def create_events(self, groups, verbose):
        """Create 2 events for each group"""
        base_date = timezone.now() + timedelta(days=7)

        event_types = [
            'academic',
            'social',
            'sports',
            'cultural',
            'meeting',
            'workshop',
        ]

        for i, group in enumerate(groups):
            # Create first event for the group
            event1, created = Event.objects.get_or_create(
                title=f'Evento 1 - {group.name}',
                defaults={
                    'description':
                    f'Primer evento del {group.name}. Una actividad especial para todos los miembros.',
                    'event_type': event_types[i % len(event_types)],
                    'status': 'published',
                    'start_datetime': base_date + timedelta(days=i * 2),
                    'end_datetime': base_date + timedelta(days=i * 2, hours=2),
                    'location': f'Aula {i+1} - Campus Tecmilenio',
                    'max_attendees': 30,
                    'requires_registration': True,
                    'registration_deadline':
                    base_date + timedelta(days=i * 2 - 1),
                })
            if created:
                event1.target_groups.add(group)
                if verbose:
                    self.stdout.write(f'Created event: {event1.title}')

            # Create second event for the group
            event2, created = Event.objects.get_or_create(
                title=f'Evento 2 - {group.name}',
                defaults={
                    'description':
                    f'Segundo evento del {group.name}. Una actividad complementaria para fortalecer el grupo.',
                    'event_type': event_types[(i + 1) % len(event_types)],
                    'status': 'published',
                    'start_datetime': base_date + timedelta(days=i * 2 + 1),
                    'end_datetime':
                    base_date + timedelta(days=i * 2 + 1, hours=3),
                    'location': f'Auditorio {i+1} - Campus Tecmilenio',
                    'max_attendees': 50,
                    'requires_registration': True,
                    'registration_deadline': base_date + timedelta(days=i * 2),
                })
            if created:
                event2.target_groups.add(group)
                if verbose:
                    self.stdout.write(f'Created event: {event2.title}')

        if verbose:
            self.stdout.write(f'Created {len(groups) * 2} events total')
