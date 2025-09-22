import { apiClient } from './client';

// MFA-related types
export interface MFAStatus {
  mfa_enabled: boolean;
  totp_configured: boolean;
  backup_codes_count: number;
  mfa_required: boolean;
}

export interface TOTPSetupResponse {
  id: string;
  name: string;
  secret_key: string;
  provisioning_uri: string;
  qr_code: string;
  is_active: boolean;
  confirmed: boolean;
  created_at: string;
}

export interface TOTPDevice {
  id: string;
  name: string;
  is_active: boolean;
  confirmed: boolean;
  created_at: string;
  last_used_at: string | null;
}

export interface BackupCode {
  code: string;
  is_used: boolean;
  used_at: string | null;
  created_at: string;
}

export interface MFAEnforcementPolicy {
  role: 'admin' | 'president' | 'student';
  role_display: string;
  mfa_required: boolean;
  grace_period_days: number;
  enforcement_date: string | null;
  enforcement_status: string;
}

// MFA API client
export const mfaApi = {
  // Get MFA status
  async getStatus(): Promise<MFAStatus> {
    return await apiClient.get<MFAStatus>('/api/auth/mfa/status/');
  },

  // TOTP Management
  async setupTOTP(name: string = 'Tecmilenio 2FA'): Promise<TOTPSetupResponse> {
    return await apiClient.post<TOTPSetupResponse>(
      '/api/auth/mfa/totp/setup/',
      {
        name,
      }
    );
  },

  async confirmTOTP(
    token: string
  ): Promise<{ message: string; device: TOTPDevice }> {
    return await apiClient.post<{ message: string; device: TOTPDevice }>(
      '/api/auth/mfa/totp/confirm/',
      { token }
    );
  },

  async verifyTOTP(
    token: string
  ): Promise<{ valid: boolean; message: string }> {
    return await apiClient.post<{ valid: boolean; message: string }>(
      '/api/auth/mfa/totp/verify/',
      { token }
    );
  },

  async disableTOTP(token: string): Promise<{ message: string }> {
    return await apiClient.post<{ message: string }>(
      '/api/auth/mfa/totp/disable/',
      { token }
    );
  },

  // Backup Codes Management
  async getBackupCodes(token: string): Promise<{ codes: BackupCode[] }> {
    return await apiClient.post<{ codes: BackupCode[] }>(
      '/api/auth/mfa/backup-codes/',
      { token }
    );
  },

  async regenerateBackupCodes(token: string): Promise<{ codes: BackupCode[] }> {
    return await apiClient.post<{ codes: BackupCode[] }>(
      '/api/auth/mfa/backup-codes/regenerate/',
      { token }
    );
  },

  async verifyBackupCode(code: string): Promise<{
    valid: boolean;
    message: string;
    remaining_codes?: number;
  }> {
    return await apiClient.post<{
      valid: boolean;
      message: string;
      remaining_codes?: number;
    }>('/api/auth/mfa/backup-codes/verify/', { code });
  },

  // MFA Enforcement Policies (for display purposes)
  async getEnforcementPolicies(): Promise<MFAEnforcementPolicy[]> {
    return await apiClient.get<MFAEnforcementPolicy[]>(
      '/api/auth/mfa/policies/'
    );
  },
};

// Utility functions
export const mfaUtils = {
  // Format MFA status for display
  formatMFAStatus(status: MFAStatus): {
    statusText: string;
    statusColor: string;
    icon: string;
  } {
    if (status.mfa_enabled && status.totp_configured) {
      return {
        statusText: 'Activo',
        statusColor: 'text-green-600',
        icon: 'faCheck',
      };
    } else if (status.mfa_required) {
      return {
        statusText: 'Requerido',
        statusColor: 'text-yellow-600',
        icon: 'faExclamationTriangle',
      };
    } else {
      return {
        statusText: 'Inactivo',
        statusColor: 'text-gray-600',
        icon: 'faTimes',
      };
    }
  },

  // Format backup codes count
  formatBackupCodesCount(count: number): {
    text: string;
    color: string;
    warning: boolean;
  } {
    if (count === 0) {
      return {
        text: 'Sin códigos disponibles',
        color: 'text-red-600',
        warning: true,
      };
    } else if (count <= 2) {
      return {
        text: `${count} código${count === 1 ? '' : 's'} restante${count === 1 ? '' : 's'}`,
        color: 'text-yellow-600',
        warning: true,
      };
    } else {
      return {
        text: `${count} códigos disponibles`,
        color: 'text-green-600',
        warning: false,
      };
    }
  },

  // Format enforcement policy status
  formatEnforcementStatus(policy: MFAEnforcementPolicy): {
    text: string;
    color: string;
    description: string;
  } {
    if (!policy.mfa_required) {
      return {
        text: 'No requerido',
        color: 'text-gray-600',
        description: 'MFA no es obligatorio para este rol',
      };
    }

    if (policy.enforcement_date) {
      const enforcementDate = new Date(policy.enforcement_date);
      const now = new Date();
      const gracePeriodEnd = new Date(
        enforcementDate.getTime() +
          policy.grace_period_days * 24 * 60 * 60 * 1000
      );

      if (now > gracePeriodEnd) {
        return {
          text: 'Obligatorio',
          color: 'text-red-600',
          description: 'MFA es obligatorio para este rol',
        };
      } else {
        const daysLeft = Math.ceil(
          (gracePeriodEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
        );
        return {
          text: `Período de gracia (${daysLeft} días)`,
          color: 'text-yellow-600',
          description: `MFA será obligatorio en ${daysLeft} día${daysLeft === 1 ? '' : 's'}`,
        };
      }
    }

    return {
      text: 'Pendiente',
      color: 'text-blue-600',
      description: 'MFA será requerido próximamente',
    };
  },

  // Validate TOTP token format
  validateTOTPToken(token: string): boolean {
    return /^\d{6}$/.test(token);
  },

  // Validate backup code format
  validateBackupCode(code: string): boolean {
    return /^[A-Z0-9]{8}$/.test(code.toUpperCase());
  },

  // Format device name for display
  formatDeviceName(name: string, createdAt: string): string {
    const date = new Date(createdAt).toLocaleDateString('es-MX');
    return `${name} (${date})`;
  },
};
