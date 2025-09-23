import { z } from 'zod';

// Event creation form validation schema
export const eventCreationSchema = z
  .object({
    title: z
      .string({ message: 'Por favor ingresa el título del evento' })
      .trim()
      .min(1, 'El título del evento es obligatorio')
      .min(3, 'El título debe tener al menos 3 caracteres')
      .max(100, 'El título es demasiado largo (máximo 100 caracteres)')
      .regex(
        /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s\-.,!?()]+$/,
        'El título solo puede contener letras, números, espacios y caracteres básicos de puntuación'
      ),
    description: z
      .string({ message: 'Por favor ingresa la descripción del evento' })
      .trim()
      .min(1, 'La descripción del evento es obligatoria')
      .min(10, 'La descripción debe tener al menos 10 caracteres')
      .max(2000, 'La descripción es demasiado larga (máximo 2000 caracteres)'),
    event_type: z.enum(
      [
        'academic',
        'social',
        'sports',
        'cultural',
        'meeting',
        'workshop',
        'conference',
        'other',
      ],
      { message: 'Por favor selecciona un tipo de evento válido' }
    ),
    start_datetime: z
      .string({ message: 'Por favor selecciona la fecha y hora de inicio' })
      .min(1, 'La fecha y hora de inicio es obligatoria')
      .refine(value => {
        const date = new Date(value);
        return !isNaN(date.getTime());
      }, 'Por favor ingresa una fecha y hora válida'),
    end_datetime: z
      .string({
        message: 'Por favor selecciona la fecha y hora de finalización',
      })
      .min(1, 'La fecha y hora de finalización es obligatoria')
      .refine(value => {
        const date = new Date(value);
        return !isNaN(date.getTime());
      }, 'Por favor ingresa una fecha y hora válida'),
    location: z
      .string({ message: 'Por favor ingresa la ubicación del evento' })
      .trim()
      .min(1, 'La ubicación del evento es obligatoria')
      .min(3, 'La ubicación debe tener al menos 3 caracteres')
      .max(200, 'La ubicación es demasiado larga (máximo 200 caracteres)'),
    max_attendees: z
      .number({ message: 'Por favor ingresa el número máximo de asistentes' })
      .min(1, 'Debe haber al menos 1 asistente')
      .max(1000, 'El máximo de asistentes no puede exceder 1000')
      .optional()
      .or(z.literal('')),
    registration_deadline: z
      .string()
      .optional()
      .or(z.literal(''))
      .refine(value => {
        if (!value || value === '') return true;
        const date = new Date(value);
        return !isNaN(date.getTime());
      }, 'Por favor ingresa una fecha de registro válida'),
    requires_registration: z.boolean({
      message: 'Valor inválido para registro requerido',
    }),
    target_groups: z
      .array(z.string(), {
        message: 'Por favor selecciona al menos un grupo objetivo',
      })
      .min(1, 'Debes seleccionar al menos un grupo objetivo')
      .max(10, 'No puedes seleccionar más de 10 grupos'),
    image: z
      .instanceof(File, { message: 'El archivo debe ser una imagen válida' })
      .optional()
      .refine(file => {
        if (!file) return true;
        const maxSize = 5 * 1024 * 1024; // 5MB
        const allowedTypes = [
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/webp',
        ];
        return file.size <= maxSize && allowedTypes.includes(file.type);
      }, 'La imagen debe ser menor a 5MB y en formato JPG, PNG o WebP'),
  })
  .refine(
    data => {
      const startDate = new Date(data.start_datetime);
      const endDate = new Date(data.end_datetime);
      return endDate > startDate;
    },
    {
      message:
        'La fecha de finalización debe ser posterior a la fecha de inicio',
      path: ['end_datetime'],
    }
  )
  .refine(
    data => {
      if (!data.registration_deadline || data.registration_deadline === '')
        return true;
      const startDate = new Date(data.start_datetime);
      const deadlineDate = new Date(data.registration_deadline);
      return deadlineDate <= startDate;
    },
    {
      message:
        'La fecha límite de registro debe ser anterior o igual a la fecha de inicio del evento',
      path: ['registration_deadline'],
    }
  )
  .refine(
    data => {
      const now = new Date();
      const startDate = new Date(data.start_datetime);
      const minAdvanceTime = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      return startDate.getTime() - now.getTime() >= minAdvanceTime;
    },
    {
      message:
        'El evento debe programarse con al menos 24 horas de anticipación',
      path: ['start_datetime'],
    }
  );

// Event update form validation schema (extends creation schema)
export const eventUpdateSchema = eventCreationSchema.partial().extend({
  status: z.enum(['draft', 'published', 'cancelled', 'completed'], {
    message: 'Estado de evento inválido',
  }),
});

// Event filters validation schema
export const eventFiltersSchema = z.object({
  search: z.string().optional(),
  type: z.string().optional(),
  status: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  group_id: z.string().optional(),
  my_events: z.boolean().optional(),
});

// Type exports for TypeScript
export type EventCreationFormData = z.infer<typeof eventCreationSchema>;
export type EventUpdateFormData = z.infer<typeof eventUpdateSchema>;
export type EventFiltersFormData = z.infer<typeof eventFiltersSchema>;

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
export function validateEventCreation(data: unknown) {
  const result = eventCreationSchema.safeParse(data);

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

export function validateEventUpdate(data: unknown) {
  const result = eventUpdateSchema.safeParse(data);

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

export function validateEventFilters(data: unknown) {
  const result = eventFiltersSchema.safeParse(data);

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

// Event type labels for form display
export const EVENT_TYPE_OPTIONS = [
  { value: 'academic', label: 'Académico' },
  { value: 'social', label: 'Social' },
  { value: 'sports', label: 'Deportivo' },
  { value: 'cultural', label: 'Cultural' },
  { value: 'meeting', label: 'Reunión' },
  { value: 'workshop', label: 'Taller' },
  { value: 'conference', label: 'Conferencia' },
  { value: 'other', label: 'Otro' },
] as const;

// Helper function to get event type label
export function getEventTypeLabel(type: string): string {
  const option = EVENT_TYPE_OPTIONS.find(opt => opt.value === type);
  return option?.label || 'Desconocido';
}

// Date/time validation helpers
export function validateEventDateTime(
  startDateTime: string,
  endDateTime: string,
  registrationDeadline?: string
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const now = new Date();
  const startDate = new Date(startDateTime);
  const endDate = new Date(endDateTime);
  const deadlineDate = registrationDeadline
    ? new Date(registrationDeadline)
    : null;

  // Check if dates are valid
  if (isNaN(startDate.getTime())) {
    errors.push('Fecha de inicio inválida');
  }
  if (isNaN(endDate.getTime())) {
    errors.push('Fecha de finalización inválida');
  }
  if (deadlineDate && isNaN(deadlineDate.getTime())) {
    errors.push('Fecha límite de registro inválida');
  }

  // Check if end date is after start date
  if (endDate <= startDate) {
    errors.push(
      'La fecha de finalización debe ser posterior a la fecha de inicio'
    );
  }

  // Check if start date is in the future (at least 24 hours)
  const minAdvanceTime = 24 * 60 * 60 * 1000; // 24 hours
  if (startDate.getTime() - now.getTime() < minAdvanceTime) {
    errors.push(
      'El evento debe programarse con al menos 24 horas de anticipación'
    );
  }

  // Check if registration deadline is before start date
  if (deadlineDate && deadlineDate > startDate) {
    errors.push(
      'La fecha límite de registro debe ser anterior a la fecha de inicio del evento'
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Image validation helper
export function validateEventImage(file: File): {
  isValid: boolean;
  error?: string;
} {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'La imagen debe ser menor a 5MB',
    };
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'La imagen debe ser en formato JPG, PNG o WebP',
    };
  }

  return { isValid: true };
}
