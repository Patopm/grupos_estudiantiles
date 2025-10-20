// Verification components exports

// Re-export verification API types
export type {
  EmailVerificationConfirm as EmailVerificationConfirmData,
  EmailVerificationRequest as EmailVerificationRequestData,
  PhoneVerificationConfirm as PhoneVerificationConfirmData,
  PhoneVerificationRequest as PhoneVerificationRequestData,
  ResendVerificationRequest,
  VerificationCheckRequest,
  VerificationCheckResponse,
  VerificationStatus,
} from "../../../lib/api/verification";
export { default as EmailVerificationConfirm } from "../EmailVerificationConfirm";
export { default as EmailVerificationRequest } from "../EmailVerificationRequest";
export { default as PhoneVerificationConfirm } from "../PhoneVerificationConfirm";
export { default as PhoneVerificationRequest } from "../PhoneVerificationRequest";
export { default as VerificationFlow } from "../VerificationFlow";
export { default as VerificationGuard } from "../VerificationGuard";
export { default as VerificationStatusIndicator } from "../VerificationStatusIndicator";
