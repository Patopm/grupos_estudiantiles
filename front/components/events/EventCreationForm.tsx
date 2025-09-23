'use client';

import React, { useState, useRef, useEffect } from 'react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  X,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { groupsApi, Group } from '@/lib/api/groups';
import { eventsApi, CreateEventFormData } from '@/lib/api/events';
import {
  EventCreationFormData,
  EVENT_TYPE_OPTIONS,
  validateEventCreation,
  validateEventImage,
  validateEventDateTime,
} from '@/lib/validations/events';
import Image from 'next/image';

interface EventCreationFormProps {
  onSuccess?: (eventId: string) => void;
  onCancel?: () => void;
  initialData?: Partial<EventCreationFormData>;
}

export default function EventCreationForm({
  onSuccess,
  onCancel,
  initialData,
}: EventCreationFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState<EventCreationFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    event_type: initialData?.event_type || 'academic',
    start_datetime: initialData?.start_datetime || '',
    end_datetime: initialData?.end_datetime || '',
    location: initialData?.location || '',
    max_attendees: initialData?.max_attendees || '',
    registration_deadline: initialData?.registration_deadline || '',
    requires_registration: initialData?.requires_registration ?? true,
    target_groups: initialData?.target_groups || [],
    image: initialData?.image,
  });

  // UI state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showGroupSelector, setShowGroupSelector] = useState(false);

  // Data state
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);

  // Load available groups on component mount
  useEffect(() => {
    loadAvailableGroups();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update image preview when image changes
  useEffect(() => {
    if (formData.image) {
      const reader = new FileReader();
      reader.onload = e => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(formData.image);
    } else {
      setImagePreview(null);
    }
  }, [formData.image]);

  const loadAvailableGroups = async () => {
    if (!user || user.role !== 'president') return;

    setIsLoadingGroups(true);
    try {
      const groups = await groupsApi.getMyGroups();
      setAvailableGroups(groups);
    } catch (error) {
      console.error('Error loading groups:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los grupos disponibles',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingGroups(false);
    }
  };

  const handleInputChange = (
    field: keyof EventCreationFormData,
    value: string | number | boolean | File | string[]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validateEventImage(file);
    if (!validation.isValid) {
      toast({
        title: 'Error',
        description: validation.error,
        variant: 'destructive',
      });
      return;
    }

    handleInputChange('image', file);
  };

  const removeImage = () => {
    handleInputChange('image', '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleGroupToggle = (groupId: string) => {
    const currentGroups = formData.target_groups;
    const isSelected = currentGroups.includes(groupId);

    if (isSelected) {
      handleInputChange(
        'target_groups',
        currentGroups.filter(id => id !== groupId)
      );
    } else {
      handleInputChange('target_groups', [...currentGroups, groupId]);
    }
  };

  const validateForm = (): boolean => {
    const validation = validateEventCreation(formData);

    if (!validation.success) {
      setErrors(validation.errors);
      return false;
    }

    // Additional date/time validation
    const dateValidation = validateEventDateTime(
      formData.start_datetime,
      formData.end_datetime,
      formData.registration_deadline
    );

    if (!dateValidation.isValid) {
      const dateErrors: Record<string, string> = {};
      dateValidation.errors.forEach(error => {
        if (error.includes('inicio')) {
          dateErrors.start_datetime = error;
        } else if (error.includes('finalización')) {
          dateErrors.end_datetime = error;
        } else if (error.includes('registro')) {
          dateErrors.registration_deadline = error;
        }
      });
      setErrors(prev => ({ ...prev, ...dateErrors }));
      return false;
    }

    setErrors({});
    return true;
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

    setIsSubmitting(true);

    try {
      const eventData: CreateEventFormData = {
        ...formData,
        max_attendees: formData.max_attendees || undefined,
        registration_deadline: formData.registration_deadline || undefined,
      };

      const createdEvent = await eventsApi.create(eventData);

      toast({
        title: 'Evento creado',
        description: 'El evento se ha creado exitosamente',
      });

      onSuccess?.(createdEvent.event_id);
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear el evento. Por favor intenta de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDateTimeForInput = (dateTime: string): string => {
    if (!dateTime) return '';
    const date = new Date(dateTime);
    return date.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:MM
  };

  const getMinDateTime = (): string => {
    const now = new Date();
    now.setHours(now.getHours() + 24); // 24 hours from now
    return now.toISOString().slice(0, 16);
  };

  const getMaxDateTime = (startDateTime: string): string => {
    if (!startDateTime) return '';
    const startDate = new Date(startDateTime);
    startDate.setHours(startDate.getHours() + 24); // Max 24 hours duration
    return startDate.toISOString().slice(0, 16);
  };

  const getMaxRegistrationDateTime = (startDateTime: string): string => {
    if (!startDateTime) return '';
    const startDate = new Date(startDateTime);
    return startDate.toISOString().slice(0, 16);
  };

  return (
    <div className='max-w-4xl mx-auto p-6 space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Calendar className='h-5 w-5' />
            Crear Nuevo Evento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-6'>
            {/* Basic Information Section */}
            <div className='space-y-4'>
              <h3 className='text-lg font-semibold'>Información Básica</h3>

              {/* Title */}
              <div className='space-y-2'>
                <Label htmlFor='title'>Título del Evento *</Label>
                <Input
                  id='title'
                  value={formData.title}
                  onChange={e => handleInputChange('title', e.target.value)}
                  placeholder='Ingresa el título del evento'
                  className={errors.title ? 'border-destructive' : ''}
                />
                {errors.title && (
                  <p className='text-sm text-destructive flex items-center gap-1'>
                    <AlertCircle className='h-4 w-4' />
                    {errors.title}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className='space-y-2'>
                <Label htmlFor='description'>Descripción *</Label>
                <Textarea
                  id='description'
                  value={formData.description}
                  onChange={e =>
                    handleInputChange('description', e.target.value)
                  }
                  placeholder='Describe el evento, sus objetivos y qué esperar'
                  rows={4}
                  className={errors.description ? 'border-destructive' : ''}
                />
                <div className='flex justify-between text-sm text-muted-foreground'>
                  <span>{formData.description.length}/2000 caracteres</span>
                  {errors.description && (
                    <span className='text-destructive flex items-center gap-1'>
                      <AlertCircle className='h-4 w-4' />
                      {errors.description}
                    </span>
                  )}
                </div>
              </div>

              {/* Event Type */}
              <div className='space-y-2'>
                <Label htmlFor='event_type'>Tipo de Evento *</Label>
                <Select
                  value={formData.event_type}
                  onValueChange={value =>
                    handleInputChange('event_type', value)
                  }
                >
                  <SelectTrigger
                    className={errors.event_type ? 'border-destructive' : ''}
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
                  <p className='text-sm text-destructive flex items-center gap-1'>
                    <AlertCircle className='h-4 w-4' />
                    {errors.event_type}
                  </p>
                )}
              </div>
            </div>

            {/* Date and Time Section */}
            <div className='space-y-4'>
              <h3 className='text-lg font-semibold flex items-center gap-2'>
                <Clock className='h-5 w-5' />
                Fecha y Hora
              </h3>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {/* Start Date/Time */}
                <div className='space-y-2'>
                  <Label htmlFor='start_datetime'>
                    Fecha y Hora de Inicio *
                  </Label>
                  <Input
                    id='start_datetime'
                    type='datetime-local'
                    value={formatDateTimeForInput(formData.start_datetime)}
                    onChange={e =>
                      handleInputChange('start_datetime', e.target.value)
                    }
                    min={getMinDateTime()}
                    className={
                      errors.start_datetime ? 'border-destructive' : ''
                    }
                  />
                  {errors.start_datetime && (
                    <p className='text-sm text-destructive flex items-center gap-1'>
                      <AlertCircle className='h-4 w-4' />
                      {errors.start_datetime}
                    </p>
                  )}
                </div>

                {/* End Date/Time */}
                <div className='space-y-2'>
                  <Label htmlFor='end_datetime'>
                    Fecha y Hora de Finalización *
                  </Label>
                  <Input
                    id='end_datetime'
                    type='datetime-local'
                    value={formatDateTimeForInput(formData.end_datetime)}
                    onChange={e =>
                      handleInputChange('end_datetime', e.target.value)
                    }
                    min={formatDateTimeForInput(formData.start_datetime)}
                    max={getMaxDateTime(formData.start_datetime)}
                    className={errors.end_datetime ? 'border-destructive' : ''}
                  />
                  {errors.end_datetime && (
                    <p className='text-sm text-destructive flex items-center gap-1'>
                      <AlertCircle className='h-4 w-4' />
                      {errors.end_datetime}
                    </p>
                  )}
                </div>
              </div>

              {/* Registration Deadline */}
              <div className='space-y-2'>
                <Label htmlFor='registration_deadline'>
                  Fecha Límite de Registro
                </Label>
                <Input
                  id='registration_deadline'
                  type='datetime-local'
                  value={formatDateTimeForInput(
                    formData.registration_deadline ?? ''
                  )}
                  onChange={e =>
                    handleInputChange('registration_deadline', e.target.value)
                  }
                  max={getMaxRegistrationDateTime(formData.start_datetime)}
                  className={
                    errors.registration_deadline ? 'border-destructive' : ''
                  }
                />
                <p className='text-sm text-muted-foreground'>
                  Opcional. Si no se especifica, el registro estará abierto
                  hasta el inicio del evento.
                </p>
                {errors.registration_deadline && (
                  <p className='text-sm text-destructive flex items-center gap-1'>
                    <AlertCircle className='h-4 w-4' />
                    {errors.registration_deadline}
                  </p>
                )}
              </div>
            </div>

            {/* Location and Capacity Section */}
            <div className='space-y-4'>
              <h3 className='text-lg font-semibold flex items-center gap-2'>
                <MapPin className='h-5 w-5' />
                Ubicación y Capacidad
              </h3>

              {/* Location */}
              <div className='space-y-2'>
                <Label htmlFor='location'>Ubicación *</Label>
                <Input
                  id='location'
                  value={formData.location}
                  onChange={e => handleInputChange('location', e.target.value)}
                  placeholder='Ingresa la ubicación del evento'
                  className={errors.location ? 'border-destructive' : ''}
                />
                {errors.location && (
                  <p className='text-sm text-destructive flex items-center gap-1'>
                    <AlertCircle className='h-4 w-4' />
                    {errors.location}
                  </p>
                )}
              </div>

              {/* Max Attendees */}
              <div className='space-y-2'>
                <Label htmlFor='max_attendees'>Máximo de Asistentes</Label>
                <Input
                  id='max_attendees'
                  type='number'
                  value={formData.max_attendees}
                  onChange={e =>
                    handleInputChange('max_attendees', e.target.value)
                  }
                  placeholder='Ej: 50'
                  min={1}
                  max={1000}
                  className={errors.max_attendees ? 'border-destructive' : ''}
                />
                <p className='text-sm text-muted-foreground'>
                  Opcional. Deja vacío para permitir asistencia ilimitada.
                </p>
                {errors.max_attendees && (
                  <p className='text-sm text-destructive flex items-center gap-1'>
                    <AlertCircle className='h-4 w-4' />
                    {errors.max_attendees}
                  </p>
                )}
              </div>
            </div>

            {/* Registration Settings */}
            <div className='space-y-4'>
              <h3 className='text-lg font-semibold flex items-center gap-2'>
                <Users className='h-5 w-5' />
                Configuración de Registro
              </h3>

              {/* Requires Registration */}
              <div className='flex items-center space-x-2'>
                <Checkbox
                  id='requires_registration'
                  checked={formData.requires_registration}
                  onCheckedChange={checked =>
                    handleInputChange('requires_registration', checked)
                  }
                />
                <Label htmlFor='requires_registration'>
                  Requiere registro previo
                </Label>
              </div>
              <p className='text-sm text-muted-foreground ml-6'>
                Si está marcado, los estudiantes deberán registrarse antes de
                asistir al evento.
              </p>
            </div>

            {/* Target Groups Section */}
            <div className='space-y-4'>
              <h3 className='text-lg font-semibold'>Grupos Objetivo *</h3>

              <Dialog
                open={showGroupSelector}
                onOpenChange={setShowGroupSelector}
              >
                <DialogTrigger asChild>
                  <Button type='button' variant='outline' className='w-full'>
                    Seleccionar Grupos ({formData.target_groups.length}{' '}
                    seleccionados)
                  </Button>
                </DialogTrigger>
                <DialogContent className='max-w-2xl'>
                  <DialogHeader>
                    <DialogTitle>Seleccionar Grupos Objetivo</DialogTitle>
                    <DialogDescription>
                      Selecciona los grupos que pueden asistir a este evento.
                    </DialogDescription>
                  </DialogHeader>

                  <div className='space-y-4 max-h-96 overflow-y-auto'>
                    {isLoadingGroups ? (
                      <div className='flex items-center justify-center py-8'>
                        <Loader2 className='h-6 w-6 animate-spin' />
                        <span className='ml-2'>Cargando grupos...</span>
                      </div>
                    ) : availableGroups.length === 0 ? (
                      <p className='text-center text-muted-foreground py-8'>
                        No tienes grupos disponibles para seleccionar.
                      </p>
                    ) : (
                      availableGroups.map(group => (
                        <div
                          key={group.group_id}
                          className='flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50'
                        >
                          <Checkbox
                            checked={formData.target_groups.includes(
                              group.group_id
                            )}
                            onCheckedChange={() =>
                              handleGroupToggle(group.group_id)
                            }
                          />
                          <div className='flex-1'>
                            <h4 className='font-medium'>{group.name}</h4>
                            <p className='text-sm text-muted-foreground'>
                              {group.description}
                            </p>
                            <div className='flex items-center gap-2 mt-1'>
                              <Badge variant='secondary'>
                                {group.category}
                              </Badge>
                              <span className='text-xs text-muted-foreground'>
                                {group.member_count} miembros
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <DialogFooter>
                    <Button
                      type='button'
                      onClick={() => setShowGroupSelector(false)}
                    >
                      Confirmar Selección
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Selected Groups Display */}
              {formData.target_groups.length > 0 && (
                <div className='space-y-2'>
                  <Label>Grupos Seleccionados:</Label>
                  <div className='flex flex-wrap gap-2'>
                    {formData.target_groups.map(groupId => {
                      const group = availableGroups.find(
                        g => g.group_id === groupId
                      );
                      return (
                        <Badge
                          key={groupId}
                          variant='secondary'
                          className='flex items-center gap-1'
                        >
                          {group?.name || groupId}
                          <button
                            type='button'
                            onClick={() => handleGroupToggle(groupId)}
                            className='ml-1 hover:text-destructive'
                          >
                            <X className='h-3 w-3' />
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}

              {errors.target_groups && (
                <p className='text-sm text-destructive flex items-center gap-1'>
                  <AlertCircle className='h-4 w-4' />
                  {errors.target_groups}
                </p>
              )}
            </div>

            {/* Image Upload Section */}
            <div className='space-y-4'>
              <h3 className='text-lg font-semibold flex items-center gap-2'>
                <ImageIcon className='h-5 w-5' />
                Imagen del Evento
              </h3>

              <div className='space-y-4'>
                {/* Image Preview */}
                {imagePreview && (
                  <div className='relative w-full max-w-md'>
                    <Image
                      src={imagePreview}
                      alt='Preview'
                      className='w-full h-48 object-cover rounded-lg border'
                      fill
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

                {/* File Input */}
                <div className='space-y-2'>
                  <Label htmlFor='image'>Imagen del Evento</Label>
                  <Input
                    ref={fileInputRef}
                    id='image'
                    type='file'
                    accept='image/jpeg,image/jpg,image/png,image/webp'
                    onChange={handleImageUpload}
                    className={errors.image ? 'border-destructive' : ''}
                  />
                  <p className='text-sm text-muted-foreground'>
                    Formatos permitidos: JPG, PNG, WebP. Tamaño máximo: 5MB.
                  </p>
                  {errors.image && (
                    <p className='text-sm text-destructive flex items-center gap-1'>
                      <AlertCircle className='h-4 w-4' />
                      {errors.image}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className='flex justify-end gap-4 pt-6 border-t'>
              <Button
                type='button'
                variant='outline'
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type='submit' disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Creando Evento...
                  </>
                ) : (
                  <>
                    <CheckCircle className='mr-2 h-4 w-4' />
                    Crear Evento
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
