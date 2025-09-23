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
    | 'NETWORK_ERROR'
    | 'GROUP_INACTIVE'
    | 'INVALID_DATA';
}

// Additional interfaces for enhanced functionality
export interface GroupJoinEligibility {
  canJoin: boolean;
  reason?:
    | 'GROUP_FULL'
    | 'ALREADY_MEMBER'
    | 'PENDING_REQUEST'
    | 'GROUP_INACTIVE'
    | 'PERMISSION_DENIED';
  message?: string;
}

export interface GroupFilters {
  search?: string;
  category?: string;
  status?: 'active' | 'inactive';
  has_space?: boolean;
  my_groups?: boolean;
  available?: boolean;
}

export interface GroupSortOptions {
  field: 'name' | 'member_count' | 'created_at' | 'category';
  direction: 'asc' | 'desc';
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

  // Get all groups (admin only) - alias for getAll
  getAllGroups: async (): Promise<Group[]> => {
    return await groupsApi.getAll();
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
  create: async (data: CreateGroupData, image?: File): Promise<Group> => {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('description', data.description);
    formData.append('category', data.category);
    formData.append('max_members', data.max_members.toString());
    if (image) {
      formData.append('image', image);
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
      // Validate group ID
      if (!id || typeof id !== 'string') {
        throw new Error('Invalid group ID provided');
      }

      // Fetch group details, members, and events in parallel
      // Handle potential failures gracefully
      const [group, members, events] = await Promise.allSettled([
        groupsApi.getById(id),
        groupsApi.getMembers(id),
        eventsApi.getByGroupId(id),
      ]);

      // Extract successful results or provide defaults
      const groupData = group.status === 'fulfilled' ? group.value : null;
      const membersData = members.status === 'fulfilled' ? members.value : [];
      const eventsData = events.status === 'fulfilled' ? events.value : [];

      if (!groupData) {
        throw new Error('Group not found or inaccessible');
      }

      // Filter upcoming events
      const upcomingEvents = eventsData.filter(
        (event: Event) => new Date(event.start_datetime) > new Date()
      );

      // Calculate comprehensive statistics
      const statistics: GroupStatistics = {
        totalMembers: membersData.length,
        activeMembers: membersData.filter(m => m.status === 'active').length,
        upcomingEvents: upcomingEvents.length,
        totalEvents: eventsData.length,
        membershipGrowth: 0, // Would need historical data from backend
        eventAttendanceRate:
          eventsData.length > 0
            ? eventsData.reduce(
                (sum, event) => sum + (event.attendee_count || 0),
                0
              ) / eventsData.length
            : 0,
      };

      // For now, return empty membership history as this would need a dedicated endpoint
      const membershipHistory: MembershipActivity[] = [];

      return {
        ...groupData,
        members: membersData,
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
      // Validate group ID
      if (!id || typeof id !== 'string') {
        throw new Error('Invalid group ID provided');
      }

      // Fetch members and events data to compute statistics
      // Use Promise.allSettled to handle potential failures gracefully
      const [membersResult, eventsResult] = await Promise.allSettled([
        groupsApi.getMembers(id),
        eventsApi.getByGroupId(id),
      ]);

      const members =
        membersResult.status === 'fulfilled' ? membersResult.value : [];
      const events =
        eventsResult.status === 'fulfilled' ? eventsResult.value : [];

      const upcomingEvents = events.filter(
        (event: Event) => new Date(event.start_datetime) > new Date()
      );

      // Calculate more comprehensive statistics
      const totalAttendees = events.reduce(
        (sum, event) => sum + (event.attendee_count || 0),
        0
      );
      const averageAttendance =
        events.length > 0 ? totalAttendees / events.length : 0;

      return {
        totalMembers: members.length,
        activeMembers: members.filter(m => m.status === 'active').length,
        upcomingEvents: upcomingEvents.length,
        totalEvents: events.length,
        membershipGrowth: 0, // Would need historical data from backend
        eventAttendanceRate: Math.round(averageAttendance * 100) / 100, // Round to 2 decimal places
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
    // Handle string errors
    if (typeof error === 'string') {
      return {
        message: error,
        status: 0,
        type: 'NETWORK_ERROR',
        details: { originalError: error },
      };
    }

    // Handle Error objects
    if (error instanceof Error) {
      return {
        message: error.message || defaultMessage,
        status: 0,
        type: 'NETWORK_ERROR',
        details: { originalError: error.message },
      };
    }

    // If it's already an ApiError, enhance it with group-specific context
    if (error && typeof error === 'object' && 'status' in error) {
      const apiError = error as ApiError;
      const groupError: GroupError = { ...apiError };

      // Map common group error scenarios
      switch (apiError.status) {
        case 400:
          if (
            apiError.message?.includes('full') ||
            apiError.message?.includes('máximo') ||
            apiError.message?.includes('capacity')
          ) {
            groupError.type = 'GROUP_FULL';
            groupError.message = 'El grupo ha alcanzado su capacidad máxima';
          } else if (
            apiError.message?.includes('already') ||
            apiError.message?.includes('ya eres') ||
            apiError.message?.includes('member')
          ) {
            groupError.type = 'ALREADY_MEMBER';
            groupError.message = 'Ya eres miembro de este grupo';
          } else if (
            apiError.message?.includes('pending') ||
            apiError.message?.includes('pendiente') ||
            apiError.message?.includes('request')
          ) {
            groupError.type = 'PENDING_REQUEST';
            groupError.message =
              'Ya tienes una solicitud pendiente para este grupo';
          }
          break;
        case 401:
          groupError.type = 'PERMISSION_DENIED';
          groupError.message = 'Debes iniciar sesión para realizar esta acción';
          break;
        case 403:
          groupError.type = 'PERMISSION_DENIED';
          groupError.message = 'No tienes permisos para realizar esta acción';
          break;
        case 404:
          groupError.type = 'NOT_FOUND';
          groupError.message = 'El grupo no fue encontrado';
          break;
        case 429:
          groupError.type = 'NETWORK_ERROR';
          groupError.message =
            'Demasiadas solicitudes. Intenta de nuevo más tarde.';
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          groupError.type = 'NETWORK_ERROR';
          groupError.message =
            'Error del servidor. Intenta de nuevo más tarde.';
          break;
        case 0:
          groupError.type = 'NETWORK_ERROR';
          groupError.message =
            'Error de conexión. Verifica tu conexión a internet.';
          break;
        default:
          groupError.type = 'NETWORK_ERROR';
          groupError.message = apiError.message || defaultMessage;
      }

      return groupError;
    }

    // For unknown error types, create a new GroupError
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
  canJoinGroup: async (id: string): Promise<GroupJoinEligibility> => {
    try {
      if (!id || typeof id !== 'string') {
        return {
          canJoin: false,
          reason: 'PERMISSION_DENIED',
          message: 'ID de grupo inválido',
        };
      }

      const group = await groupsApi.getById(id);

      // Check if group is active
      if (!group.is_active) {
        return {
          canJoin: false,
          reason: 'GROUP_INACTIVE',
          message: 'El grupo no está activo',
        };
      }

      // Check if group is full
      if (group.member_count >= group.max_members) {
        return {
          canJoin: false,
          reason: 'GROUP_FULL',
          message: 'El grupo ha alcanzado su capacidad máxima',
        };
      }

      // Check if user is already a member
      if (group.is_member) {
        return {
          canJoin: false,
          reason: 'ALREADY_MEMBER',
          message: 'Ya eres miembro de este grupo',
        };
      }

      // Check if user has pending request
      if (group.membership_status === 'pending') {
        return {
          canJoin: false,
          reason: 'PENDING_REQUEST',
          message: 'Ya tienes una solicitud pendiente para este grupo',
        };
      }

      return {
        canJoin: true,
        message: 'Puedes unirte a este grupo',
      };
    } catch (error) {
      throw groupsApi.handleGroupError(
        error,
        'Failed to check group join eligibility'
      );
    }
  },

  /**
   * Get groups with advanced filtering and sorting
   * Requirements: 1.1, 1.2, 1.3
   */
  getFilteredGroups: async (
    filters?: GroupFilters,
    sort?: GroupSortOptions
  ): Promise<Group[]> => {
    try {
      const params = new URLSearchParams();

      if (filters?.search) params.append('search', filters.search);
      if (filters?.category) params.append('category', filters.category);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.has_space) params.append('has_space', 'true');
      if (filters?.my_groups) params.append('my_groups', 'true');
      if (filters?.available) params.append('available', 'true');

      if (sort?.field)
        params.append(
          'ordering',
          sort.direction === 'desc' ? `-${sort.field}` : sort.field
        );

      const response = await apiClient.get<ApiPaginatedResponse>(
        `/api/groups/?${params}`
      );
      return response.results as Group[];
    } catch (error) {
      throw groupsApi.handleGroupError(
        error,
        'Failed to fetch filtered groups'
      );
    }
  },

  /**
   * Batch operation to get multiple groups' statistics
   * Requirements: 1.4, 2.3
   */
  getBatchStatistics: async (
    groupIds: string[]
  ): Promise<Record<string, GroupStatistics>> => {
    try {
      if (!Array.isArray(groupIds) || groupIds.length === 0) {
        return {};
      }

      // Validate all group IDs
      const validIds = groupIds.filter(id => id && typeof id === 'string');
      if (validIds.length === 0) {
        return {};
      }

      // Fetch statistics for all groups in parallel
      const statisticsPromises = validIds.map(async id => {
        try {
          const stats = await groupsApi.getStatistics(id);
          return { id, stats };
        } catch (error) {
          // Log error but don't fail the entire batch
          console.warn(`Failed to fetch statistics for group ${id}:`, error);
          return null;
        }
      });

      const results = await Promise.all(statisticsPromises);

      // Build result object, filtering out failed requests
      const statisticsMap: Record<string, GroupStatistics> = {};
      results.forEach(result => {
        if (result) {
          statisticsMap[result.id] = result.stats;
        }
      });

      return statisticsMap;
    } catch (error) {
      throw groupsApi.handleGroupError(
        error,
        'Failed to fetch batch group statistics'
      );
    }
  },

  /**
   * Validate group data before operations
   * Requirements: 1.1, 1.4, 2.3
   */
  validateGroupData: (
    data: Partial<CreateGroupData>
  ): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (data.name !== undefined) {
      if (!data.name || data.name.trim().length === 0) {
        errors.push('El nombre del grupo es requerido');
      } else if (data.name.length > 100) {
        errors.push('El nombre del grupo no puede exceder 100 caracteres');
      }
    }

    if (data.description !== undefined) {
      if (!data.description || data.description.trim().length === 0) {
        errors.push('La descripción del grupo es requerida');
      } else if (data.description.length > 500) {
        errors.push('La descripción no puede exceder 500 caracteres');
      }
    }

    if (data.category !== undefined) {
      const validCategories = [
        'deportivo',
        'cultural',
        'académico',
        'social',
        'tecnológico',
        'otro',
      ];
      if (
        !data.category ||
        !validCategories.includes(data.category.toLowerCase())
      ) {
        errors.push('Categoría inválida');
      }
    }

    if (data.max_members !== undefined) {
      if (!data.max_members || data.max_members < 1) {
        errors.push('El número máximo de miembros debe ser mayor a 0');
      } else if (data.max_members > 1000) {
        errors.push('El número máximo de miembros no puede exceder 1000');
      }
    }

    if (data.image !== undefined && data.image) {
      const maxSize = 5 * 1024 * 1024; // 5MB
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

      if (data.image.size > maxSize) {
        errors.push('La imagen no puede exceder 5MB');
      }

      if (!allowedTypes.includes(data.image.type)) {
        errors.push('Formato de imagen no válido. Use JPEG, PNG o WebP');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },
};
