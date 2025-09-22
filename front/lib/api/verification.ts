import { apiClient } from './client';

// Types for verification API responses
export interface VerificationStatus {
  email_verified: boolean;
  email_verified_at: string | null;
  phone_verified: boolean;
  phone_verified_at: string | null;
  account_verified: boolean;
  account_verified_at: string | null;
  email_verification_required: boolean;
  phone_verification_required: boolean;
  verification_progress: number;
  is_fully_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface VerificationCheckResponse {
  verification_required: boolean;
  verification_type: string | null;
  message: string;
  user_verification_status: VerificationStatus;
}

// Email verification types
export interface EmailVerificationRequest {
  email?: string;
}

export interface EmailVerificationConfirm {
  token: string;
}

// Phone verification types
export interface PhoneVerificationRequest {
  phone_number?: string;
}

export interface PhoneVerificationConfirm {
  phone_number: string;
  token: string;
}

// Resend verification types
export interface ResendVerificationRequest {
  verification_type: 'email' | 'phone';
  email?: string;
  phone_number?: string;
}

// Verification check types
export interface VerificationCheckRequest {
  operation: string;
}

/**
 * Verification API client
 */
export const verificationApi = {
  /**
   * Get current user's verification status
   */
  async getStatus(): Promise<VerificationStatus> {
    return await apiClient.get<VerificationStatus>(
      '/api/users/verification/status/'
    );
  },

  /**
   * Request email verification
   */
  async requestEmailVerification(
    data: EmailVerificationRequest = {}
  ): Promise<{ message: string }> {
    return await apiClient.post<{ message: string }>(
      '/api/users/verification/email/request/',
      data
    );
  },

  /**
   * Confirm email verification
   */
  async confirmEmailVerification(
    data: EmailVerificationConfirm
  ): Promise<{ message: string }> {
    return await apiClient.post<{ message: string }>(
      '/api/users/verification/email/confirm/',
      data
    );
  },

  /**
   * Request phone verification
   */
  async requestPhoneVerification(
    data: PhoneVerificationRequest = {}
  ): Promise<{ message: string }> {
    return await apiClient.post<{ message: string }>(
      '/api/users/verification/phone/request/',
      data
    );
  },

  /**
   * Confirm phone verification
   */
  async confirmPhoneVerification(
    data: PhoneVerificationConfirm
  ): Promise<{ message: string }> {
    return await apiClient.post<{ message: string }>(
      '/api/users/verification/phone/confirm/',
      data
    );
  },

  /**
   * Check verification requirements for an operation
   */
  async checkVerificationRequirements(
    data: VerificationCheckRequest
  ): Promise<VerificationCheckResponse> {
    return await apiClient.post<VerificationCheckResponse>(
      '/api/users/verification/check/',
      data
    );
  },

  /**
   * Resend verification (email or phone)
   */
  async resendVerification(
    data: ResendVerificationRequest
  ): Promise<{ message: string }> {
    return await apiClient.post<{ message: string }>(
      '/api/users/verification/resend/',
      data
    );
  },
};

export default verificationApi;
