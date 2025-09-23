'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Eye,
  UserPlus,
  Sparkles,
} from 'lucide-react';
import { eventsApi, EVENT_TYPE_LABELS } from '@/lib/api/events';
import { DashboardEvent } from '@/lib/api/dashboard';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface EventRecommendationsProps {
  events: Array<DashboardEvent & { recommendation_reason: string }>;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export default function EventRecommendations({
  events,
  isLoading = false,
  onRefresh,
}: EventRecommendationsProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleRegister = async (eventId: string) => {
    setActionLoading(eventId);
    try {
      await eventsApi.register(eventId);
      toast({
        title: 'Registro Exitoso',
        description: 'Te has registrado para el evento recomendado',
      });
      onRefresh?.();
    } catch (error) {
      console.error('Error registering for event:', error);
      toast({
        title: 'Error',
        description: 'No se pudo registrar para el evento',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewEvent = (eventId: string) => {
    router.push(`/dashboard/student/events/${eventId}`);
  };

  const formatEventDateTime = (event: DashboardEvent) => {
    const startDate = new Date(event.start_datetime);
    const endDate = new Date(event.end_datetime);

    const date = startDate.toLocaleDateString('es-ES', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

    const startTime = startDate.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return { date, time: startTime };
  };

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

  const getRecommendationReason = (
    event: DashboardEvent & { recommendation_reason: string }
  ) => {
    // This would typically come from the backend, but we'll provide fallbacks
    const reasons = [
      'Basado en tus grupos',
      'Eventos populares',
      'Similar a tus intereses',
      'Recomendado para ti',
    ];
    return (
      event.recommendation_reason ||
      reasons[Math.floor(Math.random() * reasons.length)]
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Sparkles className='w-5 h-5' />
            Eventos Recomendados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className='animate-pulse'>
                <div className='h-4 bg-muted rounded w-3/4 mb-2'></div>
                <div className='h-3 bg-muted rounded w-1/2'></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Sparkles className='w-5 h-5' />
            Eventos Recomendados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-center py-6'>
            <Sparkles className='w-10 h-10 text-muted-foreground mx-auto mb-3' />
            <h3 className='text-lg font-semibold mb-2'>
              No hay recomendaciones
            </h3>
            <p className='text-muted-foreground text-sm'>
              Únete a más grupos para recibir recomendaciones personalizadas
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2'>
            <Sparkles className='w-5 h-5' />
            Eventos Recomendados
          </CardTitle>
          <Button variant='outline' size='sm' asChild>
            <Link href='/dashboard/student/events'>Explorar Más</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {events.slice(0, 2).map(event => {
            const dateTime = formatEventDateTime(event);
            const isRegistered =
              event.is_registered ||
              (event.user_attendance_status &&
                ['registered', 'confirmed', 'attended'].includes(
                  event.user_attendance_status
                ));

            return (
              <div
                key={event.event_id}
                className='p-4 border rounded-lg hover:shadow-md transition-shadow bg-gradient-to-r from-primary/5 to-transparent'
              >
                <div className='flex items-start justify-between gap-3'>
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-start gap-2 mb-2'>
                      <h4 className='font-semibold text-sm truncate flex-1'>
                        {event.title}
                      </h4>
                      <div className='flex gap-1'>
                        <Badge
                          className={`text-xs ${getEventTypeColor(event.event_type)}`}
                        >
                          {EVENT_TYPE_LABELS[event.event_type]}
                        </Badge>
                        <Badge variant='secondary' className='text-xs'>
                          <Sparkles className='w-3 h-3 mr-1' />
                          Recomendado
                        </Badge>
                      </div>
                    </div>

                    <div className='space-y-1 text-xs text-muted-foreground mb-2'>
                      <div className='flex items-center gap-1'>
                        <Calendar className='w-3 h-3' />
                        <span>{dateTime.date}</span>
                        <Clock className='w-3 h-3 ml-2' />
                        <span>{dateTime.time}</span>
                      </div>
                      {event.location && (
                        <div className='flex items-center gap-1'>
                          <MapPin className='w-3 h-3' />
                          <span className='truncate'>{event.location}</span>
                        </div>
                      )}
                      <div className='flex items-center gap-1'>
                        <Users className='w-3 h-3' />
                        <span>
                          {event.target_groups.map(g => g.name).join(', ')}
                        </span>
                      </div>
                    </div>

                    <div className='text-xs text-primary font-medium'>
                      💡 {getRecommendationReason(event)}
                    </div>
                  </div>
                </div>

                <div className='flex gap-2 mt-3'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => handleViewEvent(event.event_id)}
                    className='flex items-center gap-1'
                  >
                    <Eye className='w-3 h-3' />
                    Ver
                  </Button>

                  {event.requires_registration && !isRegistered && (
                    <Button
                      size='sm'
                      onClick={() => handleRegister(event.event_id)}
                      disabled={
                        actionLoading === event.event_id ||
                        event.is_full ||
                        !event.registration_open ||
                        event.is_past
                      }
                      className='flex items-center gap-1'
                    >
                      <UserPlus className='w-3 h-3' />
                      Registrarse
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
