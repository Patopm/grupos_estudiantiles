'use client';

import { useState, useEffect } from 'react';
import { useAuth, ProtectedRoute } from '@/contexts/AuthContext';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { StudentQuickActions } from '@/components/dashboard/QuickActions';
import UpcomingEventsSection from '@/components/dashboard/UpcomingEventsSection';
import EventRecommendations from '@/components/dashboard/EventRecommendations';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import EnhancedParticipationStats from '@/components/dashboard/EnhancedParticipationStats';
import { dashboardApi, StudentDashboardData } from '@/lib/api/dashboard';
import { useToast } from '@/hooks/use-toast';
import GroupList from '@/components/groups/GroupList';
import { groupsApi } from '@/lib/api/groups';
import { useRouter } from 'next/navigation';

export default function StudentDashboard() {
  return (
    <ProtectedRoute allowedRoles={['student']}>
      <StudentDashboardContent />
    </ProtectedRoute>
  );
}

function StudentDashboardContent() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [dashboardData, setDashboardData] =
    useState<StudentDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        const data = await dashboardApi.getStudentData();
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

  const refreshDashboardData = async () => {
    try {
      const data = await dashboardApi.getStudentData();
      setDashboardData(data);
    } catch (error) {
      console.error('Error refreshing dashboard data:', error);
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    try {
      await groupsApi.join(groupId);
      toast({
        title: 'Solicitud Enviada',
        description:
          'Tu solicitud de ingreso ha sido enviada al presidente del grupo',
      });
      refreshDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error joining group:', error);
      toast({
        title: 'Error',
        description: 'No se pudo enviar la solicitud de ingreso',
        variant: 'destructive',
      });
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    if (!confirm('¿Estás seguro de que quieres salir de este grupo?')) {
      return;
    }

    try {
      await groupsApi.leave(groupId);
      toast({
        title: 'Salida Exitosa',
        description: 'Has salido del grupo exitosamente',
      });
      refreshDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error leaving group:', error);
      toast({
        title: 'Error',
        description: 'No se pudo salir del grupo',
        variant: 'destructive',
      });
    }
  };

  const handleViewGroup = (groupId: string) => {
    router.push(`/dashboard/student/groups/${groupId}`);
  };

  if (isLoading) {
    return (
      <div className='min-h-screen bg-background'>
        <DashboardHeader
          title='Dashboard Estudiante'
          description='Cargando...'
        />
        <div className='max-w-7xl mx-auto p-6'>
          <div className='animate-pulse space-y-6'>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              {Array.from({ length: 3 }).map((_, i) => (
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
        description='Bienvenido a tu dashboard de estudiante. Aquí podrás gestionar tus grupos y eventos.'
      />

      <div className='max-w-7xl mx-auto p-6 space-y-8'>
        {/* Enhanced Statistics */}
        {dashboardData && (
          <EnhancedParticipationStats
            stats={dashboardData.participation_stats}
          />
        )}

        {/* Quick Actions */}
        <StudentQuickActions
          pendingRequests={
            dashboardData?.participation_stats.pending_requests_count
          }
          upcomingEvents={dashboardData?.upcoming_events.length}
        />

        {/* Main Content Grid */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Left Column - Events */}
          <div className='lg:col-span-2 space-y-6'>
            {/* Upcoming Events */}
            {dashboardData && (
              <UpcomingEventsSection
                events={dashboardData.upcoming_events}
                onRefresh={refreshDashboardData}
              />
            )}

            {/* Event Recommendations */}
            {dashboardData && dashboardData.recommended_events && (
              <EventRecommendations
                events={dashboardData.recommended_events}
                onRefresh={refreshDashboardData}
              />
            )}

            {/* My Groups Section */}
            {dashboardData && dashboardData.my_groups.length > 0 && (
              <div className='space-y-4'>
                <h2 className='text-2xl font-bold'>Mis Grupos</h2>
                <GroupList
                  groups={dashboardData.my_groups.slice(0, 4)} // Show only first 4
                  showSearch={false}
                  showFilters={false}
                  variant='compact'
                  emptyMessage='No perteneces a ningún grupo'
                  onLeave={handleLeaveGroup}
                  onView={handleViewGroup}
                />
                {dashboardData.my_groups.length > 4 && (
                  <div className='text-center'>
                    <button
                      onClick={() => router.push('/dashboard/student/groups')}
                      className='text-primary hover:underline'
                    >
                      Ver todos mis grupos ({dashboardData.my_groups.length})
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Available Groups Section */}
            {dashboardData && dashboardData.available_groups.length > 0 && (
              <div className='space-y-4'>
                <h2 className='text-2xl font-bold'>Grupos Disponibles</h2>
                <GroupList
                  groups={dashboardData.available_groups.slice(0, 3)} // Show only first 3
                  showSearch={false}
                  showFilters={false}
                  variant='compact'
                  emptyMessage='No hay grupos disponibles'
                  onJoin={handleJoinGroup}
                  onView={handleViewGroup}
                />
                {dashboardData.available_groups.length > 3 && (
                  <div className='text-center'>
                    <button
                      onClick={() =>
                        router.push('/dashboard/student/groups?tab=available')
                      }
                      className='text-primary hover:underline'
                    >
                      Explorar todos los grupos (
                      {dashboardData.available_groups.length})
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Activity Feed */}
          <div className='space-y-6'>
            {/* Activity Feed */}
            {dashboardData && dashboardData.recent_activity && (
              <ActivityFeed activities={dashboardData.recent_activity} />
            )}

            {/* User Information */}
            <div className='p-6 bg-primary/5 dark:bg-primary/10 rounded-lg'>
              <h2 className='text-xl font-semibold mb-4'>
                Información de Usuario
              </h2>
              <div className='grid grid-cols-1 gap-4 text-sm'>
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
      </div>
    </div>
  );
}
