from django.urls import path

from .mfa_views import (BackupCodesRegenerateView, BackupCodesView,
                        BackupCodeVerifyView, MFAEnforcementPolicyListView,
                        MFAEnforcementPolicyUpdateView, MFAStatusView,
                        TOTPConfirmView, TOTPDisableView, TOTPSetupView,
                        TOTPVerifyView)

app_name = 'mfa'

urlpatterns = [
    # MFA Status
    path('status/', MFAStatusView.as_view(), name='mfa_status'),  # GET /api/auth/mfa/status/
    
    # TOTP Management
    path('totp/setup/', TOTPSetupView.as_view(), name='totp_setup'),  # POST /api/auth/mfa/totp/setup/
    path('totp/confirm/', TOTPConfirmView.as_view(), name='totp_confirm'),  # POST /api/auth/mfa/totp/confirm/
    path('totp/verify/', TOTPVerifyView.as_view(), name='totp_verify'),  # POST /api/auth/mfa/totp/verify/
    path('totp/disable/', TOTPDisableView.as_view(), name='totp_disable'),  # POST /api/auth/mfa/totp/disable/
    
    # Backup Codes Management
    path('backup-codes/', BackupCodesView.as_view(), name='backup_codes'),  # POST /api/auth/mfa/backup-codes/
    path('backup-codes/regenerate/', BackupCodesRegenerateView.as_view(), name='backup_codes_regenerate'),  # POST /api/auth/mfa/backup-codes/regenerate/
    path('backup-codes/verify/', BackupCodeVerifyView.as_view(), name='backup_code_verify'),  # POST /api/auth/mfa/backup-codes/verify/
    
    # MFA Enforcement Policies (Admin only)
    path('policies/', MFAEnforcementPolicyListView.as_view(), name='mfa_policies'),  # GET /api/auth/mfa/policies/
    path('policies/update/', MFAEnforcementPolicyUpdateView.as_view(), name='mfa_policy_update'),  # POST /api/auth/mfa/policies/update/
]