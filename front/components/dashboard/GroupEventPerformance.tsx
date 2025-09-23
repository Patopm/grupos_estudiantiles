'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Target,
  Award,
  Activity,
  Zap,
} from 'lucide-react';

interface GroupEventPerformanceProps {
  performanceData: {
    groupMetrics: {
      totalGroups: number;
      activeGroups: number;
      inactiveGroups: number;
      averageMembersPerGroup: number;
      topPerformingGroups: Array<{
        group_id: string;
        name: string;
        category: string;
        member_count: number;
        event_count: number;
        average_attendance: number;
        engagement_score: number;
      }>;
      groupGrowthTrend: Array<{
        month: string;
        new_groups: number;
        total_groups: number;
      }>;
      categoryDistribution: Array<{
        category: string;
        count: number;
        percentage: number;
      }>;
    };
    eventMetrics: {
      totalEvents: number;
      averageEventsPerGroup: number;
      eventCompletionRate: number;
      averageEventDuration: number;
      mostPopularEventTypes: Array<{
        type: string;
        count: number;
        percentage: number;
      }>;
      eventSuccessRate: number;
      averageRegistrationRate: number;
    };
    engagementMetrics: {
      overallEngagementScore: number;
      averageMemberActivity: number;
      eventParticipationRate: number;
      groupRetentionRate: number;
      memberGrowthRate: number;
      activeMemberPercentage: number;
    };
    platformHealth: {
      systemUptime: number;
      averageResponseTime: number;
      errorRate: number;
      userSatisfactionScore: number;
      featureAdoptionRate: number;
    };
  };
}

export default function GroupEventPerformance({
  performanceData,
}: GroupEventPerformanceProps) {
  const [selectedMetric, setSelectedMetric] = useState<
    'groups' | 'events' | 'engagement' | 'health'
  >('groups');

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceBadge = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold'>Métricas de Rendimiento</h2>
          <p className='text-muted-foreground'>
            Análisis de rendimiento de grupos, eventos y participación
          </p>
        </div>
        <div className='flex gap-2'>
          {(['groups', 'events', 'engagement', 'health'] as const).map(
            metric => (
              <Button
                key={metric}
                variant={selectedMetric === metric ? 'default' : 'outline'}
                size='sm'
                onClick={() => setSelectedMetric(metric)}
              >
                {metric === 'groups'
                  ? 'Grupos'
                  : metric === 'events'
                    ? 'Eventos'
                    : metric === 'engagement'
                      ? 'Participación'
                      : 'Salud'}
              </Button>
            )
          )}
        </div>
      </div>

      {/* Group Metrics */}
      {selectedMetric === 'groups' && (
        <div className='space-y-6'>
          {/* Group Overview */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            <Card>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-muted-foreground'>
                      Total Grupos
                    </p>
                    <p className='text-2xl font-bold'>
                      {performanceData.groupMetrics.totalGroups}
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      {performanceData.groupMetrics.activeGroups} activos
                    </p>
                  </div>
                  <Users className='h-8 w-8 text-muted-foreground' />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-muted-foreground'>
                      Promedio Miembros
                    </p>
                    <p className='text-2xl font-bold'>
                      {performanceData.groupMetrics.averageMembersPerGroup.toFixed(
                        1
                      )}
                    </p>
                    <p className='text-xs text-muted-foreground'>por grupo</p>
                  </div>
                  <BarChart3 className='h-8 w-8 text-muted-foreground' />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-muted-foreground'>
                      Grupos Activos
                    </p>
                    <p className='text-2xl font-bold'>
                      {performanceData.groupMetrics.activeGroups}
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      {(
                        (performanceData.groupMetrics.activeGroups /
                          performanceData.groupMetrics.totalGroups) *
                        100
                      ).toFixed(1)}
                      % del total
                    </p>
                  </div>
                  <Activity className='h-8 w-8 text-muted-foreground' />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-muted-foreground'>
                      Grupos Inactivos
                    </p>
                    <p className='text-2xl font-bold'>
                      {performanceData.groupMetrics.inactiveGroups}
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      Requieren atención
                    </p>
                  </div>
                  <TrendingDown className='h-8 w-8 text-muted-foreground' />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Performing Groups */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Award className='w-5 h-5' />
                Grupos con Mejor Rendimiento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {performanceData.groupMetrics.topPerformingGroups.map(
                  (group, index) => (
                    <div
                      key={group.group_id}
                      className='flex items-center justify-between p-4 border rounded-lg'
                    >
                      <div className='flex items-center gap-4'>
                        <div className='w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center'>
                          <span className='text-sm font-bold text-primary'>
                            {index + 1}
                          </span>
                        </div>
                        <div>
                          <p className='font-medium'>{group.name}</p>
                          <p className='text-sm text-muted-foreground'>
                            {group.category} • {group.member_count} miembros
                          </p>
                        </div>
                      </div>
                      <div className='flex items-center gap-4'>
                        <div className='text-right'>
                          <p className='text-sm font-medium'>
                            {group.event_count}
                          </p>
                          <p className='text-xs text-muted-foreground'>
                            eventos
                          </p>
                        </div>
                        <div className='text-right'>
                          <p className='text-sm font-medium'>
                            {group.average_attendance.toFixed(1)}
                          </p>
                          <p className='text-xs text-muted-foreground'>
                            promedio
                          </p>
                        </div>
                        <div className='text-right'>
                          <Badge
                            className={getPerformanceBadge(
                              group.engagement_score
                            )}
                          >
                            {group.engagement_score.toFixed(0)}%
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>

          {/* Category Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <BarChart3 className='w-5 h-5' />
                Distribución por Categoría
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {performanceData.groupMetrics.categoryDistribution.map(
                  (item, index) => (
                    <div key={index} className='space-y-2'>
                      <div className='flex items-center justify-between'>
                        <span className='text-sm font-medium capitalize'>
                          {item.category}
                        </span>
                        <div className='flex items-center gap-2'>
                          <span className='text-sm text-muted-foreground'>
                            {item.count}
                          </span>
                          <Badge variant='outline'>
                            {item.percentage.toFixed(1)}%
                          </Badge>
                        </div>
                      </div>
                      <Progress value={item.percentage} className='h-2' />
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Event Metrics */}
      {selectedMetric === 'events' && (
        <div className='space-y-6'>
          {/* Event Overview */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            <Card>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-muted-foreground'>
                      Total Eventos
                    </p>
                    <p className='text-2xl font-bold'>
                      {performanceData.eventMetrics.totalEvents}
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      {performanceData.eventMetrics.averageEventsPerGroup.toFixed(
                        1
                      )}{' '}
                      por grupo
                    </p>
                  </div>
                  <BarChart3 className='h-8 w-8 text-muted-foreground' />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-muted-foreground'>
                      Tasa de Completitud
                    </p>
                    <p className='text-2xl font-bold'>
                      {performanceData.eventMetrics.eventCompletionRate.toFixed(
                        1
                      )}
                      %
                    </p>
                    <div className='mt-2'>
                      <Progress
                        value={performanceData.eventMetrics.eventCompletionRate}
                        className='h-2'
                      />
                    </div>
                  </div>
                  <Target className='h-8 w-8 text-muted-foreground' />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-muted-foreground'>
                      Tasa de Éxito
                    </p>
                    <p className='text-2xl font-bold'>
                      {performanceData.eventMetrics.eventSuccessRate.toFixed(1)}
                      %
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      eventos exitosos
                    </p>
                  </div>
                  <Award className='h-8 w-8 text-muted-foreground' />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-muted-foreground'>
                      Duración Promedio
                    </p>
                    <p className='text-2xl font-bold'>
                      {performanceData.eventMetrics.averageEventDuration.toFixed(
                        1
                      )}
                      h
                    </p>
                    <p className='text-xs text-muted-foreground'>por evento</p>
                  </div>
                  <Activity className='h-8 w-8 text-muted-foreground' />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Most Popular Event Types */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <TrendingUp className='w-5 h-5' />
                Tipos de Eventos Más Populares
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {performanceData.eventMetrics.mostPopularEventTypes.map(
                  (item, index) => (
                    <div key={index} className='space-y-2'>
                      <div className='flex items-center justify-between'>
                        <span className='text-sm font-medium capitalize'>
                          {item.type}
                        </span>
                        <div className='flex items-center gap-2'>
                          <span className='text-sm text-muted-foreground'>
                            {item.count}
                          </span>
                          <Badge variant='outline'>
                            {item.percentage.toFixed(1)}%
                          </Badge>
                        </div>
                      </div>
                      <Progress value={item.percentage} className='h-2' />
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Engagement Metrics */}
      {selectedMetric === 'engagement' && (
        <div className='space-y-6'>
          {/* Engagement Overview */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            <Card>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-muted-foreground'>
                      Puntuación General
                    </p>
                    <p
                      className={`text-2xl font-bold ${getPerformanceColor(performanceData.engagementMetrics.overallEngagementScore)}`}
                    >
                      {performanceData.engagementMetrics.overallEngagementScore.toFixed(
                        1
                      )}
                    </p>
                    <Badge
                      className={getPerformanceBadge(
                        performanceData.engagementMetrics.overallEngagementScore
                      )}
                    >
                      {performanceData.engagementMetrics
                        .overallEngagementScore >= 80
                        ? 'Excelente'
                        : performanceData.engagementMetrics
                              .overallEngagementScore >= 60
                          ? 'Bueno'
                          : 'Necesita Mejora'}
                    </Badge>
                  </div>
                  <Zap className='h-8 w-8 text-muted-foreground' />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-muted-foreground'>
                      Actividad Promedio
                    </p>
                    <p className='text-2xl font-bold'>
                      {performanceData.engagementMetrics.averageMemberActivity.toFixed(
                        1
                      )}
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      eventos por miembro
                    </p>
                  </div>
                  <Activity className='h-8 w-8 text-muted-foreground' />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-muted-foreground'>
                      Tasa de Participación
                    </p>
                    <p className='text-2xl font-bold'>
                      {performanceData.engagementMetrics.eventParticipationRate.toFixed(
                        1
                      )}
                      %
                    </p>
                    <div className='mt-2'>
                      <Progress
                        value={
                          performanceData.engagementMetrics
                            .eventParticipationRate
                        }
                        className='h-2'
                      />
                    </div>
                  </div>
                  <Users className='h-8 w-8 text-muted-foreground' />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-muted-foreground'>
                      Retención de Grupos
                    </p>
                    <p className='text-2xl font-bold'>
                      {performanceData.engagementMetrics.groupRetentionRate.toFixed(
                        1
                      )}
                      %
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      grupos activos
                    </p>
                  </div>
                  <TrendingUp className='h-8 w-8 text-muted-foreground' />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Platform Health */}
      {selectedMetric === 'health' && (
        <div className='space-y-6'>
          {/* Health Overview */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            <Card>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-muted-foreground'>
                      Tiempo de Actividad
                    </p>
                    <p className='text-2xl font-bold'>
                      {performanceData.platformHealth.systemUptime.toFixed(1)}%
                    </p>
                    <Badge
                      className={getPerformanceBadge(
                        performanceData.platformHealth.systemUptime
                      )}
                    >
                      {performanceData.platformHealth.systemUptime >= 99
                        ? 'Excelente'
                        : performanceData.platformHealth.systemUptime >= 95
                          ? 'Bueno'
                          : 'Crítico'}
                    </Badge>
                  </div>
                  <Activity className='h-8 w-8 text-muted-foreground' />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-muted-foreground'>
                      Tiempo de Respuesta
                    </p>
                    <p className='text-2xl font-bold'>
                      {performanceData.platformHealth.averageResponseTime.toFixed(
                        0
                      )}
                      ms
                    </p>
                    <p className='text-xs text-muted-foreground'>promedio</p>
                  </div>
                  <Zap className='h-8 w-8 text-muted-foreground' />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-muted-foreground'>
                      Tasa de Error
                    </p>
                    <p className='text-2xl font-bold'>
                      {performanceData.platformHealth.errorRate.toFixed(2)}%
                    </p>
                    <Badge
                      className={getPerformanceBadge(
                        100 - performanceData.platformHealth.errorRate
                      )}
                    >
                      {performanceData.platformHealth.errorRate < 1
                        ? 'Excelente'
                        : performanceData.platformHealth.errorRate < 5
                          ? 'Bueno'
                          : 'Crítico'}
                    </Badge>
                  </div>
                  <TrendingDown className='h-8 w-8 text-muted-foreground' />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-muted-foreground'>
                      Satisfacción Usuario
                    </p>
                    <p className='text-2xl font-bold'>
                      {performanceData.platformHealth.userSatisfactionScore.toFixed(
                        1
                      )}
                      /5
                    </p>
                    <div className='mt-2'>
                      <Progress
                        value={
                          (performanceData.platformHealth
                            .userSatisfactionScore /
                            5) *
                          100
                        }
                        className='h-2'
                      />
                    </div>
                  </div>
                  <Award className='h-8 w-8 text-muted-foreground' />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
