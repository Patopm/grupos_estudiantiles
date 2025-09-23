'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Activity,
  Users,
  Calendar,
  CheckCircle,
  XCircle,
  UserPlus,
  UserMinus,
  Clock,
} from 'lucide-react';
import Link from 'next/link';

interface ActivityItem {
  id: string;
  type:
    | 'group_joined'
    | 'group_left'
    | 'event_registered'
    | 'event_attended'
    | 'event_cancelled';
  title: string;
  description: string;
  timestamp: string;
  group_name?: string;
  event_title?: string;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  isLoading?: boolean;
}

export default function ActivityFeed({
  activities,
  isLoading = false,
}: ActivityFeedProps) {
  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'group_joined':
        return <UserPlus className='w-4 h-4 text-green-600' />;
      case 'group_left':
        return <UserMinus className='w-4 h-4 text-red-600' />;
      case 'event_registered':
        return <Calendar className='w-4 h-4 text-blue-600' />;
      case 'event_attended':
        return <CheckCircle className='w-4 h-4 text-green-600' />;
      case 'event_cancelled':
        return <XCircle className='w-4 h-4 text-red-600' />;
      default:
        return <Activity className='w-4 h-4 text-gray-600' />;
    }
  };

  const getActivityColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'group_joined':
      case 'event_attended':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'group_left':
      case 'event_cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'event_registered':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getActivityLabel = (type: ActivityItem['type']) => {
    switch (type) {
      case 'group_joined':
        return 'Te uniste';
      case 'group_left':
        return 'Saliste';
      case 'event_registered':
        return 'Te registraste';
      case 'event_attended':
        return 'Asististe';
      case 'event_cancelled':
        return 'Cancelaste';
      default:
        return 'Actividad';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) {
      return 'Hace unos minutos';
    } else if (diffInHours < 24) {
      return `Hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
    } else if (diffInHours < 48) {
      return 'Ayer';
    } else {
      return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Activity className='w-5 h-5' />
            Actividad Reciente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className='flex items-start gap-3 animate-pulse'>
                <div className='w-8 h-8 bg-muted rounded-full'></div>
                <div className='flex-1 space-y-2'>
                  <div className='h-4 bg-muted rounded w-3/4'></div>
                  <div className='h-3 bg-muted rounded w-1/2'></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Activity className='w-5 h-5' />
            Actividad Reciente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-center py-8'>
            <Activity className='w-12 h-12 text-muted-foreground mx-auto mb-4' />
            <h3 className='text-lg font-semibold mb-2'>
              Sin actividad reciente
            </h3>
            <p className='text-muted-foreground mb-4'>
              Tu actividad aparecerá aquí cuando te unas a grupos o eventos
            </p>
            <div className='flex gap-2 justify-center'>
              <Button variant='outline' size='sm' asChild>
                <Link href='/dashboard/student/groups'>Explorar Grupos</Link>
              </Button>
              <Button variant='outline' size='sm' asChild>
                <Link href='/dashboard/student/events'>Ver Eventos</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2'>
            <Activity className='w-5 h-5' />
            Actividad Reciente
          </CardTitle>
          <Button variant='outline' size='sm' asChild>
            <Link href='/dashboard/student/activity'>Ver Todo</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {activities.slice(0, 5).map(activity => (
            <div
              key={activity.id}
              className='flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors'
            >
              <div className='flex-shrink-0 mt-0.5'>
                {getActivityIcon(activity.type)}
              </div>
              <div className='flex-1 min-w-0'>
                <div className='flex items-start justify-between gap-2 mb-1'>
                  <div className='flex-1 min-w-0'>
                    <h4 className='font-medium text-sm truncate'>
                      {activity.title}
                    </h4>
                    <p className='text-xs text-muted-foreground mt-1'>
                      {activity.description}
                    </p>
                  </div>
                  <div className='flex items-center gap-2 flex-shrink-0'>
                    <Badge
                      className={`text-xs ${getActivityColor(activity.type)}`}
                    >
                      {getActivityLabel(activity.type)}
                    </Badge>
                    <div className='flex items-center gap-1 text-xs text-muted-foreground'>
                      <Clock className='w-3 h-3' />
                      <span>{formatTimestamp(activity.timestamp)}</span>
                    </div>
                  </div>
                </div>

                {(activity.group_name || activity.event_title) && (
                  <div className='text-xs text-muted-foreground mt-1'>
                    {activity.group_name && (
                      <span className='flex items-center gap-1'>
                        <Users className='w-3 h-3' />
                        {activity.group_name}
                      </span>
                    )}
                    {activity.event_title && (
                      <span className='flex items-center gap-1'>
                        <Calendar className='w-3 h-3' />
                        {activity.event_title}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
