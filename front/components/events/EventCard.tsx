'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Eye,
  UserPlus,
  UserMinus,
  Settings,
  CheckCircle,
  XCircle,
  AlertCircle,
  CalendarX,
} from 'lucide-react';
import { Event, EVENT_TYPE_LABELS } from '@/lib/api/events';
import { useAuth } from '@/contexts/AuthContext';

interface EventCardProps {
  event: Event;
  variant?: 'default' | 'compact' | 'detailed';
  showActions?: boolean;
  showAttendanceStatus?: boolean;
  onRegister?: (eventId: string) => void;
  onUnregister?: (eventId: string) => void;
  onView?: (eventId: string) => void;
  onManage?: (eventId: string) => void;
  isLoading?: boolean;
}

export default function EventCard({
  event,
  variant = 'default',
  showActions = true,
  showAttendanceStatus = false,
  onRegister,
  onUnregister,
  onView,
  onManage,
}: EventCardProps) {
  const { user } = useAuth();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Check user permissions
  const isOrganizer =
    user?.role === 'president' &&
    event.target_groups.some(group => group.group_id === String(user.id));
  const isAdmin = user?.role === 'admin';
  const canManage = isOrganizer || isAdmin;

  // Event status checks
  const isRegistered =
    event.is_registered ||
    (event.user_attendance_status &&
      ['registered', 'confirmed', 'attended'].includes(
        event.user_attendance_status
      ));
  const canRegister =
    event.requires_registration &&
    !isRegistered &&
    event.registration_open &&
    !event.is_full &&
    !event.is_past &&
    event.status === 'published';

  const handleAction = async (
    action: () => Promise<void> | void,
    actionType: string
  ) => {
    setActionLoading(actionType);

    // Set loading message for screen readers
    const loadingMessages: Record<string, string> = {
      register: 'Registrándose para el evento...',
      unregister: 'Cancelando registro del evento...',
      view: 'Cargando detalles del evento...',
      manage: 'Accediendo a la gestión del evento...',
    };

    setStatusMessage(loadingMessages[actionType] || 'Procesando...');

    try {
      await action();

      // Set success message
      const successMessages: Record<string, string> = {
        register: 'Registro exitoso para el evento',
        unregister: 'Registro cancelado correctamente',
        view: 'Detalles del evento cargados',
        manage: 'Acceso a gestión concedido',
      };

      setStatusMessage(successMessages[actionType] || 'Acción completada');

      // Clear message after a delay
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (error) {
      console.error('Action failed:', error);
      setStatusMessage('Error al procesar la acción. Intenta de nuevo.');
      setTimeout(() => setStatusMessage(''), 5000);
    } finally {
      setActionLoading(null);
    }
  };

  // Format event date and time
  const formatEventDateTime = () => {
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

    return {
      date,
      time: `${startTime} - ${endTime}`,
      startTime,
      endTime,
    };
  };

  // Get attendance status for past events
  const getAttendanceStatus = () => {
    if (!showAttendanceStatus || !event.is_past) return null;

    switch (event.user_attendance_status) {
      case 'attended':
        return {
          status: 'attended',
          label: 'Asististe',
          icon: CheckCircle,
          color:
            'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
          ariaLabel: 'Asististe a este evento',
        };
      case 'no_show':
        return {
          status: 'no_show',
          label: 'No Asististe',
          icon: XCircle,
          color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
          ariaLabel: 'No asististe a este evento',
        };
      case 'cancelled':
        return {
          status: 'cancelled',
          label: 'Cancelado',
          icon: XCircle,
          color:
            'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
          ariaLabel: 'Cancelaste tu asistencia a este evento',
        };
      default:
        return {
          status: 'unknown',
          label: 'Sin confirmar',
          icon: AlertCircle,
          color:
            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
          ariaLabel: 'Estado de asistencia no confirmado',
        };
    }
  };

  // Get registration status with enhanced indicators
  const getRegistrationStatus = () => {
    if (event.status === 'cancelled') {
      return {
        status: 'cancelled',
        label: 'Evento Cancelado',
        icon: CalendarX,
        color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        ariaLabel: 'Este evento ha sido cancelado',
      };
    }

    if (event.is_past) {
      if (event.user_attendance_status === 'attended') {
        return {
          status: 'attended',
          label: 'Asististe',
          icon: CheckCircle,
          color:
            'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
          ariaLabel: 'Asististe a este evento',
        };
      }
      if (event.user_attendance_status === 'no_show') {
        return {
          status: 'no_show',
          label: 'No Asististe',
          icon: XCircle,
          color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
          ariaLabel: 'No asististe a este evento',
        };
      }
      return {
        status: 'completed',
        label: 'Evento Finalizado',
        icon: CheckCircle,
        color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
        ariaLabel: 'Este evento ya finalizó',
      };
    }

    if (isRegistered) {
      return {
        status: 'registered',
        label: 'Registrado',
        icon: CheckCircle,
        color:
          'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        ariaLabel: 'Estás registrado para este evento',
      };
    }

    if (event.is_full) {
      return {
        status: 'full',
        label: 'Evento Lleno',
        icon: XCircle,
        color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        ariaLabel: 'Este evento ha alcanzado su capacidad máxima',
      };
    }

    if (!event.registration_open) {
      return {
        status: 'closed',
        label: 'Registro Cerrado',
        icon: AlertCircle,
        color:
          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        ariaLabel: 'El registro para este evento está cerrado',
      };
    }

    if (canRegister) {
      return {
        status: 'available',
        label: 'Disponible',
        icon: UserPlus,
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        ariaLabel: 'Puedes registrarte para este evento',
      };
    }

    return null;
  };

  // Get event type color
  const getEventTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      academic:
        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      social: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      sports: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      cultural:
        'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      meeting:
        'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      workshop:
        'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      conference:
        'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
      other: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    };
    return colors[type] || colors.other;
  };

  // Get attendance capacity status
  const getCapacityStatus = () => {
    if (!event.max_attendees) return null;

    const percentage = (event.attendee_count / event.max_attendees) * 100;
    if (percentage >= 100) {
      return {
        level: 'full',
        color: 'text-red-600 dark:text-red-400',
        percentage: 100,
        label: 'Lleno',
      };
    }
    if (percentage >= 80) {
      return {
        level: 'high',
        color: 'text-orange-600 dark:text-orange-400',
        percentage: Math.round(percentage),
        label: 'Casi lleno',
      };
    }
    if (percentage >= 50) {
      return {
        level: 'medium',
        color: 'text-yellow-600 dark:text-yellow-400',
        percentage: Math.round(percentage),
        label: 'Medio lleno',
      };
    }
    return {
      level: 'low',
      color: 'text-green-600 dark:text-green-400',
      percentage: Math.round(percentage),
      label: 'Disponible',
    };
  };

  const renderActions = () => {
    if (!showActions) return null;

    const actions = [];

    // View action (always available)
    if (onView) {
      actions.push(
        <Button
          key='view'
          variant='outline'
          size='sm'
          onClick={() => handleAction(() => onView(event.event_id), 'view')}
          disabled={actionLoading !== null}
          className='flex items-center gap-2 touch-manipulation min-h-[44px] min-w-[44px] transition-all duration-200 hover:scale-105 active:scale-95'
          aria-label={`Ver detalles del evento ${event.title}`}
          aria-describedby={`event-${event.event_id}-description`}
        >
          <Eye className='w-4 h-4' aria-hidden='true' />
          {actionLoading === 'view' ? (
            <>
              <span
                className='animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full'
                aria-hidden='true'
              />
              <span className='sr-only'>Cargando...</span>
            </>
          ) : (
            <>
              <span className='hidden sm:inline'>Ver Detalles</span>
              <span className='sm:hidden'>Ver</span>
            </>
          )}
        </Button>
      );
    }

    // Management actions for organizers/admin
    if (canManage && onManage) {
      actions.push(
        <Button
          key='manage'
          variant='default'
          size='sm'
          onClick={() => handleAction(() => onManage(event.event_id), 'manage')}
          disabled={actionLoading !== null}
          className='flex items-center gap-2 touch-manipulation min-h-[44px] min-w-[44px] transition-all duration-200 hover:scale-105 active:scale-95'
          aria-label={`Gestionar evento ${event.title}. Acceso a configuración, asistentes y estadísticas`}
        >
          <Settings className='w-4 h-4' aria-hidden='true' />
          {actionLoading === 'manage' ? (
            <>
              <span
                className='animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full'
                aria-hidden='true'
              />
              <span className='sr-only'>Cargando gestión...</span>
            </>
          ) : (
            <>
              <span className='hidden sm:inline'>Gestionar</span>
              <span className='sm:hidden'>Admin</span>
            </>
          )}
        </Button>
      );
    }

    // Student registration actions
    if (user?.role === 'student' && event.requires_registration) {
      if (isRegistered) {
        if (onUnregister && !event.is_past) {
          actions.push(
            <Button
              key='unregister'
              variant='destructive'
              size='sm'
              onClick={() =>
                handleAction(() => onUnregister(event.event_id), 'unregister')
              }
              disabled={actionLoading !== null}
              className='flex items-center gap-2 touch-manipulation min-h-[44px] min-w-[44px] transition-all duration-200 hover:scale-105 active:scale-95'
              aria-label={`Cancelar registro para el evento ${event.title}. Esta acción requerirá confirmación`}
              aria-describedby={`event-${event.event_id}-unregister-warning`}
            >
              <UserMinus className='w-4 h-4' aria-hidden='true' />
              {actionLoading === 'unregister' ? (
                <>
                  <span
                    className='animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full'
                    aria-hidden='true'
                  />
                  <span className='sr-only'>Cancelando registro...</span>
                </>
              ) : (
                'Cancelar'
              )}
              <div
                id={`event-${event.event_id}-unregister-warning`}
                className='sr-only'
              >
                Al cancelar tu registro perderás tu lugar en el evento
              </div>
            </Button>
          );
        }
      } else if (canRegister && onRegister) {
        actions.push(
          <Button
            key='register'
            variant='default'
            size='sm'
            onClick={() =>
              handleAction(() => onRegister(event.event_id), 'register')
            }
            disabled={actionLoading !== null}
            className='flex items-center gap-2 touch-manipulation min-h-[44px] min-w-[44px] transition-all duration-200 hover:scale-105 active:scale-95 bg-primary hover:bg-primary/90'
            aria-label={`Registrarse para el evento ${event.title}. El registro es gratuito y se confirmará inmediatamente`}
            aria-describedby={`event-${event.event_id}-register-info`}
          >
            <UserPlus className='w-4 h-4' aria-hidden='true' />
            {actionLoading === 'register' ? (
              <>
                <span
                  className='animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full'
                  aria-hidden='true'
                />
                <span className='sr-only'>Registrándose...</span>
              </>
            ) : (
              'Registrarse'
            )}
            <div
              id={`event-${event.event_id}-register-info`}
              className='sr-only'
            >
              Tu registro será confirmado inmediatamente
            </div>
          </Button>
        );
      }
    }

    return actions;
  };

  // Render attendance count with visual indicator
  const renderAttendanceCount = () => {
    if (!event.max_attendees) {
      return (
        <div
          className='flex items-center gap-1 text-sm text-muted-foreground'
          aria-label={`${event.attendee_count} personas registradas`}
        >
          <Users className='w-4 h-4' aria-hidden='true' />
          <span>{event.attendee_count} registrados</span>
        </div>
      );
    }

    const capacityStatus = getCapacityStatus();
    if (!capacityStatus) return null;

    return (
      <div
        className='flex items-center gap-2'
        role='group'
        aria-label={`Información de asistencia: ${event.attendee_count} de ${event.max_attendees} registrados, ${capacityStatus.label}`}
      >
        <Users
          className={`w-4 h-4 ${capacityStatus.color}`}
          aria-hidden='true'
        />
        <div className='flex-1'>
          <div className='flex items-center justify-between text-sm'>
            <span className={`font-medium ${capacityStatus.color}`}>
              {event.attendee_count}/{event.max_attendees}
            </span>
            <span className={`text-xs ${capacityStatus.color}`}>
              {capacityStatus.percentage}%
            </span>
          </div>
          <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1'>
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${
                capacityStatus.level === 'full'
                  ? 'bg-red-500'
                  : capacityStatus.level === 'high'
                    ? 'bg-orange-500'
                    : capacityStatus.level === 'medium'
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
              }`}
              style={{ width: `${capacityStatus.percentage}%` }}
              role='progressbar'
              aria-valuenow={capacityStatus.percentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Capacidad del evento: ${capacityStatus.percentage}% lleno`}
            />
          </div>
          <div className='text-xs text-muted-foreground mt-1'>
            {capacityStatus.label}
          </div>
        </div>
      </div>
    );
  };

  const dateTime = formatEventDateTime();
  const registrationStatus = getRegistrationStatus();

  if (variant === 'compact') {
    const StatusIcon = registrationStatus?.icon;
    const AttendanceStatus = getAttendanceStatus();
    const AttendanceIcon = AttendanceStatus?.icon;

    return (
      <Card
        className='hover:shadow-md transition-all duration-200 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 group'
        role='article'
        aria-labelledby={`event-${event.event_id}-title`}
        aria-describedby={`event-${event.event_id}-description`}
        tabIndex={0}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (onView) {
              onView(event.event_id);
            }
          }
        }}
      >
        <CardContent className='p-4'>
          <div className='flex items-start gap-3'>
            {event.image && (
              <div className='relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0'>
                <Image
                  src={event.image}
                  alt={`Imagen del evento ${event.title}`}
                  fill
                  className='object-cover'
                />
              </div>
            )}
            <div className='flex-1 min-w-0'>
              <div className='flex items-start justify-between gap-2'>
                <div className='flex-1 min-w-0'>
                  <h3
                    id={`event-${event.event_id}-title`}
                    className='font-semibold text-sm truncate'
                  >
                    {event.title}
                  </h3>
                  <div className='flex items-center gap-2 text-xs text-muted-foreground mt-1'>
                    <div className='flex items-center gap-1'>
                      <Calendar className='w-3 h-3' aria-hidden='true' />
                      <span>{dateTime.startTime}</span>
                    </div>
                    {event.location && (
                      <div className='flex items-center gap-1'>
                        <MapPin className='w-3 h-3' aria-hidden='true' />
                        <span className='truncate'>{event.location}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className='flex flex-col gap-1 items-end'>
                  <Badge
                    className={`text-xs ${getEventTypeColor(event.event_type)}`}
                    aria-label={`Tipo: ${EVENT_TYPE_LABELS[event.event_type]}`}
                  >
                    {EVENT_TYPE_LABELS[event.event_type]}
                  </Badge>
                  {registrationStatus && StatusIcon && (
                    <Badge
                      className={`text-xs ${registrationStatus.color}`}
                      aria-label={registrationStatus.ariaLabel}
                    >
                      <StatusIcon className='w-3 h-3 mr-1' aria-hidden='true' />
                      {registrationStatus.label}
                    </Badge>
                  )}
                  {AttendanceStatus && AttendanceIcon && (
                    <Badge
                      className={`text-xs ${AttendanceStatus.color}`}
                      aria-label={AttendanceStatus.ariaLabel}
                    >
                      <AttendanceIcon
                        className='w-3 h-3 mr-1'
                        aria-hidden='true'
                      />
                      {AttendanceStatus.label}
                    </Badge>
                  )}
                </div>
              </div>
              <div className='mt-2'>
                <div className='flex items-center gap-2 text-xs'>
                  {event.target_groups.length > 0 && (
                    <div
                      className='text-muted-foreground truncate'
                      aria-label={`Organizado por: ${event.target_groups.map(g => g.name).join(', ')}`}
                    >
                      {event.target_groups.map(g => g.name).join(', ')}
                    </div>
                  )}
                </div>
                {event.requires_registration && event.max_attendees && (
                  <div className='mt-1'>
                    <div className='flex items-center gap-1 text-xs text-muted-foreground'>
                      <Users className='w-3 h-3' aria-hidden='true' />
                      <span>
                        {event.attendee_count}/{event.max_attendees}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div id={`event-${event.event_id}-description`} className='sr-only'>
            {event.description}
          </div>
          {showActions && (
            <div
              className='flex flex-wrap gap-2 mt-3'
              role='group'
              aria-label='Acciones del evento'
            >
              {renderActions()}
            </div>
          )}
        </CardContent>

        {/* Live region for status announcements */}
        {statusMessage && (
          <div
            className='sr-only'
            role='status'
            aria-live='polite'
            aria-atomic='true'
          >
            {statusMessage}
          </div>
        )}
      </Card>
    );
  }

  const StatusIcon = registrationStatus?.icon;
  const AttendanceStatus = getAttendanceStatus();
  const AttendanceIcon = AttendanceStatus?.icon;

  return (
    <Card
      className='hover:shadow-lg transition-all duration-200 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 group'
      role='article'
      aria-labelledby={`event-${event.event_id}-title`}
      aria-describedby={`event-${event.event_id}-description`}
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (onView) {
            onView(event.event_id);
          }
        }
      }}
    >
      <CardHeader className='pb-3'>
        <div className='flex items-start justify-between gap-3'>
          <div className='flex-1 min-w-0'>
            <div className='flex items-start gap-2 mb-2'>
              <h3
                id={`event-${event.event_id}-title`}
                className='font-semibold text-lg truncate flex-1'
              >
                {event.title}
              </h3>
              <div className='flex flex-col gap-1 items-end'>
                <Badge
                  className={getEventTypeColor(event.event_type)}
                  aria-label={`Tipo: ${EVENT_TYPE_LABELS[event.event_type]}`}
                >
                  {EVENT_TYPE_LABELS[event.event_type]}
                </Badge>
                {registrationStatus && StatusIcon && (
                  <Badge
                    className={`text-xs ${registrationStatus.color}`}
                    aria-label={registrationStatus.ariaLabel}
                  >
                    <StatusIcon className='w-3 h-3 mr-1' aria-hidden='true' />
                    {registrationStatus.label}
                  </Badge>
                )}
                {AttendanceStatus && AttendanceIcon && (
                  <Badge
                    className={`text-xs ${AttendanceStatus.color}`}
                    aria-label={AttendanceStatus.ariaLabel}
                  >
                    <AttendanceIcon
                      className='w-3 h-3 mr-1'
                      aria-hidden='true'
                    />
                    {AttendanceStatus.label}
                  </Badge>
                )}
              </div>
            </div>
            {event.target_groups.length > 0 && (
              <p
                className='text-sm text-muted-foreground'
                aria-label={`Organizado por: ${event.target_groups.map(g => g.name).join(', ')}`}
              >
                Organizado por:{' '}
                {event.target_groups.map(g => g.name).join(', ')}
              </p>
            )}
          </div>
        </div>
      </CardHeader>

      {event.image && (
        <div className='relative w-full h-48 overflow-hidden'>
          <Image
            src={event.image}
            alt={`Imagen del evento ${event.title}`}
            fill
            className='object-cover'
          />
        </div>
      )}

      <CardContent className='pt-4'>
        <p
          id={`event-${event.event_id}-description`}
          className='text-sm text-muted-foreground mb-4 line-clamp-3'
        >
          {event.description}
        </p>

        {/* Event details */}
        <div className='space-y-3 mb-4'>
          <div
            className='flex items-center gap-2 text-sm'
            aria-label={`Fecha: ${dateTime.date}`}
          >
            <Calendar
              className='w-4 h-4 text-blue-600 dark:text-blue-400'
              aria-hidden='true'
            />
            <span className='font-medium'>{dateTime.date}</span>
          </div>
          <div
            className='flex items-center gap-2 text-sm'
            aria-label={`Horario: ${dateTime.time}`}
          >
            <Clock
              className='w-4 h-4 text-green-600 dark:text-green-400'
              aria-hidden='true'
            />
            <span>{dateTime.time}</span>
          </div>
          {event.location && (
            <div
              className='flex items-center gap-2 text-sm'
              aria-label={`Ubicación: ${event.location}`}
            >
              <MapPin
                className='w-4 h-4 text-red-600 dark:text-red-400'
                aria-hidden='true'
              />
              <span>{event.location}</span>
            </div>
          )}
        </div>

        {/* Attendance information */}
        {event.requires_registration && (
          <div className='mb-4'>{renderAttendanceCount()}</div>
        )}
      </CardContent>

      <CardFooter className='pt-2'>
        <div
          className='flex flex-wrap gap-2 w-full'
          role='group'
          aria-label='Acciones del evento'
        >
          {renderActions()}
        </div>
      </CardFooter>

      {/* Live region for status announcements */}
      {statusMessage && (
        <div
          className='sr-only'
          role='status'
          aria-live='polite'
          aria-atomic='true'
        >
          {statusMessage}
        </div>
      )}
    </Card>
  );
}
