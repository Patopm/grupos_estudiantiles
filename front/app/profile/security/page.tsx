'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import TOTPSetup from '@/components/notifications/TOTPSetup';
import NotificationPreferences from '@/components/notifications/NotificationPreferences';
import { totpApi, type TOTPDevice } from '@/lib/api/notifications';
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
} from '@fortawesome/free-solid-svg-icons';

export default function SecurityPage() {
  const { user } = useAuth();
  const [totpDevices, setTotpDevices] = useState<TOTPDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showTotpSetup, setShowTotpSetup] = useState(false);
  const [disableToken, setDisableToken] = useState('');
  const [disablingDevice, setDisablingDevice] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'security' | 'notifications'>(
    'security'
  );

  useEffect(() => {
    if (user) {
      loadTotpDevices();
    }
  }, [user]);

  const loadTotpDevices = async () => {
    try {
      const devices = await totpApi.getDevices();
      setTotpDevices(devices);
    } catch (error) {
      const apiError = error as ApiError;
      console.error('Error loading TOTP devices:', error);
      toast.error(apiError.message || 'Error al cargar dispositivos 2FA');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetupComplete = (device: TOTPDevice) => {
    setTotpDevices([device]);
    setShowTotpSetup(false);
    toast.success('2FA configurado correctamente');
  };

  const handleDisable2FA = async (deviceId: string) => {
    // Simple validation since this is just a quick disable action
    if (
      !disableToken ||
      disableToken.length !== 6 ||
      !/^\d{6}$/.test(disableToken)
    ) {
      toast.error('Por favor ingresa un código de 6 dígitos válido');
      return;
    }

    setDisablingDevice(deviceId);
    try {
      await totpApi.disableDevice(deviceId, disableToken);
      setTotpDevices(devices => devices.filter(d => d.id !== deviceId));
      setDisableToken('');
      toast.success('2FA desactivado correctamente');
    } catch (error) {
      const apiError = error as ApiError;
      toast.error(apiError.message || 'Error al desactivar 2FA');
    } finally {
      setDisablingDevice(null);
    }
  };

  const activeDevice = totpDevices.find(d => d.is_active && d.confirmed);
  const has2FA = Boolean(activeDevice);

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
        <div className='border-b border-gray-200 mb-8'>
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
          </nav>
        </div>

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className='space-y-6'>
            {/* 2FA Status Card */}
            <Card className='p-6'>
              <div className='flex items-start justify-between'>
                <div className='flex items-start'>
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${
                      has2FA ? 'bg-green-100' : 'bg-yellow-100'
                    }`}
                  >
                    <FontAwesomeIcon
                      icon={has2FA ? faCheck : faExclamationTriangle}
                      className={`text-xl ${has2FA ? 'text-green-600' : 'text-yellow-600'}`}
                    />
                  </div>
                  <div>
                    <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1'>
                      Autenticación de Dos Factores (2FA)
                    </h3>
                    <p className='text-gray-600 dark:text-gray-400 mb-2'>
                      {has2FA
                        ? 'Tu cuenta está protegida con 2FA'
                        : 'Mejora la seguridad de tu cuenta activando 2FA'}
                    </p>
                    {has2FA && activeDevice && (
                      <div className='text-sm text-gray-500 dark:text-gray-400'>
                        <p>
                          Dispositivo: <strong>{activeDevice.name}</strong>
                        </p>
                        <p>
                          Configurado:{' '}
                          {new Date(activeDevice.created_at).toLocaleDateString(
                            'es-MX'
                          )}
                        </p>
                        {activeDevice.last_used_at && (
                          <p>
                            Último uso:{' '}
                            {new Date(
                              activeDevice.last_used_at
                            ).toLocaleDateString('es-MX')}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className='flex flex-col space-y-2'>
                  {!has2FA ? (
                    <Button
                      onClick={() => setShowTotpSetup(true)}
                      disabled={isLoading}
                    >
                      <FontAwesomeIcon icon={faPlus} className='mr-2' />
                      Activar 2FA
                    </Button>
                  ) : (
                    <div className='space-y-3'>
                      <div className='text-right'>
                        <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                          <FontAwesomeIcon icon={faCheck} className='mr-1' />
                          Activo
                        </span>
                      </div>

                      <div className='space-y-2'>
                        <Label htmlFor='disableToken' className='text-sm'>
                          Código para desactivar:
                        </Label>
                        <Input
                          id='disableToken'
                          value={disableToken}
                          onChange={e =>
                            setDisableToken(
                              e.target.value.replace(/\D/g, '').slice(0, 6)
                            )
                          }
                          placeholder='000000'
                          className='text-center font-mono'
                          maxLength={6}
                        />
                        <Button
                          variant='destructive'
                          size='sm'
                          onClick={() =>
                            activeDevice && handleDisable2FA(activeDevice.id)
                          }
                          disabled={
                            disablingDevice !== null ||
                            disableToken.length !== 6
                          }
                          className='w-full'
                        >
                          {disablingDevice ? (
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
                  )}
                </div>
              </div>
            </Card>

            {/* 2FA Setup Modal */}
            {showTotpSetup && (
              <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
                <div className='max-w-md w-full'>
                  <TOTPSetup
                    onSetupComplete={handleSetupComplete}
                    onCancel={() => setShowTotpSetup(false)}
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
                      has2FA ? 'bg-green-100' : 'bg-gray-100'
                    }`}
                  >
                    <FontAwesomeIcon
                      icon={has2FA ? faCheck : faTimes}
                      className={`text-sm ${has2FA ? 'text-green-600' : 'text-gray-400'}`}
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
      </div>
    </DashboardLayout>
  );
}
