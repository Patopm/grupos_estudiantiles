'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Mail,
  Phone,
  Shield,
} from 'lucide-react';
import { VerificationStatus } from '@/lib/api/verification';

interface VerificationStatusIndicatorProps {
  status?: VerificationStatus | null;
  showActions?: boolean;
  onRequestEmailVerification?: () => void;
  onRequestPhoneVerification?: () => void;
  compact?: boolean;
}

export default function VerificationStatusIndicator({
  status,
  showActions = false,
  onRequestEmailVerification,
  onRequestPhoneVerification,
  compact = false,
}: VerificationStatusIndicatorProps) {
  const { verificationStatus } = useAuth();

  // Use provided status or context status
  const currentStatus = status || verificationStatus;

  if (!currentStatus) {
    return null;
  }

  const getStatusIcon = (verified: boolean, required: boolean) => {
    if (verified) {
      return <CheckCircle className='h-4 w-4 text-green-500' />;
    } else if (required) {
      return <XCircle className='h-4 w-4 text-red-500' />;
    } else {
      return <AlertCircle className='h-4 w-4 text-yellow-500' />;
    }
  };

  const getStatusBadge = (verified: boolean, required: boolean) => {
    if (verified) {
      return (
        <Badge
          variant='default'
          className='bg-green-100 text-green-800 border-green-200'
        >
          Verificado
        </Badge>
      );
    } else if (required) {
      return <Badge variant='destructive'>Requerido</Badge>;
    } else {
      return <Badge variant='secondary'>Opcional</Badge>;
    }
  };

  if (compact) {
    return (
      <div className='flex items-center gap-2'>
        <div className='flex items-center gap-1'>
          {getStatusIcon(
            currentStatus.email_verified,
            currentStatus.email_verification_required
          )}
          <Mail className='h-3 w-3 text-muted-foreground' />
        </div>
        <div className='flex items-center gap-1'>
          {getStatusIcon(
            currentStatus.phone_verified,
            currentStatus.phone_verification_required
          )}
          <Phone className='h-3 w-3 text-muted-foreground' />
        </div>
        {currentStatus.is_fully_verified && (
          <div className='flex items-center gap-1'>
            <Shield className='h-3 w-3 text-green-500' />
            <span className='text-xs text-green-600 font-medium'>
              Verificado
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className='p-4'>
      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <h3 className='text-lg font-semibold text-foreground flex items-center gap-2'>
            <Shield className='h-5 w-5' />
            Estado de Verificación
          </h3>
          <div className='text-sm text-muted-foreground'>
            {currentStatus.verification_progress}% completado
          </div>
        </div>

        <div className='space-y-3'>
          {/* Email Verification */}
          <div className='flex items-center justify-between p-3 bg-muted/50 rounded-lg'>
            <div className='flex items-center gap-3'>
              <Mail className='h-5 w-5 text-muted-foreground' />
              <div>
                <div className='flex items-center gap-2'>
                  <span className='font-medium'>Email</span>
                  {getStatusIcon(
                    currentStatus.email_verified,
                    currentStatus.email_verification_required
                  )}
                </div>
                <p className='text-sm text-muted-foreground'>
                  {currentStatus.email_verified
                    ? `Verificado ${currentStatus.email_verified_at ? new Date(currentStatus.email_verified_at).toLocaleDateString() : ''}`
                    : currentStatus.email_verification_required
                      ? 'Verificación requerida'
                      : 'Verificación opcional'}
                </p>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              {getStatusBadge(
                currentStatus.email_verified,
                currentStatus.email_verification_required
              )}
              {showActions &&
                !currentStatus.email_verified &&
                onRequestEmailVerification && (
                  <Button
                    onClick={onRequestEmailVerification}
                    size='sm'
                    variant='outline'
                  >
                    Verificar
                  </Button>
                )}
            </div>
          </div>

          {/* Phone Verification */}
          <div className='flex items-center justify-between p-3 bg-muted/50 rounded-lg'>
            <div className='flex items-center gap-3'>
              <Phone className='h-5 w-5 text-muted-foreground' />
              <div>
                <div className='flex items-center gap-2'>
                  <span className='font-medium'>Teléfono</span>
                  {getStatusIcon(
                    currentStatus.phone_verified,
                    currentStatus.phone_verification_required
                  )}
                </div>
                <p className='text-sm text-muted-foreground'>
                  {currentStatus.phone_verified
                    ? `Verificado ${currentStatus.phone_verified_at ? new Date(currentStatus.phone_verified_at).toLocaleDateString() : ''}`
                    : currentStatus.phone_verification_required
                      ? 'Verificación requerida'
                      : 'Verificación opcional'}
                </p>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              {getStatusBadge(
                currentStatus.phone_verified,
                currentStatus.phone_verification_required
              )}
              {showActions &&
                !currentStatus.phone_verified &&
                onRequestPhoneVerification && (
                  <Button
                    onClick={onRequestPhoneVerification}
                    size='sm'
                    variant='outline'
                  >
                    Verificar
                  </Button>
                )}
            </div>
          </div>
        </div>

        {/* Overall Status */}
        {currentStatus.is_fully_verified ? (
          <div className='flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg'>
            <CheckCircle className='h-5 w-5 text-green-500' />
            <div>
              <p className='font-medium text-green-800'>
                Cuenta Completamente Verificada
              </p>
              <p className='text-sm text-green-600'>
                Tienes acceso completo a todas las funciones de la plataforma.
              </p>
            </div>
          </div>
        ) : (
          <div className='flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg'>
            <AlertCircle className='h-5 w-5 text-yellow-500' />
            <div>
              <p className='font-medium text-yellow-800'>
                Verificación Pendiente
              </p>
              <p className='text-sm text-yellow-600'>
                Completa la verificación para acceder a todas las funciones.
              </p>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        <div className='space-y-2'>
          <div className='flex justify-between text-sm'>
            <span className='text-muted-foreground'>Progreso</span>
            <span className='font-medium'>
              {currentStatus.verification_progress}%
            </span>
          </div>
          <div className='w-full bg-muted rounded-full h-2'>
            <div
              className='bg-primary h-2 rounded-full transition-all duration-300'
              style={{ width: `${currentStatus.verification_progress}%` }}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
