'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Calendar,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  Plus,
  BarChart3,
  Eye,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { eventsApi, Event } from '@/lib/api/events';

interface EventManagementOverviewProps {
  groupId?: string;
}

interface EventStats {
  totalEvents: number;
  publishedEvents: number;
  draftEvents: number;
  cancelledEvents: number;
  upcomingEvents: number;
  pastEvents: number;
  totalAttendees: number;
  averageAttendance: number;
  attendanceRate: number;
}

export default function EventManagementOverview({
  groupId,
}: EventManagementOverviewProps) {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<EventStats>({
    totalEvents: 0,
    publishedEvents: 0,
    draftEvents: 0,
    cancelledEvents: 0,
    upcomingEvents: 0,
    pastEvents: 0,
    totalAttendees: 0,
    averageAttendance: 0,
    attendanceRate: 0,
  });

  useEffect(() => {
    const loadEvents = async () => {
      try {
        setIsLoading(true);
        const eventsData = await eventsApi.getAll({});
        setEvents(eventsData);

        // Calculate stats
        const now = new Date();
        const upcomingEvents = eventsData.filter(
          event => new Date(event.start_datetime) > now
        );
        const pastEvents = eventsData.filter(
          event => new Date(event.start_datetime) <= now
        );

        const totalAttendees = eventsData.reduce(
          (sum, event) => sum + event.attendee_count,
          0
        );

        const publishedEvents = eventsData.filter(
          event => event.status === 'published'
        );

        const averageAttendance =
          publishedEvents.length > 0
            ? totalAttendees / publishedEvents.length
            : 0;

        const attendanceRate =
          publishedEvents.length > 0
            ? (publishedEvents.reduce(
                (sum, event) => sum + event.attendee_count,
                0
              ) /
                publishedEvents.reduce(
                  (sum, event) => sum + (event.max_attendees || 0),
                  0
                )) *
              100
            : 0;

        setStats({
          totalEvents: eventsData.length,
          publishedEvents: publishedEvents.length,
          draftEvents: eventsData.filter(e => e.status === 'draft').length,
          cancelledEvents: eventsData.filter(e => e.status === 'cancelled')
            .length,
          upcomingEvents: upcomingEvents.length,
          pastEvents: pastEvents.length,
          totalAttendees,
          averageAttendance: Math.round(averageAttendance),
          attendanceRate: Math.round(attendanceRate),
        });
      } catch (error) {
        console.error('Error loading events:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadEvents();
  }, [groupId]);

  const recentEvents = events
    .sort(
      (a, b) =>
        new Date(b.start_datetime).getTime() -
        new Date(a.start_datetime).getTime()
    )
    .slice(0, 5);

  if (isLoading) {
    return (
      <div className='space-y-6'>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className='p-6'>
                <div className='animate-pulse'>
                  <div className='h-4 bg-muted rounded w-3/4 mb-2'></div>
                  <div className='h-8 bg-muted rounded w-1/2'></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Event Statistics Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-muted-foreground'>
                  Total Eventos
                </p>
                <p className='text-2xl font-bold'>{stats.totalEvents}</p>
              </div>
              <Calendar className='h-8 w-8 text-blue-600' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-muted-foreground'>
                  Eventos Activos
                </p>
                <p className='text-2xl font-bold text-green-600'>
                  {stats.publishedEvents}
                </p>
              </div>
              <CheckCircle className='h-8 w-8 text-green-600' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-muted-foreground'>
                  Próximos Eventos
                </p>
                <p className='text-2xl font-bold text-orange-600'>
                  {stats.upcomingEvents}
                </p>
              </div>
              <Clock className='h-8 w-8 text-orange-600' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-muted-foreground'>
                  Total Asistentes
                </p>
                <p className='text-2xl font-bold text-purple-600'>
                  {stats.totalAttendees}
                </p>
              </div>
              <Users className='h-8 w-8 text-purple-600' />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Analytics */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <TrendingUp className='h-5 w-5' />
              Métricas de Asistencia
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-2'>
              <div className='flex justify-between text-sm'>
                <span>Promedio de Asistencia</span>
                <span className='font-medium'>
                  {stats.averageAttendance} personas
                </span>
              </div>
              <Progress
                value={Math.min(stats.averageAttendance * 2, 100)}
                className='h-2'
              />
            </div>

            <div className='space-y-2'>
              <div className='flex justify-between text-sm'>
                <span>Tasa de Asistencia</span>
                <span className='font-medium'>{stats.attendanceRate}%</span>
              </div>
              <Progress value={stats.attendanceRate} className='h-2' />
            </div>

            <div className='grid grid-cols-2 gap-4 pt-4'>
              <div className='text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg'>
                <p className='text-2xl font-bold text-green-600'>
                  {stats.publishedEvents}
                </p>
                <p className='text-sm text-green-600'>Eventos Publicados</p>
              </div>
              <div className='text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg'>
                <p className='text-2xl font-bold text-yellow-600'>
                  {stats.draftEvents}
                </p>
                <p className='text-sm text-yellow-600'>Borradores</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <BarChart3 className='h-5 w-5' />
              Estado de Eventos
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <div className='w-3 h-3 rounded-full bg-green-500'></div>
                  <span className='text-sm'>Publicados</span>
                </div>
                <Badge variant='secondary'>{stats.publishedEvents}</Badge>
              </div>

              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <div className='w-3 h-3 rounded-full bg-yellow-500'></div>
                  <span className='text-sm'>Borradores</span>
                </div>
                <Badge variant='secondary'>{stats.draftEvents}</Badge>
              </div>

              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <div className='w-3 h-3 rounded-full bg-red-500'></div>
                  <span className='text-sm'>Cancelados</span>
                </div>
                <Badge variant='secondary'>{stats.cancelledEvents}</Badge>
              </div>
            </div>

            <div className='pt-4 border-t'>
              <Button
                className='w-full'
                onClick={() =>
                  router.push('/dashboard/president/events/create')
                }
              >
                <Plus className='h-4 w-4 mr-2' />
                Crear Nuevo Evento
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Events */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Calendar className='h-5 w-5' />
              Eventos Recientes
            </div>
            <Button
              variant='outline'
              size='sm'
              onClick={() => router.push('/dashboard/president/events')}
            >
              <Eye className='h-4 w-4 mr-2' />
              Ver Todos
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentEvents.length === 0 ? (
            <div className='text-center py-8 text-muted-foreground'>
              <Calendar className='h-12 w-12 mx-auto mb-4 opacity-50' />
              <p>No hay eventos creados aún</p>
              <Button
                className='mt-4'
                onClick={() =>
                  router.push('/dashboard/president/events/create')
                }
              >
                <Plus className='h-4 w-4 mr-2' />
                Crear Primer Evento
              </Button>
            </div>
          ) : (
            <div className='space-y-3'>
              {recentEvents.map(event => (
                <div
                  key={event.event_id}
                  className='flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors'
                >
                  <div className='flex-1'>
                    <div className='flex items-center gap-2 mb-1'>
                      <h4 className='font-medium'>{event.title}</h4>
                      <Badge
                        variant={
                          event.status === 'published'
                            ? 'default'
                            : event.status === 'cancelled'
                              ? 'destructive'
                              : 'secondary'
                        }
                        className='text-xs'
                      >
                        {event.status}
                      </Badge>
                    </div>
                    <div className='flex items-center gap-4 text-sm text-muted-foreground'>
                      <span>
                        {new Date(event.start_datetime).toLocaleDateString()}
                      </span>
                      <span>{event.location}</span>
                      <span>{event.attendee_count} asistentes</span>
                    </div>
                  </div>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() =>
                      router.push(
                        `/dashboard/president/events/${event.event_id}`
                      )
                    }
                  >
                    Gestionar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
