'use client';

import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGlobe } from '@fortawesome/free-solid-svg-icons';

interface LanguageRegionSettingsProps {
  language: string;
  timezone: string;
  onLanguageChange: (language: string) => void;
  onTimezoneChange: (timezone: string) => void;
}

export default function LanguageRegionSettings({
  language,
  timezone,
  onLanguageChange,
  onTimezoneChange,
}: LanguageRegionSettingsProps) {
  const languageOptions = [
    { value: 'es', label: 'Español' },
    { value: 'en', label: 'English' },
  ];

  const timezoneOptions = [
    { value: 'America/Mexico_City', label: 'Ciudad de México (GMT-6)' },
    { value: 'America/Cancun', label: 'Cancún (GMT-5)' },
    { value: 'America/Tijuana', label: 'Tijuana (GMT-8)' },
    { value: 'UTC', label: 'UTC (GMT+0)' },
  ];

  return (
    <Card className='p-6'>
      <h2 className='text-xl font-semibold mb-4 flex items-center gap-2 text-primary-text'>
        <FontAwesomeIcon icon={faGlobe} className='text-primary' />
        Idioma y Región
      </h2>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <div>
          <Label className='text-sm font-medium text-secondary-text mb-2 block'>
            Idioma
          </Label>
          <select
            value={language}
            onChange={e => onLanguageChange(e.target.value)}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary'
          >
            {languageOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label className='text-sm font-medium text-secondary-text mb-2 block'>
            Zona Horaria
          </Label>
          <select
            value={timezone}
            onChange={e => onTimezoneChange(e.target.value)}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary'
          >
            {timezoneOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </Card>
  );
}
