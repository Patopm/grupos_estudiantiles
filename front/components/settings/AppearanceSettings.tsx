'use client';

import { useTheme } from 'next-themes';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPalette } from '@fortawesome/free-solid-svg-icons';

interface AppearanceSettingsProps {
  theme: string;
  onThemeChange: (theme: string) => void;
}

export default function AppearanceSettings({
  theme,
  onThemeChange,
}: AppearanceSettingsProps) {
  const { setTheme } = useTheme();

  const themeOptions = [
    { value: 'light', label: 'Claro' },
    { value: 'dark', label: 'Oscuro' },
    { value: 'system', label: 'Sistema' },
  ];

  return (
    <Card className='p-6'>
      <h2 className='text-xl font-semibold mb-4 flex items-center gap-2 text-primary-text'>
        <FontAwesomeIcon icon={faPalette} className='text-primary' />
        Apariencia
      </h2>

      <div className='space-y-4'>
        <div>
          <Label className='text-sm font-medium text-secondary-text mb-2 block'>
            Tema
          </Label>
          <div className='grid grid-cols-3 gap-3'>
            {themeOptions.map(option => (
              <label key={option.value} className='relative cursor-pointer'>
                <input
                  type='radio'
                  name='theme'
                  value={option.value}
                  checked={theme === option.value}
                  onChange={e => {
                    onThemeChange(e.target.value);
                    setTheme(e.target.value);
                  }}
                  className='sr-only'
                />
                <div
                  className={`p-3 border-2 rounded-lg text-center transition-colors ${
                    theme === option.value
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
  );
}
