'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { mfaApi, type BackupCode } from '@/lib/api/mfa';
import { type ApiError } from '@/lib/api/client';
import { toast } from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faKey,
  faDownload,
  faCopy,
  faRefresh,
  faSpinner,
  faExclamationTriangle,
  faEye,
  faEyeSlash,
  faShield,
} from '@fortawesome/free-solid-svg-icons';

interface BackupCodesManagerProps {
  onCodesGenerated?: (codes: BackupCode[]) => void;
  onClose?: () => void;
}

export default function BackupCodesManager({
  onCodesGenerated,
  onClose,
}: BackupCodesManagerProps) {
  const [step, setStep] = useState<'verify' | 'display' | 'regenerate'>(
    'verify'
  );
  const [verificationToken, setVerificationToken] = useState('');
  const [backupCodes, setBackupCodes] = useState<BackupCode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCodes, setShowCodes] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleVerifyAndGetCodes = async () => {
    if (!verificationToken || verificationToken.length !== 6) {
      toast.error('Por favor ingresa un código TOTP válido de 6 dígitos');
      return;
    }

    setIsLoading(true);
    try {
      const response = await mfaApi.getBackupCodes(verificationToken);
      setBackupCodes(response.codes);
      setStep('display');
      setShowCodes(true);

      if (onCodesGenerated) {
        onCodesGenerated(response.codes);
      }

      toast.success('Códigos de respaldo obtenidos correctamente');
    } catch (error) {
      const apiError = error as ApiError;
      toast.error(apiError.message || 'Error al obtener códigos de respaldo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerateCodes = async () => {
    if (!verificationToken || verificationToken.length !== 6) {
      toast.error('Por favor ingresa un código TOTP válido de 6 dígitos');
      return;
    }

    setIsRegenerating(true);
    try {
      const response = await mfaApi.regenerateBackupCodes(verificationToken);
      setBackupCodes(response.codes);
      setShowCodes(true);

      if (onCodesGenerated) {
        onCodesGenerated(response.codes);
      }

      toast.success('Códigos de respaldo regenerados correctamente');
    } catch (error) {
      const apiError = error as ApiError;
      toast.error(apiError.message || 'Error al regenerar códigos de respaldo');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleCopyCodes = async () => {
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

  const handleDownloadCodes = () => {
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

  const handleTokenInput = (value: string) => {
    const numericValue = value.replace(/\D/g, '').slice(0, 6);
    setVerificationToken(numericValue);
  };

  const availableCodes = backupCodes.filter(code => !code.is_used);
  const usedCodes = backupCodes.filter(code => code.is_used);

  const renderVerifyStep = () => (
    <div className='space-y-6'>
      <div className='text-center'>
        <div className='w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4'>
          <FontAwesomeIcon icon={faKey} className='text-2xl text-blue-600' />
        </div>
        <h3 className='text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2'>
          Verificar Identidad
        </h3>
        <p className='text-gray-600 dark:text-gray-400'>
          Ingresa tu código TOTP para acceder a los códigos de respaldo
        </p>
      </div>

      <div className='bg-yellow-50 border border-yellow-200 dark:border-yellow-800 dark:bg-yellow-900 rounded-lg p-4'>
        <h4 className='font-medium text-yellow-900 dark:text-yellow-100 mb-2'>
          <FontAwesomeIcon icon={faExclamationTriangle} className='mr-2' />
          Importante
        </h4>
        <p className='text-sm text-yellow-800 dark:text-yellow-400'>
          Los códigos de respaldo son tu única forma de acceder a tu cuenta si
          pierdes tu dispositivo de autenticación. Guárdalos en un lugar seguro.
        </p>
      </div>

      <div className='space-y-4'>
        <div>
          <Label htmlFor='verificationToken'>Código TOTP</Label>
          <Input
            id='verificationToken'
            value={verificationToken}
            onChange={e => handleTokenInput(e.target.value)}
            placeholder='000000'
            className='mt-1 text-center text-2xl tracking-widest font-mono'
            maxLength={6}
            autoComplete='off'
          />
          <p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>
            Ingresa el código de 6 dígitos de tu aplicación autenticadora
          </p>
        </div>

        <div className='flex gap-3'>
          <Button
            onClick={handleVerifyAndGetCodes}
            disabled={isLoading || verificationToken.length !== 6}
            className='flex-1'
          >
            {isLoading ? (
              <>
                <FontAwesomeIcon
                  icon={faSpinner}
                  className='mr-2 animate-spin'
                />
                Verificando...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faKey} className='mr-2' />
                Ver Códigos
              </>
            )}
          </Button>
          {onClose && (
            <Button variant='outline' onClick={onClose}>
              Cancelar
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  const renderDisplayStep = () => (
    <div className='space-y-6'>
      <div className='text-center'>
        <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4'>
          <FontAwesomeIcon
            icon={faShield}
            className='text-2xl text-green-600'
          />
        </div>
        <h3 className='text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2'>
          Códigos de Respaldo
        </h3>
        <p className='text-gray-600 dark:text-gray-400'>
          Guarda estos códigos en un lugar seguro
        </p>
      </div>

      {/* Codes Display */}
      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <h4 className='font-medium text-gray-900 dark:text-gray-100'>
            Códigos Disponibles ({availableCodes.length})
          </h4>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setShowCodes(!showCodes)}
          >
            <FontAwesomeIcon
              icon={showCodes ? faEyeSlash : faEye}
              className='mr-2'
            />
            {showCodes ? 'Ocultar' : 'Mostrar'}
          </Button>
        </div>

        <div className='bg-gray-50 dark:bg-gray-800 rounded-lg p-4'>
          {showCodes ? (
            <div className='grid grid-cols-2 gap-2'>
              {availableCodes.map((code, index) => (
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
              <FontAwesomeIcon icon={faEyeSlash} className='text-3xl mb-2' />
              <p>Códigos ocultos por seguridad</p>
              <p className='text-sm'>
                Haz clic en &quot;Mostrar&quot; para verlos
              </p>
            </div>
          )}
        </div>

        {/* Used Codes */}
        {usedCodes.length > 0 && (
          <div className='space-y-2'>
            <h4 className='font-medium text-gray-900 dark:text-gray-100'>
              Códigos Usados ({usedCodes.length})
            </h4>
            <div className='bg-red-50 dark:bg-red-900/20 rounded-lg p-3'>
              <div className='grid grid-cols-2 gap-2'>
                {usedCodes.map((code, index) => (
                  <div
                    key={index}
                    className='bg-red-100 dark:bg-red-800/30 p-2 rounded border font-mono text-center text-sm tracking-wider text-red-600 dark:text-red-400 line-through'
                  >
                    {code.code}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className='flex gap-3'>
        <Button
          onClick={handleCopyCodes}
          variant='outline'
          className='flex-1'
          disabled={availableCodes.length === 0}
        >
          <FontAwesomeIcon icon={faCopy} className='mr-2' />
          Copiar
        </Button>
        <Button
          onClick={handleDownloadCodes}
          variant='outline'
          className='flex-1'
          disabled={availableCodes.length === 0}
        >
          <FontAwesomeIcon icon={faDownload} className='mr-2' />
          Descargar
        </Button>
      </div>

      {/* Regenerate Section */}
      <div className='border-t pt-4'>
        <div className='bg-yellow-50 border border-yellow-200 dark:border-yellow-800 dark:bg-yellow-900 rounded-lg p-4 mb-4'>
          <h4 className='font-medium text-yellow-900 dark:text-yellow-100 mb-2'>
            <FontAwesomeIcon icon={faExclamationTriangle} className='mr-2' />
            Regenerar Códigos
          </h4>
          <p className='text-sm text-yellow-800 dark:text-yellow-400 mb-3'>
            Al regenerar los códigos, todos los códigos actuales (usados y no
            usados) serán invalidados y se generarán nuevos códigos.
          </p>
        </div>

        <Button
          onClick={handleRegenerateCodes}
          variant='destructive'
          disabled={isRegenerating || verificationToken.length !== 6}
          className='w-full'
        >
          {isRegenerating ? (
            <>
              <FontAwesomeIcon icon={faSpinner} className='mr-2 animate-spin' />
              Regenerando...
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faRefresh} className='mr-2' />
              Regenerar Todos los Códigos
            </>
          )}
        </Button>
      </div>

      {/* Close Button */}
      {onClose && (
        <Button onClick={onClose} variant='outline' className='w-full'>
          Cerrar
        </Button>
      )}
    </div>
  );

  return (
    <Card className='max-w-2xl mx-auto p-6'>
      {step === 'verify' && renderVerifyStep()}
      {step === 'display' && renderDisplayStep()}
    </Card>
  );
}
