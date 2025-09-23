'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  UserPlus,
  UserMinus,
  Share2,
  CalendarPlus,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  AlertCircle,
  CalendarX,
  ExternalLink,
  Copy,
  Facebook,
  Twitter,
  Linkedin,
  Mail,
} from 'lucide-react';
import {
  Event,
  EventAttendee,
  EVENT_TYPE_LABELS,
  EVENT_STATUS_LABELS,
  ATTENDANCE_STATUS_LABELS,
} from '@/lib/api/events';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface EventDetailContentProps {
  event: Event;
  attendees: EventAttendee[];
  relatedEvents: Event[];
  isLoadingAttendees: boolean;
  isLoadingRelated: boolean;
  onRegister: (notes?: string) => void;
  onUnregister: () => void;
  onViewEvent: (eventId: string) => void;
}

export default function EventDetailContent({
  event,
  attendees,
  relatedEvents,
  isLoadingAttendees,
  isLoadingRelated,
  onRegister,
  onUnregister,
  onViewEvent,
}: EventDetailContentProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [showAttendees, setShowAttendees] = useState(false);
  const [registrationNotes, setRegistrationNotes] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isUnregistering, setIsUnregistering] = useState(false);
  const [showRegistrationDialog, setShowRegistrationDialog] = useState(false);

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

    const duration = event.duration_hours
      ? `${event.duration_hours} horas`
      : `${Math.round(((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)) * 10) / 10} horas`;

    return {
      date,
      time: `${startTime} - ${endTime}`,
      startTime,
      endTime,
      duration,
    };
  };

  // Get registration status
  const getRegistrationStatus = () => {
    if (event.status === 'cancelled') {
      return {
        status: 'cancelled',
        label: 'Evento Cancelado',
        icon: CalendarX,
        color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        description: 'Este evento ha sido cancelado',
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
          description: 'Asististe a este evento',
        };
      }
      if (event.user_attendance_status === 'no_show') {
        return {
          status: 'no_show',
          label: 'No Asististe',
          icon: XCircle,
          color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
          description: 'No asististe a este evento',
        };
      }
      return {
        status: 'completed',
        label: 'Evento Finalizado',
        icon: CheckCircle,
        color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
        description: 'Este evento ya finalizó',
      };
    }

    if (isRegistered) {
      return {
        status: 'registered',
        label: 'Registrado',
        icon: CheckCircle,
        color:
          'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        description: 'Estás registrado para este evento',
      };
    }

    if (event.is_full) {
      return {
        status: 'full',
        label: 'Evento Lleno',
        icon: XCircle,
        color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        description: 'Este evento ha alcanzado su capacidad máxima',
      };
    }

    if (!event.registration_open) {
      return {
        status: 'closed',
        label: 'Registro Cerrado',
        icon: AlertCircle,
        color:
          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        description: 'El registro para este evento está cerrado',
      };
    }

    if (canRegister) {
      return {
        status: 'available',
        label: 'Disponible',
        icon: UserPlus,
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        description: 'Puedes registrarte para este evento',
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

  // Handle registration
  const handleRegister = async () => {
    setIsRegistering(true);
    try {
      await onRegister(registrationNotes.trim() || undefined);
      setShowRegistrationDialog(false);
      setRegistrationNotes('');
    } finally {
      setIsRegistering(false);
    }
  };

  // Handle unregistration
  const handleUnregister = async () => {
    setIsUnregistering(true);
    try {
      await onUnregister();
    } finally {
      setIsUnregistering(false);
    }
  };

  // Handle social sharing
  const handleShare = async (platform: string) => {
    const eventUrl = window.location.href;
    const eventTitle = event.title;
    const eventDescription = event.description.substring(0, 200) + '...';

    let shareUrl = '';
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(eventUrl)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(eventUrl)}&text=${encodeURIComponent(eventTitle)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(eventUrl)}`;
        break;
      case 'mail':
        shareUrl = `mailto:?subject=${encodeURIComponent(eventTitle)}&body=${encodeURIComponent(`${eventDescription}\n\n${eventUrl}`)}`;
        break;
      case 'copy':
        await navigator.clipboard.writeText(eventUrl);
        toast({
          title: 'Enlace copiado',
          description: 'El enlace del evento se ha copiado al portapapeles',
        });
        return;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };

  // Handle calendar download
  const handleCalendarDownload = () => {
    const startDate = new Date(event.start_datetime);
    const endDate = new Date(event.end_datetime);

    // Create ICS content
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Event Management System//EN',
      'BEGIN:VEVENT',
      `UID:${event.event_id}@eventsystem.com`,
      `DTSTART:${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTEND:${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.description}`,
      `LOCATION:${event.location}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    // Create and download file
    const blob = new Blob([icsContent], {
      type: 'text/calendar;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: 'Calendario descargado',
      description: 'El evento se ha agregado a tu calendario',
    });
  };

  const dateTime = formatEventDateTime();
  const registrationStatus = getRegistrationStatus();
  const StatusIcon = registrationStatus?.icon;

  return (
    <div className='space-y-6'>
      {/* Event Header */}
      <Card>
        <CardHeader>
          <div className='flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4'>
            <div className='flex-1'>
              <div className='flex items-start gap-3 mb-4'>
                <div className='flex-1'>
                  <h1 className='text-3xl font-bold mb-2'>{event.title}</h1>
                  <div className='flex items-center gap-2 mb-3'>
                    <Badge className={getEventTypeColor(event.event_type)}>
                      {EVENT_TYPE_LABELS[event.event_type]}
                    </Badge>
                    <Badge variant='outline'>
                      {EVENT_STATUS_LABELS[event.status]}
                    </Badge>
                    {registrationStatus && StatusIcon && (
                      <Badge className={registrationStatus.color}>
                        <StatusIcon className='w-3 h-3 mr-1' />
                        {registrationStatus.label}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className='flex items-center gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => handleShare('copy')}
                    className='flex items-center gap-2'
                  >
                    <Copy className='w-4 h-4' />
                    Copiar enlace
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={handleCalendarDownload}
                    className='flex items-center gap-2'
                  >
                    <CalendarPlus className='w-4 h-4' />
                    Agregar al calendario
                  </Button>
                </div>
              </div>

              {event.target_groups.length > 0 && (
                <p className='text-muted-foreground mb-4'>
                  Organizado por:{' '}
                  {event.target_groups.map(group => group.name).join(', ')}
                </p>
              )}
            </div>
          </div>
        </CardHeader>

        {event.image && (
          <div className='relative w-full h-64 lg:h-80 overflow-hidden'>
            <Image
              src={event.image}
              alt={`Imagen del evento ${event.title}`}
              fill
              className='object-cover'
            />
          </div>
        )}

        <CardContent className='pt-6'>
          <div className='prose max-w-none'>
            <p className='text-muted-foreground leading-relaxed'>
              {event.description}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Event Details */}
        <div className='lg:col-span-2 space-y-6'>
          {/* Event Information */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Calendar className='w-5 h-5' />
                Información del Evento
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-center gap-3'>
                <Calendar className='w-5 h-5 text-blue-600 dark:text-blue-400' />
                <div>
                  <p className='font-medium'>{dateTime.date}</p>
                  <p className='text-sm text-muted-foreground'>
                    {dateTime.time}
                  </p>
                </div>
              </div>

              <div className='flex items-center gap-3'>
                <Clock className='w-5 h-5 text-green-600 dark:text-green-400' />
                <div>
                  <p className='font-medium'>Duración</p>
                  <p className='text-sm text-muted-foreground'>
                    {dateTime.duration}
                  </p>
                </div>
              </div>

              <div className='flex items-center gap-3'>
                <MapPin className='w-5 h-5 text-red-600 dark:text-red-400' />
                <div>
                  <p className='font-medium'>Ubicación</p>
                  <p className='text-sm text-muted-foreground'>
                    {event.location}
                  </p>
                </div>
              </div>

              {event.requires_registration && (
                <div className='flex items-center gap-3'>
                  <Users className='w-5 h-5 text-purple-600 dark:text-purple-400' />
                  <div className='flex-1'>
                    <p className='font-medium'>Asistencia</p>
                    <p className='text-sm text-muted-foreground'>
                      {event.attendee_count} registrados
                      {event.max_attendees &&
                        ` de ${event.max_attendees} cupos`}
                    </p>
                    {event.max_attendees && (
                      <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2'>
                        <div
                          className='bg-primary h-2 rounded-full transition-all duration-300'
                          style={{
                            width: `${Math.min(
                              (event.attendee_count / event.max_attendees) *
                                100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {event.registration_deadline && (
                <div className='flex items-center gap-3'>
                  <AlertCircle className='w-5 h-5 text-orange-600 dark:text-orange-400' />
                  <div>
                    <p className='font-medium'>Fecha límite de registro</p>
                    <p className='text-sm text-muted-foreground'>
                      {new Date(event.registration_deadline).toLocaleDateString(
                        'es-ES',
                        {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        }
                      )}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Registration Actions */}
          {event.requires_registration && (
            <Card>
              <CardHeader>
                <CardTitle>Registro al Evento</CardTitle>
              </CardHeader>
              <CardContent>
                {registrationStatus && (
                  <div className='mb-4 p-4 rounded-lg bg-muted/50'>
                    <div className='flex items-center gap-2 mb-2'>
                      {StatusIcon && <StatusIcon className='w-5 h-5' />}
                      <p className='font-medium'>{registrationStatus.label}</p>
                    </div>
                    <p className='text-sm text-muted-foreground'>
                      {registrationStatus.description}
                    </p>
                  </div>
                )}

                {user?.role === 'student' && (
                  <div className='space-y-4'>
                    {isRegistered ? (
                      <div className='space-y-3'>
                        <p className='text-sm text-muted-foreground'>
                          Estás registrado para este evento.
                        </p>
                        {!event.is_past && (
                          <Button
                            variant='destructive'
                            onClick={handleUnregister}
                            disabled={isUnregistering}
                            className='flex items-center gap-2'
                          >
                            <UserMinus className='w-4 h-4' />
                            {isUnregistering
                              ? 'Cancelando...'
                              : 'Cancelar Registro'}
                          </Button>
                        )}
                      </div>
                    ) : canRegister ? (
                      <Dialog
                        open={showRegistrationDialog}
                        onOpenChange={setShowRegistrationDialog}
                      >
                        <DialogTrigger asChild>
                          <Button className='flex items-center gap-2'>
                            <UserPlus className='w-4 h-4' />
                            Registrarse al Evento
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Registrarse al Evento</DialogTitle>
                            <DialogDescription>
                              Confirma tu registro para &quot;{event.title}
                              &quot;
                            </DialogDescription>
                          </DialogHeader>
                          <div className='space-y-4'>
                            <div>
                              <label className='text-sm font-medium'>
                                Notas adicionales (opcional)
                              </label>
                              <Textarea
                                placeholder='Agrega cualquier información adicional...'
                                value={registrationNotes}
                                onChange={e =>
                                  setRegistrationNotes(e.target.value)
                                }
                                className='mt-1'
                                rows={3}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              variant='outline'
                              onClick={() => setShowRegistrationDialog(false)}
                            >
                              Cancelar
                            </Button>
                            <Button
                              onClick={handleRegister}
                              disabled={isRegistering}
                              className='flex items-center gap-2'
                            >
                              <UserPlus className='w-4 h-4' />
                              {isRegistering
                                ? 'Registrando...'
                                : 'Confirmar Registro'}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    ) : (
                      <p className='text-sm text-muted-foreground'>
                        {registrationStatus?.description ||
                          'No puedes registrarte para este evento'}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Social Sharing */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Share2 className='w-5 h-5' />
                Compartir Evento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='flex flex-wrap gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => handleShare('facebook')}
                  className='flex items-center gap-2'
                >
                  <Facebook className='w-4 h-4' />
                  Facebook
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => handleShare('twitter')}
                  className='flex items-center gap-2'
                >
                  <Twitter className='w-4 h-4' />
                  Twitter
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => handleShare('linkedin')}
                  className='flex items-center gap-2'
                >
                  <Linkedin className='w-4 h-4' />
                  LinkedIn
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => handleShare('mail')}
                  className='flex items-center gap-2'
                >
                  <Mail className='w-4 h-4' />
                  Email
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className='space-y-6'>
          {/* Attendees List (for organizers) */}
          {canManage && event.requires_registration && (
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <Users className='w-5 h-5' />
                    Asistentes ({attendees.length})
                  </div>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setShowAttendees(!showAttendees)}
                    className='flex items-center gap-2'
                  >
                    {showAttendees ? (
                      <EyeOff className='w-4 h-4' />
                    ) : (
                      <Eye className='w-4 h-4' />
                    )}
                    {showAttendees ? 'Ocultar' : 'Ver'}
                  </Button>
                </CardTitle>
              </CardHeader>
              {showAttendees && (
                <CardContent>
                  {isLoadingAttendees ? (
                    <div className='space-y-2'>
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className='animate-pulse'>
                          <div className='h-4 bg-muted rounded w-3/4'></div>
                        </div>
                      ))}
                    </div>
                  ) : attendees.length > 0 ? (
                    <div className='space-y-3 max-h-64 overflow-y-auto'>
                      {attendees.map(attendee => (
                        <div
                          key={attendee.attendance_id}
                          className='flex items-center justify-between p-2 rounded-lg bg-muted/50'
                        >
                          <div className='flex-1 min-w-0'>
                            <p className='font-medium text-sm truncate'>
                              {attendee.user_details.full_name}
                            </p>
                            <p className='text-xs text-muted-foreground'>
                              {attendee.user_details.student_id}
                            </p>
                          </div>
                          <Badge variant='outline' className='text-xs'>
                            {ATTENDANCE_STATUS_LABELS[attendee.status]}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className='text-sm text-muted-foreground text-center py-4'>
                      No hay asistentes registrados
                    </p>
                  )}
                </CardContent>
              )}
            </Card>
          )}

          {/* Related Events */}
          {relatedEvents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Calendar className='w-5 h-5' />
                  Eventos Relacionados
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingRelated ? (
                  <div className='space-y-3'>
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className='animate-pulse'>
                        <div className='h-20 bg-muted rounded'></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='space-y-3'>
                    {relatedEvents.slice(0, 3).map(relatedEvent => (
                      <div
                        key={relatedEvent.event_id}
                        className='p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer'
                        onClick={() => onViewEvent(relatedEvent.event_id)}
                      >
                        <h4 className='font-medium text-sm mb-1 line-clamp-2'>
                          {relatedEvent.title}
                        </h4>
                        <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                          <Calendar className='w-3 h-3' />
                          <span>
                            {new Date(
                              relatedEvent.start_datetime
                            ).toLocaleDateString('es-ES')}
                          </span>
                        </div>
                        <div className='flex items-center gap-2 text-xs text-muted-foreground mt-1'>
                          <MapPin className='w-3 h-3' />
                          <span className='truncate'>
                            {relatedEvent.location}
                          </span>
                        </div>
                      </div>
                    ))}
                    {relatedEvents.length > 3 && (
                      <Button
                        variant='outline'
                        size='sm'
                        className='w-full'
                        onClick={() => onViewEvent('')} // This would go to events list
                      >
                        Ver todos los eventos
                        <ExternalLink className='w-3 h-3 ml-1' />
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
