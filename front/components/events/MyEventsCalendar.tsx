'use client';

import { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { Event } from '@/lib/api/events';

interface MyEventsCalendarProps {
  events: Event[];
  onView?: (eventId: string) => void;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: Event[];
}

const MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function MyEventsCalendar({
  events,
  onView,
}: MyEventsCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Group events by date
  const eventsByDate = useMemo(() => {
    const grouped: Record<string, Event[]> = {};

    events.forEach(event => {
      const eventDate = new Date(event.start_datetime);
      const dateKey = eventDate.toISOString().split('T')[0];

      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });

    return grouped;
  }, [events]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days: CalendarDay[] = [];
    const today = new Date();

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      const dateKey = date.toISOString().split('T')[0];
      const dayEvents = eventsByDate[dateKey] || [];

      days.push({
        date,
        isCurrentMonth: date.getMonth() === month,
        isToday: date.toDateString() === today.toDateString(),
        events: dayEvents,
      });
    }

    return days;
  }, [currentDate, eventsByDate]);

  const navigateMonth = useCallback((direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  }, []);

  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const getAttendanceStatusIcon = (status?: string | null) => {
    switch (status) {
      case 'attended':
        return <CheckCircle className='w-3 h-3 text-green-500' />;
      case 'no_show':
        return <XCircle className='w-3 h-3 text-red-500' />;
      case 'cancelled':
        return <XCircle className='w-3 h-3 text-gray-500' />;
      case 'registered':
      case 'confirmed':
        return <AlertCircle className='w-3 h-3 text-blue-500' />;
      default:
        return null;
    }
  };

  const getEventStatusColor = (event: Event) => {
    const now = new Date();
    const eventDate = new Date(event.start_datetime);

    if (event.user_attendance_status === 'attended') {
      return 'bg-green-100 border-green-300 text-green-800';
    }
    if (event.user_attendance_status === 'no_show') {
      return 'bg-red-100 border-red-300 text-red-800';
    }
    if (event.user_attendance_status === 'cancelled') {
      return 'bg-gray-100 border-gray-300 text-gray-800';
    }
    if (eventDate < now) {
      return 'bg-gray-100 border-gray-300 text-gray-600';
    }
    if (eventDate.toDateString() === now.toDateString()) {
      return 'bg-blue-100 border-blue-300 text-blue-800';
    }
    return 'bg-blue-50 border-blue-200 text-blue-700';
  };

  return (
    <div className='space-y-4'>
      {/* Calendar header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <h3 className='text-lg font-semibold'>
            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>
          <Button
            variant='outline'
            size='sm'
            onClick={goToToday}
            className='text-xs'
          >
            Hoy
          </Button>
        </div>

        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => navigateMonth('prev')}
            className='h-8 w-8 p-0'
          >
            <ChevronLeft className='w-4 h-4' />
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() => navigateMonth('next')}
            className='h-8 w-8 p-0'
          >
            <ChevronRight className='w-4 h-4' />
          </Button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className='border rounded-lg overflow-hidden'>
        {/* Weekday headers */}
        <div className='grid grid-cols-7 bg-muted/50'>
          {WEEKDAYS.map(day => (
            <div
              key={day}
              className='p-3 text-center text-sm font-medium text-muted-foreground'
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className='grid grid-cols-7'>
          {calendarDays.map((day, index) => (
            <div
              key={index}
              className={`min-h-[120px] border-r border-b last:border-r-0 p-2 ${
                day.isCurrentMonth ? 'bg-background' : 'bg-muted/20'
              } ${day.isToday ? 'bg-blue-50' : ''}`}
            >
              {/* Date number */}
              <div
                className={`text-sm font-medium mb-1 ${
                  day.isCurrentMonth
                    ? 'text-foreground'
                    : 'text-muted-foreground'
                } ${day.isToday ? 'text-blue-600 font-bold' : ''}`}
              >
                {day.date.getDate()}
              </div>

              {/* Events for this day */}
              <div className='space-y-1'>
                {day.events.slice(0, 3).map(event => (
                  <div
                    key={event.event_id}
                    className={`text-xs p-1 rounded border cursor-pointer hover:shadow-sm transition-shadow ${getEventStatusColor(event)}`}
                    onClick={() => onView?.(event.event_id)}
                    title={`${event.title} - ${new Date(
                      event.start_datetime
                    ).toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}`}
                  >
                    <div className='flex items-center gap-1 mb-1'>
                      {getAttendanceStatusIcon(event.user_attendance_status)}
                      <span className='font-medium truncate'>
                        {event.title}
                      </span>
                    </div>
                    <div className='flex items-center gap-1 text-xs opacity-75'>
                      <Clock className='w-2 h-2' />
                      <span>
                        {new Date(event.start_datetime).toLocaleTimeString(
                          'es-ES',
                          {
                            hour: '2-digit',
                            minute: '2-digit',
                          }
                        )}
                      </span>
                    </div>
                    <div className='flex items-center gap-1 text-xs opacity-75'>
                      <MapPin className='w-2 h-2' />
                      <span className='truncate'>{event.location}</span>
                    </div>
                  </div>
                ))}

                {day.events.length > 3 && (
                  <div className='text-xs text-muted-foreground text-center'>
                    +{day.events.length - 3} más
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className='flex flex-wrap gap-4 text-sm'>
        <div className='flex items-center gap-2'>
          <div className='w-3 h-3 rounded bg-green-100 border border-green-300'></div>
          <span>Asistido</span>
        </div>
        <div className='flex items-center gap-2'>
          <div className='w-3 h-3 rounded bg-red-100 border border-red-300'></div>
          <span>No asistió</span>
        </div>
        <div className='flex items-center gap-2'>
          <div className='w-3 h-3 rounded bg-blue-100 border border-blue-300'></div>
          <span>Próximo</span>
        </div>
        <div className='flex items-center gap-2'>
          <div className='w-3 h-3 rounded bg-gray-100 border border-gray-300'></div>
          <span>Pasado</span>
        </div>
      </div>

      {/* Event summary */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-6'>
        <div className='bg-muted/50 rounded-lg p-4'>
          <div className='flex items-center gap-2 mb-2'>
            <Calendar className='w-4 h-4 text-blue-500' />
            <span className='font-medium'>Total de eventos</span>
          </div>
          <div className='text-2xl font-bold'>{events.length}</div>
        </div>

        <div className='bg-muted/50 rounded-lg p-4'>
          <div className='flex items-center gap-2 mb-2'>
            <CheckCircle className='w-4 h-4 text-green-500' />
            <span className='font-medium'>Asistidos</span>
          </div>
          <div className='text-2xl font-bold'>
            {events.filter(e => e.user_attendance_status === 'attended').length}
          </div>
        </div>

        <div className='bg-muted/50 rounded-lg p-4'>
          <div className='flex items-center gap-2 mb-2'>
            <Clock className='w-4 h-4 text-orange-500' />
            <span className='font-medium'>Próximos</span>
          </div>
          <div className='text-2xl font-bold'>
            {events.filter(e => new Date(e.start_datetime) > new Date()).length}
          </div>
        </div>
      </div>
    </div>
  );
}
