// Custom error messages for better user experience

export const authErrorMessages = {
  // Login errors
  INVALID_CREDENTIALS:
    'Tu correo o contraseña son incorrectos. Por favor verifica e intenta de nuevo.',
  EMAIL_NOT_FOUND: 'No encontramos una cuenta con este correo electrónico.',
  ACCOUNT_DISABLED:
    'Tu cuenta ha sido deshabilitada. Contacta al administrador.',
  TOO_MANY_ATTEMPTS:
    'Has intentado iniciar sesión demasiadas veces. Espera unos minutos e intenta de nuevo.',

  // Registration errors
  EMAIL_ALREADY_EXISTS:
    'Ya existe una cuenta con este correo electrónico. ¿Quieres iniciar sesión?',
  STUDENT_ID_ALREADY_EXISTS: 'Esta matrícula ya está registrada en el sistema.',
  INVALID_STUDENT_ID:
    'La matrícula que ingresaste no es válida o no está en nuestros registros.',
  WEAK_PASSWORD:
    'Tu contraseña debe ser más segura. Sigue las recomendaciones mostradas.',

  // Network errors
  NETWORK_ERROR:
    'No pudimos conectar con el servidor. Verifica tu conexión a internet.',
  SERVER_ERROR:
    'Estamos experimentando problemas técnicos. Intenta de nuevo en unos minutos.',
  TIMEOUT_ERROR: 'La operación tardó demasiado. Por favor intenta de nuevo.',

  // Validation errors
  REQUIRED_FIELD: 'Este campo es obligatorio',
  INVALID_EMAIL: 'Por favor ingresa un correo electrónico válido',
  INVALID_PHONE: 'Por favor ingresa un teléfono válido de 10 dígitos',

  // Default messages
  DEFAULT_LOGIN_ERROR:
    'Hubo un problema al iniciar sesión. Por favor verifica tus datos e intenta de nuevo.',
  DEFAULT_REGISTER_ERROR:
    'Hubo un problema al crear tu cuenta. Por favor verifica todos los datos e intenta de nuevo.',
  DEFAULT_ERROR: 'Ocurrió un error inesperado. Por favor intenta de nuevo.',
} as const;

export const fieldErrorMessages = {
  firstName: {
    required: 'Por favor ingresa tu nombre',
    tooShort: 'Tu nombre debe tener al menos 2 caracteres',
    tooLong: 'Tu nombre es demasiado largo (máximo 50 caracteres)',
    invalid:
      'Tu nombre solo puede contener letras, espacios, apostrofes y guiones',
  },
  lastName: {
    required: 'Por favor ingresa tus apellidos',
    tooShort: 'Tus apellidos deben tener al menos 2 caracteres',
    tooLong: 'Tus apellidos son demasiado largos (máximo 100 caracteres)',
    invalid:
      'Tus apellidos solo pueden contener letras, espacios, apostrofes y guiones',
  },
  email: {
    required: 'Por favor ingresa tu correo electrónico',
    invalid: 'Por favor ingresa un correo electrónico válido',
    domain: 'Debes usar tu correo institucional de Tecmilenio (@tecmilenio.mx)',
  },
  studentId: {
    required: 'Por favor ingresa tu matrícula',
    invalid:
      'Tu matrícula debe seguir el formato AL seguido de 8 números (ej: AL12345678)',
  },
  phone: {
    required: 'Por favor ingresa tu teléfono',
    invalid: 'Tu teléfono debe tener exactamente 10 dígitos',
  },
  password: {
    required: 'Por favor crea una contraseña',
    tooShort: 'Tu contraseña debe tener al menos 8 caracteres',
    tooLong: 'Tu contraseña es demasiado larga (máximo 100 caracteres)',
    noLowercase:
      'Tu contraseña debe incluir al menos una letra minúscula (a-z)',
    noUppercase:
      'Tu contraseña debe incluir al menos una letra mayúscula (A-Z)',
    noNumber: 'Tu contraseña debe incluir al menos un número (0-9)',
    noSpecial:
      'Tu contraseña debe incluir al menos un carácter especial (!@#$%^&*(),.?":{}|<>)',
  },
  confirmPassword: {
    required: 'Por favor confirma tu contraseña',
    mismatch:
      'Las contraseñas que ingresaste no coinciden. Por favor verifica que sean idénticas.',
  },
  terms: {
    required: 'Debes aceptar los términos y condiciones para continuar',
  },
} as const;

// Helper function to get user-friendly error message
export function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }

  return authErrorMessages.DEFAULT_ERROR;
}

// Helper function to map API error codes to user-friendly messages
export function mapApiError(
  errorCode: string,
  context: 'login' | 'register' = 'login'
): string {
  switch (errorCode) {
    case 'INVALID_CREDENTIALS':
    case 'WRONG_PASSWORD':
    case 'USER_NOT_FOUND':
      return authErrorMessages.INVALID_CREDENTIALS;

    case 'EMAIL_ALREADY_EXISTS':
    case 'USER_EXISTS':
      return authErrorMessages.EMAIL_ALREADY_EXISTS;

    case 'STUDENT_ID_EXISTS':
      return authErrorMessages.STUDENT_ID_ALREADY_EXISTS;

    case 'INVALID_STUDENT_ID':
      return authErrorMessages.INVALID_STUDENT_ID;

    case 'ACCOUNT_DISABLED':
    case 'USER_DISABLED':
      return authErrorMessages.ACCOUNT_DISABLED;

    case 'TOO_MANY_REQUESTS':
    case 'RATE_LIMITED':
      return authErrorMessages.TOO_MANY_ATTEMPTS;

    case 'NETWORK_ERROR':
    case 'CONNECTION_ERROR':
      return authErrorMessages.NETWORK_ERROR;

    case 'SERVER_ERROR':
    case 'INTERNAL_ERROR':
      return authErrorMessages.SERVER_ERROR;

    case 'TIMEOUT':
      return authErrorMessages.TIMEOUT_ERROR;

    default:
      return context === 'login'
        ? authErrorMessages.DEFAULT_LOGIN_ERROR
        : authErrorMessages.DEFAULT_REGISTER_ERROR;
  }
}

// Success messages
export const successMessages = {
  REGISTRATION_SUCCESS:
    '¡Cuenta creada exitosamente! Ahora puedes iniciar sesión.',
  LOGIN_SUCCESS: '¡Bienvenido de vuelta!',
  PASSWORD_CHANGED: 'Tu contraseña ha sido actualizada correctamente.',
  PROFILE_UPDATED: 'Tu perfil ha sido actualizado correctamente.',
} as const;
