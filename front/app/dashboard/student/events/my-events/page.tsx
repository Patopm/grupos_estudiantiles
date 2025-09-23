'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/contexts/AuthContext';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { useToast } from '@/hooks/use-toast';
import { eventsApi, Event, EventFilters } from '@/lib/api/events';
import { MyEventsContent } from '@/components/events';

export default function MyEventsPage() {
  return (
    <ProtectedRoute allowedRoles={['student']}>
      <MyEventsPageContent />
    </ProtectedRoute>
  );
}

function MyEventsPageContent() {
  const router = useRouter();
  const { toast } = useToast();

  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<EventFilters>({ my_events: true });
  const [searchQuery, setSearchQuery] = useState('');

  const loadMyEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      const eventsData = await eventsApi.getMyEvents();
      setEvents(eventsData);
    } catch (error) {
      console.error('Error loading my events:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar tus eventos',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadMyEvents();
  }, [loadMyEvents]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setFilters(prev => ({
      ...prev,
      search: query || undefined,
    }));
  }, []);

  const handleFilterChange = useCallback(
    (newFilters: Partial<EventFilters>) => {
      setFilters(prev => ({
        ...prev,
        ...newFilters,
      }));
    },
    []
  );

  const handleUnregister = async (eventId: string) => {
    try {
      await eventsApi.unregister(eventId);
      toast({
        title: 'Cancelación Exitosa',
        description: 'Te has desregistrado del evento',
      });
      // Refresh events to update registration status
      loadMyEvents();
    } catch (error) {
      console.error('Error unregistering from event:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cancelar el registro',
        variant: 'destructive',
      });
    }
  };

  const handleViewEvent = (eventId: string) => {
    router.push(`/dashboard/events/${eventId}`);
  };

  return (
    <div className='min-h-screen bg-background'>
      <DashboardHeader
        title='Mis Eventos'
        description='Gestiona tus eventos registrados y revisa tu historial de asistencia'
        actions={
          <button
            onClick={() => router.push('/dashboard/student/events')}
            className='px-4 py-2 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors'
          >
            Descubrir Eventos
          </button>
        }
      />

      <div className='max-w-7xl mx-auto p-6'>
        <MyEventsContent
          events={events}
          isLoading={isLoading}
          onUnregister={handleUnregister}
          onView={handleViewEvent}
          onSearch={handleSearch}
          onFilterChange={handleFilterChange}
          searchQuery={searchQuery}
          currentFilters={filters}
          onRefresh={loadMyEvents}
        />
      </div>
    </div>
  );
}
