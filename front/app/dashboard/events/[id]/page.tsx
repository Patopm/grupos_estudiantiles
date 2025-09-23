'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/contexts/AuthContext';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { useToast } from '@/hooks/use-toast';
import { eventsApi, Event, EventAttendee } from '@/lib/api/events';
import { EventDetailContent } from '@/components/events';

export default function EventDetailPage() {
  return (
    <ProtectedRoute allowedRoles={['student', 'president', 'admin']}>
      <EventDetailPageContent />
    </ProtectedRoute>
  );
}

function EventDetailPageContent() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const [event, setEvent] = useState<Event | null>(null);
  const [attendees, setAttendees] = useState<EventAttendee[]>([]);
  const [relatedEvents, setRelatedEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAttendees, setIsLoadingAttendees] = useState(false);
  const [isLoadingRelated, setIsLoadingRelated] = useState(false);

  const eventId = params.id as string;

  const loadEventDetails = useCallback(async () => {
    if (!eventId) return;

    try {
      setIsLoading(true);
      const eventData = await eventsApi.getById(eventId);
      setEvent(eventData);
    } catch (error) {
      console.error('Error loading event details:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar la información del evento',
        variant: 'destructive',
      });
      router.push('/dashboard');
    } finally {
      setIsLoading(false);
    }
  }, [eventId, toast, router]);

  const loadAttendees = useCallback(async () => {
    if (!eventId) return;

    try {
      setIsLoadingAttendees(true);
      const attendeesData = await eventsApi.getAttendees(eventId);
      setAttendees(attendeesData);
    } catch (error) {
      console.error('Error loading attendees:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los asistentes del evento',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingAttendees(false);
    }
  }, [eventId, toast]);

  const loadRelatedEvents = useCallback(async () => {
    if (!event) return;

    try {
      setIsLoadingRelated(true);
      // Get related events from the same target groups
      const groupIds = event.target_groups.map(group => group.group_id);
      if (groupIds.length > 0) {
        const relatedEventsData = await Promise.all(
          groupIds.map(groupId => eventsApi.getByGroupId(groupId))
        );
        // Flatten and filter out current event
        const allRelated = relatedEventsData
          .flat()
          .filter(relatedEvent => relatedEvent.event_id !== event.event_id)
          .slice(0, 6); // Limit to 6 related events
        setRelatedEvents(allRelated);
      }
    } catch (error) {
      console.error('Error loading related events:', error);
      // Don't show error toast for related events as it's not critical
    } finally {
      setIsLoadingRelated(false);
    }
  }, [event]);

  useEffect(() => {
    loadEventDetails();
  }, [loadEventDetails]);

  useEffect(() => {
    if (event) {
      loadAttendees();
      loadRelatedEvents();
    }
  }, [event, loadAttendees, loadRelatedEvents]);

  const handleRegister = async (notes?: string) => {
    if (!event) return;

    try {
      await eventsApi.register(event.event_id, notes);
      toast({
        title: 'Registro Exitoso',
        description: 'Te has registrado correctamente al evento',
      });
      // Refresh event data to update registration status
      loadEventDetails();
    } catch (error) {
      console.error('Error registering for event:', error);
      toast({
        title: 'Error',
        description: 'No se pudo registrar al evento',
        variant: 'destructive',
      });
    }
  };

  const handleUnregister = async () => {
    if (!event) return;

    try {
      await eventsApi.unregister(event.event_id);
      toast({
        title: 'Cancelación Exitosa',
        description: 'Te has desregistrado del evento',
      });
      // Refresh event data to update registration status
      loadEventDetails();
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

  if (isLoading) {
    return (
      <div className='min-h-screen bg-background'>
        <DashboardHeader
          title='Cargando Evento'
          description='Obteniendo información del evento...'
        />
        <div className='max-w-7xl mx-auto p-6'>
          <div className='animate-pulse space-y-6'>
            <div className='h-8 bg-muted rounded w-1/3'></div>
            <div className='h-64 bg-muted rounded'></div>
            <div className='space-y-4'>
              <div className='h-4 bg-muted rounded w-3/4'></div>
              <div className='h-4 bg-muted rounded w-1/2'></div>
              <div className='h-4 bg-muted rounded w-2/3'></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className='min-h-screen bg-background'>
        <DashboardHeader
          title='Evento No Encontrado'
          description='El evento solicitado no existe o no tienes acceso a él'
        />
        <div className='max-w-7xl mx-auto p-6'>
          <div className='text-center py-12'>
            <h2 className='text-2xl font-bold mb-4'>Evento no encontrado</h2>
            <p className='text-muted-foreground mb-6'>
              El evento que buscas no existe o no tienes permisos para verlo.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className='px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90'
            >
              Volver al Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-background'>
      <DashboardHeader
        title={event.title}
        description={`Evento ${event.event_type} - ${event.location}`}
      />

      <div className='max-w-7xl mx-auto p-6'>
        <EventDetailContent
          event={event}
          attendees={attendees}
          relatedEvents={relatedEvents}
          isLoadingAttendees={isLoadingAttendees}
          isLoadingRelated={isLoadingRelated}
          onRegister={handleRegister}
          onUnregister={handleUnregister}
          onViewEvent={handleViewEvent}
        />
      </div>
    </div>
  );
}
