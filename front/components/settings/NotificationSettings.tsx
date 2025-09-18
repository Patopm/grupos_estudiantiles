'use client';

import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell } from '@fortawesome/free-solid-svg-icons';

interface NotificationSettingsProps {
  emailDigest: boolean;
  pushNotifications: boolean;
  marketingEmails: boolean;
  onEmailDigestChange: (value: boolean) => void;
  onPushNotificationsChange: (value: boolean) => void;
  onMarketingEmailsChange: (value: boolean) => void;
}

export default function NotificationSettings({
  emailDigest,
  pushNotifications,
  marketingEmails,
  onEmailDigestChange,
  onPushNotificationsChange,
  onMarketingEmailsChange,
}: NotificationSettingsProps) {
  const ToggleSwitch = ({
    checked,
    onChange,
  }: {
    checked: boolean;
    onChange: (value: boolean) => void;
  }) => (
    <label className='relative inline-flex items-center cursor-pointer'>
      <input
        type='checkbox'
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className='sr-only peer'
      />
      <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
    </label>
  );

  return (
    <Card className='p-6'>
      <h2 className='text-xl font-semibold mb-4 flex items-center gap-2 text-primary-text'>
        <FontAwesomeIcon icon={faBell} className='text-primary' />
        Notificaciones Generales
      </h2>

      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <div>
            <Label className='text-sm font-medium text-secondary-text'>
              Resumen por email
            </Label>
            <p className='text-sm text-gray-500'>
              Recibe un resumen de actividad por email
            </p>
          </div>
          <ToggleSwitch checked={emailDigest} onChange={onEmailDigestChange} />
        </div>

        <div className='flex items-center justify-between'>
          <div>
            <Label className='text-sm font-medium text-secondary-text'>
              Notificaciones push
            </Label>
            <p className='text-sm text-gray-500'>
              Recibe notificaciones en tiempo real
            </p>
          </div>
          <ToggleSwitch
            checked={pushNotifications}
            onChange={onPushNotificationsChange}
          />
        </div>

        <div className='flex items-center justify-between'>
          <div>
            <Label className='text-sm font-medium text-secondary-text'>
              Emails de marketing
            </Label>
            <p className='text-sm text-gray-500'>
              Recibe información sobre nuevas funciones y eventos especiales
            </p>
          </div>
          <ToggleSwitch
            checked={marketingEmails}
            onChange={onMarketingEmailsChange}
          />
        </div>
      </div>
    </Card>
  );
}
