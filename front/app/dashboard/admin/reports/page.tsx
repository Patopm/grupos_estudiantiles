'use client';

import { useState, useEffect } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import {
  BarChart3,
  Download,
  Calendar,
  Users,
  TrendingUp,
  FileText,
} from 'lucide-react';
import { dashboardApi, AdminDashboardData } from '@/lib/api/dashboard';

export default function AdminReportsPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminReportsContent />
    </ProtectedRoute>
  );
}

function AdminReportsContent() {
  const { toast } = useToast();

  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [reportType, setReportType] = useState('overview');
  const [dateRange, setDateRange] = useState('30');

  useEffect(() => {
    loadDashboardData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const data = await dashboardApi.getAdminData();
      setDashboardData(data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos del reporte',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportReport = (format: 'pdf' | 'excel' | 'csv') => {
    toast({
      title: 'Exportando reporte',
      description: `Generando reporte en formato ${format.toUpperCase()}...`,
    });
    // TODO: Implement actual export functionality
  };

  if (isLoading) {
    return (
      <div className='min-h-screen bg-background'>
        <DashboardHeader
          title='Reportes del Sistema'
          description='Generar reportes y análisis del sistema'
        />
        <div className='max-w-7xl mx-auto p-6'>
          <div className='animate-pulse space-y-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className='h-48 bg-muted rounded-lg'></div>
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
        title='Reportes del Sistema'
        description='Generar reportes y análisis del sistema'
      />

      <div className='max-w-7xl mx-auto p-6 space-y-6'>
        {/* Report Controls */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <FileText className='w-5 h-5' />
              Configuración de Reportes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex flex-col sm:flex-row gap-4 items-start sm:items-center'>
              <div className='flex gap-4'>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger className='w-[200px]'>
                    <SelectValue placeholder='Tipo de reporte' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='overview'>Resumen General</SelectItem>
                    <SelectItem value='users'>Usuarios</SelectItem>
                    <SelectItem value='groups'>Grupos</SelectItem>
                    <SelectItem value='events'>Eventos</SelectItem>
                    <SelectItem value='engagement'>Participación</SelectItem>
                    <SelectItem value='performance'>Rendimiento</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className='w-[150px]'>
                    <SelectValue placeholder='Período' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='7'>Últimos 7 días</SelectItem>
                    <SelectItem value='30'>Últimos 30 días</SelectItem>
                    <SelectItem value='90'>Últimos 90 días</SelectItem>
                    <SelectItem value='365'>Último año</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='flex gap-2'>
                <Button onClick={() => handleExportReport('pdf')}>
                  <Download className='w-4 h-4 mr-2' />
                  PDF
                </Button>
                <Button onClick={() => handleExportReport('excel')}>
                  <Download className='w-4 h-4 mr-2' />
                  Excel
                </Button>
                <Button onClick={() => handleExportReport('csv')}>
                  <Download className='w-4 h-4 mr-2' />
                  CSV
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Overview Report */}
        {reportType === 'overview' && dashboardData && (
          <div className='space-y-6'>
            <h2 className='text-2xl font-bold'>Resumen General del Sistema</h2>

            {/* Key Metrics */}
            <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
              <Card>
                <CardContent className='p-6'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-sm font-medium text-muted-foreground'>
                        Total Usuarios
                      </p>
                      <p className='text-2xl font-bold'>
                        {dashboardData.system_stats.total_users}
                      </p>
                    </div>
                    <Users className='w-8 h-8 text-primary' />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className='p-6'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-sm font-medium text-muted-foreground'>
                        Total Grupos
                      </p>
                      <p className='text-2xl font-bold'>
                        {dashboardData.system_stats.total_groups}
                      </p>
                    </div>
                    <BarChart3 className='w-8 h-8 text-green-500' />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className='p-6'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-sm font-medium text-muted-foreground'>
                        Total Eventos
                      </p>
                      <p className='text-2xl font-bold'>
                        {dashboardData.system_stats.total_events}
                      </p>
                    </div>
                    <Calendar className='w-8 h-8 text-blue-500' />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className='p-6'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-sm font-medium text-muted-foreground'>
                        Membresías
                      </p>
                      <p className='text-2xl font-bold'>
                        {dashboardData.activity_summary.total_memberships}
                      </p>
                    </div>
                    <TrendingUp className='w-8 h-8 text-purple-500' />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Activity Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Resumen de Actividad</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                  <div className='text-center p-4 border rounded-lg'>
                    <p className='text-2xl font-bold text-green-600'>
                      {dashboardData.activity_summary.new_users_this_week}
                    </p>
                    <p className='text-sm text-muted-foreground'>
                      Nuevos usuarios esta semana
                    </p>
                  </div>
                  <div className='text-center p-4 border rounded-lg'>
                    <p className='text-2xl font-bold text-blue-600'>
                      {dashboardData.activity_summary.new_groups_this_week}
                    </p>
                    <p className='text-sm text-muted-foreground'>
                      Nuevos grupos esta semana
                    </p>
                  </div>
                  <div className='text-center p-4 border rounded-lg'>
                    <p className='text-2xl font-bold text-purple-600'>
                      {dashboardData.activity_summary.events_this_week}
                    </p>
                    <p className='text-sm text-muted-foreground'>
                      Eventos esta semana
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Users Report */}
        {reportType === 'users' && dashboardData && (
          <div className='space-y-6'>
            <h2 className='text-2xl font-bold'>Reporte de Usuarios</h2>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <Card>
                <CardHeader>
                  <CardTitle>Distribución por Roles</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-4'>
                    <div className='flex justify-between items-center'>
                      <span>Estudiantes</span>
                      <Badge variant='secondary'>
                        {dashboardData.system_stats.total_students}
                      </Badge>
                    </div>
                    <div className='flex justify-between items-center'>
                      <span>Presidentes</span>
                      <Badge variant='default'>
                        {dashboardData.system_stats.total_presidents}
                      </Badge>
                    </div>
                    <div className='flex justify-between items-center'>
                      <span>Administradores</span>
                      <Badge variant='destructive'>1</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Usuarios Más Activos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-3'>
                    {dashboardData.user_engagement.activityMetrics.mostActiveUsers
                      .slice(0, 5)
                      .map(user => (
                        <div
                          key={user.user_id}
                          className='flex justify-between items-center'
                        >
                          <div>
                            <p className='font-medium'>{user.full_name}</p>
                            <p className='text-sm text-muted-foreground'>
                              {user.role}
                            </p>
                          </div>
                          <Badge variant='outline'>
                            {user.login_count} logins
                          </Badge>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Groups Report */}
        {reportType === 'groups' && dashboardData && (
          <div className='space-y-6'>
            <h2 className='text-2xl font-bold'>Reporte de Grupos</h2>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <Card>
                <CardHeader>
                  <CardTitle>Estadísticas de Grupos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-4'>
                    <div className='flex justify-between items-center'>
                      <span>Total Grupos</span>
                      <Badge variant='secondary'>
                        {dashboardData.system_stats.total_groups}
                      </Badge>
                    </div>
                    <div className='flex justify-between items-center'>
                      <span>Grupos Activos</span>
                      <Badge variant='default'>
                        {dashboardData.system_stats.active_groups}
                      </Badge>
                    </div>
                    <div className='flex justify-between items-center'>
                      <span>Promedio Miembros/Grupo</span>
                      <Badge variant='outline'>
                        {dashboardData.performance_metrics.groupMetrics.averageMembersPerGroup.toFixed(
                          1
                        )}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Grupos con Mejor Rendimiento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-3'>
                    {dashboardData.performance_metrics.groupMetrics.topPerformingGroups
                      .slice(0, 5)
                      .map(group => (
                        <div
                          key={group.group_id}
                          className='flex justify-between items-center'
                        >
                          <div>
                            <p className='font-medium'>{group.name}</p>
                            <p className='text-sm text-muted-foreground'>
                              {group.category}
                            </p>
                          </div>
                          <Badge variant='outline'>
                            {group.engagement_score} pts
                          </Badge>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Events Report */}
        {reportType === 'events' && dashboardData && (
          <div className='space-y-6'>
            <h2 className='text-2xl font-bold'>Reporte de Eventos</h2>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <Card>
                <CardHeader>
                  <CardTitle>Estadísticas de Eventos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-4'>
                    <div className='flex justify-between items-center'>
                      <span>Total Eventos</span>
                      <Badge variant='secondary'>
                        {dashboardData.events_analytics.totalEvents}
                      </Badge>
                    </div>
                    <div className='flex justify-between items-center'>
                      <span>Eventos Publicados</span>
                      <Badge variant='default'>
                        {dashboardData.events_analytics.publishedEvents}
                      </Badge>
                    </div>
                    <div className='flex justify-between items-center'>
                      <span>Eventos Próximos</span>
                      <Badge variant='outline'>
                        {dashboardData.events_analytics.upcomingEvents}
                      </Badge>
                    </div>
                    <div className='flex justify-between items-center'>
                      <span>Tasa de Asistencia</span>
                      <Badge variant='outline'>
                        {dashboardData.events_analytics.attendanceRate.toFixed(
                          1
                        )}
                        %
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Eventos con Mejor Rendimiento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-3'>
                    {dashboardData.events_analytics.topPerformingEvents
                      .slice(0, 5)
                      .map(event => (
                        <div
                          key={event.event_id}
                          className='flex justify-between items-center'
                        >
                          <div>
                            <p className='font-medium'>{event.title}</p>
                            <p className='text-sm text-muted-foreground'>
                              {event.group_name}
                            </p>
                          </div>
                          <Badge variant='outline'>
                            {event.attendee_count} asistentes
                          </Badge>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Platform Health Report */}
        {reportType === 'performance' && dashboardData && (
          <div className='space-y-6'>
            <h2 className='text-2xl font-bold'>Reporte de Rendimiento</h2>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <Card>
                <CardHeader>
                  <CardTitle>Métricas del Sistema</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-4'>
                    <div className='flex justify-between items-center'>
                      <span>Uptime</span>
                      <Badge variant='default'>
                        {dashboardData.platform_health.systemMetrics.uptime}%
                      </Badge>
                    </div>
                    <div className='flex justify-between items-center'>
                      <span>Tiempo de Respuesta</span>
                      <Badge variant='outline'>
                        {
                          dashboardData.platform_health.systemMetrics
                            .responseTime
                        }
                        ms
                      </Badge>
                    </div>
                    <div className='flex justify-between items-center'>
                      <span>Tasa de Error</span>
                      <Badge variant='outline'>
                        {dashboardData.platform_health.systemMetrics.errorRate}%
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Métricas de Seguridad</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-4'>
                    <div className='flex justify-between items-center'>
                      <span>Puntuación de Seguridad</span>
                      <Badge variant='default'>
                        {
                          dashboardData.platform_health.securityMetrics
                            .securityScore
                        }
                        /100
                      </Badge>
                    </div>
                    <div className='flex justify-between items-center'>
                      <span>Logins Fallidos</span>
                      <Badge variant='outline'>
                        {
                          dashboardData.platform_health.securityMetrics
                            .failedLogins
                        }
                      </Badge>
                    </div>
                    <div className='flex justify-between items-center'>
                      <span>Solicitudes Bloqueadas</span>
                      <Badge variant='outline'>
                        {
                          dashboardData.platform_health.securityMetrics
                            .blockedRequests
                        }
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
