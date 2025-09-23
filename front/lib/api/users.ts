import { apiClient } from './client';

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  student_id?: string;
  phone?: string;
  role: 'student' | 'president' | 'admin';
  is_active: boolean;
  is_verified: boolean;
  date_joined: string;
  last_login?: string;
  groups_joined?: number;
  events_attended?: number;
}

export interface CreateUserData {
  first_name: string;
  last_name: string;
  email: string;
  student_id?: string;
  phone?: string;
  role: 'student' | 'president' | 'admin';
  password: string;
}

export interface UpdateUserData {
  first_name?: string;
  last_name?: string;
  email?: string;
  student_id?: string;
  phone?: string;
  role?: 'student' | 'president' | 'admin';
  is_active?: boolean;
}

export const usersApi = {
  // Get all users (admin only)
  getAllUsers: async (): Promise<User[]> => {
    return await apiClient.get<User[]>('/api/users/');
  },

  // Get user by ID
  getUser: async (id: number): Promise<User> => {
    return await apiClient.get<User>(`/api/users/${id}/`);
  },

  // Create new user (admin only)
  createUser: async (userData: CreateUserData): Promise<User> => {
    return await apiClient.post<User>('/api/users/', userData);
  },

  // Update user (admin only)
  updateUser: async (id: number, userData: UpdateUserData): Promise<User> => {
    return await apiClient.patch<User>(`/api/users/${id}/`, userData);
  },

  // Delete user (admin only)
  deleteUser: async (id: number): Promise<void> => {
    return await apiClient.delete(`/api/users/${id}/`);
  },

  // Update user status (admin only)
  updateUserStatus: async (id: number, isActive: boolean): Promise<User> => {
    return await apiClient.patch<User>(`/api/users/${id}/`, {
      is_active: isActive,
    });
  },

  // Get user profile
  getProfile: async (): Promise<User> => {
    return await apiClient.get<User>('/api/users/profile/');
  },

  // Update user profile
  updateProfile: async (userData: Partial<UpdateUserData>): Promise<User> => {
    return await apiClient.patch<User>('/api/users/profile/', userData);
  },

  // Change password
  changePassword: async (
    oldPassword: string,
    newPassword: string
  ): Promise<void> => {
    return await apiClient.post('/api/users/change-password/', {
      old_password: oldPassword,
      new_password: newPassword,
    });
  },

  // Reset password (admin only)
  resetPassword: async (id: number, newPassword: string): Promise<void> => {
    return await apiClient.post(`/api/users/${id}/reset-password/`, {
      new_password: newPassword,
    });
  },

  // Get user statistics
  getUserStats: async (
    id: number
  ): Promise<{
    groups_joined: number;
    events_attended: number;
    events_created: number;
    last_activity: string;
  }> => {
    return await apiClient.get(`/api/users/${id}/stats/`);
  },
};
