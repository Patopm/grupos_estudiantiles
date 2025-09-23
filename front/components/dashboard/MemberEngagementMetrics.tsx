'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  UserPlus,
  Activity,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

interface MemberEngagementMetricsProps {
  groupId?: string;
}

interface EngagementData {
  totalMembers: number;
  activeMembers: number;
  newMembersThisMonth: number;
  averageEventParticipation: number;
  memberRetentionRate: number;
  topParticipatingMembers: Array<{
    id: string;
    name: string;
    eventsAttended: number;
    participationRate: number;
  }>;
  memberActivityTrend: Array<{
    month: string;
    activeMembers: number;
    newMembers: number;
  }>;
}

export default function MemberEngagementMetrics({
  groupId,
}: MemberEngagementMetricsProps) {
  const [engagementData, setEngagementData] = useState<EngagementData>({
    totalMembers: 0,
    activeMembers: 0,
    newMembersThisMonth: 0,
    averageEventParticipation: 0,
    memberRetentionRate: 0,
    topParticipatingMembers: [],
    memberActivityTrend: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadEngagementData = async () => {
      try {
        setIsLoading(true);

        // Mock data - in real implementation, this would come from API
        const mockData: EngagementData = {
          totalMembers: 45,
          activeMembers: 38,
          newMembersThisMonth: 7,
          averageEventParticipation: 78,
          memberRetentionRate: 85,
          topParticipatingMembers: [
            {
              id: '1',
              name: 'María González',
              eventsAttended: 12,
              participationRate: 95,
            },
            {
              id: '2',
              name: 'Carlos Rodríguez',
              eventsAttended: 11,
              participationRate: 88,
            },
            {
              id: '3',
              name: 'Ana Martínez',
              eventsAttended: 10,
              participationRate: 82,
            },
            {
              id: '4',
              name: 'Luis Fernández',
              eventsAttended: 9,
              participationRate: 75,
            },
            {
              id: '5',
              name: 'Sofia López',
              eventsAttended: 8,
              participationRate: 70,
            },
          ],
          memberActivityTrend: [
            { month: 'Ene', activeMembers: 35, newMembers: 3 },
            { month: 'Feb', activeMembers: 38, newMembers: 5 },
            { month: 'Mar', activeMembers: 42, newMembers: 4 },
            { month: 'Abr', activeMembers: 38, newMembers: 7 },
            { month: 'May', activeMembers: 40, newMembers: 2 },
            { month: 'Jun', activeMembers: 38, newMembers: 6 },
          ],
        };

        setEngagementData(mockData);
      } catch (error) {
        console.error('Error loading engagement data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadEngagementData();
  }, [groupId]);

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

  const engagementRate =
    engagementData.totalMembers > 0
      ? (engagementData.activeMembers / engagementData.totalMembers) * 100
      : 0;

  return (
    <div className='space-y-6'>
      {/* Member Statistics Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-muted-foreground'>
                  Total Miembros
                </p>
                <p className='text-2xl font-bold'>
                  {engagementData.totalMembers}
                </p>
              </div>
              <Users className='h-8 w-8 text-blue-600' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-muted-foreground'>
                  Miembros Activos
                </p>
                <p className='text-2xl font-bold text-green-600'>
                  {engagementData.activeMembers}
                </p>
              </div>
              <Activity className='h-8 w-8 text-green-600' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-muted-foreground'>
                  Nuevos Este Mes
                </p>
                <p className='text-2xl font-bold text-purple-600'>
                  {engagementData.newMembersThisMonth}
                </p>
              </div>
              <UserPlus className='h-8 w-8 text-purple-600' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-muted-foreground'>
                  Tasa de Retención
                </p>
                <p className='text-2xl font-bold text-orange-600'>
                  {engagementData.memberRetentionRate}%
                </p>
              </div>
              <TrendingUp className='h-8 w-8 text-orange-600' />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Engagement Analytics */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Activity className='h-5 w-5' />
              Métricas de Participación
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-2'>
              <div className='flex justify-between text-sm'>
                <span>Tasa de Compromiso</span>
                <span className='font-medium'>
                  {Math.round(engagementRate)}%
                </span>
              </div>
              <Progress value={engagementRate} className='h-2' />
            </div>

            <div className='space-y-2'>
              <div className='flex justify-between text-sm'>
                <span>Participación Promedio en Eventos</span>
                <span className='font-medium'>
                  {engagementData.averageEventParticipation}%
                </span>
              </div>
              <Progress
                value={engagementData.averageEventParticipation}
                className='h-2'
              />
            </div>

            <div className='grid grid-cols-2 gap-4 pt-4'>
              <div className='text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg'>
                <p className='text-2xl font-bold text-green-600'>
                  {engagementData.activeMembers}
                </p>
                <p className='text-sm text-green-600'>Miembros Activos</p>
              </div>
              <div className='text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg'>
                <p className='text-2xl font-bold text-blue-600'>
                  {engagementData.newMembersThisMonth}
                </p>
                <p className='text-sm text-blue-600'>Nuevos Este Mes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <TrendingUp className='h-5 w-5' />
              Miembros Más Participativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              {engagementData.topParticipatingMembers
                .slice(0, 5)
                .map((member, index) => (
                  <div
                    key={member.id}
                    className='flex items-center justify-between p-3 border rounded-lg'
                  >
                    <div className='flex items-center gap-3'>
                      <div className='w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium'>
                        {index + 1}
                      </div>
                      <div>
                        <p className='font-medium text-sm'>{member.name}</p>
                        <p className='text-xs text-muted-foreground'>
                          {member.eventsAttended} eventos
                        </p>
                      </div>
                    </div>
                    <div className='text-right'>
                      <Badge variant='secondary' className='text-xs'>
                        {member.participationRate}%
                      </Badge>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Trend */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Calendar className='h-5 w-5' />
            Tendencia de Actividad de Miembros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            <div className='grid grid-cols-6 gap-4'>
              {engagementData.memberActivityTrend.map((trend, index) => (
                <div key={trend.month} className='text-center'>
                  <div className='text-sm font-medium mb-2'>{trend.month}</div>
                  <div className='space-y-1'>
                    <div className='flex items-center justify-center gap-1'>
                      <div className='w-2 h-2 rounded-full bg-green-500'></div>
                      <span className='text-xs'>{trend.activeMembers}</span>
                    </div>
                    <div className='flex items-center justify-center gap-1'>
                      <div className='w-2 h-2 rounded-full bg-blue-500'></div>
                      <span className='text-xs'>{trend.newMembers}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className='flex items-center justify-center gap-6 text-sm text-muted-foreground'>
              <div className='flex items-center gap-2'>
                <div className='w-3 h-3 rounded-full bg-green-500'></div>
                <span>Miembros Activos</span>
              </div>
              <div className='flex items-center gap-2'>
                <div className='w-3 h-3 rounded-full bg-blue-500'></div>
                <span>Nuevos Miembros</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
