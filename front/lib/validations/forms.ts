import { z } from 'zod';

// Profile form validation schema
export const profileSchema = z.object({
  first_name: z
    .string({ message: 'Por favor ingresa tu nombre' })
    .trim()
    .min(1, 'El nombre es obligatorio')
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre es demasiado largo (máximo 50 caracteres)')
    .regex(
      /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/,
      'El nombre solo puede contener letras, espacios, apostrofes y guiones'
    ),
  last_name: z
    .string({ message: 'Por favor ingresa tus apellidos' })
    .trim()
    .min(1, 'Los apellidos son obligatorios')
    .min(2, 'Los apellidos deben tener al menos 2 caracteres')
    .max(100, 'Los apellidos son demasiado largos (máximo 100 caracteres)')
    .regex(
      /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/,
      'Los apellidos solo pueden contener letras, espacios, apostrofes y guiones'
    ),
  phone: z
    .string({ message: 'Por favor ingresa tu teléfono' })
    .optional()
    .or(z.literal(''))
    .transform(val => (val ? val.replace(/\D/g, '') : ''))
    .pipe(
      z.union([
        z.literal(''),
        z
          .string()
          .length(10, 'El teléfono debe tener exactamente 10 dígitos')
          .regex(/^\d{10}$/, 'El teléfono debe contener solo números'),
      ])
    ),
});

// Settings form validation schema
export const settingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system'], {
    message: 'Tema inválido',
  }),
  language: z.enum(['es', 'en'], {
    message: 'Idioma inválido',
  }),
  timezone: z
    .string({ message: 'Por favor selecciona una zona horaria' })
    .min(1, 'La zona horaria es obligatoria'),
  emailDigest: z.boolean({
    message: 'Valor inválido para resumen por email',
  }),
  pushNotifications: z.boolean({
    message: 'Valor inválido para notificaciones push',
  }),
  marketingEmails: z.boolean({
    message: 'Valor inválido para emails de marketing',
  }),
});

// Notification preferences validation schema
export const notificationPreferencesSchema = z.object({
  event_reminders: z.boolean({
    message: 'Valor inválido para recordatorios de eventos',
  }),
  event_updates: z.boolean({
    message: 'Valor inválido para actualizaciones de eventos',
  }),
  event_cancellations: z.boolean({
    message: 'Valor inválido para cancelaciones de eventos',
  }),
  group_requests: z.boolean({
    message: 'Valor inválido para solicitudes de grupo',
  }),
  group_updates: z.boolean({
    message: 'Valor inválido para actualizaciones de grupo',
  }),
  new_members: z.boolean({
    message: 'Valor inválido para nuevos miembros',
  }),
  security_alerts: z.boolean({
    message: 'Valor inválido para alertas de seguridad',
  }),
  login_notifications: z.boolean({
    message: 'Valor inválido para notificaciones de inicio de sesión',
  }),
  newsletter: z.boolean({
    message: 'Valor inválido para boletín informativo',
  }),
  promotional_emails: z.boolean({
    message: 'Valor inválido para emails promocionales',
  }),
  email_frequency: z.enum(['immediate', 'daily', 'weekly'], {
    message: 'Frecuencia de email inválida',
  }),
});

// Security/2FA setup validation schema
export const totpSetupSchema = z.object({
  token: z
    .string({ message: 'Por favor ingresa el código de verificación' })
    .min(1, 'El código de verificación es obligatorio')
    .length(6, 'El código debe tener exactamente 6 dígitos')
    .regex(/^\d{6}$/, 'El código debe contener solo números'),
});

// Password change validation schema
export const passwordChangeSchema = z
  .object({
    current_password: z
      .string({ message: 'Por favor ingresa tu contraseña actual' })
      .min(1, 'La contraseña actual es obligatoria'),
    new_password: z
      .string({ message: 'Por favor ingresa tu nueva contraseña' })
      .min(1, 'La nueva contraseña es obligatoria')
      .min(8, 'La nueva contraseña debe tener al menos 8 caracteres')
      .max(
        100,
        'La nueva contraseña es demasiado larga (máximo 100 caracteres)'
      )
      .regex(
        /[a-z]/,
        'La nueva contraseña debe incluir al menos una letra minúscula (a-z)'
      )
      .regex(
        /[A-Z]/,
        'La nueva contraseña debe incluir al menos una letra mayúscula (A-Z)'
      )
      .regex(/\d/, 'La nueva contraseña debe incluir al menos un número (0-9)')
      .regex(
        /[!@#$%^&*(),.?":{}|<>]/,
        'La nueva contraseña debe incluir al menos un carácter especial (!@#$%^&*(),.?":{}|<>)'
      ),
    confirm_new_password: z
      .string({ message: 'Por favor confirma tu nueva contraseña' })
      .min(1, 'Debes confirmar tu nueva contraseña'),
  })
  .refine(data => data.new_password === data.confirm_new_password, {
    message:
      'Las contraseñas no coinciden. Por favor verifica que sean idénticas.',
    path: ['confirm_new_password'],
  });

// Search/filter validation schema
export const searchFilterSchema = z.object({
  searchTerm: z.string().optional(),
  statusFilter: z.string().optional(),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional(),
});

// Type exports for TypeScript
export type ProfileFormData = z.infer<typeof profileSchema>;
export type SettingsFormData = z.infer<typeof settingsSchema>;
export type NotificationPreferencesFormData = z.infer<
  typeof notificationPreferencesSchema
>;
export type TotpSetupFormData = z.infer<typeof totpSetupSchema>;
export type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>;
export type SearchFilterFormData = z.infer<typeof searchFilterSchema>;

// Helper function to format Zod errors consistently
export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};

  error.issues.forEach((issue: z.ZodIssue) => {
    const path = issue.path.length > 0 ? issue.path.join('.') : 'root';
    if (!errors[path]) {
      errors[path] = issue.message;
    }
  });

  return errors;
}

// Validation helper functions using safeParse
export function validateProfile(data: unknown) {
  const result = profileSchema.safeParse(data);

  if (result.success) {
    return {
      success: true as const,
      data: result.data,
    };
  }

  return {
    success: false as const,
    errors: formatZodErrors(result.error),
  };
}

export function validateSettings(data: unknown) {
  const result = settingsSchema.safeParse(data);

  if (result.success) {
    return {
      success: true as const,
      data: result.data,
    };
  }

  return {
    success: false as const,
    errors: formatZodErrors(result.error),
  };
}

export function validateNotificationPreferences(data: unknown) {
  const result = notificationPreferencesSchema.safeParse(data);

  if (result.success) {
    return {
      success: true as const,
      data: result.data,
    };
  }

  return {
    success: false as const,
    errors: formatZodErrors(result.error),
  };
}

export function validateTotpSetup(data: unknown) {
  const result = totpSetupSchema.safeParse(data);

  if (result.success) {
    return {
      success: true as const,
      data: result.data,
    };
  }

  return {
    success: false as const,
    errors: formatZodErrors(result.error),
  };
}

export function validatePasswordChange(data: unknown) {
  const result = passwordChangeSchema.safeParse(data);

  if (result.success) {
    return {
      success: true as const,
      data: result.data,
    };
  }

  return {
    success: false as const,
    errors: formatZodErrors(result.error),
  };
}

export function validateSearchFilter(data: unknown) {
  const result = searchFilterSchema.safeParse(data);

  if (result.success) {
    return {
      success: true as const,
      data: result.data,
    };
  }

  return {
    success: false as const,
    errors: formatZodErrors(result.error),
  };
}

// Individual field validation helper
export function validateSingleField<T>(
  schema: z.ZodType<T>,
  value: unknown
): { success: boolean; error?: string } {
  const result = schema.safeParse(value);

  if (result.success) {
    return { success: true };
  }

  return {
    success: false,
    error: result.error.issues[0]?.message || 'Error de validación',
  };
}
