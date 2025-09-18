'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import NotificationCheckbox from './NotificationCheckbox';
import {
  preferencesApi,
  type NotificationPreferences as PreferencesType,
} from '@/lib/api/notifications';
import { type ApiError } from '@/lib/api/client';
import { toast } from 'react-hot-toast';
import { useForm } from '@/hooks/useForm';
import {
  notificationPreferencesSchema,
  type NotificationPreferencesFormData,
} from '@/lib/validations/forms';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBell,
  faCalendarAlt,
  faUsers,
  faShield,
  faNewspaper,
  faSpinner,
  faSave,
} from '@fortawesome/free-solid-svg-icons';

interface NotificationPreferencesProps {
  onSave?: (preferences: PreferencesType) => void;
}

export default function NotificationPreferences({
  onSave,
}: NotificationPreferencesProps) {
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<NotificationPreferencesFormData>({
    initialValues: {
      event_reminders: true,
      event_updates: true,
      event_cancellations: true,
      group_requests: true,
      group_updates: true,
      new_members: true,
      security_alerts: true,
      login_notifications: false,
      newsletter: false,
      promotional_emails: false,
      email_frequency: 'immediate' as const,
    },
    schema: notificationPreferencesSchema,
    onSubmit: async values => {
      try {
        const updatedPreferences =
          await preferencesApi.updatePreferences(values);
        toast.success('Preferencias guardadas correctamente');

        if (onSave) {
          onSave(updatedPreferences);
        }
      } catch (error) {
        const apiError = error as ApiError;
        toast.error(apiError.message || 'Error al guardar preferencias');
        throw error;
      }
    },
  });

  useEffect(() => {
    loadPreferences();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadPreferences = async () => {
    try {
      const data = await preferencesApi.getPreferences();
      form.setValues({
        event_reminders: data.event_reminders,
        event_updates: data.event_updates,
        event_cancellations: data.event_cancellations,
        group_requests: data.group_requests,
        group_updates: data.group_updates,
        new_members: data.new_members,
        security_alerts: data.security_alerts,
        login_notifications: data.login_notifications,
        newsletter: data.newsletter,
        promotional_emails: data.promotional_emails,
        email_frequency: data.email_frequency,
      });
    } catch (error) {
      const apiError = error as ApiError;
      toast.error(apiError.message || 'Error al cargar preferencias');
      console.error('Error loading preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className='p-6'>
        <div className='flex items-center justify-center py-8'>
          <FontAwesomeIcon
            icon={faSpinner}
            className='text-2xl animate-spin text-gray-400'
          />
          <span className='ml-3 text-gray-600'>Cargando preferencias...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Event Notifications */}
      <Card className='p-6'>
        <div className='flex items-center mb-4'>
          <FontAwesomeIcon
            icon={faCalendarAlt}
            className='text-lg text-blue-600 mr-3'
          />
          <h3 className='text-lg font-semibold text-gray-900'>
            Notificaciones de Eventos
          </h3>
        </div>

        <div className='space-y-4'>
          <NotificationCheckbox
            id='event_reminders'
            label='Recordatorios de eventos'
            description='Recibe recordatorios antes de los eventos a los que te has inscrito'
            checked={form.values.event_reminders}
            onChange={checked => form.handleChange('event_reminders', checked)}
          />

          <NotificationCheckbox
            id='event_updates'
            label='Actualizaciones de eventos'
            description='Notificaciones cuando se modifiquen los detalles de un evento'
            checked={form.values.event_updates}
            onChange={checked => form.handleChange('event_updates', checked)}
          />

          <NotificationCheckbox
            id='event_cancellations'
            label='Cancelaciones de eventos'
            description='Notificaciones cuando un evento sea cancelado'
            checked={form.values.event_cancellations}
            onChange={checked =>
              form.handleChange('event_cancellations', checked)
            }
          />
        </div>
      </Card>

      {/* Group Notifications */}
      <Card className='p-6'>
        <div className='flex items-center mb-4'>
          <FontAwesomeIcon
            icon={faUsers}
            className='text-lg text-green-600 mr-3'
          />
          <h3 className='text-lg font-semibold text-gray-900'>
            Notificaciones de Grupos
          </h3>
        </div>

        <div className='space-y-4'>
          <NotificationCheckbox
            id='group_requests'
            label='Solicitudes de grupo'
            description='Notificaciones sobre solicitudes de ingreso a grupos (para presidentes)'
            checked={form.values.group_requests}
            onChange={checked => form.handleChange('group_requests', checked)}
          />

          <NotificationCheckbox
            id='group_updates'
            label='Actualizaciones de grupo'
            description='Notificaciones cuando se actualice información de tus grupos'
            checked={form.values.group_updates}
            onChange={checked => form.handleChange('group_updates', checked)}
          />

          <NotificationCheckbox
            id='new_members'
            label='Nuevos miembros'
            description='Notificaciones cuando nuevos miembros se unan a tus grupos'
            checked={form.values.new_members}
            onChange={checked => form.handleChange('new_members', checked)}
          />
        </div>
      </Card>

      {/* Security Notifications */}
      <Card className='p-6'>
        <div className='flex items-center mb-4'>
          <FontAwesomeIcon
            icon={faShield}
            className='text-lg text-red-600 mr-3'
          />
          <h3 className='text-lg font-semibold text-gray-900'>
            Notificaciones de Seguridad
          </h3>
        </div>

        <div className='space-y-4'>
          <NotificationCheckbox
            id='security_alerts'
            label='Alertas de seguridad'
            description='Notificaciones importantes sobre la seguridad de tu cuenta'
            checked={form.values.security_alerts}
            onChange={checked => form.handleChange('security_alerts', checked)}
          />

          <NotificationCheckbox
            id='login_notifications'
            label='Notificaciones de inicio de sesión'
            description='Recibe un email cada vez que inicies sesión en tu cuenta'
            checked={form.values.login_notifications}
            onChange={checked =>
              form.handleChange('login_notifications', checked)
            }
          />
        </div>
      </Card>

      {/* General Notifications */}
      <Card className='p-6'>
        <div className='flex items-center mb-4'>
          <FontAwesomeIcon
            icon={faNewspaper}
            className='text-lg text-purple-600 mr-3'
          />
          <h3 className='text-lg font-semibold text-gray-900'>
            Notificaciones Generales
          </h3>
        </div>

        <div className='space-y-4'>
          <NotificationCheckbox
            id='newsletter'
            label='Boletín informativo'
            description='Recibe noticias y actualizaciones sobre la plataforma'
            checked={form.values.newsletter}
            onChange={checked => form.handleChange('newsletter', checked)}
          />

          <NotificationCheckbox
            id='promotional_emails'
            label='Emails promocionales'
            description='Recibe información sobre eventos especiales y promociones'
            checked={form.values.promotional_emails}
            onChange={checked =>
              form.handleChange('promotional_emails', checked)
            }
          />
        </div>
      </Card>

      {/* Email Frequency */}
      <Card className='p-6'>
        <div className='flex items-center mb-4'>
          <FontAwesomeIcon
            icon={faBell}
            className='text-lg text-orange-600 mr-3'
          />
          <h3 className='text-lg font-semibold text-gray-900'>
            Frecuencia de Emails
          </h3>
        </div>

        <div className='space-y-3'>
          <Label className='text-sm font-medium text-gray-700'>
            ¿Con qué frecuencia deseas recibir notificaciones por email?
          </Label>

          <div className='space-y-3'>
            <label className='flex items-center space-x-3 cursor-pointer'>
              <input
                type='radio'
                name='email_frequency'
                value='immediate'
                checked={form.values.email_frequency === 'immediate'}
                onChange={e =>
                  form.handleChange('email_frequency', e.target.value)
                }
                className='w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500'
              />
              <div>
                <div className='font-medium text-gray-900'>Inmediato</div>
                <div className='text-sm text-gray-500'>
                  Recibe emails tan pronto como ocurra la actividad
                </div>
              </div>
            </label>

            <label className='flex items-center space-x-3 cursor-pointer'>
              <input
                type='radio'
                name='email_frequency'
                value='daily'
                checked={form.values.email_frequency === 'daily'}
                onChange={e =>
                  form.handleChange('email_frequency', e.target.value)
                }
                className='w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500'
              />
              <div>
                <div className='font-medium text-gray-900'>Diario</div>
                <div className='text-sm text-gray-500'>
                  Recibe un resumen diario a las 9:00 AM
                </div>
              </div>
            </label>

            <label className='flex items-center space-x-3 cursor-pointer'>
              <input
                type='radio'
                name='email_frequency'
                value='weekly'
                checked={form.values.email_frequency === 'weekly'}
                onChange={e =>
                  form.handleChange('email_frequency', e.target.value)
                }
                className='w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500'
              />
              <div>
                <div className='font-medium text-gray-900'>Semanal</div>
                <div className='text-sm text-gray-500'>
                  Recibe un resumen semanal los lunes a las 9:00 AM
                </div>
              </div>
            </label>
          </div>
        </div>
      </Card>

      {/* Save Button */}
      <div className='flex justify-end'>
        <Button
          onClick={form.handleSubmit}
          disabled={form.isSubmitting}
          className='px-6'
        >
          {form.isSubmitting ? (
            <>
              <FontAwesomeIcon icon={faSpinner} className='mr-2 animate-spin' />
              Guardando...
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faSave} className='mr-2' />
              Guardar Preferencias
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
