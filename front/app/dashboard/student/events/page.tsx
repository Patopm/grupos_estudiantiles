'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/contexts/AuthContext';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { useToast } from '@/hooks/use-toast';
import { eventsApi, Event, EventFilters } from '@/lib/api/events';
import EventList from '@/components/events/EventList';

export default function StudentEventsPage() {
  return (
    <ProtectedRoute allowedRoles={['student']}>
      <StudentEventsContent />
    </ProtectedRoute>
  );
}

function StudentEventsContent() {
  const router = useRouter();
  const { toast } = useToast();

  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<EventFilters>({});
  const [searchQuery, setSearchQuery] = useState('');

  const loadEvents = useCallback(
    async (currentFilters: EventFilters = {}) => {
      try {
        setIsLoading(true);
        const eventsData = await eventsApi.getAll(currentFilters);
        setEvents(eventsData);
      } catch (error) {
        console.error('Error loading events:', error);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los eventos',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    loadEvents(filters);
  }, [loadEvents, filters]);

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

  const handleRegister = async (eventId: string) => {
    try {
      await eventsApi.register(eventId);
      toast({
        title: 'Registro Exitoso',
        description: 'Te has registrado correctamente al evento',
      });
      // Refresh events to update registration status
      loadEvents(filters);
    } catch (error) {
      console.error('Error registering for event:', error);
      toast({
        title: 'Error',
        description: 'No se pudo registrar al evento',
        variant: 'destructive',
      });
    }
  };

  const handleUnregister = async (eventId: string) => {
    try {
      await eventsApi.unregister(eventId);
      toast({
        title: 'Cancelación Exitosa',
        description: 'Te has desregistrado del evento',
      });
      // Refresh events to update registration status
      loadEvents(filters);
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
        title='Descubrir Eventos'
        description='Explora y regístrate en eventos de tus grupos estudiantiles'
        actions={
          <button
            onClick={() => router.push('/dashboard/student/events/my-events')}
            className='px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors'
          >
            Mis Eventos
          </button>
        }
      />

      <div className='max-w-7xl mx-auto p-6'>
        <EventList
          events={events}
          title='Eventos Disponibles'
          showSearch={true}
          showFilters={true}
          showViewToggle={true}
          variant='default'
          emptyMessage='No hay eventos disponibles en este momento'
          onRegister={handleRegister}
          onUnregister={handleUnregister}
          onView={handleViewEvent}
          isLoading={isLoading}
          enablePagination={true}
          onSearch={handleSearch}
          onFilterChange={handleFilterChange}
          searchQuery={searchQuery}
          currentFilters={filters}
        />
      </div>
    </div>
  );
}
