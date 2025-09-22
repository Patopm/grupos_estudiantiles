'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Mail, Phone, Shield, ArrowLeft } from 'lucide-react';

import EmailVerificationRequest from './EmailVerificationRequest';
import EmailVerificationConfirm from './EmailVerificationConfirm';
import PhoneVerificationRequest from './PhoneVerificationRequest';
import PhoneVerificationConfirm from './PhoneVerificationConfirm';
import VerificationStatusIndicator from './VerificationStatusIndicator';

interface VerificationFlowProps {
  onComplete?: () => void;
  onCancel?: () => void;
  initialTab?: 'email' | 'phone' | 'status';
  showStatusTab?: boolean;
  emailToken?: string; // For direct email verification
}

export default function VerificationFlow({
  onComplete,
  onCancel,
  initialTab = 'status',
  showStatusTab = true,
  emailToken,
}: VerificationFlowProps) {
  const { user, verificationStatus, getVerificationStatus } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [emailStep, setEmailStep] = useState<'request' | 'confirm'>('request');
  const [phoneStep, setPhoneStep] = useState<'request' | 'confirm'>('request');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Load verification status on mount
  useEffect(() => {
    getVerificationStatus().catch(console.error);
  }, []);

  // Handle direct email verification
  useEffect(() => {
    if (emailToken) {
      setActiveTab('email');
      setEmailStep('confirm');
    }
  }, [emailToken]);

  const handleEmailVerificationSuccess = () => {
    toast.success('Email verificado exitosamente');
    getVerificationStatus();
    if (showStatusTab) {
      setActiveTab('status');
    } else {
      onComplete?.();
    }
  };

  const handlePhoneRequestSuccess = (phone: string) => {
    setPhoneNumber(phone);
    setPhoneStep('confirm');
  };

  const handlePhoneVerificationSuccess = () => {
    toast.success('Teléfono verificado exitosamente');
    getVerificationStatus();
    if (showStatusTab) {
      setActiveTab('status');
    } else {
      onComplete?.();
    }
  };

  const handleBackToEmailRequest = () => {
    setEmailStep('request');
  };

  const handleBackToPhoneRequest = () => {
    setPhoneStep('request');
  };

  const isFullyVerified = verificationStatus?.is_fully_verified || false;

  return (
    <div className='max-w-2xl mx-auto'>
      <Tabs
        value={activeTab}
        onValueChange={value =>
          setActiveTab(value as 'email' | 'phone' | 'status')
        }
        className='w-full'
      >
        <TabsList className='grid w-full grid-cols-3'>
          {showStatusTab && (
            <TabsTrigger value='status' className='flex items-center gap-2'>
              <Shield className='h-4 w-4' />
              Estado
            </TabsTrigger>
          )}
          <TabsTrigger value='email' className='flex items-center gap-2'>
            <Mail className='h-4 w-4' />
            Email
          </TabsTrigger>
          <TabsTrigger value='phone' className='flex items-center gap-2'>
            <Phone className='h-4 w-4' />
            Teléfono
          </TabsTrigger>
        </TabsList>

        {showStatusTab && (
          <TabsContent value='status' className='space-y-4'>
            <VerificationStatusIndicator
              status={verificationStatus}
              showActions={true}
              onRequestEmailVerification={() => setActiveTab('email')}
              onRequestPhoneVerification={() => setActiveTab('phone')}
            />

            {isFullyVerified && (
              <div className='flex justify-center'>
                <Button onClick={onComplete} className='w-full max-w-sm'>
                  Continuar
                </Button>
              </div>
            )}

            {onCancel && (
              <div className='flex justify-center'>
                <Button
                  onClick={onCancel}
                  variant='outline'
                  className='w-full max-w-sm'
                >
                  Cerrar
                </Button>
              </div>
            )}
          </TabsContent>
        )}

        <TabsContent value='email' className='space-y-4'>
          {emailStep === 'request' && (
            <>
              {showStatusTab && (
                <Button
                  onClick={() => setActiveTab('status')}
                  variant='ghost'
                  size='sm'
                  className='mb-4'
                >
                  <ArrowLeft className='mr-2 h-4 w-4' />
                  Volver al Estado
                </Button>
              )}
              <EmailVerificationRequest
                onSuccess={handleEmailVerificationSuccess}
                onCancel={onCancel}
                defaultEmail={user?.email}
                showEmailInput={!user?.email}
              />
            </>
          )}

          {emailStep === 'confirm' && (
            <>
              <Button
                onClick={handleBackToEmailRequest}
                variant='ghost'
                size='sm'
                className='mb-4'
              >
                <ArrowLeft className='mr-2 h-4 w-4' />
                Volver a Solicitar
              </Button>
              <EmailVerificationConfirm
                token={emailToken}
                onSuccess={handleEmailVerificationSuccess}
                onError={() => setEmailStep('request')}
              />
            </>
          )}
        </TabsContent>

        <TabsContent value='phone' className='space-y-4'>
          {phoneStep === 'request' && (
            <>
              {showStatusTab && (
                <Button
                  onClick={() => setActiveTab('status')}
                  variant='ghost'
                  size='sm'
                  className='mb-4'
                >
                  <ArrowLeft className='mr-2 h-4 w-4' />
                  Volver al Estado
                </Button>
              )}
              <PhoneVerificationRequest
                onSuccess={handlePhoneRequestSuccess}
                onCancel={onCancel}
                defaultPhone={user?.phone}
                showPhoneInput={!user?.phone}
              />
            </>
          )}

          {phoneStep === 'confirm' && (
            <>
              <Button
                onClick={handleBackToPhoneRequest}
                variant='ghost'
                size='sm'
                className='mb-4'
              >
                <ArrowLeft className='mr-2 h-4 w-4' />
                Volver a Solicitar
              </Button>
              <PhoneVerificationConfirm
                phoneNumber={phoneNumber || user?.phone || ''}
                onSuccess={handlePhoneVerificationSuccess}
                onCancel={handleBackToPhoneRequest}
                onResend={() => setPhoneStep('request')}
              />
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
