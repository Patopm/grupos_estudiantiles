'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  mfaApi,
  type TOTPSetupResponse,
  type TOTPDevice,
  type BackupCode,
} from '@/lib/api/mfa';
import { type ApiError } from '@/lib/api/client';
import { toast } from 'react-hot-toast';
import { useForm } from '@/hooks/useForm';
import {
  totpSetupSchema,
  type TotpSetupFormData,
} from '@/lib/validations/forms';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faShield,
  faQrcode,
  faCheck,
  faSpinner,
  faKey,
  faExclamationTriangle,
  faDownload,
  faCopy,
} from '@fortawesome/free-solid-svg-icons';
import Image from 'next/image';

interface MFASetupFlowProps {
  onSetupComplete?: (device: TOTPDevice, backupCodes: BackupCode[]) => void;
  onCancel?: () => void;
}

export default function MFASetupFlow({
  onSetupComplete,
  onCancel,
}: MFASetupFlowProps) {
  const [step, setStep] = useState<
    'setup' | 'verify' | 'backup-codes' | 'complete'
  >('setup');
  const [setupResponse, setSetupResponse] = useState<TOTPSetupResponse | null>(
    null
  );
  const [confirmedDevice, setConfirmedDevice] = useState<TOTPDevice | null>(
    null
  );
  const [backupCodes, setBackupCodes] = useState<BackupCode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deviceName, setDeviceName] = useState('Tecmilenio 2FA');
  const [showBackupCodes, setShowBackupCodes] = useState(false);

  const form = useForm<TotpSetupFormData>({
    initialValues: {
      token: '',
    },
    schema: totpSetupSchema,
    onSubmit: async values => {
      if (!setupResponse) {
        toast.error('Error: dispositivo no configurado');
        return;
      }

      try {
        const confirmResponse = await mfaApi.confirmTOTP(values.token);
        setConfirmedDevice(confirmResponse.device);

        // Get backup codes after successful TOTP confirmation
        const backupCodesResponse = await mfaApi.getBackupCodes(values.token);
        setBackupCodes(backupCodesResponse.codes);

        setStep('backup-codes');
        toast.success('¡2FA activado correctamente!');
      } catch (error) {
        const apiError = error as ApiError;
        toast.error(apiError.message || 'Código inválido');
        throw error;
      }
    },
  });

  const handleSetupDevice = async () => {
    setIsLoading(true);
    try {
      const response = await mfaApi.setupTOTP(deviceName);
      setSetupResponse(response);
      setStep('verify');
      toast.success('Dispositivo TOTP configurado. Escanea el código QR.');
    } catch (error) {
      const apiError = error as ApiError;
      toast.error(apiError.message || 'Error al configurar 2FA');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTokenInput = (value: string) => {
    const numericValue = value.replace(/\D/g, '').slice(0, 6);
    form.handleChange('token', numericValue);
  };

  const handleCopyBackupCodes = async () => {
    const codesText = backupCodes
      .filter(code => !code.is_used)
      .map(code => code.code)
      .join('\n');

    try {
      await navigator.clipboard.writeText(codesText);
      toast.success('Códigos copiados al portapapeles');
    } catch {
      toast.error('Error al copiar códigos');
    }
  };

  const handleDownloadBackupCodes = () => {
    const codesText = backupCodes
      .filter(code => !code.is_used)
      .map(code => code.code)
      .join('\n');

    const blob = new Blob(
      [
        `Códigos de Respaldo - Grupos Estudiantiles Tecmilenio\n`,
        `Generados: ${new Date().toLocaleString('es-MX')}\n\n`,
        `IMPORTANTE: Guarda estos códigos en un lugar seguro.\n`,
        `Cada código solo puede usarse una vez.\n\n`,
        `Códigos:\n`,
        codesText,
      ],
      { type: 'text/plain' }
    );

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-codes-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Códigos descargados');
  };

  const handleComplete = () => {
    if (confirmedDevice && onSetupComplete) {
      onSetupComplete(confirmedDevice, backupCodes);
    }
    setStep('complete');
  };

  const renderSetupStep = () => (
    <div className='space-y-6'>
      <div className='text-center'>
        <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4'>
          <FontAwesomeIcon
            icon={faShield}
            className='text-2xl text-green-600'
          />
        </div>
        <h3 className='text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2'>
          Configurar Autenticación de Dos Factores
        </h3>
        <p className='text-gray-600 dark:text-gray-400'>
          Mejora la seguridad de tu cuenta con 2FA
        </p>
      </div>

      <div className='space-y-4'>
        <div>
          <Label htmlFor='deviceName'>Nombre del dispositivo</Label>
          <Input
            id='deviceName'
            value={deviceName}
            onChange={e => setDeviceName(e.target.value)}
            placeholder='Ej: Mi iPhone, Mi Android'
            className='mt-1'
          />
          <p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>
            Este nombre te ayudará a identificar el dispositivo
          </p>
        </div>

        <div className='bg-blue-50 border border-blue-200 dark:border-blue-800 dark:bg-blue-900 rounded-lg p-4'>
          <h4 className='font-medium text-blue-900 dark:text-blue-100 mb-2'>
            <FontAwesomeIcon icon={faKey} className='mr-2' />
            Antes de continuar
          </h4>
          <p className='text-sm text-blue-800 dark:text-blue-400 mb-3'>
            Necesitarás una aplicación autenticadora instalada en tu dispositivo
            móvil:
          </p>
          <ul className='text-sm text-blue-800 dark:text-blue-400 space-y-1'>
            <li>• Google Authenticator</li>
            <li>• Microsoft Authenticator</li>
            <li>• Authy</li>
            <li>• Cualquier app compatible con TOTP</li>
          </ul>
        </div>

        <div className='flex gap-3'>
          <Button
            onClick={handleSetupDevice}
            disabled={isLoading || !deviceName.trim()}
            className='flex-1'
          >
            {isLoading ? (
              <>
                <FontAwesomeIcon
                  icon={faSpinner}
                  className='mr-2 animate-spin'
                />
                Configurando...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faQrcode} className='mr-2' />
                Generar Código QR
              </>
            )}
          </Button>
          {onCancel && (
            <Button variant='outline' onClick={onCancel}>
              Cancelar
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  const renderVerifyStep = () => (
    <div className='space-y-6'>
      <div className='text-center'>
        <div className='w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4'>
          <FontAwesomeIcon icon={faQrcode} className='text-2xl text-blue-600' />
        </div>
        <h3 className='text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2'>
          Escanea el Código QR
        </h3>
        <p className='text-gray-600 dark:text-gray-400'>
          Usa tu aplicación autenticadora para escanear el código
        </p>
      </div>

      {setupResponse?.qr_code && (
        <div className='flex justify-center'>
          <div className='bg-white p-4 rounded-lg border-2 border-gray-200'>
            <Image
              src={`data:image/png;base64,${setupResponse.qr_code}`}
              alt='Código QR para 2FA'
              width={192}
              height={192}
              className='w-48 h-48'
            />
          </div>
        </div>
      )}

      <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
        <h4 className='font-medium text-yellow-900 mb-2'>
          <FontAwesomeIcon icon={faExclamationTriangle} className='mr-2' />
          Instrucciones
        </h4>
        <ol className='text-sm text-yellow-800 space-y-1 list-decimal list-inside'>
          <li>Abre tu aplicación autenticadora</li>
          <li>Escanea el código QR mostrado arriba</li>
          <li>Ingresa el código de 6 dígitos generado</li>
          <li>Haz clic en &quot;Verificar y Activar&quot;</li>
        </ol>
      </div>

      <div className='space-y-4'>
        <div>
          <Label htmlFor='token'>Código de verificación</Label>
          <Input
            id='token'
            value={form.values.token}
            onChange={e => handleTokenInput(e.target.value)}
            placeholder='000000'
            className={`mt-1 text-center text-2xl tracking-widest font-mono ${
              form.errors.token ? 'border-red-500' : ''
            }`}
            maxLength={6}
            autoComplete='off'
          />
          {form.errors.token && (
            <p className='text-red-500 text-sm mt-1'>{form.errors.token}</p>
          )}
          <p className='text-sm text-gray-500 mt-1'>
            Ingresa el código de 6 dígitos de tu aplicación
          </p>
        </div>

        <div className='flex gap-3'>
          <Button
            onClick={form.handleSubmit}
            disabled={form.isSubmitting || form.values.token.length !== 6}
            className='flex-1'
          >
            {form.isSubmitting ? (
              <>
                <FontAwesomeIcon
                  icon={faSpinner}
                  className='mr-2 animate-spin'
                />
                Verificando...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faCheck} className='mr-2' />
                Verificar y Activar
              </>
            )}
          </Button>
          <Button
            variant='outline'
            onClick={() => setStep('setup')}
            disabled={form.isSubmitting}
          >
            Atrás
          </Button>
        </div>
      </div>
    </div>
  );

  const renderBackupCodesStep = () => (
    <div className='space-y-6'>
      <div className='text-center'>
        <div className='w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4'>
          <FontAwesomeIcon icon={faKey} className='text-2xl text-yellow-600' />
        </div>
        <h3 className='text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2'>
          Códigos de Respaldo
        </h3>
        <p className='text-gray-600 dark:text-gray-400'>
          Guarda estos códigos en un lugar seguro
        </p>
      </div>

      <div className='bg-red-50 border border-red-200 dark:border-red-800 dark:bg-red-900 rounded-lg p-4'>
        <h4 className='font-medium text-red-900 dark:text-red-100 mb-2'>
          <FontAwesomeIcon icon={faExclamationTriangle} className='mr-2' />
          ¡Muy Importante!
        </h4>
        <p className='text-sm text-red-800 dark:text-red-400'>
          Estos códigos son tu única forma de acceder a tu cuenta si pierdes tu
          dispositivo de autenticación. Guárdalos en un lugar seguro y no los
          compartas con nadie.
        </p>
      </div>

      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <h4 className='font-medium text-gray-900 dark:text-gray-100'>
            Códigos de Respaldo ({backupCodes.length})
          </h4>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setShowBackupCodes(!showBackupCodes)}
          >
            {showBackupCodes ? 'Ocultar' : 'Mostrar'}
          </Button>
        </div>

        <div className='bg-gray-50 dark:bg-gray-800 rounded-lg p-4'>
          {showBackupCodes ? (
            <div className='grid grid-cols-2 gap-2'>
              {backupCodes.map((code, index) => (
                <div
                  key={index}
                  className='bg-white dark:bg-gray-700 p-3 rounded border font-mono text-center text-lg tracking-wider'
                >
                  {code.code}
                </div>
              ))}
            </div>
          ) : (
            <div className='text-center py-8 text-gray-500 dark:text-gray-400'>
              <FontAwesomeIcon icon={faKey} className='text-3xl mb-2' />
              <p>Códigos ocultos por seguridad</p>
              <p className='text-sm'>
                Haz clic en &quot;Mostrar&quot; para verlos
              </p>
            </div>
          )}
        </div>

        <div className='flex gap-3'>
          <Button
            onClick={handleCopyBackupCodes}
            variant='outline'
            className='flex-1'
          >
            <FontAwesomeIcon icon={faCopy} className='mr-2' />
            Copiar
          </Button>
          <Button
            onClick={handleDownloadBackupCodes}
            variant='outline'
            className='flex-1'
          >
            <FontAwesomeIcon icon={faDownload} className='mr-2' />
            Descargar
          </Button>
        </div>
      </div>

      <Button onClick={handleComplete} className='w-full'>
        <FontAwesomeIcon icon={faCheck} className='mr-2' />
        He Guardado los Códigos
      </Button>
    </div>
  );

  const renderCompleteStep = () => (
    <div className='space-y-6 text-center'>
      <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4'>
        <FontAwesomeIcon icon={faCheck} className='text-2xl text-green-600' />
      </div>

      <div>
        <h3 className='text-xl font-semibold text-gray-900 mb-2'>
          ¡2FA Configurado Correctamente!
        </h3>
        <p className='text-gray-600 mb-6'>
          Tu cuenta ahora está protegida con autenticación de dos factores
        </p>
      </div>

      <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
        <h4 className='font-medium text-green-900 mb-2'>
          <FontAwesomeIcon icon={faShield} className='mr-2' />
          Próximos pasos
        </h4>
        <ul className='text-sm text-green-800 space-y-1 text-left'>
          <li>• Tus códigos de respaldo están guardados de forma segura</li>
          <li>• No compartas tu aplicación autenticadora</li>
          <li>• Si pierdes tu dispositivo, usa los códigos de respaldo</li>
          <li>• Contacta al soporte si necesitas ayuda</li>
        </ul>
      </div>

      <Button onClick={() => window.location.reload()} className='w-full'>
        <FontAwesomeIcon icon={faCheck} className='mr-2' />
        Completar Configuración
      </Button>
    </div>
  );

  return (
    <Card className='max-w-md mx-auto p-6'>
      {step === 'setup' && renderSetupStep()}
      {step === 'verify' && renderVerifyStep()}
      {step === 'backup-codes' && renderBackupCodesStep()}
      {step === 'complete' && renderCompleteStep()}
    </Card>
  );
}
