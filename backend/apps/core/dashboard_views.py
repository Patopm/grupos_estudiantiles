from datetime import timedelta

from apps.core.permissions import DashboardPermission
from apps.events.models import Event, EventAttendance
from apps.students.models import GroupMembership, StudentGroup
from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

User = get_user_model()


@extend_schema(
    summary="Dashboard de estudiante",
    description="""
    Obtiene los datos del dashboard para usuarios con rol de estudiante.
    
    Incluye:
    - Mis grupos estudiantiles
    - Grupos disponibles para unirse
    - Eventos próximos
    - Solicitudes pendientes
    - Historial de participación
    """,
    tags=["Dashboard"],
    responses={
        200: {
            "type": "object",
            "properties": {
                "user_info": {
                    "type": "object",
                    "properties": {
                        "full_name": {
                            "type": "string"
                        },
                        "student_id": {
                            "type": "string"
                        },
                        "role": {
                            "type": "string"
                        }
                    }
                },
                "my_groups": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "group_id": {
                                "type": "string"
                            },
                            "name": {
                                "type": "string"
                            },
                            "description": {
                                "type": "string"
                            },
                            "image": {
                                "type": "string"
                            },
                            "president_name": {
                                "type": "string"
                            },
                            "president_id": {
                                "type": "integer"
                            },
                            "category": {
                                "type": "string"
                            },
                            "member_count": {
                                "type": "integer"
                            },
                            "max_members": {
                                "type": "integer"
                            },
                            "is_active": {
                                "type": "boolean"
                            },
                            "created_at": {
                                "type": "string"
                            },
                            "is_member": {
                                "type": "boolean"
                            },
                            "membership_status": {
                                "type": "string"
                            }
                        }
                    }
                },
                "available_groups": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "group_id": {
                                "type": "string"
                            },
                            "name": {
                                "type": "string"
                            },
                            "description": {
                                "type": "string"
                            },
                            "image": {
                                "type": "string"
                            },
                            "president_name": {
                                "type": "string"
                            },
                            "president_id": {
                                "type": "integer"
                            },
                            "category": {
                                "type": "string"
                            },
                            "member_count": {
                                "type": "integer"
                            },
                            "max_members": {
                                "type": "integer"
                            },
                            "is_active": {
                                "type": "boolean"
                            },
                            "created_at": {
                                "type": "string"
                            },
                            "is_member": {
                                "type": "boolean"
                            },
                            "membership_status": {
                                "type": "string"
                            }
                        }
                    }
                },
                "upcoming_events": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "event_id": {
                                "type": "string"
                            },
                            "title": {
                                "type": "string"
                            },
                            "start_datetime": {
                                "type": "string"
                            },
                            "location": {
                                "type": "string"
                            },
                            "my_attendance_status": {
                                "type": "string"
                            }
                        }
                    }
                },
                "pending_requests": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "group_name": {
                                "type": "string"
                            },
                            "requested_at": {
                                "type": "string"
                            }
                        }
                    }
                },
                "stats": {
                    "type": "object",
                    "properties": {
                        "total_groups": {
                            "type": "integer"
                        },
                        "total_events_attended": {
                            "type": "integer"
                        },
                        "pending_requests_count": {
                            "type": "integer"
                        }
                    }
                }
            }
        },
        403: {
            "type": "object",
            "properties": {
                "error": {
                    "type": "string",
                    "example":
                    "Solo estudiantes pueden acceder a este dashboard"
                }
            }
        }
    })
@api_view(['GET'])
@permission_classes([DashboardPermission])
def student_dashboard(request):
    """
    Dashboard para estudiantes
    GET /api/dashboard/student/
    """
    if not request.user.is_student:
        return Response(
            {'error': 'Solo estudiantes pueden acceder a este dashboard'},
            status=status.HTTP_403_FORBIDDEN)

    user = request.user

    # Información del usuario
    user_info = {
        'full_name': user.get_full_name(),
        'student_id': user.student_id,
        'role': user.get_role_display()
    }

    # Mis grupos (membresías activas)
    my_memberships = GroupMembership.objects.filter(
        user=user, status='active').select_related('group')

    my_groups = [{
        'group_id':
        str(membership.group.group_id),
        'name':
        membership.group.name,
        'description':
        membership.group.description,
        'image':
        membership.group.image.url if membership.group.image else None,
        'president_name':
        membership.group.president_name,
        'president_id':
        membership.group.president.id,
        'category':
        membership.group.category,
        'member_count':
        membership.group.member_count,
        'max_members':
        membership.group.max_members,
        'is_active':
        membership.group.is_active,
        'created_at':
        membership.group.created_at.isoformat(),
        'is_member':
        True,
        'membership_status':
        membership.status
    } for membership in my_memberships]

    # Eventos próximos (de mis grupos o públicos)
    my_group_ids = [membership.group.group_id for membership in my_memberships]
    upcoming_events_query = Event.objects.filter(
        Q(target_groups__group_id__in=my_group_ids)
        | Q(target_groups__isnull=True),
        status='published',
        start_datetime__gte=timezone.now()).distinct().order_by(
            'start_datetime')[:10]

    upcoming_events = []
    for event in upcoming_events_query:
        try:
            attendance = EventAttendance.objects.get(user=user, event=event)
            attendance_status = attendance.status
        except EventAttendance.DoesNotExist:
            attendance_status = None

        upcoming_events.append({
            'event_id': str(event.event_id),
            'title': event.title,
            'start_datetime': event.start_datetime,
            'location': event.location,
            'my_attendance_status': attendance_status
        })

    # Solicitudes pendientes
    pending_requests = GroupMembership.objects.filter(
        user=user, status='pending').select_related('group')

    pending_requests_data = [{
        'group_name': req.group.name,
        'requested_at': req.joined_at
    } for req in pending_requests]

    # Grupos disponibles (no soy miembro ni tengo solicitud pendiente)
    user_group_ids = list(
        GroupMembership.objects.filter(user=user,
                                       status__in=['active', 'pending'
                                                   ]).values_list('group_id',
                                                                  flat=True))

    available_groups_query = StudentGroup.objects.filter(
        is_active=True).exclude(
            group_id__in=user_group_ids).order_by('-created_at')[:20]

    available_groups = [{
        'group_id': str(group.group_id),
        'name': group.name,
        'description': group.description,
        'image': group.image.url if group.image else None,
        'president_name': group.president_name,
        'president_id': group.president.id,
        'category': group.category,
        'member_count': group.member_count,
        'max_members': group.max_members,
        'is_active': group.is_active,
        'created_at': group.created_at.isoformat(),
        'is_member': False,
        'membership_status': None
    } for group in available_groups_query]

    # Estadísticas
    total_events_attended = EventAttendance.objects.filter(
        user=user, status='attended').count()

    stats = {
        'total_groups': len(my_groups),
        'total_events_attended': total_events_attended,
        'pending_requests_count': len(pending_requests_data)
    }

    return Response({
        'user_info': user_info,
        'my_groups': my_groups,
        'available_groups': available_groups,
        'upcoming_events': upcoming_events,
        'pending_requests': pending_requests_data,
        'participation_stats': stats
    })


@extend_schema(
    summary="Dashboard de presidente",
    description="""
    Obtiene los datos del dashboard para usuarios con rol de presidente.
    
    Incluye:
    - Resumen del grupo
    - Solicitudes de ingreso pendientes
    - Gestión de eventos
    - Lista de miembros
    - Estadísticas del grupo
    """,
    tags=["Dashboard"],
    responses={
        200: {
            "type": "object",
            "properties": {
                "user_info": {
                    "type": "object",
                    "properties": {
                        "full_name": {
                            "type": "string"
                        },
                        "role": {
                            "type": "string"
                        }
                    }
                },
                "my_groups": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "group_id": {
                                "type": "string"
                            },
                            "name": {
                                "type": "string"
                            },
                            "category": {
                                "type": "string"
                            },
                            "member_count": {
                                "type": "integer"
                            },
                            "max_members": {
                                "type": "integer"
                            },
                            "pending_requests_count": {
                                "type": "integer"
                            }
                        }
                    }
                },
                "recent_events": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "event_id": {
                                "type": "string"
                            },
                            "title": {
                                "type": "string"
                            },
                            "start_datetime": {
                                "type": "string"
                            },
                            "attendee_count": {
                                "type": "integer"
                            },
                            "status": {
                                "type": "string"
                            }
                        }
                    }
                },
                "pending_requests": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "user_name": {
                                "type": "string"
                            },
                            "student_id": {
                                "type": "string"
                            },
                            "requested_at": {
                                "type": "string"
                            },
                            "group_name": {
                                "type": "string"
                            }
                        }
                    }
                },
                "stats": {
                    "type": "object",
                    "properties": {
                        "total_members": {
                            "type": "integer"
                        },
                        "total_events_created": {
                            "type": "integer"
                        },
                        "pending_requests_count": {
                            "type": "integer"
                        }
                    }
                }
            }
        },
        403: {
            "type": "object",
            "properties": {
                "error": {
                    "type": "string",
                    "example":
                    "Solo presidentes pueden acceder a este dashboard"
                }
            }
        }
    })
@api_view(['GET'])
@permission_classes([DashboardPermission])
def president_dashboard(request):
    """
    Dashboard para presidentes
    GET /api/dashboard/president/
    """
    if not request.user.is_president:
        return Response(
            {'error': 'Solo presidentes pueden acceder a este dashboard'},
            status=status.HTTP_403_FORBIDDEN)

    user = request.user

    # Información del usuario
    user_info = {
        'full_name': user.get_full_name(),
        'role': user.get_role_display()
    }

    # Mis grupos (grupos donde soy presidente)
    my_groups_query = StudentGroup.objects.filter(president=user,
                                                  is_active=True)

    my_groups = []
    total_members = 0
    total_pending_requests = 0

    for group in my_groups_query:
        pending_count = GroupMembership.objects.filter(
            group=group, status='pending').count()

        total_pending_requests += pending_count
        total_members += group.member_count

        my_groups.append({
            'group_id': str(group.group_id),
            'name': group.name,
            'category': group.category,
            'member_count': group.member_count,
            'max_members': group.max_members,
            'pending_requests_count': pending_count
        })

    # Eventos recientes de mis grupos
    my_group_ids = [group.group_id for group in my_groups_query]
    recent_events = Event.objects.filter(
        target_groups__group_id__in=my_group_ids).distinct().order_by(
            '-created_at')[:10]

    recent_events_data = [{
        'event_id': str(event.event_id),
        'title': event.title,
        'start_datetime': event.start_datetime,
        'attendee_count': event.attendee_count,
        'status': event.status
    } for event in recent_events]

    # Solicitudes pendientes de todos mis grupos
    pending_requests = GroupMembership.objects.filter(
        group__president=user,
        status='pending').select_related('user',
                                         'group').order_by('-joined_at')[:20]

    pending_requests_data = [{
        'user_name': req.user.get_full_name(),
        'student_id': req.user.student_id,
        'requested_at': req.joined_at,
        'group_name': req.group.name
    } for req in pending_requests]

    # Estadísticas
    total_events_created = Event.objects.filter(
        target_groups__president=user).distinct().count()

    stats = {
        'total_members': total_members,
        'total_events_created': total_events_created,
        'pending_requests_count': total_pending_requests
    }

    return Response({
        'user_info': user_info,
        'my_groups': my_groups,
        'recent_events': recent_events_data,
        'pending_requests': pending_requests_data,
        'participation_stats': stats
    })


@extend_schema(
    summary="Dashboard de administrador",
    description="""
    Obtiene los datos del dashboard para usuarios con rol de administrador.
    
    Incluye:
    - Resumen general del sistema
    - Gestión de grupos estudiantiles
    - Gestión de usuarios
    - Reportes y analytics
    """,
    tags=["Dashboard"],
    responses={
        200: {
            "type": "object",
            "properties": {
                "user_info": {
                    "type": "object",
                    "properties": {
                        "full_name": {
                            "type": "string"
                        },
                        "role": {
                            "type": "string"
                        }
                    }
                },
                "system_stats": {
                    "type": "object",
                    "properties": {
                        "total_users": {
                            "type": "integer"
                        },
                        "total_students": {
                            "type": "integer"
                        },
                        "total_presidents": {
                            "type": "integer"
                        },
                        "total_groups": {
                            "type": "integer"
                        },
                        "active_groups": {
                            "type": "integer"
                        },
                        "total_events": {
                            "type": "integer"
                        },
                        "upcoming_events": {
                            "type": "integer"
                        }
                    }
                },
                "recent_groups": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "group_id": {
                                "type": "string"
                            },
                            "name": {
                                "type": "string"
                            },
                            "category": {
                                "type": "string"
                            },
                            "member_count": {
                                "type": "integer"
                            },
                            "president_name": {
                                "type": "string"
                            },
                            "created_at": {
                                "type": "string"
                            }
                        }
                    }
                },
                "recent_users": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "id": {
                                "type": "integer"
                            },
                            "full_name": {
                                "type": "string"
                            },
                            "email": {
                                "type": "string"
                            },
                            "role": {
                                "type": "string"
                            },
                            "created_at": {
                                "type": "string"
                            }
                        }
                    }
                },
                "activity_summary": {
                    "type": "object",
                    "properties": {
                        "new_users_this_week": {
                            "type": "integer"
                        },
                        "new_groups_this_week": {
                            "type": "integer"
                        },
                        "events_this_week": {
                            "type": "integer"
                        },
                        "total_memberships": {
                            "type": "integer"
                        }
                    }
                }
            }
        },
        403: {
            "type": "object",
            "properties": {
                "error": {
                    "type":
                    "string",
                    "example":
                    "Solo administradores pueden acceder a este dashboard"
                }
            }
        }
    })
@api_view(['GET'])
@permission_classes([DashboardPermission])
def admin_dashboard(request):
    """
    Dashboard para administradores
    GET /api/dashboard/admin/
    """
    if not request.user.is_admin:
        return Response(
            {'error': 'Solo administradores pueden acceder a este dashboard'},
            status=status.HTTP_403_FORBIDDEN)

    user = request.user

    # Información del usuario
    user_info = {
        'full_name': user.get_full_name(),
        'role': user.get_role_display()
    }

    # Estadísticas del sistema
    total_users = User.objects.count()
    total_students = User.objects.filter(role='student').count()
    total_presidents = User.objects.filter(role='president').count()
    total_groups = StudentGroup.objects.count()
    active_groups = StudentGroup.objects.filter(is_active=True).count()
    total_events = Event.objects.count()
    upcoming_events = Event.objects.filter(start_datetime__gte=timezone.now(),
                                           status='published').count()

    system_stats = {
        'total_users': total_users,
        'total_students': total_students,
        'total_presidents': total_presidents,
        'total_groups': total_groups,
        'active_groups': active_groups,
        'total_events': total_events,
        'upcoming_events': upcoming_events
    }

    # Grupos recientes
    recent_groups = StudentGroup.objects.select_related('president').order_by(
        '-created_at')[:10]
    recent_groups_data = [{
        'group_id': str(group.group_id),
        'name': group.name,
        'category': group.category,
        'member_count': group.member_count,
        'president_name': group.president_name,
        'created_at': group.created_at
    } for group in recent_groups]

    # Usuarios recientes
    recent_users = User.objects.order_by('-date_joined')[:10]
    recent_users_data = [{
        'id': user_obj.id,
        'full_name': user_obj.get_full_name(),
        'email': user_obj.email,
        'role': user_obj.get_role_display(),
        'created_at': user_obj.date_joined
    } for user_obj in recent_users]

    # Resumen de actividad (última semana)
    one_week_ago = timezone.now() - timedelta(days=7)

    new_users_this_week = User.objects.filter(
        date_joined__gte=one_week_ago).count()
    new_groups_this_week = StudentGroup.objects.filter(
        created_at__gte=one_week_ago).count()
    events_this_week = Event.objects.filter(
        created_at__gte=one_week_ago).count()
    total_memberships = GroupMembership.objects.filter(status='active').count()

    activity_summary = {
        'new_users_this_week': new_users_this_week,
        'new_groups_this_week': new_groups_this_week,
        'events_this_week': events_this_week,
        'total_memberships': total_memberships
    }

    return Response({
        'user_info': user_info,
        'system_stats': system_stats,
        'recent_groups': recent_groups_data,
        'recent_users': recent_users_data,
        'activity_summary': activity_summary
    })
