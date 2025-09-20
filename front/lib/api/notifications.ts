import { apiClient } from './client';

export interface TOTPDevice {
  id: string;
  name: string;
  is_active: boolean;
  confirmed: boolean;
  created_at: string;
  last_used_at: string | null;
  qr_code?: string;
  provisioning_uri?: string;
}

export interface NotificationPreferences {
  event_reminders: boolean;
  event_updates: boolean;
  event_cancellations: boolean;
  group_requests: boolean;
  group_updates: boolean;
  new_members: boolean;
  security_alerts: boolean;
  login_notifications: boolean;
  newsletter: boolean;
  promotional_emails: boolean;
  email_frequency: 'immediate' | 'daily' | 'weekly';
  updated_at: string;
}

export interface EmailNotification {
  id: string;
  recipient_email: string;
  recipient_name: string;
  template_name: string;
  subject: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'pending' | 'sending' | 'sent' | 'failed' | 'cancelled';
  scheduled_at: string;
  sent_at: string | null;
  failed_at: string | null;
  error_message: string;
  created_at: string;
}

export interface EventReminder {
  id: string;
  event_title: string;
  event_start_datetime: string;
  recipient_email: string;
  reminder_type: '1_week' | '3_days' | '1_day' | '2_hours' | '30_minutes';
  scheduled_at: string;
  sent: boolean;
  sent_at: string | null;
  created_at: string;
}

// TOTP API
export const totpApi = {
  // Get user's TOTP devices
  async getDevices(): Promise<TOTPDevice[]> {
    const response = await apiClient.get<
      TOTPDevice[] | { results: TOTPDevice[] }
    >('/api/notifications/totp/');
    return Array.isArray(response) ? response : response.results;
  },

  // Setup new TOTP device
  async setupDevice(name: string = 'Tecmilenio 2FA'): Promise<TOTPDevice> {
    return await apiClient.post<TOTPDevice>('/api/notifications/totp/', {
      name,
    });
  },

  // Verify TOTP token
  async verifyToken(
    deviceId: string,
    token: string
  ): Promise<{ valid: boolean; message: string }> {
    return await apiClient.post<{ valid: boolean; message: string }>(
      `/api/notifications/totp/${deviceId}/verify/`,
      { token }
    );
  },

  // Confirm and activate TOTP device
  async confirmDevice(
    deviceId: string,
    token: string
  ): Promise<{ message: string; device: TOTPDevice }> {
    return await apiClient.post<{
      message: string;
      device: TOTPDevice;
    }>(`/api/notifications/totp/${deviceId}/confirm/`, { token });
  },

  // Disable 2FA
  async disableDevice(
    deviceId: string,
    token: string
  ): Promise<{ message: string }> {
    return await apiClient.post<{ message: string }>(
      `/api/notifications/totp/${deviceId}/disable/`,
      { token }
    );
  },

  // Delete TOTP device
  async deleteDevice(deviceId: string): Promise<void> {
    await apiClient.delete<void>(`/api/notifications/totp/${deviceId}/`);
  },
};

// Notification Preferences API
export const preferencesApi = {
  // Get user's notification preferences
  async getPreferences(): Promise<NotificationPreferences> {
    // Since it's a singleton, we can use a fixed ID or the endpoint handles it
    return await apiClient.get<NotificationPreferences>(
      '/api/notifications/preferences/1/'
    );
  },

  // Update notification preferences
  async updatePreferences(
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    return await apiClient.patch<NotificationPreferences>(
      '/api/notifications/preferences/1/',
      preferences
    );
  },
};

// Pagination response type
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Email Notifications API
export const emailNotificationsApi = {
  // Get email notifications
  async getNotifications(params?: {
    status?: string;
    priority?: string;
    page?: number;
    search?: string;
  }): Promise<PaginatedResponse<EmailNotification>> {
    const response = await apiClient.get<PaginatedResponse<EmailNotification>>(
      '/api/notifications/emails/',
      {
        params,
      }
    );
    return response;
  },

  // Get single notification
  async getNotification(id: string): Promise<EmailNotification> {
    return await apiClient.get<EmailNotification>(
      `/api/notifications/emails/${id}/`
    );
  },

  // Resend failed notification
  async resendNotification(id: string): Promise<{ message: string }> {
    return await apiClient.post<{ message: string }>(
      `/api/notifications/emails/${id}/resend/`
    );
  },
};

// Event Reminders API
export const eventRemindersApi = {
  // Get event reminders
  async getReminders(params?: {
    reminder_type?: string;
    sent?: boolean;
    page?: number;
  }): Promise<PaginatedResponse<EventReminder>> {
    const response = await apiClient.get<PaginatedResponse<EventReminder>>(
      '/api/notifications/reminders/',
      {
        params,
      }
    );
    return response;
  },
};

// Utility functions
export const notificationUtils = {
  // Format reminder type for display
  formatReminderType(type: string): string {
    const types: Record<string, string> = {
      '1_week': '1 semana antes',
      '3_days': '3 días antes',
      '1_day': '1 día antes',
      '2_hours': '2 horas antes',
      '30_minutes': '30 minutos antes',
    };
    return types[type] || type;
  },

  // Format notification status
  formatStatus(status: string): { text: string; color: string } {
    const statusMap: Record<string, { text: string; color: string }> = {
      pending: { text: 'Pendiente', color: 'text-yellow-600' },
      sending: { text: 'Enviando', color: 'text-blue-600' },
      sent: { text: 'Enviado', color: 'text-green-600' },
      failed: { text: 'Fallido', color: 'text-red-600' },
      cancelled: { text: 'Cancelado', color: 'text-gray-600' },
    };
    return statusMap[status] || { text: status, color: 'text-gray-600' };
  },

  // Format priority
  formatPriority(priority: string): { text: string; color: string } {
    const priorityMap: Record<string, { text: string; color: string }> = {
      low: { text: 'Baja', color: 'text-gray-600' },
      normal: { text: 'Normal', color: 'text-blue-600' },
      high: { text: 'Alta', color: 'text-orange-600' },
      urgent: { text: 'Urgente', color: 'text-red-600' },
    };
    return priorityMap[priority] || { text: priority, color: 'text-gray-600' };
  },

  // Format email frequency
  formatEmailFrequency(frequency: string): string {
    const frequencies: Record<string, string> = {
      immediate: 'Inmediato',
      daily: 'Diario',
      weekly: 'Semanal',
    };
    return frequencies[frequency] || frequency;
  },
};
