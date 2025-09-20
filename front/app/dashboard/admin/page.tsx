'use client';

import { useState, useEffect } from 'react';
import { useAuth, ProtectedRoute } from '@/contexts/AuthContext';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { AdminStats } from '@/components/dashboard/DashboardStats';
import { AdminQuickActions } from '@/components/dashboard/QuickActions';
import { dashboardApi, AdminDashboardData } from '@/lib/api/dashboard';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Users, UserCheck, Calendar, Settings, Eye, Edit } from 'lucide-react';

export default function AdminDashboard() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminDashboardContent />
    </ProtectedRoute>
  );
}

function AdminDashboardContent() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        const data = await dashboardApi.getAdminData();
        setDashboardData(data);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los datos del dashboard',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) {
    return (
      <div className='min-h-screen bg-background'>
        <DashboardHeader
          title='Dashboard Administrador'
          description='Cargando...'
        />
        <div className='max-w-7xl mx-auto p-6'>
          <div className='animate-pulse space-y-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className='h-32 bg-muted rounded-lg'></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-background'>
      <DashboardHeader
        title={`¡Hola, ${user?.first_name}!`}
        description='Bienvenido al panel de administración. Aquí podrás gestionar todo el sistema.'
      />

      <div className='max-w-7xl mx-auto p-6 space-y-8'>
        {/* Statistics */}
        {dashboardData && (
          <AdminStats
            systemStats={dashboardData.system_stats}
            activitySummary={dashboardData.activity_summary}
          />
        )}

        {/* Quick Actions */}
        <AdminQuickActions
          totalGroups={dashboardData?.system_stats.total_groups}
          totalUsers={dashboardData?.system_stats.total_users}
        />

        {/* Recent Groups Section */}
        {dashboardData && dashboardData.recent_groups.length > 0 && (
          <div className='space-y-4'>
            <h2 className='text-2xl font-bold'>Grupos Recientes</h2>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
              {dashboardData.recent_groups.slice(0, 6).map(group => (
                <Card
                  key={group.group_id}
                  className='hover:shadow-md transition-shadow'
                >
                  <CardHeader className='pb-3'>
                    <div className='flex items-start justify-between'>
                      <div>
                        <CardTitle className='text-lg'>{group.name}</CardTitle>
                        <p className='text-sm text-muted-foreground mt-1'>
                          {group.category}
                        </p>
                      </div>
                      <Badge variant='outline' className='text-xs'>
                        {group.member_count} miembros
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-3'>
                      <div className='flex items-center justify-between text-sm'>
                        <div className='flex items-center gap-1'>
                          <UserCheck className='w-4 h-4 text-muted-foreground' />
                          <span>Presidente: {group.president_name}</span>
                        </div>
                      </div>

                      <div className='text-xs text-muted-foreground'>
                        Creado:{' '}
                        {new Date(group.created_at).toLocaleDateString()}
                      </div>

                      <div className='flex gap-2 pt-2'>
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() =>
                            router.push(
                              `/dashboard/admin/groups/${group.group_id}`
                            )
                          }
                          className='flex-1'
                        >
                          <Eye className='w-4 h-4 mr-1' />
                          Ver
                        </Button>
                        <Button
                          size='sm'
                          onClick={() =>
                            router.push(
                              `/dashboard/admin/groups/${group.group_id}/edit`
                            )
                          }
                          className='flex-1'
                        >
                          <Edit className='w-4 h-4 mr-1' />
                          Editar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {dashboardData.recent_groups.length > 6 && (
              <div className='text-center'>
                <button
                  onClick={() => router.push('/dashboard/admin/groups')}
                  className='text-primary hover:underline'
                >
                  Ver todos los grupos (
                  {dashboardData.system_stats.total_groups})
                </button>
              </div>
            )}
          </div>
        )}

        {/* Recent Users Section */}
        {dashboardData && dashboardData.recent_users.length > 0 && (
          <div className='space-y-4'>
            <h2 className='text-2xl font-bold'>Usuarios Recientes</h2>
            <div className='space-y-3'>
              {dashboardData.recent_users.slice(0, 5).map(userItem => (
                <Card key={userItem.id}>
                  <CardContent className='p-4'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-3'>
                        <div className='w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center'>
                          <Users className='w-5 h-5 text-primary' />
                        </div>
                        <div>
                          <p className='font-medium'>{userItem.full_name}</p>
                          <p className='text-sm text-muted-foreground'>
                            {userItem.email}
                          </p>
                        </div>
                      </div>
                      <div className='flex items-center gap-2'>
                        <Badge
                          variant={
                            userItem.role === 'admin'
                              ? 'destructive'
                              : userItem.role === 'president'
                                ? 'default'
                                : 'secondary'
                          }
                          className='text-xs'
                        >
                          {userItem.role === 'admin'
                            ? 'Admin'
                            : userItem.role === 'president'
                              ? 'Presidente'
                              : 'Estudiante'}
                        </Badge>
                        <div className='text-xs text-muted-foreground'>
                          {new Date(userItem.created_at).toLocaleDateString()}
                        </div>
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() =>
                            router.push(`/dashboard/admin/users/${userItem.id}`)
                          }
                        >
                          <Settings className='w-4 h-4 mr-1' />
                          Gestionar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {dashboardData.recent_users.length > 5 && (
                <div className='text-center'>
                  <button
                    onClick={() => router.push('/dashboard/admin/users')}
                    className='text-primary hover:underline'
                  >
                    Ver todos los usuarios (
                    {dashboardData.system_stats.total_users})
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* System Overview */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Calendar className='w-5 h-5' />
                Actividad del Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                <div className='flex justify-between items-center'>
                  <span className='text-sm'>Eventos próximos</span>
                  <Badge variant='secondary'>
                    {dashboardData?.system_stats.upcoming_events}
                  </Badge>
                </div>
                <div className='flex justify-between items-center'>
                  <span className='text-sm'>Grupos activos</span>
                  <Badge variant='default'>
                    {dashboardData?.system_stats.active_groups}
                  </Badge>
                </div>
                <div className='flex justify-between items-center'>
                  <span className='text-sm'>Total membresías</span>
                  <Badge variant='outline'>
                    {dashboardData?.activity_summary.total_memberships}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Settings className='w-5 h-5' />
                Acciones Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                <Button
                  className='w-full justify-start'
                  variant='outline'
                  onClick={() => router.push('/dashboard/admin/groups/new')}
                >
                  <UserCheck className='w-4 h-4 mr-2' />
                  Crear Nuevo Grupo
                </Button>
                <Button
                  className='w-full justify-start'
                  variant='outline'
                  onClick={() => router.push('/dashboard/admin/users')}
                >
                  <Users className='w-4 h-4 mr-2' />
                  Gestionar Usuarios
                </Button>
                <Button
                  className='w-full justify-start'
                  variant='outline'
                  onClick={() => router.push('/dashboard/admin/reports')}
                >
                  <Calendar className='w-4 h-4 mr-2' />
                  Ver Reportes
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Information */}
        <div className='p-6 bg-primary/5 dark:bg-primary/10 rounded-lg'>
          <h2 className='text-xl font-semibold mb-4'>Información de Usuario</h2>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
            <div>
              <strong>Email:</strong> {user?.email}
            </div>
            <div>
              <strong>Matrícula:</strong> {user?.student_id || 'N/A'}
            </div>
            <div>
              <strong>Teléfono:</strong> {user?.phone}
            </div>
            <div>
              <strong>Rol:</strong> {user?.role_display}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
