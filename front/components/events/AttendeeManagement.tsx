'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Users,
  Search,
  Download,
  Mail,
  UserCheck,
  UserX,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  MoreHorizontal,
} from 'lucide-react';
import { EventAttendee, ATTENDANCE_STATUS_LABELS } from '@/lib/api/events';
import { useToast } from '@/hooks/use-toast';

interface AttendeeManagementProps {
  eventId: string;
  attendees: EventAttendee[];
  onAttendeeUpdate: (attendeeId: string, status: string) => Promise<void>;
}

const ATTENDANCE_STATUSES = [
  {
    value: 'registered',
    label: 'Registrado',
    color: 'bg-blue-100 text-blue-800',
  },
  {
    value: 'confirmed',
    label: 'Confirmado',
    color: 'bg-green-100 text-green-800',
  },
  {
    value: 'attended',
    label: 'Asistió',
    color: 'bg-emerald-100 text-emerald-800',
  },
  { value: 'no_show', label: 'No asistió', color: 'bg-red-100 text-red-800' },
  {
    value: 'cancelled',
    label: 'Cancelado',
    color: 'bg-gray-100 text-gray-800',
  },
];

const STATUS_FILTERS = [
  { value: 'all', label: 'Todos' },
  ...ATTENDANCE_STATUSES,
];

export default function AttendeeManagement({
  eventId,
  attendees,
  onAttendeeUpdate,
}: AttendeeManagementProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedAttendee, setSelectedAttendee] =
    useState<EventAttendee | null>(null);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);

  const filteredAttendees = useMemo(() => {
    return attendees.filter(attendee => {
      const matchesSearch =
        attendee.user_details.full_name
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        attendee.user_details.email
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        attendee.user_details.student_id
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' || attendee.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [attendees, searchTerm, statusFilter]);

  const statusCounts = useMemo(() => {
    return attendees.reduce(
      (counts, attendee) => {
        counts[attendee.status] = (counts[attendee.status] || 0) + 1;
        return counts;
      },
      {} as Record<string, number>
    );
  }, [attendees]);

  const handleStatusUpdate = async () => {
    if (!selectedAttendee || !newStatus) return;

    try {
      setIsUpdating(true);
      await onAttendeeUpdate(selectedAttendee.attendance_id, newStatus);
      setShowStatusDialog(false);
      setSelectedAttendee(null);
      setNewStatus('');
    } catch (error) {
      console.error('Error updating attendee status:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el estado del asistente',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const openStatusDialog = (attendee: EventAttendee) => {
    setSelectedAttendee(attendee);
    setNewStatus(attendee.status);
    setShowStatusDialog(true);
  };

  const exportAttendees = () => {
    const csvContent = [
      [
        'Nombre',
        'Email',
        'ID Estudiante',
        'Teléfono',
        'Estado',
        'Fecha Registro',
      ],
      ...filteredAttendees.map(attendee => [
        attendee.user_details.full_name,
        attendee.user_details.email,
        attendee.user_details.student_id,
        attendee.user_details.phone || '',
        ATTENDANCE_STATUS_LABELS[attendee.status],
        new Date(attendee.registration_date).toLocaleDateString('es-ES'),
      ]),
    ]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `asistentes-evento-${eventId}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const sendNotification = () => {
    toast({
      title: 'Función en desarrollo',
      description:
        'La funcionalidad de notificaciones estará disponible próximamente',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'registered':
        return <Clock className='h-4 w-4' />;
      case 'confirmed':
        return <CheckCircle className='h-4 w-4' />;
      case 'attended':
        return <UserCheck className='h-4 w-4' />;
      case 'no_show':
        return <XCircle className='h-4 w-4' />;
      case 'cancelled':
        return <UserX className='h-4 w-4' />;
      default:
        return <AlertCircle className='h-4 w-4' />;
    }
  };

  const getStatusColor = (status: string) => {
    const statusConfig = ATTENDANCE_STATUSES.find(s => s.value === status);
    return statusConfig?.color || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
            <CardTitle className='flex items-center gap-2'>
              <Users className='h-5 w-5' />
              Gestión de Asistentes ({attendees.length})
            </CardTitle>
            <div className='flex gap-2'>
              <Button variant='outline' onClick={exportAttendees}>
                <Download className='h-4 w-4 mr-2' />
                Exportar
              </Button>
              <Button variant='outline' onClick={sendNotification}>
                <Mail className='h-4 w-4 mr-2' />
                Notificar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Status Summary */}
          <div className='grid grid-cols-2 md:grid-cols-5 gap-4 mb-6'>
            {ATTENDANCE_STATUSES.map(status => (
              <div key={status.value} className='text-center'>
                <div
                  className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${status.color}`}
                >
                  {getStatusIcon(status.value)}
                  {status.label}
                </div>
                <div className='text-2xl font-bold mt-1'>
                  {statusCounts[status.value] || 0}
                </div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className='flex flex-col sm:flex-row gap-4'>
            <div className='flex-1'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                <Input
                  placeholder='Buscar por nombre, email o ID...'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className='pl-10'
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className='w-full sm:w-48'>
                <SelectValue placeholder='Filtrar por estado' />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTERS.map(filter => (
                  <SelectItem key={filter.value} value={filter.value}>
                    {filter.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Attendees Table */}
      <Card>
        <CardContent className='p-0'>
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asistente</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha Registro</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAttendees.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className='text-center py-8 text-muted-foreground'
                    >
                      {searchTerm || statusFilter !== 'all'
                        ? 'No se encontraron asistentes con los filtros aplicados'
                        : 'No hay asistentes registrados para este evento'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAttendees.map(attendee => (
                    <TableRow key={attendee.attendance_id}>
                      <TableCell>
                        <div>
                          <div className='font-medium'>
                            {attendee.user_details.full_name}
                          </div>
                          <div className='text-sm text-muted-foreground'>
                            ID: {attendee.user_details.student_id}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className='text-sm'>
                            {attendee.user_details.email}
                          </div>
                          {attendee.user_details.phone && (
                            <div className='text-sm text-muted-foreground'>
                              {attendee.user_details.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`${getStatusColor(attendee.status)} border-0`}
                        >
                          <div className='flex items-center gap-1'>
                            {getStatusIcon(attendee.status)}
                            {ATTENDANCE_STATUS_LABELS[attendee.status]}
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className='text-sm'>
                          {new Date(
                            attendee.registration_date
                          ).toLocaleDateString('es-ES')}
                        </div>
                        <div className='text-xs text-muted-foreground'>
                          {new Date(
                            attendee.registration_date
                          ).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => openStatusDialog(attendee)}
                        >
                          <MoreHorizontal className='h-4 w-4' />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Status Update Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Actualizar Estado del Asistente</DialogTitle>
            <DialogDescription>
              Cambiar el estado de {selectedAttendee?.user_details.full_name}
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4'>
            <div className='space-y-2'>
              <label className='text-sm font-medium'>Nuevo Estado</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder='Selecciona un estado' />
                </SelectTrigger>
                <SelectContent>
                  {ATTENDANCE_STATUSES.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      <div className='flex items-center gap-2'>
                        {getStatusIcon(status.value)}
                        {status.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedAttendee?.notes && (
              <div className='space-y-2'>
                <label className='text-sm font-medium'>Notas</label>
                <div className='p-3 bg-muted rounded-lg text-sm'>
                  {selectedAttendee.notes}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setShowStatusDialog(false)}
              disabled={isUpdating}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleStatusUpdate}
              disabled={isUpdating || !newStatus}
            >
              {isUpdating && <Loader2 className='h-4 w-4 mr-2 animate-spin' />}
              Actualizar Estado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
