import { apiClient, ApiPaginatedResponse } from './client';

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
};
