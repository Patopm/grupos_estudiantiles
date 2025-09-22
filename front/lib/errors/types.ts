/**
 * Enhanced error types for authentication flows
 * Requirement 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
 */

export interface AuthError {
  type: AuthErrorType;
  message: string;
  code?: string;
  field?: string;
  retryable: boolean;
  retryAfter?: number;
  details?: Record<string, unknown>;
  timestamp: Date;
  correlationId?: string;
}

export type AuthErrorType =
  | 'network'
  | 'authentication'
  | 'validation'
  | 'authorization'
  | 'server'
  | 'rate_limit'
  | 'mfa_required'
  | 'mfa_invalid'
  | 'verification_required'
  | 'verification_invalid'
  | 'token_expired'
  | 'session_timeout'
  | 'security_violation';

export interface NetworkError extends AuthError {
  type: 'network';
  retryable: true;
  retryCount?: number;
  maxRetries?: number;
}

export interface RateLimitError extends AuthError {
  type: 'rate_limit';
  retryable: true;
  retryAfter: number;
  remainingAttempts?: number;
  resetTime?: Date;
}

export interface MFAError extends AuthError {
  type: 'mfa_required' | 'mfa_invalid';
  mfaType?: 'totp' | 'backup_code' | 'sms';
  attemptsRemaining?: number;
  backupCodesRemaining?: number;
}

export interface VerificationError extends AuthError {
  type: 'verification_required' | 'verification_invalid';
  verificationType?: 'email' | 'phone';
  canResend?: boolean;
  resendAvailableAt?: Date;
}

export interface ValidationError extends AuthError {
  type: 'validation';
  fieldErrors?: Record<string, string[]>;
}

export interface SecurityError extends AuthError {
  type: 'security_violation';
  violationType?:
    | 'suspicious_activity'
    | 'multiple_failures'
    | 'location_change';
  securityLevel?: 'low' | 'medium' | 'high' | 'critical';
  recommendedActions?: string[];
}

// Error severity levels
export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface ErrorContext {
  userAgent?: string;
  ipAddress?: string;
  timestamp: Date;
  sessionId?: string;
  userId?: string;
  action?: string;
  additionalData?: Record<string, unknown>;
}

// Error recovery strategies
export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitter: boolean;
}

export interface ErrorRecoveryAction {
  type: 'retry' | 'redirect' | 'refresh' | 'logout' | 'contact_support';
  label: string;
  action: () => void | Promise<void>;
  primary?: boolean;
}

// Progressive security measures
export interface SecurityMeasure {
  level: number;
  name: string;
  description: string;
  active: boolean;
  triggeredAt?: Date;
  expiresAt?: Date;
}

export interface ProgressiveSecurityState {
  currentLevel: number;
  measures: SecurityMeasure[];
  nextEscalation?: Date;
  canReset: boolean;
  resetAvailableAt?: Date;
}
