'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  Users,
  TrendingUp,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Target,
  Activity,
} from 'lucide-react';
import { Event, EventAttendee } from '@/lib/api/events';

interface EventAnalyticsProps {
  event: Event;
  attendees: EventAttendee[];
}

interface AnalyticsData {
  totalRegistrations: number;
  confirmedAttendees: number;
  actualAttendees: number;
  noShows: number;
  cancellations: number;
  attendanceRate: number;
  confirmationRate: number;
  registrationTrend: Array<{ date: string; count: number }>;
  statusDistribution: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  groupParticipation: Array<{ groupName: string; count: number }>;
}

export default function EventAnalytics({
  event,
  attendees,
}: EventAnalyticsProps) {
  const analyticsData = useMemo((): AnalyticsData => {
    const totalRegistrations = attendees.length;
    const confirmedAttendees = attendees.filter(
      a => a.status === 'confirmed'
    ).length;
    const actualAttendees = attendees.filter(
      a => a.status === 'attended'
    ).length;
    const noShows = attendees.filter(a => a.status === 'no_show').length;
    const cancellations = attendees.filter(
      a => a.status === 'cancelled'
    ).length;

    const attendanceRate =
      totalRegistrations > 0 ? (actualAttendees / totalRegistrations) * 100 : 0;
    const confirmationRate =
      totalRegistrations > 0
        ? (confirmedAttendees / totalRegistrations) * 100
        : 0;

    // Registration trend (last 7 days)
    const registrationTrend = attendees
      .map(attendee => ({
        date: new Date(attendee.registration_date).toISOString().split('T')[0],
        count: 1,
      }))
      .reduce(
        (acc, curr) => {
          const existing = acc.find(item => item.date === curr.date);
          if (existing) {
            existing.count += 1;
          } else {
            acc.push(curr);
          }
          return acc;
        },
        [] as Array<{ date: string; count: number }>
      )
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-7);

    // Status distribution
    const statusCounts = attendees.reduce(
      (acc, attendee) => {
        acc[attendee.status] = (acc[attendee.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const statusDistribution = Object.entries(statusCounts).map(
      ([status, count]) => ({
        status,
        count,
        percentage:
          totalRegistrations > 0 ? (count / totalRegistrations) * 100 : 0,
      })
    );

    // Group participation (if event has target groups)
    const groupParticipation =
      event.target_groups?.map(group => {
        const groupAttendees = attendees.filter(
          attendee =>
            // This would need to be enhanced based on how group membership is tracked
            // For now, we'll show all attendees as part of the first group
            group.group_id === event.target_groups[0]?.group_id
        );
        return {
          groupName: group.name,
          count: groupAttendees.length,
        };
      }) || [];

    return {
      totalRegistrations,
      confirmedAttendees,
      actualAttendees,
      noShows,
      cancellations,
      attendanceRate,
      confirmationRate,
      registrationTrend,
      statusDistribution,
      groupParticipation,
    };
  }, [event, attendees]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'registered':
        return 'bg-blue-100 text-blue-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'attended':
        return 'bg-emerald-100 text-emerald-800';
      case 'no_show':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      registered: 'Registrado',
      confirmed: 'Confirmado',
      attended: 'Asistió',
      no_show: 'No asistió',
      cancelled: 'Cancelado',
    };
    return labels[status] || status;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className='space-y-6'>
      {/* Key Metrics */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-muted-foreground'>
                  Total Registros
                </p>
                <p className='text-2xl font-bold'>
                  {analyticsData.totalRegistrations}
                </p>
              </div>
              <Users className='h-8 w-8 text-muted-foreground' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-muted-foreground'>
                  Asistencia Real
                </p>
                <p className='text-2xl font-bold'>
                  {analyticsData.actualAttendees}
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
                  Tasa de Asistencia
                </p>
                <p className='text-2xl font-bold'>
                  {analyticsData.attendanceRate.toFixed(1)}%
                </p>
              </div>
              <TrendingUp className='h-8 w-8 text-blue-600' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-muted-foreground'>
                  Tasa de Confirmación
                </p>
                <p className='text-2xl font-bold'>
                  {analyticsData.confirmationRate.toFixed(1)}%
                </p>
              </div>
              <Target className='h-8 w-8 text-purple-600' />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Event Details */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Calendar className='h-5 w-5' />
              Información del Evento
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex justify-between items-center'>
              <span className='text-sm text-muted-foreground'>Capacidad</span>
              <span className='font-semibold'>
                {event.max_attendees ? `${event.max_attendees}` : 'Sin límite'}
              </span>
            </div>
            <div className='flex justify-between items-center'>
              <span className='text-sm text-muted-foreground'>Ocupación</span>
              <span className='font-semibold'>
                {event.max_attendees
                  ? `${((analyticsData.totalRegistrations / event.max_attendees) * 100).toFixed(1)}%`
                  : 'N/A'}
              </span>
            </div>
            <div className='flex justify-between items-center'>
              <span className='text-sm text-muted-foreground'>Duración</span>
              <span className='font-semibold'>
                {event.duration_hours} horas
              </span>
            </div>
            <div className='flex justify-between items-center'>
              <span className='text-sm text-muted-foreground'>Tipo</span>
              <Badge variant='outline'>{event.event_type}</Badge>
            </div>
            <div className='flex justify-between items-center'>
              <span className='text-sm text-muted-foreground'>Estado</span>
              <Badge
                variant={
                  event.status === 'published'
                    ? 'default'
                    : event.status === 'cancelled'
                      ? 'destructive'
                      : 'secondary'
                }
              >
                {event.status}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <BarChart3 className='h-5 w-5' />
              Distribución por Estado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              {analyticsData.statusDistribution.map(item => (
                <div key={item.status} className='space-y-2'>
                  <div className='flex justify-between items-center'>
                    <div className='flex items-center gap-2'>
                      <Badge
                        className={`${getStatusColor(item.status)} border-0`}
                      >
                        {getStatusLabel(item.status)}
                      </Badge>
                    </div>
                    <span className='text-sm font-medium'>
                      {item.count} ({item.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className='w-full bg-gray-200 rounded-full h-2'>
                    <div
                      className={`h-2 rounded-full ${
                        item.status === 'attended'
                          ? 'bg-emerald-500'
                          : item.status === 'confirmed'
                            ? 'bg-green-500'
                            : item.status === 'registered'
                              ? 'bg-blue-500'
                              : item.status === 'no_show'
                                ? 'bg-red-500'
                                : 'bg-gray-500'
                      }`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Registration Trend */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Activity className='h-5 w-5' />
            Tendencia de Registros (Últimos 7 días)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {analyticsData.registrationTrend.length > 0 ? (
            <div className='space-y-4'>
              <div className='grid grid-cols-7 gap-2'>
                {analyticsData.registrationTrend.map((item, index) => (
                  <div key={index} className='text-center'>
                    <div className='text-xs text-muted-foreground mb-1'>
                      {formatDate(item.date)}
                    </div>
                    <div className='bg-blue-100 rounded-lg p-2 min-h-[40px] flex items-center justify-center'>
                      <span className='text-sm font-semibold text-blue-800'>
                        {item.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className='text-sm text-muted-foreground text-center'>
                Total de registros en los últimos 7 días:{' '}
                {analyticsData.registrationTrend.reduce(
                  (sum, item) => sum + item.count,
                  0
                )}
              </div>
            </div>
          ) : (
            <div className='text-center py-8 text-muted-foreground'>
              <Clock className='h-8 w-8 mx-auto mb-2' />
              <p>No hay datos de registro disponibles</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Group Participation */}
      {analyticsData.groupParticipation.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Users className='h-5 w-5' />
              Participación por Grupo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              {analyticsData.groupParticipation.map((group, index) => (
                <div key={index} className='flex justify-between items-center'>
                  <span className='text-sm font-medium'>{group.groupName}</span>
                  <div className='flex items-center gap-2'>
                    <span className='text-sm text-muted-foreground'>
                      {group.count} asistentes
                    </span>
                    <Badge variant='outline'>
                      {analyticsData.totalRegistrations > 0
                        ? `${((group.count / analyticsData.totalRegistrations) * 100).toFixed(1)}%`
                        : '0%'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <TrendingUp className='h-5 w-5' />
            Insights de Rendimiento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {analyticsData.attendanceRate >= 80 && (
              <div className='flex items-start gap-3 p-3 bg-green-50 rounded-lg'>
                <CheckCircle className='h-5 w-5 text-green-600 mt-0.5' />
                <div>
                  <p className='text-sm font-medium text-green-800'>
                    Excelente asistencia
                  </p>
                  <p className='text-xs text-green-700'>
                    La tasa de asistencia del{' '}
                    {analyticsData.attendanceRate.toFixed(1)}% es muy buena.
                  </p>
                </div>
              </div>
            )}

            {analyticsData.attendanceRate < 60 &&
              analyticsData.attendanceRate > 0 && (
                <div className='flex items-start gap-3 p-3 bg-yellow-50 rounded-lg'>
                  <AlertCircle className='h-5 w-5 text-yellow-600 mt-0.5' />
                  <div>
                    <p className='text-sm font-medium text-yellow-800'>
                      Asistencia baja
                    </p>
                    <p className='text-xs text-yellow-700'>
                      La tasa de asistencia del{' '}
                      {analyticsData.attendanceRate.toFixed(1)}% podría
                      mejorarse.
                    </p>
                  </div>
                </div>
              )}

            {analyticsData.noShows > analyticsData.actualAttendees && (
              <div className='flex items-start gap-3 p-3 bg-red-50 rounded-lg'>
                <XCircle className='h-5 w-5 text-red-600 mt-0.5' />
                <div>
                  <p className='text-sm font-medium text-red-800'>
                    Muchas ausencias
                  </p>
                  <p className='text-xs text-red-700'>
                    Hay más ausencias ({analyticsData.noShows}) que asistentes (
                    {analyticsData.actualAttendees}).
                  </p>
                </div>
              </div>
            )}

            {analyticsData.totalRegistrations === 0 && (
              <div className='flex items-start gap-3 p-3 bg-gray-50 rounded-lg'>
                <AlertCircle className='h-5 w-5 text-gray-600 mt-0.5' />
                <div>
                  <p className='text-sm font-medium text-gray-800'>
                    Sin registros
                  </p>
                  <p className='text-xs text-gray-700'>
                    No hay asistentes registrados para este evento.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
