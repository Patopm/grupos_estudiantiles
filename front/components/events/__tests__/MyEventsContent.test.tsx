import React from 'react';
import { render, screen } from '@testing-library/react';
import MyEventsContent from '../MyEventsContent';
import { Event } from '@/lib/api/events';

// Mock the useDebounce hook
jest.mock('@/hooks/useDebounce', () => ({
  useDebounce: (value: string) => value,
}));

// Mock the useAuth hook
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: '1',
      role: 'student',
      first_name: 'Test',
      last_name: 'User',
    },
  }),
}));

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

describe('MyEventsContent', () => {
  const defaultProps = {
    events: mockEvents,
    isLoading: false,
    onUnregister: jest.fn(),
    onView: jest.fn(),
    onSearch: jest.fn(),
    onFilterChange: jest.fn(),
    onRefresh: jest.fn(),
  };

  it('renders the component with events', () => {
    render(<MyEventsContent {...defaultProps} />);

    expect(screen.getByText('Mis Eventos')).toBeInTheDocument();
    expect(screen.getByText('Test Event 1')).toBeInTheDocument();
    expect(screen.getByText('Test Event 2')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<MyEventsContent {...defaultProps} isLoading={true} />);

    // Check for loading skeleton
    expect(screen.getAllByTestId('loading-skeleton')).toHaveLength(6);
  });

  it('displays event statistics', () => {
    render(<MyEventsContent {...defaultProps} />);

    expect(screen.getByText('1 próximos')).toBeInTheDocument();
    expect(screen.getByText('1 asistidos')).toBeInTheDocument();
  });

  it('shows tabs for different views', () => {
    render(<MyEventsContent {...defaultProps} />);

    expect(screen.getByText('Lista')).toBeInTheDocument();
    expect(screen.getByText('Calendario')).toBeInTheDocument();
    expect(screen.getByText('Próximos (1)')).toBeInTheDocument();
    expect(screen.getByText('Historial (1)')).toBeInTheDocument();
  });

  it('handles empty events list', () => {
    render(<MyEventsContent {...defaultProps} events={[]} />);

    expect(screen.getByText('No se encontraron eventos')).toBeInTheDocument();
  });

  it('calls onUnregister when unregister button is clicked', () => {
    const mockUnregister = jest.fn();
    render(<MyEventsContent {...defaultProps} onUnregister={mockUnregister} />);

    // Find and click unregister button for upcoming event
    const unregisterButton = screen.getByText('Cancelar');
    unregisterButton.click();

    expect(mockUnregister).toHaveBeenCalledWith('1');
  });

  it('calls onView when view button is clicked', () => {
    const mockView = jest.fn();
    render(<MyEventsContent {...defaultProps} onView={mockView} />);

    // Find and click view button
    const viewButton = screen.getByText('Ver Detalles');
    viewButton.click();

    expect(mockView).toHaveBeenCalledWith('1');
  });
});
