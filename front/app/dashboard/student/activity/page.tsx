'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/contexts/AuthContext';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import { dashboardApi, StudentDashboardData } from '@/lib/api/dashboard';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function StudentActivityPage() {
  return (
    <ProtectedRoute allowedRoles={['student']}>
      <StudentActivityContent />
    </ProtectedRoute>
  );
}

function StudentActivityContent() {
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
          description: 'No se pudieron cargar los datos de actividad',
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
        <DashboardHeader title='Mi Actividad' description='Cargando...' />
        <div className='max-w-4xl mx-auto p-6'>
          <div className='animate-pulse space-y-6'>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className='h-20 bg-muted rounded-lg'></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-background'>
      <DashboardHeader
        title='Mi Actividad'
        description='Historial completo de tu participación en grupos y eventos'
      />

      <div className='max-w-4xl mx-auto p-6'>
        {dashboardData && dashboardData.recent_activity ? (
          <ActivityFeed
            activities={dashboardData.recent_activity}
            isLoading={false}
          />
        ) : (
          <div className='text-center py-12'>
            <div className='text-6xl mb-4'>📊</div>
            <h2 className='text-2xl font-bold mb-2'>
              Sin actividad registrada
            </h2>
            <p className='text-muted-foreground mb-6'>
              Tu actividad aparecerá aquí cuando participes en grupos y eventos
            </p>
            <div className='flex gap-4 justify-center'>
              <Link
                href='/dashboard/student/groups'
                className='px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90'
              >
                Explorar Grupos
              </Link>
              <a
                href='/dashboard/student/events'
                className='px-4 py-2 border border-input bg-background hover:bg-accent rounded-md'
              >
                Ver Eventos
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
