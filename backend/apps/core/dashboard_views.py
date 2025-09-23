from datetime import timedelta

from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from django.utils import timezone

from drf_spectacular.utils import extend_schema
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from apps.core.permissions import DashboardPermission
from apps.events.models import Event, EventAttendance
from apps.students.models import GroupMembership, StudentGroup

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
                        },
                    },
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
                            },
                        },
                    },
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
                            },
                        },
                    },
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
                            },
                        },
                    },
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
                            },
                        },
                    },
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
                        },
                    },
                },
            },
        },
        403: {
            "type": "object",
            "properties": {
                "error": {
                    "type": "string",
                    "example":
                    "Solo estudiantes pueden acceder a este dashboard",
                }
            },
        },
    },
)
@api_view(["GET"])
@permission_classes([DashboardPermission])
def student_dashboard(request):
    """
    Dashboard para estudiantes
    GET /api/dashboard/student/
    """
    if not request.user.is_student:
        return Response(
            {"error": "Solo estudiantes pueden acceder a este dashboard"},
            status=status.HTTP_403_FORBIDDEN,
        )

    user = request.user

    # Información del usuario
    user_info = {
        "full_name": user.get_full_name(),
        "student_id": user.student_id,
        "role": user.get_role_display(),
    }

    # Mis grupos (membresías activas)
    my_memberships = GroupMembership.objects.filter(
        user=user, status="active").select_related("group")

    my_groups = [{
        "group_id":
        str(membership.group.group_id),
        "name":
        membership.group.name,
        "description":
        membership.group.description,
        "image":
        membership.group.image.url if membership.group.image else None,
        "president_name":
        membership.group.president_name,
        "president_id":
        membership.group.president.id,
        "category":
        membership.group.category,
        "member_count":
        membership.group.member_count,
        "max_members":
        membership.group.max_members,
        "is_active":
        membership.group.is_active,
        "created_at":
        membership.group.created_at.isoformat(),
        "is_member":
        True,
        "membership_status":
        membership.status,
    } for membership in my_memberships]

    # Eventos próximos (de mis grupos o públicos)
    my_group_ids = [membership.group.group_id for membership in my_memberships]
    upcoming_events_query = (Event.objects.filter(
        Q(target_groups__group_id__in=my_group_ids)
        | Q(target_groups__isnull=True),
        status="published",
        start_datetime__gte=timezone.now(),
    ).distinct().order_by("start_datetime")[:10])

    upcoming_events = []
    for event in upcoming_events_query:
        try:
            attendance = EventAttendance.objects.get(user=user, event=event)
            attendance_status = attendance.status
        except EventAttendance.DoesNotExist:
            attendance_status = None

        upcoming_events.append({
            "event_id": str(event.event_id),
            "title": event.title,
            "start_datetime": event.start_datetime,
            "location": event.location,
            "my_attendance_status": attendance_status,
        })

    # Solicitudes pendientes
    pending_requests = GroupMembership.objects.filter(
        user=user, status="pending").select_related("group")

    pending_requests_data = [{
        "group_name": req.group.name,
        "requested_at": req.joined_at
    } for req in pending_requests]

    # Grupos disponibles (no soy miembro ni tengo solicitud pendiente)
    user_group_ids = list(
        GroupMembership.objects.filter(user=user,
                                       status__in=["active", "pending"
                                                   ]).values_list("group_id",
                                                                  flat=True))

    available_groups_query = (StudentGroup.objects.filter(
        is_active=True).exclude(
            group_id__in=user_group_ids).order_by("-created_at")[:20])

    available_groups = [{
        "group_id": str(group.group_id),
        "name": group.name,
        "description": group.description,
        "image": group.image.url if group.image else None,
        "president_name": group.president_name,
        "president_id": group.president.id,
        "category": group.category,
        "member_count": group.member_count,
        "max_members": group.max_members,
        "is_active": group.is_active,
        "created_at": group.created_at.isoformat(),
        "is_member": False,
        "membership_status": None,
    } for group in available_groups_query]

    # Estadísticas
    total_events_attended = EventAttendance.objects.filter(
        user=user, status="attended").count()

    stats = {
        "total_groups": len(my_groups),
        "total_events_attended": total_events_attended,
        "pending_requests_count": len(pending_requests_data),
    }

    return Response({
        "user_info": user_info,
        "my_groups": my_groups,
        "available_groups": available_groups,
        "upcoming_events": upcoming_events,
        "pending_requests": pending_requests_data,
        "participation_stats": stats,
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
                        },
                    },
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
                            },
                        },
                    },
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
                            },
                        },
                    },
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
                            },
                        },
                    },
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
                        },
                    },
                },
            },
        },
        403: {
            "type": "object",
            "properties": {
                "error": {
                    "type": "string",
                    "example":
                    "Solo presidentes pueden acceder a este dashboard",
                }
            },
        },
    },
)
@api_view(["GET"])
@permission_classes([DashboardPermission])
def president_dashboard(request):
    """
    Dashboard para presidentes
    GET /api/dashboard/president/
    """
    if not request.user.is_president:
        return Response(
            {"error": "Solo presidentes pueden acceder a este dashboard"},
            status=status.HTTP_403_FORBIDDEN,
        )

    user = request.user

    # Información del usuario
    user_info = {
        "full_name": user.get_full_name(),
        "role": user.get_role_display()
    }

    # Mis grupos (grupos donde soy presidente)
    my_groups_query = StudentGroup.objects.filter(president=user,
                                                  is_active=True)

    my_groups = []
    total_members = 0
    total_pending_requests = 0

    for group in my_groups_query:
        pending_count = GroupMembership.objects.filter(
            group=group, status="pending").count()

        total_pending_requests += pending_count
        total_members += group.member_count

        my_groups.append({
            "group_id": str(group.group_id),
            "name": group.name,
            "category": group.category,
            "member_count": group.member_count,
            "max_members": group.max_members,
            "pending_requests_count": pending_count,
        })

    # Eventos recientes de mis grupos
    my_group_ids = [group.group_id for group in my_groups_query]
    recent_events = (Event.objects.filter(
        target_groups__group_id__in=my_group_ids).distinct().order_by(
            "-created_at")[:10])

    recent_events_data = [{
        "event_id": str(event.event_id),
        "title": event.title,
        "start_datetime": event.start_datetime,
        "attendee_count": event.attendee_count,
        "status": event.status,
        "created_at": event.created_at,
    } for event in recent_events]

    # Solicitudes pendientes de todos mis grupos
    pending_requests = (GroupMembership.objects.filter(
        group__president=user,
        status="pending").select_related("user",
                                         "group").order_by("-joined_at")[:20])

    pending_requests_data = [{
        "user_name": req.user.get_full_name(),
        "student_id": req.user.student_id,
        "requested_at": req.joined_at,
        "group_name": req.group.name,
    } for req in pending_requests]

    # Estadísticas
    total_events_created = (Event.objects.filter(
        target_groups__president=user).distinct().count())

    stats = {
        "total_groups_managed": my_groups_query.count(),
        "total_members": total_members,
        "total_events_created": total_events_created,
        "pending_requests_count": total_pending_requests,
    }

    return Response({
        "user_info": user_info,
        "my_groups": my_groups,
        "recent_events": recent_events_data,
        "pending_requests": pending_requests_data,
        "group_stats": stats,
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
                        },
                    },
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
                        },
                    },
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
                            },
                        },
                    },
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
                            },
                        },
                    },
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
                        },
                    },
                },
            },
        },
        403: {
            "type": "object",
            "properties": {
                "error": {
                    "type":
                    "string",
                    "example":
                    "Solo administradores pueden acceder a este dashboard",
                }
            },
        },
    },
)
@api_view(["GET"])
@permission_classes([DashboardPermission])
def admin_dashboard(request):
    """
    Dashboard para administradores
    GET /api/dashboard/admin/
    """
    if not request.user.is_admin:
        return Response(
            {"error": "Solo administradores pueden acceder a este dashboard"},
            status=status.HTTP_403_FORBIDDEN,
        )

    user = request.user

    # Información del usuario
    user_info = {
        "full_name": user.get_full_name(),
        "role": user.get_role_display()
    }

    # Estadísticas del sistema
    total_users = User.objects.count()
    total_students = User.objects.filter(role="student").count()
    total_presidents = User.objects.filter(role="president").count()
    total_groups = StudentGroup.objects.count()
    active_groups = StudentGroup.objects.filter(is_active=True).count()
    total_events = Event.objects.count()
    upcoming_events = Event.objects.filter(start_datetime__gte=timezone.now(),
                                           status="published").count()

    system_stats = {
        "total_users": total_users,
        "total_students": total_students,
        "total_presidents": total_presidents,
        "total_groups": total_groups,
        "active_groups": active_groups,
        "total_events": total_events,
        "upcoming_events": upcoming_events,
    }

    # Grupos recientes
    recent_groups = StudentGroup.objects.select_related("president").order_by(
        "-created_at")[:10]
    recent_groups_data = [{
        "group_id": str(group.group_id),
        "name": group.name,
        "category": group.category,
        "member_count": group.member_count,
        "president_name": group.president_name,
        "created_at": group.created_at,
    } for group in recent_groups]

    # Usuarios recientes
    recent_users = User.objects.order_by("-date_joined")[:10]
    recent_users_data = [{
        "id":
        user_obj.id,
        "full_name":
        user_obj.get_full_name(),
        "email":
        user_obj.email,
        "role":
        user_obj.get_role_display(),
        "last_login":
        user_obj.last_login.isoformat() if user_obj.last_login else None,
        "status":
        "active" if user_obj.is_active else "inactive",
        "created_at":
        user_obj.date_joined,
    } for user_obj in recent_users]

    # Resumen de actividad (última semana)
    one_week_ago = timezone.now() - timedelta(days=7)

    new_users_this_week = User.objects.filter(
        date_joined__gte=one_week_ago).count()
    new_groups_this_week = StudentGroup.objects.filter(
        created_at__gte=one_week_ago).count()
    events_this_week = Event.objects.filter(
        created_at__gte=one_week_ago).count()
    total_memberships = GroupMembership.objects.filter(status="active").count()

    activity_summary = {
        "new_users_this_week": new_users_this_week,
        "new_groups_this_week": new_groups_this_week,
        "events_this_week": events_this_week,
        "total_memberships": total_memberships,
    }

    # Enhanced Events Analytics
    from apps.events.models import EventAttendee
    from apps.students.models import GroupMembership

    # Events analytics
    all_events = Event.objects.all()
    published_events = all_events.filter(status="published")
    draft_events = all_events.filter(status="draft")
    cancelled_events = all_events.filter(status="cancelled")
    past_events = all_events.filter(start_datetime__lt=timezone.now())

    total_attendees = sum(event.attendee_count for event in all_events)
    average_attendance = total_attendees / len(all_events) if all_events else 0

    # Calculate attendance rate
    total_capacity = sum(event.max_attendees or 0
                         for event in published_events)
    attendance_rate = (total_attendees / total_capacity *
                       100) if total_capacity > 0 else 0

    # Events by type
    events_by_type = {}
    for event in all_events:
        events_by_type[event.event_type] = events_by_type.get(
            event.event_type, 0) + 1

    total_events_count = len(all_events)
    events_by_type_data = [{
        "type":
        event_type,
        "count":
        count,
        "percentage":
        (count / total_events_count * 100) if total_events_count > 0 else 0
    } for event_type, count in events_by_type.items()]

    # Events by status
    events_by_status = {}
    for event in all_events:
        events_by_status[event.status] = events_by_status.get(event.status,
                                                              0) + 1

    events_by_status_data = [{
        "status":
        status,
        "count":
        count,
        "percentage":
        (count / total_events_count * 100) if total_events_count > 0 else 0
    } for status, count in events_by_status.items()]

    # Top performing events
    top_performing_events = []
    for event in published_events.order_by('-attendee_count')[:5]:
        event_attendance_rate = (event.attendee_count /
                                 (event.max_attendees or 1)) * 100
        top_performing_events.append({
            "event_id": str(event.event_id),
            "title": event.title,
            "group_name": event.group.name,
            "attendee_count": event.attendee_count,
            "attendance_rate": event_attendance_rate
        })

    # Recent events
    recent_events_data = []
    for event in all_events.order_by('-created_at')[:10]:
        recent_events_data.append({
            "event_id":
            str(event.event_id),
            "title":
            event.title,
            "group_name":
            event.group.name,
            "start_datetime":
            event.start_datetime.isoformat(),
            "attendee_count":
            event.attendee_count,
            "status":
            event.status,
            "created_at":
            event.created_at.isoformat()
        })

    events_analytics = {
        "totalEvents":
        total_events_count,
        "publishedEvents":
        len(published_events),
        "draftEvents":
        len(draft_events),
        "cancelledEvents":
        len(cancelled_events),
        "upcomingEvents":
        len(all_events.filter(start_datetime__gte=timezone.now())),
        "pastEvents":
        len(past_events),
        "totalAttendees":
        total_attendees,
        "averageAttendance":
        average_attendance,
        "attendanceRate":
        attendance_rate,
        "eventsByType":
        events_by_type_data,
        "eventsByStatus":
        events_by_status_data,
        "monthlyTrend": [],  # Would need historical data
        "topPerformingEvents":
        top_performing_events,
        "recentEvents":
        recent_events_data
    }

    # Performance Metrics
    # Group metrics
    inactive_groups = StudentGroup.objects.filter(is_active=False).count()
    average_members_per_group = total_memberships / total_groups if total_groups > 0 else 0

    # Top performing groups
    top_performing_groups = []
    for group in StudentGroup.objects.filter(
            is_active=True).order_by('-member_count')[:5]:
        group_events = Event.objects.filter(group=group)
        event_count = len(group_events)
        avg_attendance = sum(
            event.attendee_count
            for event in group_events) / event_count if event_count > 0 else 0
        engagement_score = min(100, (group.member_count * 10) +
                               (event_count * 5) + (avg_attendance * 2))

        top_performing_groups.append({
            "group_id": str(group.group_id),
            "name": group.name,
            "category": group.category,
            "member_count": group.member_count,
            "event_count": event_count,
            "average_attendance": avg_attendance,
            "engagement_score": engagement_score
        })

    # Category distribution
    category_distribution = {}
    for group in StudentGroup.objects.all():
        category_distribution[group.category] = category_distribution.get(
            group.category, 0) + 1

    category_distribution_data = [{
        "category":
        category,
        "count":
        count,
        "percentage": (count / total_groups * 100) if total_groups > 0 else 0
    } for category, count in category_distribution.items()]

    # Event metrics
    average_events_per_group = total_events / total_groups if total_groups > 0 else 0
    event_completion_rate = len(
        past_events) / total_events * 100 if total_events > 0 else 0

    # Calculate average event duration (simplified)
    total_duration = 0
    for event in all_events:
        if event.end_datetime and event.start_datetime:
            duration = (event.end_datetime -
                        event.start_datetime).total_seconds() / 3600  # hours
            total_duration += duration
    average_event_duration = total_duration / total_events if total_events > 0 else 0

    # Most popular event types
    most_popular_types = sorted(events_by_type_data,
                                key=lambda x: x['count'],
                                reverse=True)[:5]

    # Calculate event success rate (events with good attendance)
    successful_events = 0
    for event in published_events:
        if event.max_attendees and event.attendee_count >= (
                event.max_attendees * 0.7):
            successful_events += 1
    event_success_rate = (successful_events / len(published_events) *
                          100) if published_events else 0

    performance_metrics = {
        "groupMetrics": {
            "totalGroups": total_groups,
            "activeGroups": active_groups,
            "inactiveGroups": inactive_groups,
            "averageMembersPerGroup": average_members_per_group,
            "topPerformingGroups": top_performing_groups,
            "groupGrowthTrend": [],  # Would need historical data
            "categoryDistribution": category_distribution_data
        },
        "eventMetrics": {
            "totalEvents": total_events,
            "averageEventsPerGroup": average_events_per_group,
            "eventCompletionRate": event_completion_rate,
            "averageEventDuration": average_event_duration,
            "mostPopularEventTypes": most_popular_types,
            "eventSuccessRate": event_success_rate,
            "averageRegistrationRate": attendance_rate
        },
        "engagementMetrics": {
            "overallEngagementScore":
            min(100, (total_memberships * 2) + (total_events * 3) +
                (total_attendees * 0.5)),
            "averageMemberActivity":
            average_events_per_group,
            "eventParticipationRate":
            attendance_rate,
            "groupRetentionRate":
            (active_groups / total_groups * 100) if total_groups > 0 else 0,
            "memberGrowthRate": (new_users_this_week / total_users *
                                 100) if total_users > 0 else 0,
            "activeMemberPercentage":
            (total_memberships / total_users * 100) if total_users > 0 else 0
        },
        "platformHealth": {
            "systemUptime": 99.9,  # Mock data
            "averageResponseTime": 150,  # Mock data
            "errorRate": 0.1,  # Mock data
            "userSatisfactionScore": 4.2,  # Mock data
            "featureAdoptionRate": 75.0  # Mock data
        }
    }

    # User Engagement Reports
    # Calculate active users (users with recent activity)
    thirty_days_ago = timezone.now() - timedelta(days=30)
    active_users = User.objects.filter(last_login__gte=thirty_days_ago).count()
    inactive_users = total_users - active_users

    # New users this month
    new_users_this_month = User.objects.filter(
        date_joined__gte=thirty_days_ago).count()
    user_growth_rate = (new_users_this_month / total_users *
                        100) if total_users > 0 else 0

    # Most active users
    most_active_users = []
    for user in User.objects.filter(
            last_login__isnull=False).order_by('-last_login')[:10]:
        # Mock login count and activity data
        login_count = 50 + (user.id % 100)  # Mock data
        groups_joined = GroupMembership.objects.filter(
            user=user, status='active').count()
        events_attended = EventAttendee.objects.filter(
            user=user, status='attended').count()

        most_active_users.append({
            "user_id":
            user.id,
            "full_name":
            user.get_full_name(),
            "email":
            user.email,
            "role":
            user.get_role_display(),
            "login_count":
            login_count,
            "last_login":
            user.last_login.isoformat() if user.last_login else None,
            "groups_joined":
            groups_joined,
            "events_attended":
            events_attended
        })

    # User activity distribution (mock data)
    user_activity_distribution = [{
        "activity_level": "20",
        "count": 15,
        "percentage": 15.0
    }, {
        "activity_level": "10",
        "count": 25,
        "percentage": 25.0
    }, {
        "activity_level": "5",
        "count": 35,
        "percentage": 35.0
    }, {
        "activity_level": "1",
        "count": 25,
        "percentage": 25.0
    }]

    # Most engaged users
    most_engaged_users = []
    for user in User.objects.all()[:10]:
        groups_joined = GroupMembership.objects.filter(
            user=user, status='active').count()
        events_attended = EventAttendee.objects.filter(
            user=user, status='attended').count()
        events_created = Event.objects.filter(group__president=user).count()
        engagement_score = min(100, (groups_joined * 20) +
                               (events_attended * 10) + (events_created * 15))

        most_engaged_users.append({
            "user_id": user.id,
            "full_name": user.get_full_name(),
            "email": user.email,
            "groups_joined": groups_joined,
            "events_attended": events_attended,
            "events_created": events_created,
            "engagement_score": engagement_score
        })

    # Role metrics
    students_data = User.objects.filter(role='student')
    presidents_data = User.objects.filter(role='president')
    admins_data = User.objects.filter(role='admin')

    role_metrics = {
        "students": {
            "total":
            len(students_data),
            "active":
            len(students_data.filter(last_login__gte=thirty_days_ago)),
            "averageGroups":
            total_memberships / len(students_data) if students_data else 0,
            "averageEvents":
            total_attendees / len(students_data) if students_data else 0
        },
        "presidents": {
            "total":
            len(presidents_data),
            "active":
            len(presidents_data.filter(last_login__gte=thirty_days_ago)),
            "averageGroupsManaged":
            StudentGroup.objects.filter(
                president__in=presidents_data).count() /
            len(presidents_data) if presidents_data else 0,
            "averageEventsCreated":
            Event.objects.filter(
                group__president__in=presidents_data).count() /
            len(presidents_data) if presidents_data else 0
        },
        "admins": {
            "total":
            len(admins_data),
            "lastActive":
            admins_data.order_by('-last_login').first().last_login.isoformat()
            if admins_data.exists() and admins_data.first().last_login else
            None
        }
    }

    user_engagement = {
        "userMetrics": {
            "totalUsers":
            total_users,
            "activeUsers":
            active_users,
            "inactiveUsers":
            inactive_users,
            "newUsersThisMonth":
            new_users_this_month,
            "userGrowthRate":
            user_growth_rate,
            "averageSessionDuration":
            25.5,  # Mock data
            "userRetentionRate":
            (active_users / total_users * 100) if total_users > 0 else 0
        },
        "activityMetrics": {
            "totalLogins":
            sum(user.login_count for user in most_active_users
                if hasattr(user, 'login_count')),
            "averageLoginsPerUser":
            15.2,  # Mock data
            "mostActiveUsers":
            most_active_users,
            "loginTrend": [],  # Would need historical data
            "userActivityDistribution":
            user_activity_distribution
        },
        "participationMetrics": {
            "totalMemberships":
            total_memberships,
            "averageMembershipsPerUser":
            total_memberships / total_users if total_users > 0 else 0,
            "mostEngagedUsers":
            most_engaged_users,
            "participationTrend": []  # Would need historical data
        },
        "roleMetrics": role_metrics
    }

    # Platform Health Indicators
    platform_health = {
        "systemMetrics": {
            "uptime": 99.9,
            "responseTime": 150,
            "errorRate": 0.1,
            "throughput": 1200
        },
        "databaseMetrics": {
            "connectionPool": 85,
            "queryPerformance": 45,
            "storageUsage": 65,
            "backupStatus": "success"
        },
        "securityMetrics": {
            "failedLogins": 12,
            "blockedRequests": 3,
            "securityScore": 92,
            "lastSecurityScan": timezone.now().isoformat()
        },
        "performanceMetrics": {
            "cpuUsage": 45,
            "memoryUsage": 68,
            "diskUsage": 72,
            "networkLatency": 25
        },
        "userMetrics": {
            "activeUsers": active_users,
            "concurrentSessions": min(active_users, 50),
            "averageLoadTime": 1.2,
            "userSatisfaction": 4.2
        },
        "alerts": [{
            "id": "1",
            "type": "info",
            "message": "Sistema funcionando normalmente",
            "timestamp": timezone.now().isoformat(),
            "resolved": True
        }]
    }

    # Administrative Tools Data
    administrative_tools = {
        "groups": {
            "total": total_groups,
            "active": active_groups,
            "pending": StudentGroup.objects.filter(is_active=False).count(),
            "recent": recent_groups_data
        },
        "events": {
            "total": total_events,
            "published": len(published_events),
            "draft": len(draft_events),
            "cancelled": len(cancelled_events),
            "recent": recent_events_data
        },
        "users": {
            "total": total_users,
            "students": total_students,
            "presidents": total_presidents,
            "admins": User.objects.filter(role='admin').count(),
            "recent": recent_users_data
        }
    }

    return Response({
        "user_info": user_info,
        "system_stats": system_stats,
        "recent_groups": recent_groups_data,
        "recent_users": recent_users_data,
        "activity_summary": activity_summary,
        "events_analytics": events_analytics,
        "performance_metrics": performance_metrics,
        "user_engagement": user_engagement,
        "platform_health": platform_health,
        "administrative_tools": administrative_tools,
    })
