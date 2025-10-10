'use client';

import { faSave, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { toast } from 'react-hot-toast';
import {
  DashboardHeaders,
  DashboardLayout,
} from '@/components/dashboard/DashboardHeader';
import AppearanceSettings from '@/components/settings/AppearanceSettings';
import LanguageRegionSettings from '@/components/settings/LanguageRegionSettings';
import NotificationSettings from '@/components/settings/NotificationSettings';
import QuickLinks from '@/components/settings/QuickLinks';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useForm } from '@/hooks/useForm';
import { type SettingsFormData, settingsSchema } from '@/lib/validations/forms';

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
          <p className='text-secondary-text'>
            Debes iniciar sesión para acceder a esta página
          </p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout header={DashboardHeaders.settings()}>
      <div className='space-y-6'>
        <AppearanceSettings
          theme={form.values.theme}
          onThemeChange={value => form.handleChange('theme', value)}
        />

        <LanguageRegionSettings
          language={form.values.language}
          timezone={form.values.timezone}
          onLanguageChange={value => form.handleChange('language', value)}
          onTimezoneChange={value => form.handleChange('timezone', value)}
        />

        <NotificationSettings
          emailDigest={form.values.emailDigest}
          pushNotifications={form.values.pushNotifications}
          marketingEmails={form.values.marketingEmails}
          onEmailDigestChange={value => form.handleChange('emailDigest', value)}
          onPushNotificationsChange={value =>
            form.handleChange('pushNotifications', value)
          }
          onMarketingEmailsChange={value =>
            form.handleChange('marketingEmails', value)
          }
        />

        <QuickLinks />

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
