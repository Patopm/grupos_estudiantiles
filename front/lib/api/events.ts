import { apiClient, ApiPaginatedResponse } from './client';

/**
 * Events API Client and Data Models
 *
 * This module provides comprehensive event management functionality including:
 * - Complete Event interface with all required fields
 * - EventAttendee interface for attendance tracking
 * - CreateEventFormData for form handling
 * - EventFilters interface for search and filtering
 * - TypeScript enums for EventType, EventStatus, and AttendanceStatus
 * - Additional utility interfaces for components and enhanced functionality
 *
 * Requirements: 4.1, 5.1, 6.1
 */

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
  target_groups: Array<{
    group_id: string;
    name: string;
    category: string;
  }>;
  target_group_names?: string[];
  attendee_count: number;
  is_past?: boolean;
  is_upcoming?: boolean;
  is_ongoing?: boolean;
  is_full?: boolean;
  registration_open?: boolean;
  duration_hours?: number;
  user_attendance_status?:
    | 'registered'
    | 'confirmed'
    | 'attended'
    | 'no_show'
    | 'cancelled'
    | null;
  // Computed property for backward compatibility
  is_registered?: boolean;
  created_at: string;
  updated_at: string;
}

export interface EventAttendee {
  attendance_id: string;
  user_details: {
    id: number;
    full_name: string;
    email: string;
    student_id: string;
    phone?: string;
    is_active_student?: boolean;
  };
  status: 'registered' | 'confirmed' | 'attended' | 'no_show' | 'cancelled';
  registration_date: string;
  notes?: string;
  updated_at: string;
}

export interface CreateEventFormData {
  title: string;
  description: string;
  event_type: Event['event_type'];
  start_datetime: string;
  end_datetime: string;
  location: string;
  max_attendees?: number;
  registration_deadline?: string;
  requires_registration: boolean;
  target_groups: string[];
  image?: File;
}

export interface UpdateEventFormData extends Partial<CreateEventFormData> {
  status?: Event['status'];
}

// Additional interfaces for enhanced functionality
export interface EventDetailData extends Event {
  attendees?: EventAttendee[];
  relatedEvents?: Event[];
  organizingGroups?: Array<{
    group_id: string;
    name: string;
    category: string;
  }>;
  registrationHistory?: RegistrationActivity[];
}

export interface RegistrationActivity {
  id: string;
  action: 'registered' | 'unregistered' | 'confirmed' | 'attended' | 'no_show';
  date: string;
  user_name: string;
  details?: string;
}

// Enhanced dashboard data interfaces
export interface EventStats {
  registered_events: number;
  attended_events: number;
  upcoming_events: number;
}

export interface PresidentEventStats {
  total_events_created: number;
  upcoming_events: number;
  total_attendees: number;
  average_attendance: number;
}

// Utility types for component props
export interface EventCardProps {
  event: Event;
  variant?: 'default' | 'compact' | 'detailed';
  showActions?: boolean;
  onRegister?: (eventId: string) => void;
  onUnregister?: (eventId: string) => void;
  onView?: (eventId: string) => void;
  onManage?: (eventId: string) => void;
}

export interface EventListProps {
  events: Event[];
  title?: string;
  showSearch?: boolean;
  showFilters?: boolean;
  showViewToggle?: boolean;
  variant?: 'default' | 'compact';
  emptyMessage?: string;
  onRegister?: (eventId: string) => void;
  onUnregister?: (eventId: string) => void;
  onView?: (eventId: string) => void;
  onManage?: (eventId: string) => void;
  isLoading?: boolean;
}

// Event validation result type
export interface EventRegistrationValidation {
  canRegister: boolean;
  reason?: string;
}

// Event date/time formatting result
export interface EventDateTimeFormat {
  date: string;
  time: string;
  duration: string;
}

export interface EventFilters {
  search?: string;
  type?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  group_id?: string;
  my_events?: boolean;
}

// Type definitions for better type safety
export type EventType = Event['event_type'];
export type EventStatus = Event['status'];
export type AttendanceStatus =
  | 'registered'
  | 'confirmed'
  | 'attended'
  | 'no_show'
  | 'cancelled';

// Enums for event types and statuses (using proper TypeScript enums)
export enum EventTypeEnum {
  ACADEMIC = 'academic',
  SOCIAL = 'social',
  SPORTS = 'sports',
  CULTURAL = 'cultural',
  MEETING = 'meeting',
  WORKSHOP = 'workshop',
  CONFERENCE = 'conference',
  OTHER = 'other',
}

export enum EventStatusEnum {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

export enum AttendanceStatusEnum {
  REGISTERED = 'registered',
  CONFIRMED = 'confirmed',
  ATTENDED = 'attended',
  NO_SHOW = 'no_show',
  CANCELLED = 'cancelled',
}

// Const objects for backward compatibility and easier usage
export const EVENT_TYPES = {
  ACADEMIC: 'academic' as const,
  SOCIAL: 'social' as const,
  SPORTS: 'sports' as const,
  CULTURAL: 'cultural' as const,
  MEETING: 'meeting' as const,
  WORKSHOP: 'workshop' as const,
  CONFERENCE: 'conference' as const,
  OTHER: 'other' as const,
} as const;

export const EVENT_STATUSES = {
  DRAFT: 'draft' as const,
  PUBLISHED: 'published' as const,
  CANCELLED: 'cancelled' as const,
  COMPLETED: 'completed' as const,
} as const;

export const ATTENDANCE_STATUSES = {
  REGISTERED: 'registered' as const,
  CONFIRMED: 'confirmed' as const,
  ATTENDED: 'attended' as const,
  NO_SHOW: 'no_show' as const,
  CANCELLED: 'cancelled' as const,
} as const;

// Event type labels for UI display
export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  academic: 'Académico',
  social: 'Social',
  sports: 'Deportivo',
  cultural: 'Cultural',
  meeting: 'Reunión',
  workshop: 'Taller',
  conference: 'Conferencia',
  other: 'Otro',
};

// Event status labels for UI display
export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  draft: 'Borrador',
  published: 'Publicado',
  cancelled: 'Cancelado',
  completed: 'Completado',
};

// Attendance status labels for UI display
export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  registered: 'Registrado',
  confirmed: 'Confirmado',
  attended: 'Asistió',
  no_show: 'No asistió',
  cancelled: 'Cancelado',
};

/**
 * Comprehensive events API client
 * Provides full CRUD operations and event management functionality
 * Requirements: 4.1, 4.3, 5.1, 6.1
 */
export const eventsApi = {
  /**
   * Get all events with optional filters
   * Supports search, filtering by type, status, date range, and group
   */
  getAll: async (filters?: EventFilters): Promise<Event[]> => {
    const params = new URLSearchParams();

    if (filters?.search) params.append('search', filters.search);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);
    if (filters?.group_id) params.append('group_id', filters.group_id);
    if (filters?.my_events) params.append('my_events', 'true');

    const response = await apiClient.get<ApiPaginatedResponse>(
      `/api/events/?${params}`
    );
    const events = response.results as Event[];
    return eventsApi.enhanceEventsData(events);
  },

  /**
   * Get event details by ID
   * Returns complete event information including target groups and attendance status
   */
  getById: async (id: string): Promise<Event> => {
    const event = await apiClient.get<Event>(`/api/events/${id}/`);
    return eventsApi.enhanceEventData(event);
  },

  /**
   * Get user's registered events
   * Returns events the current user has registered for
   */
  getMyEvents: async (): Promise<Event[]> => {
    const response = await apiClient.get<ApiPaginatedResponse>(
      '/api/events/?my_events=true'
    );
    const events = response.results as Event[];
    return eventsApi.enhanceEventsData(events);
  },

  /**
   * Get events for a specific group
   * Used by groups API to fetch group events
   */
  getByGroupId: async (groupId: string): Promise<Event[]> => {
    const response = await apiClient.get<ApiPaginatedResponse>(
      `/api/events/?group_id=${groupId}`
    );
    const events = response.results as Event[];
    return eventsApi.enhanceEventsData(events);
  },

  /**
   * Create new event (president only)
   * Handles form data including file uploads for event images
   */
  create: async (data: CreateEventFormData): Promise<Event> => {
    const formData = new FormData();

    // Add all form fields to FormData
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === 'target_groups' && Array.isArray(value)) {
          // Handle array of target group IDs
          value.forEach(groupId => formData.append('target_groups', groupId));
        } else if (key === 'image' && value instanceof File) {
          // Handle file upload
          formData.append(key, value);
        } else if (
          key === 'requires_registration' &&
          typeof value === 'boolean'
        ) {
          // Handle boolean values
          formData.append(key, value.toString());
        } else {
          formData.append(key, String(value));
        }
      }
    });

    const event = await apiClient.post<Event>('/api/events/', formData, {
      headers: {
        // Don't set Content-Type for FormData - let browser set it with boundary
      },
    });
    return eventsApi.enhanceEventData(event);
  },

  /**
   * Update event (president/admin)
   * Handles partial updates with form data support
   */
  update: async (id: string, data: UpdateEventFormData): Promise<Event> => {
    const formData = new FormData();

    // Add all form fields to FormData
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === 'target_groups' && Array.isArray(value)) {
          // Handle array of target group IDs
          value.forEach(groupId => formData.append('target_groups', groupId));
        } else if (key === 'image' && value instanceof File) {
          // Handle file upload
          formData.append(key, value);
        } else if (
          key === 'requires_registration' &&
          typeof value === 'boolean'
        ) {
          // Handle boolean values
          formData.append(key, value.toString());
        } else {
          formData.append(key, String(value));
        }
      }
    });

    const event = await apiClient.put<Event>(`/api/events/${id}/`, formData, {
      headers: {
        // Don't set Content-Type for FormData - let browser set it with boundary
      },
    });
    return eventsApi.enhanceEventData(event);
  },

  /**
   * Delete event (president/admin)
   * Permanently removes the event
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/events/${id}/`);
  },

  /**
   * Register for event
   * Allows users to register for an event with optional notes
   */
  register: async (
    id: string,
    notes?: string
  ): Promise<{ message: string }> => {
    const data = notes ? { notes } : {};
    return await apiClient.post(`/api/events/${id}/attend/`, data);
  },

  /**
   * Unregister from event
   * Cancels user's registration for an event
   */
  unregister: async (id: string): Promise<{ message: string }> => {
    return await apiClient.post(`/api/events/${id}/unattend/`);
  },

  /**
   * Get event attendees (president/admin)
   * Returns list of users registered for the event
   */
  getAttendees: async (id: string): Promise<EventAttendee[]> => {
    const response = await apiClient.get<ApiPaginatedResponse>(
      `/api/events/${id}/attendees/`
    );
    return response.results as EventAttendee[];
  },

  /**
   * Helper method to check if user can register for event
   * Validates registration requirements and deadlines
   */
  canRegister: (event: Event): EventRegistrationValidation => {
    if (!event.requires_registration) {
      return {
        canRegister: false,
        reason: 'Event does not require registration',
      };
    }

    if (event.user_attendance_status) {
      return {
        canRegister: false,
        reason: 'Already registered for this event',
      };
    }

    if (!event.registration_open) {
      return { canRegister: false, reason: 'Registration is closed' };
    }

    if (event.is_full) {
      return { canRegister: false, reason: 'Event is full' };
    }

    if (event.is_past) {
      return { canRegister: false, reason: 'Event has already occurred' };
    }

    if (event.status !== 'published') {
      return { canRegister: false, reason: 'Event is not published' };
    }

    return { canRegister: true };
  },

  /**
   * Helper method to format event date/time for display
   */
  formatEventDateTime: (event: Event): EventDateTimeFormat => {
    const startDate = new Date(event.start_datetime);
    const endDate = new Date(event.end_datetime);

    const date = startDate.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const startTime = startDate.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const endTime = endDate.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const time = `${startTime} - ${endTime}`;

    const durationMs = endDate.getTime() - startDate.getTime();
    const durationHours = Math.round((durationMs / (1000 * 60 * 60)) * 10) / 10;
    const duration = `${durationHours} horas`;

    return { date, time, duration };
  },

  /**
   * Helper method to enhance event data with computed properties
   * Adds backward compatibility properties like is_registered
   */
  enhanceEventData: (event: Event): Event => {
    return {
      ...event,
      is_registered: Boolean(
        event.user_attendance_status &&
          ['registered', 'confirmed', 'attended'].includes(
            event.user_attendance_status
          )
      ),
    };
  },

  /**
   * Helper method to enhance multiple events with computed properties
   */
  enhanceEventsData: (events: Event[]): Event[] => {
    return events.map(eventsApi.enhanceEventData);
  },
};
