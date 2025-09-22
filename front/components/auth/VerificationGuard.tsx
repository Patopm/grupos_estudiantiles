'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { verificationApi } from '@/lib/api/verification';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Shield, Loader2 } from 'lucide-react';
import VerificationFlow from './VerificationFlow';

interface VerificationGuardProps {
  children: React.ReactNode;
  operation?: string;
  requireEmailVerification?: boolean;
  requirePhoneVerification?: boolean;
  requireFullVerification?: boolean;
  fallbackComponent?: React.ReactNode;
  onVerificationComplete?: () => void;
}

export default function VerificationGuard({
  children,
  operation,
  requireEmailVerification = false,
  requirePhoneVerification = false,
  requireFullVerification = false,
  fallbackComponent,
  onVerificationComplete,
}: VerificationGuardProps) {
  const { user, verificationStatus, getVerificationStatus } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [verificationRequired, setVerificationRequired] = useState(false);
  const [verificationType, setVerificationType] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [showVerificationFlow, setShowVerificationFlow] = useState(false);

  useEffect(() => {
    checkVerificationRequirements();
  }, [user, verificationStatus, operation]);

  const checkVerificationRequirements = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      // Load verification status if not available
      if (!verificationStatus) {
        await getVerificationStatus();
      }

      let needsVerification = false;
      let type: string | null = null;
      let msg = '';

      // Check specific operation requirements
      if (operation) {
        try {
          const response = await verificationApi.checkVerificationRequirements({
            operation,
          });
          needsVerification = response.verification_required;
          type = response.verification_type;
          msg = response.message;
        } catch (error) {
          console.error('Error checking verification requirements:', error);
        }
      }

      // Check explicit requirements
      if (!needsVerification) {
        const status = verificationStatus;
        if (status) {
          if (requireFullVerification && !status.is_fully_verified) {
            needsVerification = true;
            type = 'account';
            msg =
              'Se requiere verificación completa de la cuenta para acceder a esta función';
          } else if (requireEmailVerification && !status.email_verified) {
            needsVerification = true;
            type = 'email';
            msg =
              'Se requiere verificación de email para acceder a esta función';
          } else if (requirePhoneVerification && !status.phone_verified) {
            needsVerification = true;
            type = 'phone';
            msg =
              'Se requiere verificación de teléfono para acceder a esta función';
          }
        }
      }

      setVerificationRequired(needsVerification);
      setVerificationType(type);
      setMessage(msg);
    } catch (error) {
      console.error('Error checking verification requirements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartVerification = () => {
    setShowVerificationFlow(true);
  };

  const handleVerificationComplete = () => {
    setShowVerificationFlow(false);
    setVerificationRequired(false);
    onVerificationComplete?.();
    // Refresh verification status
    getVerificationStatus();
  };

  const handleCancelVerification = () => {
    setShowVerificationFlow(false);
  };

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center space-y-4'>
          <Loader2 className='h-8 w-8 animate-spin mx-auto text-primary' />
          <p className='text-muted-foreground'>Verificando permisos...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <>{children}</>;
  }

  if (showVerificationFlow) {
    return (
      <div className='min-h-screen flex items-center justify-center p-4'>
        <VerificationFlow
          onComplete={handleVerificationComplete}
          onCancel={handleCancelVerification}
          initialTab={
            verificationType === 'email'
              ? 'email'
              : verificationType === 'phone'
                ? 'phone'
                : 'status'
          }
        />
      </div>
    );
  }

  if (verificationRequired) {
    if (fallbackComponent) {
      return <>{fallbackComponent}</>;
    }

    return (
      <div className='min-h-screen flex items-center justify-center p-4'>
        <Card className='max-w-md mx-auto p-6'>
          <div className='text-center space-y-4'>
            <div className='flex justify-center'>
              <AlertTriangle className='h-12 w-12 text-yellow-500' />
            </div>
            <div>
              <h3 className='text-lg font-semibold text-foreground'>
                Verificación Requerida
              </h3>
              <p className='text-sm text-muted-foreground mt-2'>
                {message ||
                  'Se requiere verificación adicional para acceder a esta función.'}
              </p>
            </div>

            <div className='space-y-2'>
              <Button onClick={handleStartVerification} className='w-full'>
                <Shield className='mr-2 h-4 w-4' />
                Completar Verificación
              </Button>
            </div>

            <div className='text-center'>
              <p className='text-xs text-muted-foreground'>
                La verificación es necesaria para garantizar la seguridad de tu
                cuenta.
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
