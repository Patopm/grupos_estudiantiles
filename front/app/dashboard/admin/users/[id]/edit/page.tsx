'use client';

import { AlertTriangle, ArrowLeft, Save } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ProtectedRoute } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { type UpdateUserData, type User, usersApi } from '@/lib/api/users';

export default function UserEditPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <UserEditContent />
    </ProtectedRoute>
  );
}

function UserEditContent() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const userId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<UpdateUserData>({
    first_name: '',
    last_name: '',
    email: '',
    student_id: '',
    phone: '',
    role: 'student',
    is_active: true,
  });

  useEffect(() => {
    if (userId) {
      loadUser();
    }
  }, [userId]);

  const loadUser = async () => {
    try {
      setIsLoading(true);
      const userData = await usersApi.getUser(userId);
      setUser(userData);
      setFormData({
        first_name: userData.first_name,
        last_name: userData.last_name,
        email: userData.email,
        student_id: userData.student_id || '',
        phone: userData.phone || '',
        role: userData.role,
        is_active: userData.is_active,
      });
    } catch (error) {
      console.error('Error loading user:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar la información del usuario',
        variant: 'destructive',
      });
      router.push('/dashboard/admin/users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    field: keyof UpdateUserData,
    value: string | boolean
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      setIsSaving(true);
      const updatedUser = await usersApi.updateUser(user.id, formData);
      setUser(updatedUser);
      toast({
        title: 'Éxito',
        description: 'Usuario actualizado correctamente',
      });
      router.push(`/dashboard/admin/users/${user.id}`);
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el usuario',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getRoleDisplay = (role: string) => {
    const roleMap = {
      admin: 'Administrador',
      president: 'Presidente',
      student: 'Estudiante',
    };
    return roleMap[role as keyof typeof roleMap] || role;
  };

  if (isLoading) {
    return (
      <div className='min-h-screen bg-background'>
        <DashboardHeader
          title='Editar Usuario'
          description='Modificar información del usuario'
        />
        <div className='max-w-2xl mx-auto p-6'>
          <div className='animate-pulse space-y-6'>
            <div className='h-64 bg-muted rounded-lg'></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className='min-h-screen bg-background'>
        <DashboardHeader
          title='Usuario no encontrado'
          description='El usuario solicitado no existe'
        />
        <div className='max-w-2xl mx-auto p-6'>
          <div className='text-center py-12'>
            <AlertTriangle className='w-12 h-12 text-muted-foreground mx-auto mb-4' />
            <h3 className='text-lg font-semibold mb-2'>
              Usuario no encontrado
            </h3>
            <p className='text-muted-foreground mb-4'>
              El usuario que buscas no existe o no tienes permisos para
              editarlo.
            </p>
            <Button onClick={() => router.push('/dashboard/admin/users')}>
              <ArrowLeft className='w-4 h-4 mr-2' />
              Volver a usuarios
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-background'>
      <DashboardHeader
        title={`Editar: ${user.first_name} ${user.last_name}`}
        description='Modificar información del usuario'
      />

      <div className='max-w-2xl mx-auto p-6 space-y-6'>
        {/* Back Button */}
        <Button
          variant='outline'
          onClick={() => router.push(`/dashboard/admin/users/${user.id}`)}
          className='mb-4'
        >
          <ArrowLeft className='w-4 h-4 mr-2' />
          Volver a detalles
        </Button>

        {/* Edit Form */}
        <Card>
          <CardHeader>
            <CardTitle>Información del Usuario</CardTitle>
          </CardHeader>
          <CardContent className='space-y-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='firstName'>Nombre</Label>
                <Input
                  id='firstName'
                  value={formData.first_name}
                  onChange={e =>
                    handleInputChange('first_name', e.target.value)
                  }
                  placeholder='Nombre'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='lastName'>Apellido</Label>
                <Input
                  id='lastName'
                  value={formData.last_name}
                  onChange={e => handleInputChange('last_name', e.target.value)}
                  placeholder='Apellido'
                />
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='email'>Correo electrónico</Label>
              <Input
                id='email'
                type='email'
                value={formData.email}
                onChange={e => handleInputChange('email', e.target.value)}
                placeholder='correo@tecmilenio.mx'
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='studentId'>Matrícula</Label>
              <Input
                id='studentId'
                value={formData.student_id}
                onChange={e => handleInputChange('student_id', e.target.value)}
                placeholder='AL12345678'
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='phone'>Teléfono</Label>
              <Input
                id='phone'
                value={formData.phone}
                onChange={e => handleInputChange('phone', e.target.value)}
                placeholder='+52 123 456 7890'
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='role'>Rol</Label>
              <Select
                value={formData.role}
                onValueChange={value =>
                  handleInputChange('role', value as User['role'])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder='Seleccionar rol' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='student'>Estudiante</SelectItem>
                  <SelectItem value='president'>Presidente</SelectItem>
                  <SelectItem value='admin'>Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='isActive'>Estado</Label>
              <Select
                value={formData.is_active ? 'active' : 'inactive'}
                onValueChange={value =>
                  handleInputChange('is_active', value === 'active')
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder='Seleccionar estado' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='active'>Activo</SelectItem>
                  <SelectItem value='inactive'>Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className='flex gap-3 justify-end'>
          <Button
            variant='outline'
            onClick={() => router.push(`/dashboard/admin/users/${user.id}`)}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className='w-4 h-4 mr-2' />
            {isSaving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </div>
    </div>
  );
}
