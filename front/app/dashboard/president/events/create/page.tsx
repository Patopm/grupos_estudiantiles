'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import EventCreationForm from '@/components/events/EventCreationForm';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, CheckCircle } from 'lucide-react';

export default function CreateEventPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [createdEventId, setCreatedEventId] = useState<string | null>(null);

  // Redirect if user is not a president
  if (!user || user.role !== 'president') {
    router.push('/dashboard');
    return null;
  }

  const handleSuccess = (eventId: string) => {
    setCreatedEventId(eventId);
    setShowSuccessDialog(true);
  };

  const handleCancel = () => {
    router.back();
  };

  const handleViewEvent = () => {
    if (createdEventId) {
      router.push(`/dashboard/events/${createdEventId}`);
    }
  };

  const handleCreateAnother = () => {
    setShowSuccessDialog(false);
    setCreatedEventId(null);
    // The form will reset automatically
  };

  const handleGoToEvents = () => {
    router.push('/dashboard/president/events');
  };

  return (
    <div className='min-h-screen bg-background'>
      {/* Header */}
      <div className='border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
        <div className='container mx-auto px-4 py-4'>
          <div className='flex items-center gap-4'>
            <Button
              variant='ghost'
              size='sm'
              onClick={handleCancel}
              className='flex items-center gap-2'
            >
              <ArrowLeft className='h-4 w-4' />
              Volver
            </Button>
            <div className='flex items-center gap-2'>
              <Calendar className='h-5 w-5 text-primary' />
              <h1 className='text-2xl font-bold'>Crear Nuevo Evento</h1>
            </div>
          </div>
          <p className='text-muted-foreground mt-2'>
            Crea un nuevo evento para tus grupos estudiantiles
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className='container mx-auto px-4 py-6'>
        <EventCreationForm onSuccess={handleSuccess} onCancel={handleCancel} />
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <CheckCircle className='h-5 w-5 text-green-500' />
              Evento Creado Exitosamente
            </DialogTitle>
            <DialogDescription>
              Tu evento ha sido creado y está listo para ser publicado. Los
              estudiantes de los grupos seleccionados podrán verlo y
              registrarse.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4'>
            <div className='bg-muted/50 p-4 rounded-lg'>
              <h4 className='font-medium mb-2'>Próximos pasos:</h4>
              <ul className='text-sm text-muted-foreground space-y-1'>
                <li>• Revisa la información del evento</li>
                <li>• Publica el evento cuando esté listo</li>
                <li>• Comparte el evento con los grupos</li>
                <li>• Monitorea las inscripciones</li>
              </ul>
            </div>
          </div>

          <DialogFooter className='flex-col sm:flex-row gap-2'>
            <Button
              variant='outline'
              onClick={handleGoToEvents}
              className='w-full sm:w-auto'
            >
              Ver Todos los Eventos
            </Button>
            <Button
              variant='outline'
              onClick={handleCreateAnother}
              className='w-full sm:w-auto'
            >
              Crear Otro Evento
            </Button>
            <Button onClick={handleViewEvent} className='w-full sm:w-auto'>
              Ver Evento Creado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

