import { apiClient, ApiPaginatedResponse, ApiError } from './client';
import { eventsApi, Event } from './events';

export interface Group {
  group_id: string;
  name: string;
  description: string;
  image?: string;
  president_name: string;
  president_id: number;
  category: string;
  member_count: number;
  max_members: number;
  is_active: boolean;
  created_at: string;
  is_member?: boolean;
  membership_status?: 'pending' | 'active' | 'inactive';
}

// Enhanced interfaces for detailed group data

export interface GroupStatistics {
  totalMembers: number;
  activeMembers: number;
  upcomingEvents: number;
  totalEvents: number;
  membershipGrowth: number;
  eventAttendanceRate: number;
}

export interface MembershipActivity {
  id: string;
  action: 'joined' | 'left' | 'promoted' | 'demoted';
  date: string;
  user_name: string;
  details?: string;
}

export interface GroupDetailData extends Group {
  members: GroupMember[];
  upcomingEvents: Event[];
  membershipHistory: MembershipActivity[];
  statistics: GroupStatistics;
}

// Enhanced error types for group-specific errors
export interface GroupError extends ApiError {
  type?:
    | 'GROUP_FULL'
    | 'ALREADY_MEMBER'
    | 'PENDING_REQUEST'
    | 'NOT_FOUND'
    | 'PERMISSION_DENIED'
    | 'NETWORK_ERROR';
}

export interface GroupMember {
  id: number;
  user_id: number;
  full_name: string;
  email: string;
  student_id: string;
  role: 'member' | 'president';
  status: 'pending' | 'active' | 'inactive';
  joined_at: string;
}

export interface GroupRequest {
  id: number;
  user_id: number;
  full_name: string;
  email: string;
  student_id: string;
  requested_at: string;
  status: 'pending';
}

export interface CreateGroupData {
  name: string;
  description: string;
  category: string;
  max_members: number;
  image?: File;
}

export type UpdateGroupData = Partial<CreateGroupData>;

export const groupsApi = {
  // Get all groups (public)
  getAll: async (): Promise<Group[]> => {
    const response = await apiClient.get<ApiPaginatedResponse>('/api/groups/');
    return response.results as Group[];
  },

  // Get group details
  getById: async (id: string): Promise<Group> => {
    const response = await apiClient.get<Group>(`/api/groups/${id}/`);
    return response;
  },

  // Get user's groups
  getMyGroups: async (): Promise<Group[]> => {
    const response = await apiClient.get<ApiPaginatedResponse>(
      '/api/groups/?my_groups=true'
    );
    return response.results as Group[];
  },

  // Get available groups (not member)
  getAvailable: async (): Promise<Group[]> => {
    const response = await apiClient.get<ApiPaginatedResponse>(
      '/api/groups/?available=true'
    );
    return response.results as Group[];
  },

  // Create new group (admin only)
  create: async (data: CreateGroupData): Promise<Group> => {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('description', data.description);
    formData.append('category', data.category);
    formData.append('max_members', data.max_members.toString());
    if (data.image) {
      formData.append('image', data.image);
    }

    const response = await apiClient.post<Group>('/api/groups/', formData);
    return response;
  },

  // Update group (admin/president)
  update: async (id: string, data: UpdateGroupData): Promise<Group> => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === 'image' && value instanceof File) {
          formData.append(key, value);
        } else if (key !== 'image') {
          formData.append(key, String(value));
        }
      }
    });

    const response = await apiClient.put<Group>(`/api/groups/${id}/`, formData);
    return response;
  },

  // Delete group (admin only)
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/groups/${id}/`);
  },

  // Join group
  join: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.post(`/api/groups/${id}/join/`);
    return response as { message: string }; //TODO: Add propper type
  },

  // Leave group
  leave: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>(
      `/api/groups/${id}/leave/`
    );
    return response;
  },

  // Get group members
  getMembers: async (id: string): Promise<GroupMember[]> => {
    const response = await apiClient.get<ApiPaginatedResponse>(
      `/api/groups/${id}/members/`
    );
    return response.results as GroupMember[];
  },

  // Get pending requests (president only)
  getRequests: async (id: string): Promise<GroupRequest[]> => {
    const response = await apiClient.get<ApiPaginatedResponse>(
      `/api/groups/${id}/requests/`
    );
    return response.results as GroupRequest[];
  },

  // Approve request (president only)
  approveRequest: async (
    groupId: string,
    userId: number
  ): Promise<{ message: string }> => {
    const response = await apiClient.post(
      `/api/groups/${groupId}/requests/${userId}/approve/`
    );
    return response as { message: string }; //TODO: Add propper type
  },

  // Reject request (president only)
  rejectRequest: async (
    groupId: string,
    userId: number
  ): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>(
      `/api/groups/${groupId}/requests/${userId}/reject/`
    );
    return response;
  },

  // Remove member (president only)
  // TODO: Add endpoint
  // removeMember: async (
  //   groupId: string,
  //   userId: number
  // ): Promise<{ message: string }> => {
  //   const response = await apiClient.post(
  //     `/api/groups/${groupId}/members/${userId}/remove/`
  //   );
  //   return response as { message: string };
  // },

  // Enhanced methods for detailed group information

  /**
   * Get group details with extended information including members and events
   * Requirements: 1.1, 1.4, 2.3
   */
  getDetailedById: async (id: string): Promise<GroupDetailData> => {
    try {
      // Fetch group details, members, and events in parallel
      const [group, members, events] = await Promise.all([
        groupsApi.getById(id),
        groupsApi.getMembers(id),
        eventsApi.getByGroupId(id),
      ]);

      // Filter upcoming events
      const upcomingEvents = events.filter(
        (event: Event) => new Date(event.start_datetime) > new Date()
      );

      // Calculate statistics
      const statistics: GroupStatistics = {
        totalMembers: members.length,
        activeMembers: members.filter(m => m.status === 'active').length,
        upcomingEvents: upcomingEvents.length,
        totalEvents: events.length,
        membershipGrowth: 0, // Would need historical data from backend
        eventAttendanceRate: 0, // Would need attendance data from backend
      };

      // For now, return empty membership history as this would need a dedicated endpoint
      const membershipHistory: MembershipActivity[] = [];

      return {
        ...group,
        members,
        upcomingEvents,
        membershipHistory,
        statistics,
      };
    } catch (error) {
      throw groupsApi.handleGroupError(
        error,
        'Failed to fetch detailed group information'
      );
    }
  },

  /**
   * Get group statistics for analytics
   * Requirements: 1.1, 1.4, 2.3
   */
  getStatistics: async (id: string): Promise<GroupStatistics> => {
    try {
      // Fetch members and events data to compute statistics
      const [members, events] = await Promise.all([
        groupsApi.getMembers(id),
        eventsApi.getByGroupId(id),
      ]);

      const upcomingEvents = events.filter(
        (event: Event) => new Date(event.start_datetime) > new Date()
      );

      return {
        totalMembers: members.length,
        activeMembers: members.filter(m => m.status === 'active').length,
        upcomingEvents: upcomingEvents.length,
        totalEvents: events.length,
        membershipGrowth: 0, // Would need historical data
        eventAttendanceRate: 0, // Would need attendance data
      };
    } catch (error) {
      throw groupsApi.handleGroupError(
        error,
        'Failed to fetch group statistics'
      );
    }
  },

  /**
   * Enhanced error handling for group-specific edge cases
   * Requirements: 1.1, 1.4, 2.3
   */
  handleGroupError: (error: unknown, defaultMessage: string): GroupError => {
    // If it's already an ApiError, enhance it with group-specific context
    if (error && typeof error === 'object' && 'status' in error) {
      const apiError = error as ApiError;
      const groupError: GroupError = { ...apiError };

      // Map common group error scenarios
      switch (apiError.status) {
        case 400:
          if (
            apiError.message?.includes('full') ||
            apiError.message?.includes('máximo')
          ) {
            groupError.type = 'GROUP_FULL';
            groupError.message = 'El grupo ha alcanzado su capacidad máxima';
          } else if (
            apiError.message?.includes('already') ||
            apiError.message?.includes('ya eres')
          ) {
            groupError.type = 'ALREADY_MEMBER';
            groupError.message = 'Ya eres miembro de este grupo';
          } else if (
            apiError.message?.includes('pending') ||
            apiError.message?.includes('pendiente')
          ) {
            groupError.type = 'PENDING_REQUEST';
            groupError.message =
              'Ya tienes una solicitud pendiente para este grupo';
          }
          break;
        case 403:
          groupError.type = 'PERMISSION_DENIED';
          groupError.message = 'No tienes permisos para realizar esta acción';
          break;
        case 404:
          groupError.type = 'NOT_FOUND';
          groupError.message = 'El grupo no fue encontrado';
          break;
        case 0:
          groupError.type = 'NETWORK_ERROR';
          groupError.message =
            'Error de conexión. Verifica tu conexión a internet.';
          break;
      }

      return groupError;
    }

    // For non-API errors, create a new GroupError
    const groupError: GroupError = {
      message: defaultMessage,
      status: 0,
      type: 'NETWORK_ERROR',
      details: { originalError: error },
    };

    return groupError;
  },

  /**
   * Enhanced join method with better error handling
   * Requirements: 1.1, 1.4
   */
  joinWithErrorHandling: async (id: string): Promise<{ message: string }> => {
    try {
      return await groupsApi.join(id);
    } catch (error) {
      throw groupsApi.handleGroupError(error, 'Failed to join group');
    }
  },

  /**
   * Enhanced leave method with better error handling
   * Requirements: 2.1, 2.3
   */
  leaveWithErrorHandling: async (id: string): Promise<{ message: string }> => {
    try {
      return await groupsApi.leave(id);
    } catch (error) {
      throw groupsApi.handleGroupError(error, 'Failed to leave group');
    }
  },

  /**
   * Check if user can join a group (validation before attempting join)
   * Requirements: 1.1, 1.4
   */
  canJoinGroup: async (
    id: string
  ): Promise<{ canJoin: boolean; reason?: string }> => {
    try {
      const group = await groupsApi.getById(id);

      // Check if group is full
      if (group.member_count >= group.max_members) {
        return { canJoin: false, reason: 'GROUP_FULL' };
      }

      // Check if user is already a member
      if (group.is_member) {
        return { canJoin: false, reason: 'ALREADY_MEMBER' };
      }

      // Check if user has pending request
      if (group.membership_status === 'pending') {
        return { canJoin: false, reason: 'PENDING_REQUEST' };
      }

      // Check if group is active
      if (!group.is_active) {
        return { canJoin: false, reason: 'GROUP_INACTIVE' };
      }

      return { canJoin: true };
    } catch (error) {
      throw groupsApi.handleGroupError(
        error,
        'Failed to check group join eligibility'
      );
    }
  },
};
