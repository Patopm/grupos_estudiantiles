import { z } from 'zod';

// Login form validation schema
export const loginSchema = z.object({
  email: z
    .string({ message: 'Por favor ingresa tu correo electrónico' })
    .min(1, 'El correo electrónico es obligatorio')
    .email('Por favor ingresa un correo electrónico válido')
    .refine(
      email => email.endsWith('@tecmilenio.mx'),
      'Debes usar tu correo institucional de Tecmilenio (@tecmilenio.mx)'
    ),
  password: z
    .string({ message: 'Por favor ingresa tu contraseña' })
    .min(1, 'La contraseña es obligatoria'),
  rememberMe: z.boolean().default(false),
  mfaToken: z
    .string()
    .optional()
    .refine(value => {
      if (!value) return true; // Optional field
      // TOTP tokens are 6 digits, backup codes are 8 characters
      return (
        (value.length === 6 && /^\d{6}$/.test(value)) ||
        (value.length === 8 && /^[A-Z0-9]{8}$/.test(value.toUpperCase()))
      );
    }, 'El código MFA debe ser de 6 dígitos (TOTP) o 8 caracteres (código de respaldo)'),
});

// Registration form validation schema
export const registerSchema = z
  .object({
    firstName: z
      .string({ message: 'Por favor ingresa tu nombre' })
      .trim()
      .min(1, 'Tu nombre es obligatorio')
      .min(2, 'Tu nombre debe tener al menos 2 caracteres')
      .max(50, 'Tu nombre es demasiado largo (máximo 50 caracteres)')
      .regex(
        /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/,
        'Tu nombre solo puede contener letras, espacios, apostrofes y guiones'
      ),
    lastName: z
      .string({ message: 'Por favor ingresa tus apellidos' })
      .trim()
      .min(1, 'Tus apellidos son obligatorios')
      .min(2, 'Tus apellidos deben tener al menos 2 caracteres')
      .max(100, 'Tus apellidos son demasiado largos (máximo 100 caracteres)')
      .regex(
        /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/,
        'Tus apellidos solo pueden contener letras, espacios, apostrofes y guiones'
      ),
    email: z
      .string({ message: 'Por favor ingresa tu correo electrónico' })
      .min(1, 'Tu correo electrónico es obligatorio')
      .email('Por favor ingresa un correo electrónico válido')
      .refine(
        email => email.endsWith('@tecmilenio.mx'),
        'Debes usar tu correo institucional de Tecmilenio (@tecmilenio.mx)'
      ),
    studentId: z
      .string({ message: 'Por favor ingresa tu matrícula' })
      .trim()
      .min(1, 'Tu matrícula es obligatoria')
      .regex(
        /^AL[0-9]{8}$/,
        'Tu matrícula debe seguir el formato AL seguido de 8 números (ej: AL12345678)'
      ),
    phone: z
      .string({ message: 'Por favor ingresa tu teléfono' })
      .min(1, 'Tu teléfono es obligatorio')
      .transform(val => val.replace(/\D/g, ''))
      .pipe(
        z
          .string()
          .length(10, 'Tu teléfono debe tener exactamente 10 dígitos')
          .regex(/^\d{10}$/, 'Tu teléfono debe contener solo números')
      ),
    password: z
      .string({ message: 'Por favor crea una contraseña' })
      .min(1, 'La contraseña es obligatoria')
      .min(8, 'Tu contraseña debe tener al menos 8 caracteres')
      .max(100, 'Tu contraseña es demasiado larga (máximo 100 caracteres)')
      .regex(
        /[a-z]/,
        'Tu contraseña debe incluir al menos una letra minúscula (a-z)'
      )
      .regex(
        /[A-Z]/,
        'Tu contraseña debe incluir al menos una letra mayúscula (A-Z)'
      )
      .regex(/\d/, 'Tu contraseña debe incluir al menos un número (0-9)')
      .regex(
        /[!@#$%^&*(),.?":{}|<>]/,
        'Tu contraseña debe incluir al menos un carácter especial (!@#$%^&*(),.?":{}|<>)'
      ),
    confirmPassword: z
      .string({ message: 'Por favor confirma tu contraseña' })
      .min(1, 'Debes confirmar tu contraseña'),
    agreeToTerms: z
      .boolean({ message: 'Debes aceptar los términos y condiciones' })
      .refine(
        val => val === true,
        'Debes aceptar los términos y condiciones para continuar'
      ),
  })
  .refine(data => data.password === data.confirmPassword, {
    message:
      'Las contraseñas que ingresaste no coinciden. Por favor verifica que sean idénticas.',
    path: ['confirmPassword'],
  });

// Forgot password form validation schema
export const forgotPasswordSchema = z.object({
  email: z
    .string({ message: 'Por favor ingresa tu correo electrónico' })
    .min(1, 'El correo electrónico es obligatorio')
    .email('Por favor ingresa un correo electrónico válido')
    .refine(
      email => email.endsWith('@tecmilenio.mx'),
      'Debes usar tu correo institucional de Tecmilenio (@tecmilenio.mx)'
    ),
});

// Reset password form validation schema
export const resetPasswordSchema = z
  .object({
    password: z
      .string({ message: 'Por favor crea una contraseña' })
      .min(1, 'La contraseña es obligatoria')
      .min(8, 'Tu contraseña debe tener al menos 8 caracteres')
      .max(100, 'Tu contraseña es demasiado larga (máximo 100 caracteres)')
      .regex(
        /[a-z]/,
        'Tu contraseña debe incluir al menos una letra minúscula (a-z)'
      )
      .regex(
        /[A-Z]/,
        'Tu contraseña debe incluir al menos una letra mayúscula (A-Z)'
      )
      .regex(/\d/, 'Tu contraseña debe incluir al menos un número (0-9)')
      .regex(
        /[!@#$%^&*(),.?":{}|<>]/,
        'Tu contraseña debe incluir al menos un carácter especial (!@#$%^&*(),.?":{}|<>)'
      ),
    confirmPassword: z
      .string({ message: 'Por favor confirma tu contraseña' })
      .min(1, 'Debes confirmar tu contraseña'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message:
      'Las contraseñas que ingresaste no coinciden. Por favor verifica que sean idénticas.',
    path: ['confirmPassword'],
  });

// Type exports for TypeScript
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// Helper function to format Zod errors
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
export function validateLogin(data: unknown) {
  const result = loginSchema.safeParse(data);

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

export function validateRegister(data: unknown) {
  const result = registerSchema.safeParse(data);

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

export function validateForgotPassword(data: unknown) {
  const result = forgotPasswordSchema.safeParse(data);

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

export function validateResetPassword(data: unknown) {
  const result = resetPasswordSchema.safeParse(data);

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

// Password strength checker utility
export function checkPasswordStrength(password: string): {
  score: number;
  feedback: string[];
  isStrong: boolean;
} {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) score += 1;
  else feedback.push('Agrega al menos 8 caracteres');

  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('Incluye una letra minúscula (a-z)');

  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('Incluye una letra mayúscula (A-Z)');

  if (/\d/.test(password)) score += 1;
  else feedback.push('Incluye un número (0-9)');

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
  else feedback.push('Incluye un carácter especial (!@#$%^&*)');

  return {
    score,
    feedback,
    isStrong: score >= 4,
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
