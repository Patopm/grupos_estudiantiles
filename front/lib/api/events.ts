import { apiClient, ApiPaginatedResponse, ApiError } from './client';

// Event interfaces (matching backend models)
export interface Event {
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
  registration_deadline?: string;
  requires_registration: boolean;
  image?: string;
  attendee_count: number;
  is_registered?: boolean;
  registration_status?:
    | 'registered'
    | 'confirmed'
    | 'attended'
    | 'no_show'
    | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface EventFilters {
  type?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  group_id?: string;
  my_events?: boolean;
}

/**
 * Basic events API client for integration with groups
 * This is a minimal implementation to support groups functionality
 * Full events API will be implemented in later tasks
 */
export const eventsApi = {
  /**
   * Get events for a specific group
   * Used by groups API to fetch group events
   */
  getByGroupId: async (groupId: string): Promise<Event[]> => {
    try {
      const response = await apiClient.get<ApiPaginatedResponse>(
        `/api/events/?group_id=${groupId}`
      );
      return response.results as Event[];
    } catch (error) {
      // For now, return empty array if events API is not available
      // This allows groups functionality to work without events
      console.warn('Events API not available, returning empty events list');
      return [];
    }
  },

  /**
   * Get all events with optional filters
   * Basic implementation for groups integration
   */
  getAll: async (filters?: EventFilters): Promise<Event[]> => {
    try {
      const params = new URLSearchParams();
      if (filters?.type) params.append('type', filters.type);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.start_date) params.append('start_date', filters.start_date);
      if (filters?.end_date) params.append('end_date', filters.end_date);
      if (filters?.group_id) params.append('group_id', filters.group_id);
      if (filters?.my_events) params.append('my_events', 'true');

      const response = await apiClient.get<ApiPaginatedResponse>(
        `/api/events/?${params}`
      );
      return response.results as Event[];
    } catch (error) {
      // For now, return empty array if events API is not available
      console.warn('Events API not available, returning empty events list');
      return [];
    }
  },
};
