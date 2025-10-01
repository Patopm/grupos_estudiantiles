'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/contexts/AuthContext';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Edit,
  UserCheck,
  UserX,
  Shield,
  Mail,
  Phone,
  Calendar,
  Users,
  Activity,
  Key,
  AlertTriangle,
} from 'lucide-react';
import { usersApi, User } from '@/lib/api/users';

interface UserStats {
  groups_joined: number;
  events_attended: number;
  events_created: number;
  last_activity: string | null;
}

export default function UserDetailPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <UserDetailContent />
    </ProtectedRoute>
  );
}

function UserDetailContent() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const userId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState<string>('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (userId) {
      loadUserData();
    }
  }, [userId]);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      const [userData, statsData] = await Promise.all([
        usersApi.getUser(userId),
        usersApi.getUserStats(userId).catch(() => null),
      ]);
      setUser(userData);
      setUserStats(statsData);
      setNewRole(userData.role);
    } catch (error) {
      console.error('Error loading user data:', error);
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

  const handleRoleUpdate = async () => {
    if (!user || newRole === user.role) {
      setIsRoleDialogOpen(false);
      return;
    }

    try {
      setIsUpdating(true);
      const updatedUser = await usersApi.updateUser(user.id, {
        role: newRole as User['role'],
      });
      setUser(updatedUser);
      toast({
        title: 'Éxito',
        description: `Rol actualizado a ${getRoleDisplay(newRole)}`,
      });
      setIsRoleDialogOpen(false);
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el rol del usuario',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user || !newPassword || newPassword !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Las contraseñas no coinciden',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsUpdating(true);
      await usersApi.resetPassword(user.id, newPassword);
      toast({
        title: 'Éxito',
        description: 'Contraseña restablecida correctamente',
      });
      setIsPasswordDialogOpen(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error resetting password:', error);
      toast({
        title: 'Error',
        description: 'No se pudo restablecer la contraseña',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleUserStatus = async () => {
    if (!user) return;

    try {
      setIsUpdating(true);
      const updatedUser = await usersApi.updateUserStatus(
        user.id,
        !user.is_active
      );
      setUser(updatedUser);
      toast({
        title: 'Éxito',
        description: `Usuario ${!user.is_active ? 'activado' : 'desactivado'} correctamente`,
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el estado del usuario',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
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

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'president':
        return 'default';
      default:
        return 'secondary';
    }
  };

  if (isLoading) {
    return (
      <div className='min-h-screen bg-background'>
        <DashboardHeader
          title='Detalles del Usuario'
          description='Información detallada del usuario'
        />
        <div className='max-w-4xl mx-auto p-6'>
          <div className='animate-pulse space-y-6'>
            <div className='h-64 bg-muted rounded-lg'></div>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='h-48 bg-muted rounded-lg'></div>
              <div className='h-48 bg-muted rounded-lg'></div>
            </div>
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
        <div className='max-w-4xl mx-auto p-6'>
          <div className='text-center py-12'>
            <AlertTriangle className='w-12 h-12 text-muted-foreground mx-auto mb-4' />
            <h3 className='text-lg font-semibold mb-2'>
              Usuario no encontrado
            </h3>
            <p className='text-muted-foreground mb-4'>
              El usuario que buscas no existe o no tienes permisos para verlo.
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
        title={`${user.first_name} ${user.last_name}`}
        description='Información detallada del usuario'
      />

      <div className='max-w-4xl mx-auto p-6 space-y-6'>
        {/* Back Button */}
        <Button
          variant='outline'
          onClick={() => router.push('/dashboard/admin/users')}
          className='mb-4'
        >
          <ArrowLeft className='w-4 h-4 mr-2' />
          Volver a usuarios
        </Button>

        {/* User Info Card */}
        <Card>
          <CardHeader>
            <div className='flex items-start justify-between'>
              <div>
                <CardTitle className='text-2xl'>
                  {user.first_name} {user.last_name}
                </CardTitle>
                <p className='text-muted-foreground mt-1'>
                  {user.student_id || 'Sin matrícula'}
                </p>
              </div>
              <div className='flex items-center gap-2'>
                <Badge variant={getRoleBadgeVariant(user.role)}>
                  {getRoleDisplay(user.role)}
                </Badge>
                <Badge variant={user.is_active ? 'default' : 'secondary'}>
                  {user.is_active ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='flex items-center gap-2'>
                <Mail className='w-4 h-4 text-muted-foreground' />
                <span className='text-sm'>{user.email}</span>
              </div>
              {user.phone && (
                <div className='flex items-center gap-2'>
                  <Phone className='w-4 h-4 text-muted-foreground' />
                  <span className='text-sm'>{user.phone}</span>
                </div>
              )}
              <div className='flex items-center gap-2'>
                <Calendar className='w-4 h-4 text-muted-foreground' />
                <span className='text-sm'>
                  Registrado: {new Date(user.date_joined).toLocaleDateString()}
                </span>
              </div>
              {user.last_login && (
                <div className='flex items-center gap-2'>
                  <Activity className='w-4 h-4 text-muted-foreground' />
                  <span className='text-sm'>
                    Último acceso:{' '}
                    {new Date(user.last_login).toLocaleDateString()}
                  </span>
                </div>
              )}
              {userStats?.last_activity && (
                <div className='flex items-center gap-2'>
                  <Activity className='w-4 h-4 text-muted-foreground' />
                  <span className='text-sm'>
                    Última actividad:{' '}
                    {new Date(userStats.last_activity).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        {userStats && (
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <Card>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-muted-foreground'>
                      Grupos unidos
                    </p>
                    <p className='text-2xl font-bold'>
                      {userStats.groups_joined}
                    </p>
                  </div>
                  <Users className='w-8 h-8 text-blue-500' />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-muted-foreground'>
                      Eventos asistidos
                    </p>
                    <p className='text-2xl font-bold'>
                      {userStats.events_attended}
                    </p>
                  </div>
                  <Activity className='w-8 h-8 text-green-500' />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-muted-foreground'>
                      Eventos creados
                    </p>
                    <p className='text-2xl font-bold'>
                      {userStats.events_created}
                    </p>
                  </div>
                  <Shield className='w-8 h-8 text-purple-500' />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Action Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex flex-wrap gap-3'>
              <Button
                variant='outline'
                onClick={() =>
                  router.push(`/dashboard/admin/users/${user.id}/edit`)
                }
              >
                <Edit className='w-4 h-4 mr-2' />
                Editar usuario
              </Button>
              <Button
                variant='outline'
                onClick={() => setIsRoleDialogOpen(true)}
              >
                <Shield className='w-4 h-4 mr-2' />
                Cambiar rol
              </Button>
              <Button
                variant='outline'
                onClick={() => setIsPasswordDialogOpen(true)}
              >
                <Key className='w-4 h-4 mr-2' />
                Restablecer contraseña
              </Button>
              <Button
                variant={user.is_active ? 'destructive' : 'default'}
                onClick={handleToggleUserStatus}
                disabled={isUpdating}
              >
                {user.is_active ? (
                  <UserX className='w-4 h-4 mr-2' />
                ) : (
                  <UserCheck className='w-4 h-4 mr-2' />
                )}
                {user.is_active ? 'Desactivar' : 'Activar'} usuario
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Role Update Dialog */}
        <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cambiar rol de usuario</DialogTitle>
              <DialogDescription>
                Selecciona el nuevo rol para {user.first_name} {user.last_name}
              </DialogDescription>
            </DialogHeader>
            <div className='space-y-4'>
              <div>
                <Label htmlFor='role'>Rol</Label>
                <Select value={newRole} onValueChange={setNewRole}>
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
            </div>
            <DialogFooter>
              <Button
                variant='outline'
                onClick={() => setIsRoleDialogOpen(false)}
                disabled={isUpdating}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleRoleUpdate}
                disabled={isUpdating || newRole === user.role}
              >
                {isUpdating ? 'Actualizando...' : 'Actualizar rol'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Password Reset Dialog */}
        <Dialog
          open={isPasswordDialogOpen}
          onOpenChange={setIsPasswordDialogOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Restablecer contraseña</DialogTitle>
              <DialogDescription>
                Establece una nueva contraseña para {user.first_name}{' '}
                {user.last_name}
              </DialogDescription>
            </DialogHeader>
            <div className='space-y-4'>
              <div>
                <Label htmlFor='newPassword'>Nueva contraseña</Label>
                <Input
                  id='newPassword'
                  type='password'
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder='Ingresa la nueva contraseña'
                />
              </div>
              <div>
                <Label htmlFor='confirmPassword'>Confirmar contraseña</Label>
                <Input
                  id='confirmPassword'
                  type='password'
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder='Confirma la nueva contraseña'
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant='outline'
                onClick={() => {
                  setIsPasswordDialogOpen(false);
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                disabled={isUpdating}
              >
                Cancelar
              </Button>
              <Button
                onClick={handlePasswordReset}
                disabled={isUpdating || !newPassword || !confirmPassword}
              >
                {isUpdating ? 'Restableciendo...' : 'Restablecer contraseña'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
