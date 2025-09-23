import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EventCard } from '../index';
import { Event } from '@/lib/api/events';
import React from 'react';

// Mock the useAuth hook
const mockUseAuth = jest.fn();
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock auth context data
const mockAuthContext = {
  user: {
    id: 1,
    role: 'student' as const,
    full_name: 'Test User',
    email: 'test@example.com',
  },
  isAuthenticated: true,
  isLoading: false,
  mfaRequired: false,
  mfaUserId: null,
  verificationStatus: null,
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
  refreshUser: jest.fn(),
  requestPasswordReset: jest.fn(),
  resetPassword: jest.fn(),
  verifyMFA: jest.fn(),
  verifyBackupCode: jest.fn(),
  clearMFAState: jest.fn(),
  getVerificationStatus: jest.fn(),
  requestEmailVerification: jest.fn(),
  confirmEmailVerification: jest.fn(),
  requestPhoneVerification: jest.fn(),
  confirmPhoneVerification: jest.fn(),
  resendVerification: jest.fn(),
};

// Sample event data
const mockEvent: Event = {
  event_id: '1',
  title: 'Test Event',
  description: 'This is a test event description',
  event_type: 'academic',
  status: 'published',
  start_datetime: '2024-12-25T10:00:00Z',
  end_datetime: '2024-12-25T12:00:00Z',
  location: 'Test Location',
  max_attendees: 50,
  registration_deadline: '2024-12-24T23:59:59Z',
  requires_registration: true,
  image: '/test-image.jpg',
  target_groups: [
    {
      group_id: '1',
      name: 'Test Group',
      category: 'Académico',
    },
  ],
  attendee_count: 25,
  is_past: false,
  is_upcoming: true,
  is_ongoing: false,
  is_full: false,
  registration_open: true,
  user_attendance_status: null,
  is_registered: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const renderWithAuth = (component: React.ReactElement) => {
  mockUseAuth.mockReturnValue(mockAuthContext);
  return render(component);
};

describe('EventCard', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue(mockAuthContext);
  });

  it('renders event information correctly', () => {
    renderWithAuth(<EventCard event={mockEvent} />);

    expect(screen.getByText('Test Event')).toBeInTheDocument();
    expect(
      screen.getByText(/This is a test event description/)
    ).toBeInTheDocument();
    expect(screen.getByText('Test Location')).toBeInTheDocument();
    expect(screen.getByText('Organizado por: Test Group')).toBeInTheDocument();
    expect(screen.getByText('Académico')).toBeInTheDocument();
  });

  it('displays registration status correctly', () => {
    renderWithAuth(<EventCard event={mockEvent} />);

    expect(screen.getByText('25/50')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('shows register button for available events', () => {
    const onRegister = jest.fn();
    renderWithAuth(<EventCard event={mockEvent} onRegister={onRegister} />);

    expect(screen.getByText('Registrarse')).toBeInTheDocument();
  });

  it('shows registered status when user is registered', () => {
    const registeredEvent = {
      ...mockEvent,
      is_registered: true,
      user_attendance_status: 'registered' as const,
    };

    const onUnregister = jest.fn();
    renderWithAuth(
      <EventCard event={registeredEvent} onUnregister={onUnregister} />
    );

    expect(screen.getByText('Registrado')).toBeInTheDocument();
    expect(screen.getByText('Cancelar')).toBeInTheDocument();
  });

  it('shows full status when event is at capacity', () => {
    const fullEvent = {
      ...mockEvent,
      attendee_count: 50,
      is_full: true,
    };

    renderWithAuth(<EventCard event={fullEvent} />);

    expect(screen.getByText('Evento Lleno')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('calls onRegister when register button is clicked', () => {
    const onRegister = jest.fn();
    renderWithAuth(<EventCard event={mockEvent} onRegister={onRegister} />);

    fireEvent.click(screen.getByText('Registrarse'));
    expect(onRegister).toHaveBeenCalledWith('1');
  });

  it('calls onView when view button is clicked', () => {
    const onView = jest.fn();
    renderWithAuth(<EventCard event={mockEvent} onView={onView} />);

    fireEvent.click(screen.getByText('Ver Detalles'));
    expect(onView).toHaveBeenCalledWith('1');
  });

  it('renders compact variant correctly', () => {
    renderWithAuth(<EventCard event={mockEvent} variant='compact' />);

    expect(screen.getByText('Test Event')).toBeInTheDocument();
    // In compact mode, the description should be in sr-only
    expect(screen.getByText(/This is a test event description/)).toHaveClass(
      'sr-only'
    );
  });

  it('handles past events correctly', () => {
    const pastEvent = {
      ...mockEvent,
      is_past: true,
      user_attendance_status: 'attended' as const,
    };

    renderWithAuth(<EventCard event={pastEvent} />);

    expect(screen.getByText('Asististe')).toBeInTheDocument();
  });

  it('handles cancelled events correctly', () => {
    const cancelledEvent = {
      ...mockEvent,
      status: 'cancelled' as const,
    };

    renderWithAuth(<EventCard event={cancelledEvent} />);

    expect(screen.getByText('Evento Cancelado')).toBeInTheDocument();
  });

  it('shows manage button for organizers', () => {
    const organizerContext = {
      ...mockAuthContext,
      user: {
        ...mockAuthContext.user,
        role: 'president' as const,
        id: '1', // Match the target group ID
      },
    };

    const eventWithMatchingGroup = {
      ...mockEvent,
      target_groups: [
        {
          group_id: '1', // Match the user ID
          name: 'Test Group',
          category: 'Académico',
        },
      ],
    };

    const onManage = jest.fn();

    mockUseAuth.mockReturnValue(organizerContext);
    render(<EventCard event={eventWithMatchingGroup} onManage={onManage} />);

    expect(screen.getByText('Gestionar')).toBeInTheDocument();
  });

  it('formats date and time correctly', () => {
    renderWithAuth(<EventCard event={mockEvent} />);

    // Check that date formatting is applied (exact format may vary by locale and timezone)
    expect(screen.getByText(/\d{2}:\d{2} - \d{2}:\d{2}/)).toBeInTheDocument();
    expect(
      screen.getByText(/miércoles, 25 de diciembre de 2024/)
    ).toBeInTheDocument();
  });

  it('handles events without images', () => {
    const eventWithoutImage = {
      ...mockEvent,
      image: undefined,
    };

    renderWithAuth(<EventCard event={eventWithoutImage} />);

    expect(screen.getByText('Test Event')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('handles events without registration requirement', () => {
    const noRegistrationEvent = {
      ...mockEvent,
      requires_registration: false,
      max_attendees: undefined,
    };

    renderWithAuth(<EventCard event={noRegistrationEvent} />);

    expect(screen.queryByText('Registrarse')).not.toBeInTheDocument();
    expect(screen.queryByText(/\/50/)).not.toBeInTheDocument();
  });

  it('provides proper accessibility attributes', () => {
    const onView = jest.fn();
    const onRegister = jest.fn();
    renderWithAuth(
      <EventCard event={mockEvent} onView={onView} onRegister={onRegister} />
    );

    // Check for proper ARIA labels
    expect(
      screen.getByLabelText(/Ver detalles del evento Test Event/)
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Registrarse para el evento Test Event/)
    ).toBeInTheDocument();
    expect(screen.getByRole('article')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});
