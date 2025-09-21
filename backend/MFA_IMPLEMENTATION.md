# Multi-Factor Authentication (MFA) Implementation

This document describes the MFA implementation for the Grupos Estudiantiles backend authentication system.

## Overview

The MFA system provides Time-based One-Time Password (TOTP) authentication with backup codes for account recovery. It includes role-based enforcement policies and comprehensive audit logging.

## Features Implemented

### 1. TOTP Device Management

- **Model**: `TOTPDevice` in `apps.notifications.models`
- **Secret Key Generation**: Automatic secure key generation using `pyotp`
- **QR Code Generation**: Base64-encoded QR codes for easy setup
- **Device Confirmation**: Two-step setup process requiring token verification

### 2. Backup Codes System

- **Model**: `BackupCode` in `apps.notifications.models`
- **Code Generation**: 8-character secure codes (10 codes per user by default)
- **One-time Use**: Codes are marked as used after verification
- **Regeneration**: Users can regenerate all codes with TOTP verification

### 3. MFA Enforcement Policies

- **Model**: `MFAEnforcementPolicy` in `apps.users.models`
- **Role-based Requirements**: Different MFA requirements per user role
- **Grace Periods**: Configurable grace periods for MFA setup
- **Default Policies**:
  - Admins: MFA required (3-day grace period)
  - Presidents: MFA required (7-day grace period)
  - Students: MFA optional (14-day grace period if enabled)

### 4. API Endpoints

#### MFA Status and Management

- `GET /api/auth/mfa/status/` - Get user's MFA status
- `POST /api/auth/mfa/totp/setup/` - Initialize TOTP setup
- `POST /api/auth/mfa/totp/confirm/` - Confirm TOTP setup
- `POST /api/auth/mfa/totp/verify/` - Verify TOTP token
- `POST /api/auth/mfa/totp/disable/` - Disable TOTP

#### Backup Codes Management

- `POST /api/auth/mfa/backup-codes/` - Get backup codes (requires TOTP)
- `POST /api/auth/mfa/backup-codes/regenerate/` - Regenerate backup codes
- `POST /api/auth/mfa/backup-codes/verify/` - Verify backup code

#### Admin Endpoints

- `GET /api/auth/mfa/policies/` - List MFA enforcement policies
- `POST /api/auth/mfa/policies/update/` - Update MFA enforcement policy

## Security Features

### 1. Rate Limiting

- All MFA endpoints use security-focused throttling
- Progressive delays for failed attempts
- IP-based and user-based rate limiting

### 2. Audit Logging

- Comprehensive logging of all MFA events
- Security event tracking for failed attempts
- Admin action logging for policy changes

### 3. Token Security

- TOTP tokens have 30-second validity windows
- 1-step tolerance for clock drift
- Backup codes are single-use only

## Usage Examples

### 1. Setup TOTP for a User

```python
# 1. Initialize TOTP setup
POST /api/auth/mfa/totp/setup/
{
    "name": "My Phone"
}

# Response includes QR code and secret key
{
    "secret_key": "JBSWY3DPEHPK3PXP",
    "provisioning_uri": "otpauth://totp/...",
    "qr_code": "iVBORw0KGgoAAAANSUhEUgAA...",
    "device": {...}
}

# 2. User scans QR code with authenticator app

# 3. Confirm setup with generated token
POST /api/auth/mfa/totp/confirm/
{
    "token": "123456"
}

# Response includes backup codes
{
    "message": "TOTP configurado exitosamente",
    "backup_codes": ["A1B2C3D4", "E5F6G7H8", ...]
}
```

### 2. Verify MFA Token

```python
POST /api/auth/mfa/totp/verify/
{
    "token": "123456"
}

# Response
{
    "valid": true,
    "message": "Token TOTP válido"
}
```

### 3. Use Backup Code

```python
POST /api/auth/mfa/backup-codes/verify/
{
    "code": "A1B2C3D4"
}

# Response
{
    "valid": true,
    "message": "Código de respaldo válido",
    "remaining_codes": 9
}
```

## Database Models

All MFA models are located in `apps.users.models` for better organization and context.

### TOTPDevice

```python
class TOTPDevice(models.Model):
    user = models.OneToOneField('CustomUser', related_name='totp_device')
    name = models.CharField(max_length=100)
    secret_key = models.CharField(max_length=32, unique=True)
    is_active = models.BooleanField(default=False)
    confirmed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    last_used_at = models.DateTimeField(null=True, blank=True)
```

### BackupCode

```python
class BackupCode(models.Model):
    user = models.ForeignKey('CustomUser', related_name='backup_codes')
    code = models.CharField(max_length=16, unique=True)
    is_used = models.BooleanField(default=False)
    used_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

### MFAEnforcementPolicy

```python
class MFAEnforcementPolicy(models.Model):
    role = models.CharField(max_length=20, choices=USER_ROLES, unique=True)
    mfa_required = models.BooleanField(default=False)
    grace_period_days = models.IntegerField(default=7)
    enforcement_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

## Admin Interface

### Django Admin Integration

- **TOTPDevice Admin**: View and manage TOTP devices
- **BackupCode Admin**: View backup codes (with security masking)
- **MFAEnforcementPolicy Admin**: Manage MFA policies with bulk actions

### Management Commands

```bash
# Setup default MFA policies
python manage.py setup_mfa_policies

# Force update existing policies
python manage.py setup_mfa_policies --force
```

## Testing

The implementation includes comprehensive tests covering:

- MFA status endpoints
- TOTP setup and verification
- Backup code generation and verification
- MFA enforcement policies
- Admin-only endpoints

Run tests with:

```bash
python manage.py test apps.users.test_mfa
```

## Dependencies

- `pyotp`: TOTP implementation
- `qrcode`: QR code generation
- `secrets`: Secure random code generation

## Security Considerations

1. **Secret Key Storage**: TOTP secret keys are stored securely in the database
2. **QR Code Handling**: QR codes are generated on-demand and not stored
3. **Backup Code Security**: Codes are hashed and single-use
4. **Rate Limiting**: All endpoints have appropriate throttling
5. **Audit Logging**: All MFA events are logged for security monitoring

## Migration Notes

### Removed Legacy Code

- **Old TOTP ViewSet**: Removed `TOTPDeviceViewSet` from `apps.notifications.views`
- **Old TOTP Serializers**: Removed TOTP-related serializers from `apps.notifications.serializers`
- **Old TOTP URLs**: Removed `/api/notifications/totp/` endpoints
- **Reason**: Consolidated all MFA functionality into the users app for better organization and security

### Model Migration

- **TOTPDevice Model**: Moved from `apps.notifications.models` to `apps.users.models`
- **BackupCode Model**: Moved from `apps.notifications.models` to `apps.users.models`
- **Admin Interface**: Moved TOTP and BackupCode admin classes to `apps.users.admin`
- **Imports Updated**: All MFA views, serializers, and tests now import from `apps.users.models`
- **Reason**: Keep all MFA-related code in the same app context for better maintainability

### Current MFA Endpoints

All MFA functionality is now available under `/api/auth/mfa/` with proper authentication, authorization, and audit logging.

## Future Enhancements

1. **SMS Backup**: SMS-based backup authentication
2. **Hardware Tokens**: Support for FIDO2/WebAuthn
3. **Risk-based Authentication**: Adaptive MFA based on login patterns
4. **Mobile Push**: Push notification-based authentication
