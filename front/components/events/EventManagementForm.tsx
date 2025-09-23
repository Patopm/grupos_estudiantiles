'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  X,
  Image as ImageIcon,
  CheckCircle,
  Loader2,
  Save,
  Edit,
} from 'lucide-react';
import { Event, UpdateEventFormData } from '@/lib/api/events';
import { groupsApi, Group } from '@/lib/api/groups';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

interface EventManagementFormProps {
  event: Event;
  onUpdate: (data: UpdateEventFormData) => Promise<void>;
  isLoading?: boolean;
}

interface FormData {
  title: string;
  description: string;
  event_type: Event['event_type'];
  status: Event['status'];
  start_datetime: string;
  end_datetime: string;
  location: string;
  max_attendees: string;
  registration_deadline: string;
  requires_registration: boolean;
  target_groups: string[];
  image?: File;
}

const EVENT_TYPE_OPTIONS = [
  { value: 'academic', label: 'Académico' },
  { value: 'social', label: 'Social' },
  { value: 'sports', label: 'Deportivo' },
  { value: 'cultural', label: 'Cultural' },
  { value: 'meeting', label: 'Reunión' },
  { value: 'workshop', label: 'Taller' },
  { value: 'conference', label: 'Conferencia' },
  { value: 'other', label: 'Otro' },
];

const EVENT_STATUS_OPTIONS = [
  { value: 'draft', label: 'Borrador' },
  { value: 'published', label: 'Publicado' },
  { value: 'cancelled', label: 'Cancelado' },
  { value: 'completed', label: 'Completado' },
];

export default function EventManagementForm({
  event,
  onUpdate,
  isLoading = false,
}: EventManagementFormProps) {
  const { toast } = useToast();
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<FormData>({
    title: event.title,
    description: event.description,
    event_type: event.event_type,
    status: event.status,
    start_datetime: new Date(event.start_datetime).toISOString().slice(0, 16),
    end_datetime: new Date(event.end_datetime).toISOString().slice(0, 16),
    location: event.location,
    max_attendees: event.max_attendees?.toString() || '',
    registration_deadline: event.registration_deadline
      ? new Date(event.registration_deadline).toISOString().slice(0, 16)
      : '',
    requires_registration: event.requires_registration,
    target_groups: event.target_groups?.map(g => g.group_id) || [],
    image: undefined,
  });

  useEffect(() => {
    const loadGroups = async () => {
      try {
        setIsLoadingGroups(true);
        const groupsData = await groupsApi.getAll();
        setGroups(groupsData);
      } catch (error) {
        console.error('Error loading groups:', error);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los grupos',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingGroups(false);
      }
    };

    loadGroups();
  }, [toast]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'El título es requerido';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'La ubicación es requerida';
    }

    if (!formData.start_datetime) {
      newErrors.start_datetime = 'La fecha de inicio es requerida';
    }

    if (!formData.end_datetime) {
      newErrors.end_datetime = 'La fecha de fin es requerida';
    }

    if (formData.start_datetime && formData.end_datetime) {
      const startDate = new Date(formData.start_datetime);
      const endDate = new Date(formData.end_datetime);

      if (endDate <= startDate) {
        newErrors.end_datetime =
          'La fecha de fin debe ser posterior a la fecha de inicio';
      }
    }

    if (formData.max_attendees && parseInt(formData.max_attendees) < 1) {
      newErrors.max_attendees =
        'El número máximo de asistentes debe ser mayor a 0';
    }

    if (formData.registration_deadline && formData.start_datetime) {
      const deadlineDate = new Date(formData.registration_deadline);
      const startDate = new Date(formData.start_datetime);

      if (deadlineDate >= startDate) {
        newErrors.registration_deadline =
          'El límite de registro debe ser anterior al inicio del evento';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    field: keyof FormData,
    value: string | boolean | string[] | File
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Error',
          description: 'Por favor selecciona un archivo de imagen válido',
          variant: 'destructive',
        });
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Error',
          description: 'La imagen debe ser menor a 5MB',
          variant: 'destructive',
        });
        return;
      }

      handleInputChange('image', file);

      // Create preview
      const reader = new FileReader();
      reader.onload = e => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    handleInputChange('image', '');
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: 'Error de validación',
        description: 'Por favor corrige los errores en el formulario',
        variant: 'destructive',
      });
      return;
    }

    try {
      const updateData: UpdateEventFormData = {
        title: formData.title,
        description: formData.description,
        event_type: formData.event_type,
        status: formData.status,
        start_datetime: formData.start_datetime,
        end_datetime: formData.end_datetime,
        location: formData.location,
        max_attendees: formData.max_attendees
          ? parseInt(formData.max_attendees)
          : undefined,
        registration_deadline: formData.registration_deadline || undefined,
        requires_registration: formData.requires_registration,
        target_groups: formData.target_groups,
        image: formData.image,
      };

      await onUpdate(updateData);
    } catch (error) {
      console.error('Error updating event:', error);
    }
  };

  const toggleTargetGroup = (groupId: string) => {
    const isSelected = formData.target_groups.includes(groupId);
    const newGroups = isSelected
      ? formData.target_groups.filter(id => id !== groupId)
      : [...formData.target_groups, groupId];

    handleInputChange('target_groups', newGroups);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Edit className='h-5 w-5' />
          Editar Evento
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className='space-y-6'>
          {/* Basic Information */}
          <div className='space-y-4'>
            <h3 className='text-lg font-semibold'>Información Básica</h3>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='title'>Título del Evento *</Label>
                <Input
                  id='title'
                  value={formData.title}
                  onChange={e => handleInputChange('title', e.target.value)}
                  placeholder='Ingresa el título del evento'
                  className={errors.title ? 'border-red-500' : ''}
                />
                {errors.title && (
                  <p className='text-sm text-red-500'>{errors.title}</p>
                )}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='event_type'>Tipo de Evento *</Label>
                <Select
                  value={formData.event_type}
                  onValueChange={value =>
                    handleInputChange(
                      'event_type',
                      value as Event['event_type']
                    )
                  }
                >
                  <SelectTrigger
                    className={errors.event_type ? 'border-red-500' : ''}
                  >
                    <SelectValue placeholder='Selecciona el tipo de evento' />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPE_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.event_type && (
                  <p className='text-sm text-red-500'>{errors.event_type}</p>
                )}
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='description'>Descripción *</Label>
              <Textarea
                id='description'
                value={formData.description}
                onChange={e => handleInputChange('description', e.target.value)}
                placeholder='Describe el evento en detalle'
                rows={4}
                className={errors.description ? 'border-red-500' : ''}
              />
              {errors.description && (
                <p className='text-sm text-red-500'>{errors.description}</p>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='status'>Estado del Evento</Label>
              <Select
                value={formData.status}
                onValueChange={value =>
                  handleInputChange('status', value as Event['status'])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder='Selecciona el estado' />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_STATUS_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date and Time */}
          <div className='space-y-4'>
            <h3 className='text-lg font-semibold'>Fecha y Hora</h3>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='start_datetime'>Fecha y Hora de Inicio *</Label>
                <Input
                  id='start_datetime'
                  type='datetime-local'
                  value={formData.start_datetime}
                  onChange={e =>
                    handleInputChange('start_datetime', e.target.value)
                  }
                  className={errors.start_datetime ? 'border-red-500' : ''}
                />
                {errors.start_datetime && (
                  <p className='text-sm text-red-500'>
                    {errors.start_datetime}
                  </p>
                )}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='end_datetime'>Fecha y Hora de Fin *</Label>
                <Input
                  id='end_datetime'
                  type='datetime-local'
                  value={formData.end_datetime}
                  onChange={e =>
                    handleInputChange('end_datetime', e.target.value)
                  }
                  className={errors.end_datetime ? 'border-red-500' : ''}
                />
                {errors.end_datetime && (
                  <p className='text-sm text-red-500'>{errors.end_datetime}</p>
                )}
              </div>
            </div>
          </div>

          {/* Location and Capacity */}
          <div className='space-y-4'>
            <h3 className='text-lg font-semibold'>Ubicación y Capacidad</h3>

            <div className='space-y-2'>
              <Label htmlFor='location'>Ubicación *</Label>
              <Input
                id='location'
                value={formData.location}
                onChange={e => handleInputChange('location', e.target.value)}
                placeholder='Ingresa la ubicación del evento'
                className={errors.location ? 'border-red-500' : ''}
              />
              {errors.location && (
                <p className='text-sm text-red-500'>{errors.location}</p>
              )}
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='max_attendees'>Máximo de Asistentes</Label>
                <Input
                  id='max_attendees'
                  type='number'
                  min='1'
                  value={formData.max_attendees}
                  onChange={e =>
                    handleInputChange('max_attendees', e.target.value)
                  }
                  placeholder='Deja vacío para sin límite'
                  className={errors.max_attendees ? 'border-red-500' : ''}
                />
                {errors.max_attendees && (
                  <p className='text-sm text-red-500'>{errors.max_attendees}</p>
                )}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='registration_deadline'>
                  Límite de Registro
                </Label>
                <Input
                  id='registration_deadline'
                  type='datetime-local'
                  value={formData.registration_deadline}
                  onChange={e =>
                    handleInputChange('registration_deadline', e.target.value)
                  }
                  className={
                    errors.registration_deadline ? 'border-red-500' : ''
                  }
                />
                {errors.registration_deadline && (
                  <p className='text-sm text-red-500'>
                    {errors.registration_deadline}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Registration Settings */}
          <div className='space-y-4'>
            <h3 className='text-lg font-semibold'>Configuración de Registro</h3>

            <div className='flex items-center space-x-2'>
              <Checkbox
                id='requires_registration'
                checked={formData.requires_registration}
                onCheckedChange={checked =>
                  handleInputChange('requires_registration', checked as boolean)
                }
              />
              <Label htmlFor='requires_registration'>
                Requiere registro previo
              </Label>
            </div>
          </div>

          {/* Target Groups */}
          <div className='space-y-4'>
            <h3 className='text-lg font-semibold'>Grupos Objetivo</h3>

            {isLoadingGroups ? (
              <div className='flex items-center justify-center py-8'>
                <Loader2 className='h-6 w-6 animate-spin' />
                <span className='ml-2'>Cargando grupos...</span>
              </div>
            ) : (
              <div className='space-y-3'>
                <p className='text-sm text-muted-foreground'>
                  Selecciona los grupos estudiantiles que pueden participar en
                  este evento
                </p>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'>
                  {groups.map(group => (
                    <div
                      key={group.group_id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        formData.target_groups.includes(group.group_id)
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => toggleTargetGroup(group.group_id)}
                    >
                      <div className='flex items-center justify-between'>
                        <div>
                          <h4 className='font-medium'>{group.name}</h4>
                          <p className='text-sm text-muted-foreground'>
                            {group.category}
                          </p>
                        </div>
                        <div className='flex items-center gap-2'>
                          <Badge variant='outline'>
                            {group.member_count} miembros
                          </Badge>
                          {formData.target_groups.includes(group.group_id) && (
                            <CheckCircle className='h-4 w-4 text-primary' />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {formData.target_groups.length > 0 && (
                  <div className='flex flex-wrap gap-2'>
                    {formData.target_groups.map(groupId => {
                      const group = groups.find(g => g.group_id === groupId);
                      return group ? (
                        <Badge
                          key={groupId}
                          variant='secondary'
                          className='gap-1'
                        >
                          {group.name}
                          <X
                            className='h-3 w-3 cursor-pointer'
                            onClick={() => toggleTargetGroup(groupId)}
                          />
                        </Badge>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Image Upload */}
          <div className='space-y-4'>
            <h3 className='text-lg font-semibold'>Imagen del Evento</h3>

            <div className='space-y-4'>
              {imagePreview && (
                <div className='relative w-full max-w-md'>
                  <Image
                    src={imagePreview}
                    alt='Preview'
                    width={400}
                    height={200}
                    className='rounded-lg object-cover'
                  />
                  <Button
                    type='button'
                    variant='destructive'
                    size='sm'
                    className='absolute top-2 right-2'
                    onClick={removeImage}
                  >
                    <X className='h-4 w-4' />
                  </Button>
                </div>
              )}

              {event.image && !imagePreview && (
                <div className='relative w-full max-w-md'>
                  <Image
                    src={event.image}
                    alt='Current event image'
                    width={400}
                    height={200}
                    className='rounded-lg object-cover'
                  />
                </div>
              )}

              <div className='flex items-center gap-4'>
                <Label htmlFor='image' className='cursor-pointer'>
                  <div className='flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors'>
                    <ImageIcon className='h-4 w-4' />
                    <span>Seleccionar nueva imagen</span>
                  </div>
                </Label>
                <input
                  id='image'
                  type='file'
                  accept='image/*'
                  onChange={handleImageChange}
                  className='hidden'
                />
              </div>

              <p className='text-sm text-muted-foreground'>
                Formatos soportados: JPG, PNG, GIF. Tamaño máximo: 5MB
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className='flex justify-end gap-4 pt-6 border-t'>
            <Button type='submit' disabled={isLoading}>
              {isLoading && <Loader2 className='h-4 w-4 mr-2 animate-spin' />}
              <Save className='h-4 w-4 mr-2' />
              Guardar Cambios
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
