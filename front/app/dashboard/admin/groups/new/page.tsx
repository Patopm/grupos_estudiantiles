'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/contexts/AuthContext';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
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
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Users, Save, ArrowLeft, X } from 'lucide-react';
import { groupsApi, AvailablePresident } from '@/lib/api/groups';
import Image from 'next/image';

export default function AdminGroupsNewPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminGroupsNewContent />
    </ProtectedRoute>
  );
}

function AdminGroupsNewContent() {
  const router = useRouter();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    max_members: 50,
    president_id: '',
    is_active: true,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availablePresidents, setAvailablePresidents] = useState<
    AvailablePresident[]
  >([]);
  const [loadingPresidents, setLoadingPresidents] = useState(false);

  const categories = [
    'Académico',
    'Deportivo',
    'Cultural',
    'Tecnológico',
    'Social',
    'Voluntariado',
    'Profesional',
    'Otro',
  ];

  // Load available presidents on component mount
  useEffect(() => {
    const loadAvailablePresidents = async () => {
      try {
        setLoadingPresidents(true);
        const presidents = await groupsApi.getAvailablePresidents();
        setAvailablePresidents(presidents);
      } catch (error) {
        console.error('Error loading available presidents:', error);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los presidentes disponibles',
          variant: 'destructive',
        });
      } finally {
        setLoadingPresidents(false);
      }
    };

    loadAvailablePresidents();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleInputChange = (
    field: string,
    value: string | number | boolean
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = e => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.description || !formData.category) {
      toast({
        title: 'Error',
        description: 'Por favor completa todos los campos obligatorios',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const submitData = {
        ...formData,
        max_members: Number(formData.max_members),
        president_id:
          formData.president_id && formData.president_id !== 'none'
            ? Number(formData.president_id)
            : undefined,
      };

      await groupsApi.create(submitData, imageFile || undefined);

      toast({
        title: 'Éxito',
        description: 'Grupo creado correctamente',
      });

      router.push('/dashboard/admin/groups');
    } catch (error) {
      console.error('Error creating group:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear el grupo',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='min-h-screen bg-background'>
      <DashboardHeader
        title='Crear Nuevo Grupo'
        description='Crear un nuevo grupo estudiantil'
      />

      <div className='max-w-4xl mx-auto p-6'>
        <div className='mb-6'>
          <Button
            variant='outline'
            onClick={() => router.push('/dashboard/admin/groups')}
            className='mb-4'
          >
            <ArrowLeft className='w-4 h-4 mr-2' />
            Volver a Grupos
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Users className='w-5 h-5' />
              Información del Grupo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className='space-y-6'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div className='space-y-2'>
                  <Label htmlFor='name'>Nombre del Grupo *</Label>
                  <Input
                    id='name'
                    value={formData.name}
                    onChange={e => handleInputChange('name', e.target.value)}
                    placeholder='Ej: Club de Programación'
                    required
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='category'>Categoría *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={value =>
                      handleInputChange('category', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Selecciona una categoría' />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='description'>Descripción *</Label>
                <Textarea
                  id='description'
                  value={formData.description}
                  onChange={e =>
                    handleInputChange('description', e.target.value)
                  }
                  placeholder='Describe el propósito y actividades del grupo...'
                  rows={4}
                  required
                />
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div className='space-y-2'>
                  <Label htmlFor='max_members'>Máximo de Miembros</Label>
                  <Input
                    id='max_members'
                    type='number'
                    value={formData.max_members}
                    onChange={e =>
                      handleInputChange('max_members', Number(e.target.value))
                    }
                    min='1'
                    max='1000'
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='president_id'>Presidente (Opcional)</Label>
                  <Select
                    value={formData.president_id}
                    onValueChange={value =>
                      handleInputChange('president_id', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          loadingPresidents
                            ? 'Cargando presidentes...'
                            : 'Selecciona un presidente'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='none'>
                        Sin presidente asignado
                      </SelectItem>
                      {availablePresidents.map(president => (
                        <SelectItem
                          key={president.id}
                          value={president.id.toString()}
                        >
                          {president.full_name} ({president.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='image'>Imagen del Grupo</Label>
                <div className='space-y-4'>
                  <div className='flex items-center gap-4'>
                    <Input
                      id='image'
                      type='file'
                      accept='image/*'
                      onChange={handleImageChange}
                      className='flex-1'
                    />
                    {imagePreview && (
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={removeImage}
                      >
                        <X className='w-4 h-4 mr-1' />
                        Eliminar
                      </Button>
                    )}
                  </div>
                  {imagePreview && (
                    <div className='mt-4'>
                      <Image
                        src={imagePreview}
                        alt='Preview'
                        className='w-32 h-32 object-cover rounded-lg border'
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className='flex items-center space-x-2'>
                <input
                  type='checkbox'
                  id='is_active'
                  checked={formData.is_active}
                  onChange={e =>
                    handleInputChange('is_active', e.target.checked)
                  }
                  className='rounded'
                />
                <Label htmlFor='is_active'>Grupo activo</Label>
              </div>

              <div className='flex gap-4 pt-6'>
                <Button
                  type='submit'
                  disabled={isSubmitting}
                  className='flex-1'
                >
                  <Save className='w-4 h-4 mr-2' />
                  {isSubmitting ? 'Creando...' : 'Crear Grupo'}
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => router.push('/dashboard/admin/groups')}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
