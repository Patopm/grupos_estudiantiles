'use client';

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faExclamationTriangle,
  faShieldAlt,
  faLock,
  faClock,
  faRefresh,
  faEnvelope,
  faPhone,
  faInfoCircle,
  faExclamationCircle,
} from '@fortawesome/free-solid-svg-icons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AuthError,
  RateLimitError,
  MFAError,
  VerificationError,
  SecurityError,
  ErrorRecoveryAction,
} from '@/lib/errors/types';
import { useRateLimitCountdown } from '@/lib/errors/countdown';
import { ProgressiveSecurityManager } from '@/lib/errors/security';

interface EnhancedErrorDisplayProps {
  error: AuthError;
  recoveryActions?: ErrorRecoveryAction[];
  onDismiss?: () => void;
  className?: string;
}

/**
 * Enhanced error display component with specific handling for different error types
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
 */
export default function EnhancedErrorDisplay({
  error,
  recoveryActions = [],
  onDismiss,
  className = '',
}: EnhancedErrorDisplayProps) {
  const [securityMeasures, setSecurityMeasures] = useState(
    ProgressiveSecurityManager.getActiveSecurityMeasures()
  );

  // Rate limit countdown for rate limit errors
  const rateLimitCountdown = useRateLimitCountdown(
    error.type === 'rate_limit'
      ? (error as RateLimitError).retryAfter
      : undefined
  );

  useEffect(() => {
    // Update security measures when error changes
    if (error.type === 'security_violation') {
      setSecurityMeasures(
        ProgressiveSecurityManager.getActiveSecurityMeasures()
      );
    }
  }, [error]);

  const getErrorIcon = () => {
    switch (error.type) {
      case 'rate_limit':
        return faClock;
      case 'mfa_required':
      case 'mfa_invalid':
        return faLock;
      case 'verification_required':
      case 'verification_invalid':
        return faEnvelope;
      case 'security_violation':
        return faShieldAlt;
      case 'network':
        return faRefresh;
      default:
        return faExclamationTriangle;
    }
  };

  const getErrorColor = () => {
    switch (error.type) {
      case 'rate_limit':
        return 'text-orange-600';
      case 'mfa_required':
      case 'mfa_invalid':
        return 'text-blue-600';
      case 'verification_required':
      case 'verification_invalid':
        return 'text-purple-600';
      case 'security_violation':
        return 'text-red-600';
      case 'network':
        return 'text-yellow-600';
      default:
        return 'text-destructive';
    }
  };

  const getBorderColor = () => {
    switch (error.type) {
      case 'rate_limit':
        return 'border-orange-200';
      case 'mfa_required':
      case 'mfa_invalid':
        return 'border-blue-200';
      case 'verification_required':
      case 'verification_invalid':
        return 'border-purple-200';
      case 'security_violation':
        return 'border-red-200';
      case 'network':
        return 'border-yellow-200';
      default:
        return 'border-destructive/20';
    }
  };

  const getBackgroundColor = () => {
    switch (error.type) {
      case 'rate_limit':
        return 'bg-orange-50';
      case 'mfa_required':
      case 'mfa_invalid':
        return 'bg-blue-50';
      case 'verification_required':
      case 'verification_invalid':
        return 'bg-purple-50';
      case 'security_violation':
        return 'bg-red-50';
      case 'network':
        return 'bg-yellow-50';
      default:
        return 'bg-destructive/10';
    }
  };

  const renderRateLimitDetails = (rateLimitError: RateLimitError) => (
    <div className='space-y-3'>
      <div className='flex items-center gap-2'>
        <FontAwesomeIcon icon={faClock} className='w-4 h-4' />
        <span className='font-medium'>Límite de intentos alcanzado</span>
      </div>

      {rateLimitCountdown.isActive && (
        <div className='bg-white/50 rounded-md p-3'>
          <div className='text-sm text-muted-foreground mb-1'>
            Tiempo restante:
          </div>
          <div className='text-lg font-mono font-bold'>
            {rateLimitCountdown.formattedTime}
          </div>
        </div>
      )}

      {rateLimitError.remainingAttempts !== undefined && (
        <div className='text-sm text-muted-foreground'>
          Intentos restantes después del tiempo de espera:{' '}
          {rateLimitError.remainingAttempts}
        </div>
      )}
    </div>
  );

  const renderMFADetails = (mfaError: MFAError) => (
    <div className='space-y-3'>
      <div className='flex items-center gap-2'>
        <FontAwesomeIcon icon={faLock} className='w-4 h-4' />
        <span className='font-medium'>
          {mfaError.type === 'mfa_required'
            ? 'Autenticación de dos factores requerida'
            : 'Error en autenticación de dos factores'}
        </span>
      </div>

      {mfaError.mfaType && (
        <div className='text-sm text-muted-foreground'>
          Tipo:{' '}
          {mfaError.mfaType === 'totp'
            ? 'Aplicación autenticadora'
            : mfaError.mfaType === 'backup_code'
              ? 'Código de respaldo'
              : 'SMS'}
        </div>
      )}

      {mfaError.attemptsRemaining !== undefined && (
        <div className='text-sm text-muted-foreground'>
          Intentos restantes: {mfaError.attemptsRemaining}
        </div>
      )}

      {mfaError.backupCodesRemaining !== undefined && (
        <div className='text-sm text-muted-foreground'>
          Códigos de respaldo disponibles: {mfaError.backupCodesRemaining}
        </div>
      )}
    </div>
  );

  const renderVerificationDetails = (verificationError: VerificationError) => (
    <div className='space-y-3'>
      <div className='flex items-center gap-2'>
        <FontAwesomeIcon
          icon={
            verificationError.verificationType === 'email'
              ? faEnvelope
              : faPhone
          }
          className='w-4 h-4'
        />
        <span className='font-medium'>
          Verificación de{' '}
          {verificationError.verificationType === 'email'
            ? 'correo'
            : 'teléfono'}{' '}
          requerida
        </span>
      </div>

      {verificationError.canResend && (
        <div className='text-sm text-muted-foreground'>
          {verificationError.resendAvailableAt &&
          new Date() < verificationError.resendAvailableAt
            ? `Podrás solicitar un nuevo código en ${Math.ceil((verificationError.resendAvailableAt.getTime() - Date.now()) / 60000)} minutos`
            : 'Puedes solicitar un nuevo código de verificación'}
        </div>
      )}
    </div>
  );

  const renderSecurityDetails = (securityError: SecurityError) => (
    <div className='space-y-3'>
      <div className='flex items-center gap-2'>
        <FontAwesomeIcon icon={faShieldAlt} className='w-4 h-4' />
        <span className='font-medium'>Medida de seguridad activada</span>
        <Badge
          variant={
            securityError.securityLevel === 'critical'
              ? 'destructive'
              : securityError.securityLevel === 'high'
                ? 'destructive'
                : securityError.securityLevel === 'medium'
                  ? 'secondary'
                  : 'outline'
          }
        >
          {securityError.securityLevel?.toUpperCase()}
        </Badge>
      </div>

      {securityError.violationType && (
        <div className='text-sm text-muted-foreground'>
          Tipo:{' '}
          {securityError.violationType === 'suspicious_activity'
            ? 'Actividad sospechosa'
            : securityError.violationType === 'multiple_failures'
              ? 'Múltiples fallos'
              : 'Cambio de ubicación'}
        </div>
      )}

      {securityError.recommendedActions &&
        securityError.recommendedActions.length > 0 && (
          <div className='space-y-2'>
            <div className='text-sm font-medium'>Acciones recomendadas:</div>
            <ul className='text-sm text-muted-foreground space-y-1'>
              {securityError.recommendedActions.map((action, index) => (
                <li key={index} className='flex items-start gap-2'>
                  <span className='text-xs mt-1'>•</span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

      {securityMeasures.length > 0 && (
        <div className='space-y-2'>
          <div className='text-sm font-medium'>
            Medidas de seguridad activas:
          </div>
          <div className='space-y-1'>
            {securityMeasures.map((measure, index) => (
              <div key={index} className='text-sm bg-white/50 rounded p-2'>
                <div className='font-medium'>{measure.name}</div>
                <div className='text-muted-foreground text-xs'>
                  {measure.description}
                </div>
                {measure.expiresAt && (
                  <div className='text-xs text-muted-foreground mt-1'>
                    Expira: {measure.expiresAt.toLocaleString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderErrorSpecificContent = () => {
    switch (error.type) {
      case 'rate_limit':
        return renderRateLimitDetails(error as RateLimitError);
      case 'mfa_required':
      case 'mfa_invalid':
        return renderMFADetails(error as MFAError);
      case 'verification_required':
      case 'verification_invalid':
        return renderVerificationDetails(error as VerificationError);
      case 'security_violation':
        return renderSecurityDetails(error as SecurityError);
      default:
        return null;
    }
  };

  return (
    <Card
      className={`${getBorderColor()} ${getBackgroundColor()} ${className}`}
    >
      <CardHeader className='pb-3'>
        <div className='flex items-start justify-between'>
          <div className='flex items-center gap-3'>
            <div className={`p-2 rounded-full bg-white/50 ${getErrorColor()}`}>
              <FontAwesomeIcon icon={getErrorIcon()} className='w-5 h-5' />
            </div>
            <div>
              <CardTitle className='text-lg'>Error de Autenticación</CardTitle>
              <p className='text-sm text-muted-foreground mt-1'>
                {error.message}
              </p>
            </div>
          </div>
          {onDismiss && (
            <Button
              variant='ghost'
              size='sm'
              onClick={onDismiss}
              className='text-muted-foreground hover:text-foreground'
            >
              ×
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className='space-y-4'>
        {renderErrorSpecificContent()}

        {/* Recovery Actions */}
        {recoveryActions.length > 0 && (
          <div className='space-y-3'>
            <div className='text-sm font-medium'>Acciones disponibles:</div>
            <div className='flex flex-wrap gap-2'>
              {recoveryActions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.primary ? 'default' : 'outline'}
                  size='sm'
                  onClick={action.action}
                  disabled={
                    error.type === 'rate_limit' &&
                    action.type === 'retry' &&
                    !rateLimitCountdown.canRetry
                  }
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Technical Details (Development Only) */}
        {process.env.NODE_ENV === 'development' && error.correlationId && (
          <details className='text-xs text-muted-foreground'>
            <summary className='cursor-pointer'>Detalles técnicos</summary>
            <div className='mt-2 space-y-1'>
              <div>ID de correlación: {error.correlationId}</div>
              <div>Código: {error.code || 'N/A'}</div>
              <div>Timestamp: {error.timestamp.toISOString()}</div>
              {error.details && (
                <pre className='text-xs bg-muted p-2 rounded mt-2 overflow-auto'>
                  {JSON.stringify(error.details, null, 2)}
                </pre>
              )}
            </div>
          </details>
        )}
      </CardContent>
    </Card>
  );
}
