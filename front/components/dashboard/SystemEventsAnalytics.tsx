'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Calendar,
  Users,
  TrendingUp,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';

interface SystemEventsAnalyticsProps {
  analyticsData: {
    totalEvents: number;
    publishedEvents: number;
    draftEvents: number;
    cancelledEvents: number;
    upcomingEvents: number;
    pastEvents: number;
    totalAttendees: number;
    averageAttendance: number;
    attendanceRate: number;
    eventsByType: Array<{
      type: string;
      count: number;
      percentage: number;
    }>;
    eventsByStatus: Array<{
      status: string;
      count: number;
      percentage: number;
    }>;
    monthlyTrend: Array<{
      month: string;
      events: number;
      attendees: number;
    }>;
    topPerformingEvents: Array<{
      event_id: string;
      title: string;
      group_name: string;
      attendee_count: number;
      attendance_rate: number;
    }>;
    recentEvents: Array<{
      event_id: string;
      title: string;
      group_name: string;
      start_datetime: string;
      attendee_count: number;
      status: string;
    }>;
  };
}

export default function SystemEventsAnalytics({
  analyticsData,
}: SystemEventsAnalyticsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<
    'week' | 'month' | 'year'
  >('month');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <CheckCircle className='w-4 h-4 text-green-600' />;
      case 'draft':
        return <Clock className='w-4 h-4 text-yellow-600' />;
      case 'cancelled':
        return <XCircle className='w-4 h-4 text-red-600' />;
      default:
        return <AlertCircle className='w-4 h-4 text-gray-600' />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold'>
            Analytics de Eventos del Sistema
          </h2>
          <p className='text-muted-foreground'>
            Análisis completo de eventos y participación en toda la plataforma
          </p>
        </div>
        <div className='flex gap-2'>
          {(['week', 'month', 'year'] as const).map(period => (
            <Button
              key={period}
              variant={selectedPeriod === period ? 'default' : 'outline'}
              size='sm'
              onClick={() => setSelectedPeriod(period)}
            >
              {period === 'week'
                ? 'Semana'
                : period === 'month'
                  ? 'Mes'
                  : 'Año'}
            </Button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-muted-foreground'>
                  Total Eventos
                </p>
                <p className='text-2xl font-bold'>
                  {analyticsData.totalEvents}
                </p>
                <p className='text-xs text-muted-foreground'>
                  {analyticsData.publishedEvents} publicados
                </p>
              </div>
              <Calendar className='h-8 w-8 text-muted-foreground' />
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
                <p className='text-2xl font-bold'>
                  {analyticsData.totalAttendees}
                </p>
                <p className='text-xs text-muted-foreground'>
                  Promedio: {analyticsData.averageAttendance.toFixed(1)}
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
                  Tasa de Asistencia
                </p>
                <p className='text-2xl font-bold'>
                  {analyticsData.attendanceRate.toFixed(1)}%
                </p>
                <div className='mt-2'>
                  <Progress
                    value={analyticsData.attendanceRate}
                    className='h-2'
                  />
                </div>
              </div>
              <TrendingUp className='h-8 w-8 text-muted-foreground' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-muted-foreground'>
                  Eventos Próximos
                </p>
                <p className='text-2xl font-bold'>
                  {analyticsData.upcomingEvents}
                </p>
                <p className='text-xs text-muted-foreground'>
                  {analyticsData.pastEvents} completados
                </p>
              </div>
              <Clock className='h-8 w-8 text-muted-foreground' />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Events by Type */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <BarChart3 className='w-5 h-5' />
              Eventos por Tipo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {analyticsData.eventsByType.map((item, index) => (
                <div key={index} className='space-y-2'>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm font-medium capitalize'>
                      {item.type}
                    </span>
                    <div className='flex items-center gap-2'>
                      <span className='text-sm text-muted-foreground'>
                        {item.count}
                      </span>
                      <Badge variant='outline'>
                        {item.percentage.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                  <Progress value={item.percentage} className='h-2' />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Events by Status */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <BarChart3 className='w-5 h-5' />
              Eventos por Estado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {analyticsData.eventsByStatus.map((item, index) => (
                <div key={index} className='space-y-2'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      {getStatusIcon(item.status)}
                      <span className='text-sm font-medium capitalize'>
                        {item.status}
                      </span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <span className='text-sm text-muted-foreground'>
                        {item.count}
                      </span>
                      <Badge variant='outline'>
                        {item.percentage.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                  <Progress value={item.percentage} className='h-2' />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Events */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <TrendingUp className='w-5 h-5' />
            Eventos con Mejor Rendimiento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {analyticsData.topPerformingEvents.map((event, index) => (
              <div
                key={event.event_id}
                className='flex items-center justify-between p-4 border rounded-lg'
              >
                <div className='flex items-center gap-4'>
                  <div className='w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center'>
                    <span className='text-sm font-bold text-primary'>
                      {index + 1}
                    </span>
                  </div>
                  <div>
                    <p className='font-medium'>{event.title}</p>
                    <p className='text-sm text-muted-foreground'>
                      {event.group_name}
                    </p>
                  </div>
                </div>
                <div className='flex items-center gap-4'>
                  <div className='text-right'>
                    <p className='text-sm font-medium'>
                      {event.attendee_count}
                    </p>
                    <p className='text-xs text-muted-foreground'>asistentes</p>
                  </div>
                  <div className='text-right'>
                    <p className='text-sm font-medium'>
                      {event.attendance_rate.toFixed(1)}%
                    </p>
                    <p className='text-xs text-muted-foreground'>tasa</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Events */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Clock className='w-5 h-5' />
            Eventos Recientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-3'>
            {analyticsData.recentEvents.map(event => (
              <div
                key={event.event_id}
                className='flex items-center justify-between p-3 border rounded-lg'
              >
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center'>
                    <Calendar className='w-5 h-5 text-primary' />
                  </div>
                  <div>
                    <p className='font-medium'>{event.title}</p>
                    <p className='text-sm text-muted-foreground'>
                      {event.group_name} •{' '}
                      {new Date(event.start_datetime).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className='flex items-center gap-3'>
                  <Badge className={getStatusColor(event.status)}>
                    {event.status}
                  </Badge>
                  <div className='text-right'>
                    <p className='text-sm font-medium'>
                      {event.attendee_count}
                    </p>
                    <p className='text-xs text-muted-foreground'>asistentes</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
