'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import NotificationPreferences from '@/components/notifications/NotificationPreferences';
import MFASetupFlow from '@/components/auth/MFASetupFlow';
import BackupCodesManager from '@/components/auth/BackupCodesManager';
import MFAEnforcementDisplay from '@/components/auth/MFAEnforcementDisplay';
import VerificationStatusIndicator from '@/components/auth/VerificationStatusIndicator';
import VerificationFlow from '@/components/auth/VerificationFlow';
import { mfaApi, type MFAStatus } from '@/lib/api/mfa';
import { type ApiError } from '@/lib/api/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import {
  DashboardLayout,
  DashboardHeaders,
} from '@/components/dashboard/DashboardHeader';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faShield,
  faKey,
  faPlus,
  faSpinner,
  faBell,
  faExclamationTriangle,
  faCheck,
  faTimes,
  faCog,
} from '@fortawesome/free-solid-svg-icons';

export default function SecurityPage() {
  const { user } = useAuth();
  const [mfaStatus, setMfaStatus] = useState<MFAStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showMfaSetup, setShowMfaSetup] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [disableToken, setDisableToken] = useState('');
  const [isDisabling, setIsDisabling] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'security' | 'notifications' | 'policies' | 'verification'
  >('security');
  const [showVerificationFlow, setShowVerificationFlow] = useState(false);

  useEffect(() => {
    if (user) {
      loadMFAStatus();
    }
  }, [user]);

  const loadMFAStatus = async () => {
    try {
      setIsLoading(true);
      const status = await mfaApi.getStatus();
      setMfaStatus(status);
    } catch (error) {
      const apiError = error as ApiError;
      console.error('Error loading MFA status:', error);
      toast.error(apiError.message || 'Error al cargar estado de MFA');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMfaSetupComplete = () => {
    setShowMfaSetup(false);
    loadMFAStatus(); // Refresh MFA status
    toast.success('2FA configurado correctamente');
  };

  const handleDisableMFA = async () => {
    if (!disableToken || disableToken.length !== 6) {
      toast.error('Por favor ingresa un código TOTP válido de 6 dígitos');
      return;
    }

    setIsDisabling(true);
    try {
      await mfaApi.disableTOTP(disableToken);
      setDisableToken('');
      await loadMFAStatus(); // Refresh status
      toast.success('2FA desactivado correctamente');
    } catch (error) {
      const apiError = error as ApiError;
      toast.error(apiError.message || 'Error al desactivar 2FA');
    } finally {
      setIsDisabling(false);
    }
  };

  const handleTokenInput = (value: string) => {
    const numericValue = value.replace(/\D/g, '').slice(0, 6);
    setDisableToken(numericValue);
  };

  if (!user) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <div className='text-center'>
          <p className='text-gray-600'>
            Debes iniciar sesión para acceder a esta página
          </p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout header={DashboardHeaders.security()}>
      <div className='space-y-6'>
        {/* Tabs */}
        <div className='border-b border-gray-200 dark:border-gray-700 mb-8'>
          <nav className='-mb-px flex space-x-8'>
            <button
              onClick={() => setActiveTab('security')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'security'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FontAwesomeIcon icon={faShield} className='mr-2' />
              Seguridad
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'notifications'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FontAwesomeIcon icon={faBell} className='mr-2' />
              Notificaciones
            </button>
            <button
              onClick={() => setActiveTab('verification')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'verification'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FontAwesomeIcon icon={faShield} className='mr-2' />
              Verificación
            </button>
            <button
              onClick={() => setActiveTab('policies')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'policies'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FontAwesomeIcon icon={faCog} className='mr-2' />
              Políticas
            </button>
          </nav>
        </div>

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className='space-y-6'>
            {/* MFA Status Card */}
            <Card className='p-6'>
              <div className='flex items-start justify-between'>
                <div className='flex items-start'>
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${
                      mfaStatus?.mfa_enabled
                        ? 'bg-green-100'
                        : mfaStatus?.mfa_required
                          ? 'bg-yellow-100'
                          : 'bg-gray-100'
                    }`}
                  >
                    <FontAwesomeIcon
                      icon={
                        mfaStatus?.mfa_enabled
                          ? faCheck
                          : mfaStatus?.mfa_required
                            ? faExclamationTriangle
                            : faShield
                      }
                      className={`text-xl ${
                        mfaStatus?.mfa_enabled
                          ? 'text-green-600'
                          : mfaStatus?.mfa_required
                            ? 'text-yellow-600'
                            : 'text-gray-600'
                      }`}
                    />
                  </div>
                  <div>
                    <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1'>
                      Autenticación de Dos Factores (2FA)
                    </h3>
                    <p className='text-gray-600 dark:text-gray-400 mb-2'>
                      {mfaStatus?.mfa_enabled
                        ? 'Tu cuenta está protegida con 2FA'
                        : mfaStatus?.mfa_required
                          ? 'MFA es requerido para tu rol'
                          : 'Mejora la seguridad de tu cuenta activando 2FA'}
                    </p>
                    {mfaStatus && (
                      <div className='text-sm text-gray-500 dark:text-gray-400 space-y-1'>
                        <div className='flex items-center gap-4'>
                          <span>
                            TOTP:{' '}
                            {mfaStatus.totp_configured ? (
                              <Badge variant='secondary' className='text-xs'>
                                Configurado
                              </Badge>
                            ) : (
                              <Badge variant='outline' className='text-xs'>
                                No configurado
                              </Badge>
                            )}
                          </span>
                          <span>
                            Códigos de respaldo:{' '}
                            {mfaStatus.backup_codes_count > 0 ? (
                              <Badge variant='secondary' className='text-xs'>
                                {mfaStatus.backup_codes_count} disponibles
                              </Badge>
                            ) : (
                              <Badge variant='outline' className='text-xs'>
                                No disponibles
                              </Badge>
                            )}
                          </span>
                        </div>
                        {mfaStatus.mfa_required && (
                          <p className='text-yellow-600 dark:text-yellow-400 font-medium'>
                            ⚠️ MFA es obligatorio para tu rol
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className='flex flex-col space-y-2'>
                  {!mfaStatus?.mfa_enabled ? (
                    <Button
                      onClick={() => setShowMfaSetup(true)}
                      disabled={isLoading}
                      variant={mfaStatus?.mfa_required ? 'default' : 'outline'}
                    >
                      <FontAwesomeIcon icon={faPlus} className='mr-2' />
                      {mfaStatus?.mfa_required
                        ? 'Configurar MFA'
                        : 'Activar 2FA'}
                    </Button>
                  ) : (
                    <div className='space-y-3'>
                      <div className='text-right'>
                        <Badge
                          variant='secondary'
                          className='bg-green-100 text-green-800'
                        >
                          <FontAwesomeIcon icon={faCheck} className='mr-1' />
                          Activo
                        </Badge>
                      </div>

                      {/* MFA Management Actions */}
                      <div className='space-y-2'>
                        <Button
                          onClick={() => setShowBackupCodes(true)}
                          variant='outline'
                          size='sm'
                          className='w-full'
                        >
                          <FontAwesomeIcon icon={faKey} className='mr-2' />
                          Gestionar Códigos
                        </Button>

                        {/* Disable MFA Section */}
                        <div className='pt-2 border-t'>
                          <Label htmlFor='disableToken' className='text-sm'>
                            Código para desactivar:
                          </Label>
                          <Input
                            id='disableToken'
                            value={disableToken}
                            onChange={e => handleTokenInput(e.target.value)}
                            placeholder='000000'
                            className='text-center font-mono mt-1'
                            maxLength={6}
                          />
                          <Button
                            variant='destructive'
                            size='sm'
                            onClick={handleDisableMFA}
                            disabled={isDisabling || disableToken.length !== 6}
                            className='w-full mt-2'
                          >
                            {isDisabling ? (
                              <>
                                <FontAwesomeIcon
                                  icon={faSpinner}
                                  className='mr-2 animate-spin'
                                />
                                Desactivando...
                              </>
                            ) : (
                              <>
                                <FontAwesomeIcon
                                  icon={faTimes}
                                  className='mr-2'
                                />
                                Desactivar 2FA
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* MFA Setup Modal */}
            {showMfaSetup && (
              <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
                <div className='max-w-md w-full'>
                  <MFASetupFlow
                    onSetupComplete={handleMfaSetupComplete}
                    onCancel={() => setShowMfaSetup(false)}
                  />
                </div>
              </div>
            )}

            {/* Backup Codes Modal */}
            {showBackupCodes && (
              <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
                <div className='max-w-2xl w-full'>
                  <BackupCodesManager
                    onClose={() => setShowBackupCodes(false)}
                  />
                </div>
              </div>
            )}

            {/* Security Recommendations */}
            <Card className='p-6'>
              <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4'>
                <FontAwesomeIcon icon={faKey} className='mr-2' />
                Recomendaciones de Seguridad
              </h3>

              <div className='space-y-4'>
                <div className='flex items-start'>
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 mt-0.5 ${
                      mfaStatus?.mfa_enabled ? 'bg-green-100' : 'bg-gray-100'
                    }`}
                  >
                    <FontAwesomeIcon
                      icon={mfaStatus?.mfa_enabled ? faCheck : faTimes}
                      className={`text-sm ${mfaStatus?.mfa_enabled ? 'text-green-600' : 'text-gray-400'}`}
                    />
                  </div>
                  <div>
                    <p className='font-medium text-gray-900 dark:text-gray-100'>
                      Activar autenticación de dos factores
                    </p>
                    <p className='text-sm text-gray-600 dark:text-gray-400'>
                      Agrega una capa extra de seguridad a tu cuenta
                    </p>
                  </div>
                </div>

                <div className='flex items-start'>
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 mt-0.5 ${
                      mfaStatus && mfaStatus.backup_codes_count > 0
                        ? 'bg-green-100'
                        : 'bg-gray-100'
                    }`}
                  >
                    <FontAwesomeIcon
                      icon={
                        mfaStatus && mfaStatus.backup_codes_count > 0
                          ? faCheck
                          : faKey
                      }
                      className={`text-sm ${
                        mfaStatus && mfaStatus.backup_codes_count > 0
                          ? 'text-green-600'
                          : 'text-gray-400'
                      }`}
                    />
                  </div>
                  <div>
                    <p className='font-medium text-gray-900 dark:text-gray-100'>
                      Mantener códigos de respaldo seguros
                    </p>
                    <p className='text-sm text-gray-600 dark:text-gray-400'>
                      Guarda tus códigos de respaldo en un lugar seguro
                    </p>
                  </div>
                </div>

                <div className='flex items-start'>
                  <div className='w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center mr-3 mt-0.5'>
                    <FontAwesomeIcon
                      icon={faKey}
                      className='text-sm text-gray-400'
                    />
                  </div>
                  <div>
                    <p className='font-medium text-gray-900 dark:text-gray-100'>
                      Usar contraseña segura
                    </p>
                    <p className='text-sm text-gray-600 dark:text-gray-400'>
                      Usa una combinación de letras, números y símbolos
                    </p>
                  </div>
                </div>

                <div className='flex items-start'>
                  <div className='w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center mr-3 mt-0.5'>
                    <FontAwesomeIcon
                      icon={faBell}
                      className='text-sm text-gray-400'
                    />
                  </div>
                  <div>
                    <p className='font-medium text-gray-900 dark:text-gray-100'>
                      Mantener notificaciones de seguridad activas
                    </p>
                    <p className='text-sm text-gray-600 dark:text-gray-400'>
                      Te alertaremos sobre actividad sospechosa en tu cuenta
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && <NotificationPreferences />}

        {/* Verification Tab */}
        {activeTab === 'verification' && (
          <div className='space-y-6'>
            <VerificationStatusIndicator
              showActions={true}
              onRequestEmailVerification={() => setShowVerificationFlow(true)}
              onRequestPhoneVerification={() => setShowVerificationFlow(true)}
            />

            {/* Verification Flow Modal */}
            {showVerificationFlow && (
              <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
                <div className='max-w-2xl w-full'>
                  <VerificationFlow
                    onComplete={() => setShowVerificationFlow(false)}
                    onCancel={() => setShowVerificationFlow(false)}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Policies Tab */}
        {activeTab === 'policies' && (
          <div className='space-y-6'>
            <MFAEnforcementDisplay />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
