'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface RequestCardProps {
  request: {
    id: number;
    user_id: number;
    full_name: string;
    email: string;
    requested_at: string;
    status: 'pending' | 'approved' | 'rejected';
    group_name?: string;
    group_id?: string;
  };
  type: 'group' | 'event';
  onApprove?: (groupId: string, userId: number) => void;
  onReject?: (groupId: string, userId: number) => void;
  isProcessing?: boolean;
  showActions?: boolean;
}

export default function RequestCard({
  request,
  type,
  onApprove,
  onReject,
  isProcessing = false,
  showActions = true,
}: RequestCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          label: 'Pendiente',
          color:
            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
          icon: Clock,
        };
      case 'approved':
        return {
          label: 'Aprobado',
          color:
            'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
          icon: CheckCircle,
        };
      case 'rejected':
        return {
          label: 'Rechazado',
          color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
          icon: XCircle,
        };
      default:
        return {
          label: 'Desconocido',
          color:
            'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
          icon: AlertCircle,
        };
    }
  };

  const statusInfo = getStatusInfo(request.status);
  const StatusIcon = statusInfo.icon;
  const TypeIcon = type === 'group' ? Users : Calendar;

  const handleApprove = () => {
    if (onApprove && request.group_id) {
      onApprove(request.group_id, request.user_id);
    }
  };

  const handleReject = () => {
    if (onReject && request.group_id) {
      onReject(request.group_id, request.user_id);
    }
  };

  return (
    <Card
      className={`transition-all duration-200 ${
        isHovered ? 'shadow-md' : 'shadow-sm'
      } ${isProcessing ? 'opacity-50' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className='p-4'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            <div className='w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center'>
              <TypeIcon className='w-6 h-6 text-primary' />
            </div>
            <div>
              <h4 className='font-medium'>{request.full_name}</h4>
              <div className='flex items-center gap-4 text-sm text-muted-foreground'>
                <div className='flex items-center gap-1'>
                  <Mail className='w-4 h-4' />
                  {request.email}
                </div>
                {request.group_name && (
                  <div className='flex items-center gap-1'>
                    <TypeIcon className='w-4 h-4' />
                    {request.group_name}
                  </div>
                )}
                <div className='flex items-center gap-1'>
                  <Clock className='w-4 h-4' />
                  {formatDistanceToNow(new Date(request.requested_at), {
                    addSuffix: true,
                    locale: es,
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className='flex items-center gap-3'>
            <Badge className={`text-xs ${statusInfo.color}`}>
              <StatusIcon className='w-3 h-3 mr-1' />
              {statusInfo.label}
            </Badge>

            {showActions && request.status === 'pending' && (
              <div className='flex gap-2'>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={handleApprove}
                  disabled={isProcessing}
                  className='text-green-600 hover:text-green-700 hover:bg-green-50'
                >
                  <CheckCircle className='w-4 h-4 mr-1' />
                  Aprobar
                </Button>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={handleReject}
                  disabled={isProcessing}
                  className='text-red-600 hover:text-red-700 hover:bg-red-50'
                >
                  <XCircle className='w-4 h-4 mr-1' />
                  Rechazar
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
