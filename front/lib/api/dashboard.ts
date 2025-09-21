import { apiClient } from './client';
import { Group } from './groups';

export interface StudentDashboardData {
  user_info: {
    full_name: string;
    role: string;
  };
  my_groups: Group[];
  available_groups: Group[];
  upcoming_events: Array<{
    event_id: string;
    title: string;
    start_datetime: string;
    location: string;
    group_name: string;
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
    pending_requests: number;
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
