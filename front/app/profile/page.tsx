'use client';

import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { faUser, faIdCard } from '@fortawesome/free-solid-svg-icons';
import FormSection from '@/components/common/FormSection';
import FormField from '@/components/common/FormField';
import {
  DashboardLayout,
  DashboardHeaders,
} from '@/components/dashboard/DashboardHeader';
import { useForm } from '@/hooks/useForm';
import { profileSchema, type ProfileFormData } from '@/lib/validations/forms';

export default function ProfilePage() {
  const { user } = useAuth();

  const form = useForm<ProfileFormData>({
    initialValues: {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      phone: user?.phone || '',
    },
    schema: profileSchema,
    onSubmit: async () => {
      // TODO: Implement profile update API call
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulated API call
      toast.success('Perfil actualizado correctamente');
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
    <DashboardLayout header={DashboardHeaders.profile()}>
      {/* Profile Information */}
      <FormSection
        title='Información Personal'
        icon={faUser}
        isEditing={form.isEditing}
        isSaving={form.isSubmitting}
        onEdit={form.handleEdit}
        onSave={form.handleSubmit}
        onCancel={form.handleCancel}
        showActions={true}
        className='mb-6'
      >
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <FormField
            id='first_name'
            label='Nombre'
            value={form.values.first_name}
            onChange={e => form.handleChange('first_name', e.target.value)}
            disabled={!form.isEditing}
            required
            errorText={form.errors.first_name}
          />

          <FormField
            id='last_name'
            label='Apellido'
            value={form.values.last_name}
            onChange={e => form.handleChange('last_name', e.target.value)}
            disabled={!form.isEditing}
            required
            errorText={form.errors.last_name}
          />

          <FormField
            id='email'
            label='Email'
            type='email'
            value={user.email}
            disabled
            helpText='El email no se puede modificar'
          />

          <FormField
            id='phone'
            label='Teléfono'
            type='tel'
            value={form.values.phone}
            onChange={e => form.handleChange('phone', e.target.value)}
            disabled={!form.isEditing}
          />

          <FormField
            id='student_id'
            label='Matrícula'
            value={user.student_id}
            disabled
            helpText='La matrícula no se puede modificar'
          />

          <FormField id='role' label='Rol' value={user.role_display} disabled />
        </div>
      </FormSection>

      {/* Account Information */}
      <FormSection
        title='Información de Cuenta'
        icon={faIdCard}
        showActions={false}
      >
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div>
            <FormField
              id='account_status'
              label='Estado de la cuenta'
              value={user.is_active_student ? 'Activo' : 'Inactivo'}
              disabled
              className={
                user.is_active_student
                  ? 'text-green-700 bg-green-50'
                  : 'text-red-700 bg-red-50'
              }
            />
          </div>

          <div>
            <FormField
              id='full_name'
              label='Nombre completo'
              value={user.full_name}
              disabled
            />
          </div>
        </div>
      </FormSection>
    </DashboardLayout>
  );
}
