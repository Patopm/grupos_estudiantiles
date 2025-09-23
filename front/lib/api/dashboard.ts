import { apiClient } from './client';
import { Group } from './groups';

// Simplified event interface for dashboard data
export interface DashboardEvent {
  event_id: string;
  title: string;
  description: string;
  event_type:
    | 'academic'
    | 'social'
    | 'sports'
    | 'cultural'
    | 'meeting'
    | 'workshop'
    | 'conference'
    | 'other';
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  start_datetime: string;
  end_datetime: string;
  location: string;
  max_attendees?: number;
  attendee_count: number;
  requires_registration: boolean;
  registration_deadline?: string;
  image?: string;
  group_name: string;
  group_id: string;
  user_attendance_status?: string;
  is_registered?: boolean;
  registration_open?: boolean;
  is_full?: boolean;
  is_past?: boolean;
  target_groups: Array<{
    group_id: string;
    name: string;
    category: string;
  }>;
}

export interface StudentDashboardData {
  user_info: {
    full_name: string;
    role: string;
  };
  my_groups: Group[];
  available_groups: Group[];
  upcoming_events: DashboardEvent[];
  recommended_events: Array<DashboardEvent & { recommendation_reason: string }>;
  recent_activity: Array<{
    id: string;
    type:
      | 'group_joined'
      | 'group_left'
      | 'event_registered'
      | 'event_attended'
      | 'event_cancelled';
    title: string;
    description: string;
    timestamp: string;
    group_name?: string;
    event_title?: string;
  }>;
  pending_requests: Array<{
    group_id: string;
    group_name: string;
    requested_at: string;
    status: string;
  }>;
  participation_stats: {
    total_groups: number;
    total_events_attended: number;
    total_events_registered: number;
    upcoming_events_count: number;
    pending_requests_count: number;
    activity_score: number;
  };
}

export interface PresidentDashboardData {
  user_info: {
    full_name: string;
    role: string;
  };
  my_groups: Array<{
    group_id: string;
    name: string;
    description: string;
    member_count: number;
    max_members: number;
    category: string;
    pending_requests: number;
    upcoming_events: number;
  }>;
  pending_requests: Array<{
    request_id: number;
    user_name: string;
    user_email: string;
    group_name: string;
    requested_at: string;
  }>;
  recent_events: Array<{
    event_id: string;
    title: string;
    start_datetime: string;
    group_name: string;
    attendee_count: number;
  }>;
  group_stats: {
    total_groups_managed: number;
    total_members: number;
    total_events_created: number;
    pending_requests_count: number;
  };
  event_analytics: {
    total_events: number;
    published_events: number;
    draft_events: number;
    cancelled_events: number;
    upcoming_events: number;
    past_events: number;
    total_attendees: number;
    average_attendance: number;
    attendance_rate: number;
  };
  member_engagement: {
    total_members: number;
    active_members: number;
    new_members_this_month: number;
    average_event_participation: number;
    member_retention_rate: number;
  };
  performance_metrics: {
    overall_score: number;
    group_growth_rate: number;
    event_completion_rate: number;
    member_satisfaction_score: number;
  };
}

export interface AdminDashboardData {
  user_info: {
    full_name: string;
    role: string;
  };
  system_stats: {
    total_users: number;
    total_students: number;
    total_presidents: number;
    total_groups: number;
    active_groups: number;
    total_events: number;
    upcoming_events: number;
  };
  recent_groups: Array<{
    group_id: string;
    name: string;
    category: string;
    member_count: number;
    president_name: string;
    created_at: string;
  }>;
  recent_users: Array<{
    id: number;
    full_name: string;
    email: string;
    role: string;
    created_at: string;
  }>;
  activity_summary: {
    new_users_this_week: number;
    new_groups_this_week: number;
    events_this_week: number;
    total_memberships: number;
  };
  // Enhanced analytics data
  events_analytics: {
    totalEvents: number;
    publishedEvents: number;
    draftEvents: number;
    cancelledEvents: number;
    upcomingEvents: number;
    pastEvents: number;
    totalAttendees: number;
    averageAttendance: number;
    attendanceRate: number;
    eventsByType: Array<{
      type: string;
      count: number;
      percentage: number;
    }>;
    eventsByStatus: Array<{
      status: string;
      count: number;
      percentage: number;
    }>;
    monthlyTrend: Array<{
      month: string;
      events: number;
      attendees: number;
    }>;
    topPerformingEvents: Array<{
      event_id: string;
      title: string;
      group_name: string;
      attendee_count: number;
      attendance_rate: number;
    }>;
    recentEvents: Array<{
      event_id: string;
      title: string;
      group_name: string;
      start_datetime: string;
      attendee_count: number;
      status: string;
    }>;
  };
  performance_metrics: {
    groupMetrics: {
      totalGroups: number;
      activeGroups: number;
      inactiveGroups: number;
      averageMembersPerGroup: number;
      topPerformingGroups: Array<{
        group_id: string;
        name: string;
        category: string;
        member_count: number;
        event_count: number;
        average_attendance: number;
        engagement_score: number;
      }>;
      groupGrowthTrend: Array<{
        month: string;
        new_groups: number;
        total_groups: number;
      }>;
      categoryDistribution: Array<{
        category: string;
        count: number;
        percentage: number;
      }>;
    };
    eventMetrics: {
      totalEvents: number;
      averageEventsPerGroup: number;
      eventCompletionRate: number;
      averageEventDuration: number;
      mostPopularEventTypes: Array<{
        type: string;
        count: number;
        percentage: number;
      }>;
      eventSuccessRate: number;
      averageRegistrationRate: number;
    };
    engagementMetrics: {
      overallEngagementScore: number;
      averageMemberActivity: number;
      eventParticipationRate: number;
      groupRetentionRate: number;
      memberGrowthRate: number;
      activeMemberPercentage: number;
    };
    platformHealth: {
      systemUptime: number;
      averageResponseTime: number;
      errorRate: number;
      userSatisfactionScore: number;
      featureAdoptionRate: number;
    };
  };
  user_engagement: {
    userMetrics: {
      totalUsers: number;
      activeUsers: number;
      inactiveUsers: number;
      newUsersThisMonth: number;
      userGrowthRate: number;
      averageSessionDuration: number;
      userRetentionRate: number;
    };
    activityMetrics: {
      totalLogins: number;
      averageLoginsPerUser: number;
      mostActiveUsers: Array<{
        user_id: number;
        full_name: string;
        email: string;
        role: string;
        login_count: number;
        last_login: string;
        groups_joined: number;
        events_attended: number;
      }>;
      loginTrend: Array<{
        date: string;
        logins: number;
        unique_users: number;
      }>;
      userActivityDistribution: Array<{
        activity_level: string;
        count: number;
        percentage: number;
      }>;
    };
    participationMetrics: {
      totalMemberships: number;
      averageMembershipsPerUser: number;
      mostEngagedUsers: Array<{
        user_id: number;
        full_name: string;
        email: string;
        groups_joined: number;
        events_attended: number;
        events_created: number;
        engagement_score: number;
      }>;
      participationTrend: Array<{
        month: string;
        new_memberships: number;
        events_attended: number;
      }>;
    };
    roleMetrics: {
      students: {
        total: number;
        active: number;
        averageGroups: number;
        averageEvents: number;
      };
      presidents: {
        total: number;
        active: number;
        averageGroupsManaged: number;
        averageEventsCreated: number;
      };
      admins: {
        total: number;
        lastActive: string;
      };
    };
  };
  platform_health: {
    systemMetrics: {
      uptime: number;
      responseTime: number;
      errorRate: number;
      throughput: number;
    };
    databaseMetrics: {
      connectionPool: number;
      queryPerformance: number;
      storageUsage: number;
      backupStatus: string;
    };
    securityMetrics: {
      failedLogins: number;
      blockedRequests: number;
      securityScore: number;
      lastSecurityScan: string;
    };
    performanceMetrics: {
      cpuUsage: number;
      memoryUsage: number;
      diskUsage: number;
      networkLatency: number;
    };
    userMetrics: {
      activeUsers: number;
      concurrentSessions: number;
      averageLoadTime: number;
      userSatisfaction: number;
    };
    alerts: Array<{
      id: string;
      type: 'warning' | 'error' | 'info';
      message: string;
      timestamp: string;
      resolved: boolean;
    }>;
  };
  administrative_tools: {
    groups: {
      total: number;
      active: number;
      pending: number;
      recent: Array<{
        group_id: string;
        name: string;
        category: string;
        member_count: number;
        president_name: string;
        status: string;
        created_at: string;
      }>;
    };
    events: {
      total: number;
      published: number;
      draft: number;
      cancelled: number;
      recent: Array<{
        event_id: string;
        title: string;
        group_name: string;
        start_datetime: string;
        attendee_count: number;
        status: string;
        created_at: string;
      }>;
    };
    users: {
      total: number;
      students: number;
      presidents: number;
      admins: number;
      recent: Array<{
        id: number;
        full_name: string;
        email: string;
        role: string;
        last_login: string;
        status: string;
        created_at: string;
      }>;
    };
  };
}

export const dashboardApi = {
  // Get student dashboard data
  getStudentData: async (): Promise<StudentDashboardData> => {
    return await apiClient.get<StudentDashboardData>('/api/dashboard/student/');
  },

  // Get president dashboard data
  getPresidentData: async (): Promise<PresidentDashboardData> => {
    return await apiClient.get<PresidentDashboardData>(
      '/api/dashboard/president/'
    );
  },

  // Get admin dashboard data
  getAdminData: async (): Promise<AdminDashboardData> => {
    return await apiClient.get<AdminDashboardData>('/api/dashboard/admin/');
  },
};
