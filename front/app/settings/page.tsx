'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPalette,
  faGlobe,
  faBell,
  faShield,
  faSave,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import {
  DashboardLayout,
  DashboardHeaders,
} from '@/components/dashboard/DashboardHeader';
import { useForm } from '@/hooks/useForm';
import { settingsSchema, type SettingsFormData } from '@/lib/validations/forms';

export default function SettingsPage() {
  const { user } = useAuth();

  const form = useForm<SettingsFormData>({
    initialValues: {
      theme: 'system',
      language: 'es',
      timezone: 'America/Mexico_City',
      emailDigest: true,
      pushNotifications: true,
      marketingEmails: false,
    },
    schema: settingsSchema,
    onSubmit: async () => {
      // TODO: Implement settings update API call
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulated API call
      toast.success('Configuración guardada correctamente');
    },
  });

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
    <DashboardLayout header={DashboardHeaders.settings()}>
      <div className='space-y-6'>
        {/* Appearance Settings */}
        <Card className='p-6'>
          <h2 className='text-xl font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100'>
            <FontAwesomeIcon icon={faPalette} className='text-primary' />
            Apariencia
          </h2>

          <div className='space-y-4'>
            <div>
              <Label className='text-sm font-medium text-gray-700 mb-2 block'>
                Tema
              </Label>
              <div className='grid grid-cols-3 gap-3'>
                {[
                  { value: 'light', label: 'Claro' },
                  { value: 'dark', label: 'Oscuro' },
                  { value: 'system', label: 'Sistema' },
                ].map(option => (
                  <label key={option.value} className='relative cursor-pointer'>
                    <input
                      type='radio'
                      name='theme'
                      value={option.value}
                      checked={form.values.theme === option.value}
                      onChange={e => form.handleChange('theme', e.target.value)}
                      className='sr-only'
                    />
                    <div
                      className={`p-3 border-2 rounded-lg text-center transition-colors ${
                        form.values.theme === option.value
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-primary/50'
                      }`}
                    >
                      <div className='text-sm font-medium'>{option.label}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Language and Region */}
        <Card className='p-6'>
          <h2 className='text-xl font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100'>
            <FontAwesomeIcon icon={faGlobe} className='text-primary' />
            Idioma y Región
          </h2>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div>
              <Label className='text-sm font-medium text-gray-700 mb-2 block'>
                Idioma
              </Label>
              <select
                value={form.values.language}
                onChange={e => form.handleChange('language', e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary'
              >
                <option value='es'>Español</option>
                <option value='en'>English</option>
              </select>
            </div>

            <div>
              <Label className='text-sm font-medium text-gray-700 mb-2 block'>
                Zona Horaria
              </Label>
              <select
                value={form.values.timezone}
                onChange={e => form.handleChange('timezone', e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary'
              >
                <option value='America/Mexico_City'>
                  Ciudad de México (GMT-6)
                </option>
                <option value='America/Cancun'>Cancún (GMT-5)</option>
                <option value='America/Tijuana'>Tijuana (GMT-8)</option>
                <option value='UTC'>UTC (GMT+0)</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Notification Settings */}
        <Card className='p-6'>
          <h2 className='text-xl font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100'>
            <FontAwesomeIcon icon={faBell} className='text-primary' />
            Notificaciones Generales
          </h2>

          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <div>
                <Label className='text-sm font-medium text-gray-900'>
                  Resumen por email
                </Label>
                <p className='text-sm text-gray-500'>
                  Recibe un resumen de actividad por email
                </p>
              </div>
              <label className='relative inline-flex items-center cursor-pointer'>
                <input
                  type='checkbox'
                  checked={form.values.emailDigest}
                  onChange={e =>
                    form.handleChange('emailDigest', e.target.checked)
                  }
                  className='sr-only peer'
                />
                <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className='flex items-center justify-between'>
              <div>
                <Label className='text-sm font-medium text-gray-900'>
                  Notificaciones push
                </Label>
                <p className='text-sm text-gray-500'>
                  Recibe notificaciones en tiempo real
                </p>
              </div>
              <label className='relative inline-flex items-center cursor-pointer'>
                <input
                  type='checkbox'
                  checked={form.values.pushNotifications}
                  onChange={e =>
                    form.handleChange('pushNotifications', e.target.checked)
                  }
                  className='sr-only peer'
                />
                <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className='flex items-center justify-between'>
              <div>
                <Label className='text-sm font-medium text-gray-900'>
                  Emails de marketing
                </Label>
                <p className='text-sm text-gray-500'>
                  Recibe información sobre nuevas funciones y eventos especiales
                </p>
              </div>
              <label className='relative inline-flex items-center cursor-pointer'>
                <input
                  type='checkbox'
                  checked={form.values.marketingEmails}
                  onChange={e =>
                    form.handleChange('marketingEmails', e.target.checked)
                  }
                  className='sr-only peer'
                />
                <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </Card>

        {/* Quick Links */}
        <Card className='p-6'>
          <h2 className='text-xl font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100'>
            <FontAwesomeIcon icon={faShield} className='text-primary' />
            Enlaces Rápidos
          </h2>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <Button
              variant='outline'
              className='justify-start h-auto p-4'
              onClick={() => (window.location.href = '/profile/security')}
            >
              <div className='text-left'>
                <div className='font-medium'>Seguridad</div>
                <div className='text-sm text-gray-500'>
                  Gestiona 2FA y configuración de seguridad
                </div>
              </div>
            </Button>

            <Button
              variant='outline'
              className='justify-start h-auto p-4'
              onClick={() => (window.location.href = '/notifications')}
            >
              <div className='text-left'>
                <div className='font-medium'>Historial de Notificaciones</div>
                <div className='text-sm text-gray-500'>
                  Ve tu historial completo de notificaciones
                </div>
              </div>
            </Button>
          </div>
        </Card>

        {/* Save Button */}
        <div className='flex justify-end'>
          <Button
            onClick={form.handleSubmit}
            disabled={form.isSubmitting}
            className='px-8'
          >
            {form.isSubmitting ? (
              <>
                <FontAwesomeIcon
                  icon={faSpinner}
                  className='mr-2 animate-spin'
                />
                Guardando...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faSave} className='mr-2' />
                Guardar Configuración
              </>
            )}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
