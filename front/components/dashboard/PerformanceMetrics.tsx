'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  Activity,
  Target,
  Award,
  BarChart3,
  PieChart,
  LineChart,
} from 'lucide-react';

interface PerformanceMetricsProps {
  groupId?: string;
}

interface PerformanceData {
  overallScore: number;
  groupGrowth: {
    currentMembers: number;
    previousMonthMembers: number;
    growthRate: number;
  };
  eventPerformance: {
    totalEvents: number;
    averageAttendance: number;
    attendanceTrend: 'up' | 'down' | 'stable';
    completionRate: number;
  };
  memberEngagement: {
    activeMembers: number;
    participationRate: number;
    retentionRate: number;
  };
  achievements: Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
    earned: boolean;
    earnedAt?: string;
  }>;
  monthlyMetrics: Array<{
    month: string;
    events: number;
    attendance: number;
    newMembers: number;
    engagement: number;
  }>;
}

export default function PerformanceMetrics({
  groupId,
}: PerformanceMetricsProps) {
  const [performanceData, setPerformanceData] = useState<PerformanceData>({
    overallScore: 0,
    groupGrowth: {
      currentMembers: 0,
      previousMonthMembers: 0,
      growthRate: 0,
    },
    eventPerformance: {
      totalEvents: 0,
      averageAttendance: 0,
      attendanceTrend: 'stable',
      completionRate: 0,
    },
    memberEngagement: {
      activeMembers: 0,
      participationRate: 0,
      retentionRate: 0,
    },
    achievements: [],
    monthlyMetrics: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPerformanceData = async () => {
      try {
        setIsLoading(true);

        // Mock data - in real implementation, this would come from API
        const mockData: PerformanceData = {
          overallScore: 87,
          groupGrowth: {
            currentMembers: 45,
            previousMonthMembers: 38,
            growthRate: 18.4,
          },
          eventPerformance: {
            totalEvents: 12,
            averageAttendance: 78,
            attendanceTrend: 'up',
            completionRate: 95,
          },
          memberEngagement: {
            activeMembers: 38,
            participationRate: 84,
            retentionRate: 92,
          },
          achievements: [
            {
              id: '1',
              title: 'Organizador Prolífico',
              description: 'Crear 10 eventos exitosos',
              icon: 'Calendar',
              earned: true,
              earnedAt: '2024-01-10',
            },
            {
              id: '2',
              title: 'Líder de Crecimiento',
              description: 'Alcanzar 40+ miembros',
              icon: 'Users',
              earned: true,
              earnedAt: '2024-01-15',
            },
            {
              id: '3',
              title: 'Maestro de Participación',
              description: 'Mantener 80%+ de participación',
              icon: 'Activity',
              earned: true,
              earnedAt: '2024-01-20',
            },
            {
              id: '4',
              title: 'Innovador',
              description: 'Crear 5 eventos únicos',
              icon: 'Award',
              earned: false,
            },
            {
              id: '5',
              title: 'Comunidad Activa',
              description: '100% de eventos completados',
              icon: 'Target',
              earned: false,
            },
          ],
          monthlyMetrics: [
            {
              month: 'Ene',
              events: 2,
              attendance: 75,
              newMembers: 5,
              engagement: 80,
            },
            {
              month: 'Feb',
              events: 3,
              attendance: 82,
              newMembers: 7,
              engagement: 85,
            },
            {
              month: 'Mar',
              events: 4,
              attendance: 78,
              newMembers: 4,
              engagement: 82,
            },
            {
              month: 'Abr',
              events: 3,
              attendance: 85,
              newMembers: 6,
              engagement: 88,
            },
            {
              month: 'May',
              events: 2,
              attendance: 90,
              newMembers: 3,
              engagement: 90,
            },
            {
              month: 'Jun',
              events: 1,
              attendance: 88,
              newMembers: 8,
              engagement: 92,
            },
          ],
        };

        setPerformanceData(mockData);
      } catch (error) {
        console.error('Error loading performance data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPerformanceData();
  }, [groupId]);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 90) return 'default';
    if (score >= 70) return 'secondary';
    return 'destructive';
  };

  if (isLoading) {
    return (
      <div className='space-y-6'>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className='p-6'>
                <div className='animate-pulse'>
                  <div className='h-4 bg-muted rounded w-3/4 mb-2'></div>
                  <div className='h-8 bg-muted rounded w-1/2'></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Overall Performance Score */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <BarChart3 className='h-5 w-5' />
            Puntuación General de Rendimiento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-4'>
              <div className='text-6xl font-bold text-primary'>
                {performanceData.overallScore}
              </div>
              <div>
                <p className='text-sm text-muted-foreground'>
                  Puntuación Total
                </p>
                <Badge
                  variant={getScoreBadgeVariant(performanceData.overallScore)}
                >
                  {performanceData.overallScore >= 90
                    ? 'Excelente'
                    : performanceData.overallScore >= 70
                      ? 'Bueno'
                      : 'Necesita Mejora'}
                </Badge>
              </div>
            </div>
            <div className='text-right'>
              <Progress
                value={performanceData.overallScore}
                className='w-32 h-32'
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-muted-foreground'>
                  Crecimiento del Grupo
                </p>
                <p className='text-2xl font-bold text-green-600'>
                  +{performanceData.groupGrowth.growthRate}%
                </p>
                <p className='text-xs text-muted-foreground'>
                  {performanceData.groupGrowth.currentMembers} miembros
                </p>
              </div>
              <TrendingUp className='h-8 w-8 text-green-600' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-muted-foreground'>
                  Eventos Totales
                </p>
                <p className='text-2xl font-bold text-blue-600'>
                  {performanceData.eventPerformance.totalEvents}
                </p>
                <p className='text-xs text-muted-foreground'>
                  {performanceData.eventPerformance.completionRate}% completados
                </p>
              </div>
              <Calendar className='h-8 w-8 text-blue-600' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-muted-foreground'>
                  Asistencia Promedio
                </p>
                <p className='text-2xl font-bold text-purple-600'>
                  {performanceData.eventPerformance.averageAttendance}%
                </p>
                <p className='text-xs text-muted-foreground'>
                  Tendencia{' '}
                  {performanceData.eventPerformance.attendanceTrend === 'up'
                    ? '↗️'
                    : '↘️'}
                </p>
              </div>
              <Users className='h-8 w-8 text-purple-600' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-muted-foreground'>
                  Participación
                </p>
                <p className='text-2xl font-bold text-orange-600'>
                  {performanceData.memberEngagement.participationRate}%
                </p>
                <p className='text-xs text-muted-foreground'>
                  {performanceData.memberEngagement.activeMembers} activos
                </p>
              </div>
              <Activity className='h-8 w-8 text-orange-600' />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Award className='h-5 w-5' />
            Logros y Reconocimientos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {performanceData.achievements.map(achievement => (
              <div
                key={achievement.id}
                className={`p-4 border rounded-lg ${
                  achievement.earned
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-muted/50'
                }`}
              >
                <div className='flex items-center gap-3'>
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      achievement.earned
                        ? 'bg-green-100 dark:bg-green-900 text-green-600'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {achievement.icon === 'Calendar' && (
                      <Calendar className='w-5 h-5' />
                    )}
                    {achievement.icon === 'Users' && (
                      <Users className='w-5 h-5' />
                    )}
                    {achievement.icon === 'Activity' && (
                      <Activity className='w-5 h-5' />
                    )}
                    {achievement.icon === 'Award' && (
                      <Award className='w-5 h-5' />
                    )}
                    {achievement.icon === 'Target' && (
                      <Target className='w-5 h-5' />
                    )}
                  </div>
                  <div className='flex-1'>
                    <h4 className='font-medium'>{achievement.title}</h4>
                    <p className='text-sm text-muted-foreground'>
                      {achievement.description}
                    </p>
                    {achievement.earned && achievement.earnedAt && (
                      <p className='text-xs text-green-600 mt-1'>
                        Obtenido:{' '}
                        {new Date(achievement.earnedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  {achievement.earned && (
                    <Badge variant='default' className='text-xs'>
                      ✓ Completado
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Trends */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <LineChart className='h-5 w-5' />
            Tendencias Mensuales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            <div className='grid grid-cols-6 gap-4'>
              {performanceData.monthlyMetrics.map((metric, index) => (
                <div key={metric.month} className='text-center'>
                  <div className='text-sm font-medium mb-2'>{metric.month}</div>
                  <div className='space-y-1'>
                    <div className='text-xs text-blue-600'>
                      {metric.events} eventos
                    </div>
                    <div className='text-xs text-green-600'>
                      {metric.attendance}% asistencia
                    </div>
                    <div className='text-xs text-purple-600'>
                      +{metric.newMembers} miembros
                    </div>
                    <div className='text-xs text-orange-600'>
                      {metric.engagement}% engagement
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className='flex items-center justify-center gap-6 text-sm text-muted-foreground'>
              <div className='flex items-center gap-2'>
                <div className='w-3 h-3 rounded-full bg-blue-500'></div>
                <span>Eventos</span>
              </div>
              <div className='flex items-center gap-2'>
                <div className='w-3 h-3 rounded-full bg-green-500'></div>
                <span>Asistencia</span>
              </div>
              <div className='flex items-center gap-2'>
                <div className='w-3 h-3 rounded-full bg-purple-500'></div>
                <span>Nuevos Miembros</span>
              </div>
              <div className='flex items-center gap-2'>
                <div className='w-3 h-3 rounded-full bg-orange-500'></div>
                <span>Engagement</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
