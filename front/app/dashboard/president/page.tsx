'use client';

import { useState, useEffect } from 'react';
import { useAuth, ProtectedRoute } from '@/contexts/AuthContext';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { PresidentStats } from '@/components/dashboard/DashboardStats';
import { PresidentQuickActions } from '@/components/dashboard/QuickActions';
import EventManagementOverview from '@/components/dashboard/EventManagementOverview';
import MemberEngagementMetrics from '@/components/dashboard/MemberEngagementMetrics';
import PendingRequestsSummary from '@/components/dashboard/PendingRequestsSummary';
import PerformanceMetrics from '@/components/dashboard/PerformanceMetrics';
import { dashboardApi, PresidentDashboardData } from '@/lib/api/dashboard';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter } from 'next/navigation';
import {
  Users,
  Calendar,
  UserPlus,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3,
  Activity,
  Settings,
} from 'lucide-react';

export default function PresidentDashboard() {
  return (
    <ProtectedRoute allowedRoles={['president']}>
      <PresidentDashboardContent />
    </ProtectedRoute>
  );
}

function PresidentDashboardContent() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [dashboardData, setDashboardData] =
    useState<PresidentDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        const data = await dashboardApi.getPresidentData();
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
          title='Dashboard Presidente'
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
        description='Bienvenido a tu dashboard de presidente. Aquí podrás gestionar tus grupos estudiantiles y eventos.'
      />

      <div className='max-w-7xl mx-auto p-6 space-y-8'>
        {/* Statistics */}
        {dashboardData && <PresidentStats stats={dashboardData.group_stats} />}

        {/* Quick Actions */}
        <PresidentQuickActions
          pendingRequests={dashboardData?.group_stats.pending_requests_count}
          groupsManaged={dashboardData?.group_stats.total_groups_managed}
        />

        {/* Enhanced Dashboard with Tabs */}
        <Tabs defaultValue='overview' className='space-y-6'>
          <TabsList className='grid w-full grid-cols-5'>
            <TabsTrigger value='overview'>Resumen</TabsTrigger>
            <TabsTrigger value='events'>Eventos</TabsTrigger>
            <TabsTrigger value='members'>Miembros</TabsTrigger>
            <TabsTrigger value='requests'>Solicitudes</TabsTrigger>
            <TabsTrigger value='performance'>Rendimiento</TabsTrigger>
          </TabsList>

          <TabsContent value='overview' className='space-y-6'>
            {/* My Groups Section */}
            {dashboardData && dashboardData.my_groups.length > 0 && (
              <div className='space-y-4'>
                <h2 className='text-2xl font-bold'>Mis Grupos</h2>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                  {dashboardData.my_groups.map(group => (
                    <Card
                      key={group.group_id}
                      className='hover:shadow-md transition-shadow cursor-pointer'
                    >
                      <CardHeader className='pb-3'>
                        <div className='flex items-start justify-between'>
                          <div>
                            <CardTitle className='text-lg'>
                              {group.name}
                            </CardTitle>
                            <p className='text-sm text-muted-foreground mt-1'>
                              {group.category}
                            </p>
                          </div>
                          <Badge variant='secondary' className='text-xs'>
                            Presidente
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className='text-sm text-muted-foreground mb-4 line-clamp-2'>
                          {group.description}
                        </p>

                        <div className='space-y-3'>
                          <div className='flex items-center justify-between text-sm'>
                            <div className='flex items-center gap-1'>
                              <Users className='w-4 h-4 text-muted-foreground' />
                              <span>
                                {group.member_count}/{group.max_members}
                              </span>
                            </div>
                            <div className='flex items-center gap-1'>
                              <Calendar className='w-4 h-4 text-muted-foreground' />
                              <span>{group.upcoming_events}</span>
                            </div>
                          </div>

                          {group.pending_requests > 0 && (
                            <div className='flex items-center gap-1 text-sm text-orange-600 dark:text-orange-400'>
                              <UserPlus className='w-4 h-4' />
                              <span>
                                {group.pending_requests} solicitudes pendientes
                              </span>
                            </div>
                          )}

                          <div className='flex gap-2 pt-2'>
                            <Button
                              size='sm'
                              onClick={() =>
                                router.push(
                                  `/dashboard/president/groups/${group.group_id}`
                                )
                              }
                              className='flex-1'
                            >
                              Gestionar
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Events Section */}
            {dashboardData && dashboardData.recent_events.length > 0 && (
              <div className='space-y-4'>
                <h2 className='text-2xl font-bold'>Eventos Recientes</h2>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  {dashboardData.recent_events.slice(0, 4).map(event => (
                    <Card key={event.event_id}>
                      <CardContent className='p-4'>
                        <div className='flex items-start gap-3'>
                          <div className='w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center'>
                            <Calendar className='w-5 h-5 text-blue-600 dark:text-blue-400' />
                          </div>
                          <div className='flex-1'>
                            <h3 className='font-medium'>{event.title}</h3>
                            <p className='text-sm text-muted-foreground'>
                              {event.group_name}
                            </p>
                            <div className='flex items-center gap-4 mt-2 text-xs text-muted-foreground'>
                              <span>
                                {new Date(
                                  event.start_datetime
                                ).toLocaleDateString()}
                              </span>
                              <span>{event.attendee_count} asistentes</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value='events'>
            <EventManagementOverview />
          </TabsContent>

          <TabsContent value='members'>
            <MemberEngagementMetrics />
          </TabsContent>

          <TabsContent value='requests'>
            <PendingRequestsSummary />
          </TabsContent>

          <TabsContent value='performance'>
            <PerformanceMetrics />
          </TabsContent>
        </Tabs>

        {/* User Information */}
        <div className='p-6 bg-primary/5 dark:bg-primary/10 rounded-lg'>
          <h2 className='text-xl font-semibold mb-4'>Información de Usuario</h2>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
            <div>
              <strong>Email:</strong> {user?.email}
            </div>
            <div>
              <strong>Matrícula:</strong> {user?.student_id}
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
