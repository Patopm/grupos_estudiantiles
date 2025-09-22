/**
 * Error handling utilities index
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
 */

// Types
export * from './types';

// Error handlers and factories
export * from './handlers';

// Countdown utilities
export * from './countdown';

// Security management
export * from './security';

// Re-export commonly used utilities
export { useAuthError } from '../../hooks/useAuthError';
export { default as EnhancedErrorDisplay } from '../../components/auth/EnhancedErrorDisplay';
export { default as AuthErrorBoundary } from '../../components/auth/AuthErrorBoundary';
