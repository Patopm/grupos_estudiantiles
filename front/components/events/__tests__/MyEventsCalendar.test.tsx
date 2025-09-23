import React from 'react';
import { render, screen } from '@testing-library/react';
import MyEventsCalendar from '../MyEventsCalendar';
import { Event } from '@/lib/api/events';

const mockEvents: Event[] = [
  {
    event_id: '1',
    title: 'Test Event 1',
    description: 'Test description 1',
    event_type: 'academic',
    status: 'published',
    start_datetime: '2024-12-20T10:00:00Z',
    end_datetime: '2024-12-20T12:00:00Z',
    location: 'Test Location 1',
    max_attendees: 50,
    requires_registration: true,
    target_groups: [
      {
        group_id: '1',
        name: 'Test Group',
        category: 'academic',
      },
    ],
    attendee_count: 25,
    is_past: false,
    is_upcoming: true,
    is_ongoing: false,
    is_full: false,
    registration_open: true,
    user_attendance_status: 'registered',
    is_registered: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    event_id: '2',
    title: 'Test Event 2',
    description: 'Test description 2',
    event_type: 'social',
    status: 'published',
    start_datetime: '2024-01-15T14:00:00Z',
    end_datetime: '2024-01-15T16:00:00Z',
    location: 'Test Location 2',
    max_attendees: 30,
    requires_registration: true,
    target_groups: [
      {
        group_id: '2',
        name: 'Social Group',
        category: 'social',
      },
    ],
    attendee_count: 15,
    is_past: true,
    is_upcoming: false,
    is_ongoing: false,
    is_full: false,
    registration_open: false,
    user_attendance_status: 'attended',
    is_registered: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

describe('MyEventsCalendar', () => {
  const defaultProps = {
    events: mockEvents,
    onView: jest.fn(),
  };

  it('renders the calendar component', () => {
    render(<MyEventsCalendar {...defaultProps} />);

    expect(screen.getByText('Diciembre 2024')).toBeInTheDocument();
  });

  it('displays calendar navigation controls', () => {
    render(<MyEventsCalendar {...defaultProps} />);

    expect(screen.getByText('Hoy')).toBeInTheDocument();
    // Navigation arrows should be present
    expect(screen.getAllByRole('button')).toHaveLength(3); // Hoy, prev, next
  });

  it('shows weekday headers', () => {
    render(<MyEventsCalendar {...defaultProps} />);

    expect(screen.getByText('Dom')).toBeInTheDocument();
    expect(screen.getByText('Lun')).toBeInTheDocument();
    expect(screen.getByText('Mar')).toBeInTheDocument();
    expect(screen.getByText('Mié')).toBeInTheDocument();
    expect(screen.getByText('Jue')).toBeInTheDocument();
    expect(screen.getByText('Vie')).toBeInTheDocument();
    expect(screen.getByText('Sáb')).toBeInTheDocument();
  });

  it('displays event statistics', () => {
    render(<MyEventsCalendar {...defaultProps} />);

    expect(screen.getByText('Total de eventos')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // Total events
    expect(screen.getByText('Asistidos')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument(); // Attended events
    expect(screen.getByText('Próximos')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument(); // Upcoming events
  });

  it('shows legend for event statuses', () => {
    render(<MyEventsCalendar {...defaultProps} />);

    expect(screen.getByText('Asistido')).toBeInTheDocument();
    expect(screen.getByText('No asistió')).toBeInTheDocument();
    expect(screen.getByText('Próximo')).toBeInTheDocument();
    expect(screen.getByText('Pasado')).toBeInTheDocument();
  });

  it('handles empty events list', () => {
    render(<MyEventsCalendar {...defaultProps} events={[]} />);

    expect(screen.getByText('0')).toBeInTheDocument(); // Total events count
  });

  it('calls onView when event is clicked', () => {
    const mockView = jest.fn();
    render(<MyEventsCalendar {...defaultProps} onView={mockView} />);

    // Find and click an event (this would be in the calendar day)
    // Note: This test might need adjustment based on how events are rendered in calendar days
    const eventElement = screen.getByText('Test Event 1');
    eventElement.click();

    expect(mockView).toHaveBeenCalledWith('1');
  });
});
