/**
 * Basic tests for the events API client
 * These tests verify the API client structure and helper methods
 */

import {
  eventsApi,
  Event,
  EVENT_TYPES,
  EVENT_STATUSES,
  ATTENDANCE_STATUSES,
} from '../events';

// Mock event data for testing
const mockEvent: Event = {
  event_id: '123',
  title: 'Test Event',
  description: 'A test event',
  event_type: 'academic',
  status: 'published',
  start_datetime: '2024-12-01T10:00:00Z',
  end_datetime: '2024-12-01T12:00:00Z',
  location: 'Test Location',
  requires_registration: true,
  target_groups: [
    {
      group_id: '456',
      name: 'Test Group',
      category: 'academic',
    },
  ],
  attendee_count: 5,
  is_past: false,
  is_upcoming: true,
  is_full: false,
  registration_open: true,
  user_attendance_status: 'registered',
  created_at: '2024-11-01T10:00:00Z',
  updated_at: '2024-11-01T10:00:00Z',
};

describe('Events API Client', () => {
  describe('Helper Methods', () => {
    test('enhanceEventData should add is_registered property', () => {
      const enhanced = eventsApi.enhanceEventData(mockEvent);
      expect(enhanced.is_registered).toBe(true);
    });

    test('enhanceEventData should handle null user_attendance_status', () => {
      const eventWithoutStatus = { ...mockEvent, user_attendance_status: null };
      const enhanced = eventsApi.enhanceEventData(eventWithoutStatus);
      expect(enhanced.is_registered).toBe(false);
    });

    test('enhanceEventsData should enhance multiple events', () => {
      const events = [
        mockEvent,
        { ...mockEvent, user_attendance_status: null },
      ];
      const enhanced = eventsApi.enhanceEventsData(events);
      expect(enhanced).toHaveLength(2);
      expect(enhanced[0].is_registered).toBe(true);
      expect(enhanced[1].is_registered).toBe(false);
    });

    test('canRegister should validate registration requirements', () => {
      // Can register
      const result1 = eventsApi.canRegister({
        ...mockEvent,
        user_attendance_status: null,
      });
      expect(result1.canRegister).toBe(true);

      // Already registered
      const result2 = eventsApi.canRegister(mockEvent);
      expect(result2.canRegister).toBe(false);
      expect(result2.reason).toBe('Already registered for this event');

      // Event is full
      const result3 = eventsApi.canRegister({
        ...mockEvent,
        user_attendance_status: null,
        is_full: true,
      });
      expect(result3.canRegister).toBe(false);
      expect(result3.reason).toBe('Event is full');

      // Registration closed
      const result4 = eventsApi.canRegister({
        ...mockEvent,
        user_attendance_status: null,
        registration_open: false,
      });
      expect(result4.canRegister).toBe(false);
      expect(result4.reason).toBe('Registration is closed');
    });

    test('formatEventDateTime should format dates correctly', () => {
      const formatted = eventsApi.formatEventDateTime(mockEvent);
      expect(formatted).toHaveProperty('date');
      expect(formatted).toHaveProperty('time');
      expect(formatted).toHaveProperty('duration');
      expect(formatted.duration).toBe('2 horas');
    });
  });

  describe('Constants', () => {
    test('EVENT_TYPES should contain all event types', () => {
      expect(EVENT_TYPES.ACADEMIC).toBe('academic');
      expect(EVENT_TYPES.SOCIAL).toBe('social');
      expect(EVENT_TYPES.SPORTS).toBe('sports');
      expect(EVENT_TYPES.CULTURAL).toBe('cultural');
    });

    test('EVENT_STATUSES should contain all statuses', () => {
      expect(EVENT_STATUSES.DRAFT).toBe('draft');
      expect(EVENT_STATUSES.PUBLISHED).toBe('published');
      expect(EVENT_STATUSES.CANCELLED).toBe('cancelled');
      expect(EVENT_STATUSES.COMPLETED).toBe('completed');
    });

    test('ATTENDANCE_STATUSES should contain all attendance statuses', () => {
      expect(ATTENDANCE_STATUSES.REGISTERED).toBe('registered');
      expect(ATTENDANCE_STATUSES.CONFIRMED).toBe('confirmed');
      expect(ATTENDANCE_STATUSES.ATTENDED).toBe('attended');
      expect(ATTENDANCE_STATUSES.NO_SHOW).toBe('no_show');
      expect(ATTENDANCE_STATUSES.CANCELLED).toBe('cancelled');
    });
  });

  describe('API Structure', () => {
    test('eventsApi should have all required methods', () => {
      expect(typeof eventsApi.getAll).toBe('function');
      expect(typeof eventsApi.getById).toBe('function');
      expect(typeof eventsApi.getMyEvents).toBe('function');
      expect(typeof eventsApi.getByGroupId).toBe('function');
      expect(typeof eventsApi.create).toBe('function');
      expect(typeof eventsApi.update).toBe('function');
      expect(typeof eventsApi.delete).toBe('function');
      expect(typeof eventsApi.register).toBe('function');
      expect(typeof eventsApi.unregister).toBe('function');
      expect(typeof eventsApi.getAttendees).toBe('function');
      expect(typeof eventsApi.canRegister).toBe('function');
      expect(typeof eventsApi.formatEventDateTime).toBe('function');
      expect(typeof eventsApi.enhanceEventData).toBe('function');
      expect(typeof eventsApi.enhanceEventsData).toBe('function');
    });
  });
});
