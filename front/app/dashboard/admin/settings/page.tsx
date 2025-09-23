'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/contexts/AuthContext';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Settings,
  Save,
  RefreshCw,
  Shield,
  Mail,
  Users,
  Calendar,
} from 'lucide-react';

export default function AdminSettingsPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminSettingsContent />
    </ProtectedRoute>
  );
}

function AdminSettingsContent() {
  const { toast } = useToast();

  const [settings, setSettings] = useState({
    // System Settings
    siteName: 'Sistema de Grupos Estudiantiles',
    siteDescription: 'Plataforma para gestión de grupos estudiantiles',
    maintenanceMode: false,
    registrationEnabled: true,
    emailNotifications: true,

    // User Settings
    maxUsersPerGroup: 50,
    requireEmailVerification: true,
    allowSelfRegistration: true,

    // Event Settings
    maxEventsPerGroup: 100,
    eventRegistrationRequired: false,
    allowEventCancellation: true,

    // Security Settings
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    enableTwoFactor: false,
    passwordMinLength: 8,

    // Email Settings
    smtpHost: '',
    smtpPort: 587,
    smtpUsername: '',
    smtpPassword: '',
    fromEmail: 'noreply@example.com',

    // Backup Settings
    autoBackup: true,
    backupFrequency: 'daily',
    backupRetention: 30,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      // TODO: Implement actual settings API call
      // const data = await settingsApi.getSettings();
      // setSettings(data);

      // Mock loading delay
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar la configuración',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      // TODO: Implement actual settings save API call
      // await settingsApi.updateSettings(settings);

      // Mock save delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: 'Éxito',
        description: 'Configuración guardada correctamente',
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar la configuración',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetSettings = () => {
    // TODO: Implement reset to defaults
    toast({
      title: 'Configuración restablecida',
      description: 'Se han restablecido los valores por defecto',
    });
  };

  const updateSetting = (key: string, value: string | number | boolean) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  if (isLoading) {
    return (
      <div className='min-h-screen bg-background'>
        <DashboardHeader
          title='Configuración del Sistema'
          description='Administrar configuración del sistema'
        />
        <div className='max-w-4xl mx-auto p-6'>
          <div className='animate-pulse space-y-6'>
            <div className='h-64 bg-muted rounded-lg'></div>
            <div className='h-64 bg-muted rounded-lg'></div>
            <div className='h-64 bg-muted rounded-lg'></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-background'>
      <DashboardHeader
        title='Configuración del Sistema'
        description='Administrar configuración del sistema'
      />

      <div className='max-w-4xl mx-auto p-6 space-y-6'>
        {/* System Settings */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Settings className='w-5 h-5' />
              Configuración General
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='space-y-2'>
                <Label htmlFor='siteName'>Nombre del Sitio</Label>
                <Input
                  id='siteName'
                  value={settings.siteName}
                  onChange={e => updateSetting('siteName', e.target.value)}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='siteDescription'>Descripción del Sitio</Label>
                <Input
                  id='siteDescription'
                  value={settings.siteDescription}
                  onChange={e =>
                    updateSetting('siteDescription', e.target.value)
                  }
                />
              </div>
            </div>

            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <Label htmlFor='maintenanceMode'>Modo de Mantenimiento</Label>
                  <p className='text-sm text-muted-foreground'>
                    Desactiva el acceso público al sitio
                  </p>
                </div>
                <Switch
                  id='maintenanceMode'
                  checked={settings.maintenanceMode}
                  onCheckedChange={checked =>
                    updateSetting('maintenanceMode', checked)
                  }
                />
              </div>

              <div className='flex items-center justify-between'>
                <div>
                  <Label htmlFor='registrationEnabled'>
                    Registro Habilitado
                  </Label>
                  <p className='text-sm text-muted-foreground'>
                    Permite el registro de nuevos usuarios
                  </p>
                </div>
                <Switch
                  id='registrationEnabled'
                  checked={settings.registrationEnabled}
                  onCheckedChange={checked =>
                    updateSetting('registrationEnabled', checked)
                  }
                />
              </div>

              <div className='flex items-center justify-between'>
                <div>
                  <Label htmlFor='emailNotifications'>
                    Notificaciones por Email
                  </Label>
                  <p className='text-sm text-muted-foreground'>
                    Envía notificaciones por correo electrónico
                  </p>
                </div>
                <Switch
                  id='emailNotifications'
                  checked={settings.emailNotifications}
                  onCheckedChange={checked =>
                    updateSetting('emailNotifications', checked)
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Settings */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Users className='w-5 h-5' />
              Configuración de Usuarios
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='space-y-2'>
                <Label htmlFor='maxUsersPerGroup'>
                  Máximo Usuarios por Grupo
                </Label>
                <Input
                  id='maxUsersPerGroup'
                  type='number'
                  value={settings.maxUsersPerGroup}
                  onChange={e =>
                    updateSetting('maxUsersPerGroup', Number(e.target.value))
                  }
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='passwordMinLength'>
                  Longitud Mínima de Contraseña
                </Label>
                <Input
                  id='passwordMinLength'
                  type='number'
                  value={settings.passwordMinLength}
                  onChange={e =>
                    updateSetting('passwordMinLength', Number(e.target.value))
                  }
                />
              </div>
            </div>

            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <Label htmlFor='requireEmailVerification'>
                    Verificación de Email Requerida
                  </Label>
                  <p className='text-sm text-muted-foreground'>
                    Los usuarios deben verificar su email para activar la cuenta
                  </p>
                </div>
                <Switch
                  id='requireEmailVerification'
                  checked={settings.requireEmailVerification}
                  onCheckedChange={checked =>
                    updateSetting('requireEmailVerification', checked)
                  }
                />
              </div>

              <div className='flex items-center justify-between'>
                <div>
                  <Label htmlFor='allowSelfRegistration'>
                    Registro Automático
                  </Label>
                  <p className='text-sm text-muted-foreground'>
                    Permite que los usuarios se registren sin aprobación
                  </p>
                </div>
                <Switch
                  id='allowSelfRegistration'
                  checked={settings.allowSelfRegistration}
                  onCheckedChange={checked =>
                    updateSetting('allowSelfRegistration', checked)
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Event Settings */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Calendar className='w-5 h-5' />
              Configuración de Eventos
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='space-y-2'>
                <Label htmlFor='maxEventsPerGroup'>
                  Máximo Eventos por Grupo
                </Label>
                <Input
                  id='maxEventsPerGroup'
                  type='number'
                  value={settings.maxEventsPerGroup}
                  onChange={e =>
                    updateSetting('maxEventsPerGroup', Number(e.target.value))
                  }
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='sessionTimeout'>
                  Tiempo de Sesión (minutos)
                </Label>
                <Input
                  id='sessionTimeout'
                  type='number'
                  value={settings.sessionTimeout}
                  onChange={e =>
                    updateSetting('sessionTimeout', Number(e.target.value))
                  }
                />
              </div>
            </div>

            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <Label htmlFor='eventRegistrationRequired'>
                    Registro Requerido para Eventos
                  </Label>
                  <p className='text-sm text-muted-foreground'>
                    Los usuarios deben registrarse para asistir a eventos
                  </p>
                </div>
                <Switch
                  id='eventRegistrationRequired'
                  checked={settings.eventRegistrationRequired}
                  onCheckedChange={checked =>
                    updateSetting('eventRegistrationRequired', checked)
                  }
                />
              </div>

              <div className='flex items-center justify-between'>
                <div>
                  <Label htmlFor='allowEventCancellation'>
                    Permitir Cancelación de Eventos
                  </Label>
                  <p className='text-sm text-muted-foreground'>
                    Los organizadores pueden cancelar eventos
                  </p>
                </div>
                <Switch
                  id='allowEventCancellation'
                  checked={settings.allowEventCancellation}
                  onCheckedChange={checked =>
                    updateSetting('allowEventCancellation', checked)
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Shield className='w-5 h-5' />
              Configuración de Seguridad
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='space-y-2'>
                <Label htmlFor='maxLoginAttempts'>
                  Máximo Intentos de Login
                </Label>
                <Input
                  id='maxLoginAttempts'
                  type='number'
                  value={settings.maxLoginAttempts}
                  onChange={e =>
                    updateSetting('maxLoginAttempts', Number(e.target.value))
                  }
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='backupRetention'>
                  Retención de Backups (días)
                </Label>
                <Input
                  id='backupRetention'
                  type='number'
                  value={settings.backupRetention}
                  onChange={e =>
                    updateSetting('backupRetention', Number(e.target.value))
                  }
                />
              </div>
            </div>

            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <Label htmlFor='enableTwoFactor'>
                    Autenticación de Dos Factores
                  </Label>
                  <p className='text-sm text-muted-foreground'>
                    Requiere verificación adicional para el login
                  </p>
                </div>
                <Switch
                  id='enableTwoFactor'
                  checked={settings.enableTwoFactor}
                  onCheckedChange={checked =>
                    updateSetting('enableTwoFactor', checked)
                  }
                />
              </div>

              <div className='flex items-center justify-between'>
                <div>
                  <Label htmlFor='autoBackup'>Backup Automático</Label>
                  <p className='text-sm text-muted-foreground'>
                    Realiza backups automáticos de la base de datos
                  </p>
                </div>
                <Switch
                  id='autoBackup'
                  checked={settings.autoBackup}
                  onCheckedChange={checked =>
                    updateSetting('autoBackup', checked)
                  }
                />
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='backupFrequency'>Frecuencia de Backup</Label>
              <Select
                value={settings.backupFrequency}
                onValueChange={value => updateSetting('backupFrequency', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='daily'>Diario</SelectItem>
                  <SelectItem value='weekly'>Semanal</SelectItem>
                  <SelectItem value='monthly'>Mensual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Email Settings */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Mail className='w-5 h-5' />
              Configuración de Email
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='space-y-2'>
                <Label htmlFor='smtpHost'>Servidor SMTP</Label>
                <Input
                  id='smtpHost'
                  value={settings.smtpHost}
                  onChange={e => updateSetting('smtpHost', e.target.value)}
                  placeholder='smtp.gmail.com'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='smtpPort'>Puerto SMTP</Label>
                <Input
                  id='smtpPort'
                  type='number'
                  value={settings.smtpPort}
                  onChange={e =>
                    updateSetting('smtpPort', Number(e.target.value))
                  }
                />
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='space-y-2'>
                <Label htmlFor='smtpUsername'>Usuario SMTP</Label>
                <Input
                  id='smtpUsername'
                  value={settings.smtpUsername}
                  onChange={e => updateSetting('smtpUsername', e.target.value)}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='smtpPassword'>Contraseña SMTP</Label>
                <Input
                  id='smtpPassword'
                  type='password'
                  value={settings.smtpPassword}
                  onChange={e => updateSetting('smtpPassword', e.target.value)}
                />
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='fromEmail'>Email Remitente</Label>
              <Input
                id='fromEmail'
                type='email'
                value={settings.fromEmail}
                onChange={e => updateSetting('fromEmail', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className='flex gap-4 justify-end'>
          <Button
            variant='outline'
            onClick={handleResetSettings}
            disabled={isSaving}
          >
            <RefreshCw className='w-4 h-4 mr-2' />
            Restablecer
          </Button>
          <Button onClick={handleSaveSettings} disabled={isSaving}>
            <Save className='w-4 h-4 mr-2' />
            {isSaving ? 'Guardando...' : 'Guardar Configuración'}
          </Button>
        </div>
      </div>
    </div>
  );
}
