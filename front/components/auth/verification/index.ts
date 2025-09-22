// Verification components exports
export { default as EmailVerificationRequest } from '../EmailVerificationRequest';
export { default as EmailVerificationConfirm } from '../EmailVerificationConfirm';
export { default as PhoneVerificationRequest } from '../PhoneVerificationRequest';
export { default as PhoneVerificationConfirm } from '../PhoneVerificationConfirm';
export { default as VerificationStatusIndicator } from '../VerificationStatusIndicator';
export { default as VerificationFlow } from '../VerificationFlow';
export { default as VerificationGuard } from '../VerificationGuard';

// Re-export verification API types
export type {
  VerificationStatus,
  VerificationCheckResponse,
  EmailVerificationRequest as EmailVerificationRequestData,
  EmailVerificationConfirm as EmailVerificationConfirmData,
  PhoneVerificationRequest as PhoneVerificationRequestData,
  PhoneVerificationConfirm as PhoneVerificationConfirmData,
  ResendVerificationRequest,
  VerificationCheckRequest,
} from '../../../lib/api/verification';
