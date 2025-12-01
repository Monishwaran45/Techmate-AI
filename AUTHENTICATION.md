# TechMate AI - Authentication & Authorization

## Overview

Complete authentication and authorization system with JWT tokens, two-factor authentication, role-based access control, and comprehensive property-based testing.

## Features Implemented

### Task 3.1 - Authentication Service ✅
- **Password Hashing**: bcrypt with salt rounds for secure password storage
- **User Registration**: Creates user, profile, and free subscription automatically
- **Login**: Email/password authentication with JWT token generation
- **Token Refresh**: Refresh token mechanism for seamless re-authentication
- **Token Generation**: Access tokens (1h) and refresh tokens (7d)

### Task 3.2 - Property Test: Registration ✅
**Property 1: Registration creates valid accounts**
- Tests that any valid registration credentials create a persisted user
- Verifies password is hashed (not stored in plain text)
- Confirms profile and subscription are created
- Validates tokens are generated
- Runs 100 iterations with random data

### Task 3.3 - Property Test: Login ✅
**Property 2: Valid credentials produce valid tokens**
- Tests that valid credentials always produce valid JWT tokens
- Verifies invalid passwords are always rejected
- Tests across 100+ random credential combinations
- Ensures consistent authentication behavior

### Task 3.4 - JWT Strategy and Guards ✅
- **JWT Strategy**: Passport strategy for token validation
- **JWT Auth Guard**: Protects routes requiring authentication
- **Roles Guard**: Role-based authorization (student/developer/professional)
- **Decorators**: @Public(), @Roles(), @CurrentUser()
- **Token Expiration**: Automatic handling of expired tokens

### Task 3.5 - Property Test: Token Expiration ✅
**Property 4: Expired tokens are rejected**
- Tests that expired tokens are always rejected
- Verifies invalid tokens throw appropriate errors
- Runs 50 iterations with various token scenarios

### Task 3.6 - Two-Factor Authentication ✅
- **TOTP Generation**: Time-based one-time passwords using otplib
- **QR Code**: Generates QR codes for authenticator apps
- **2FA Setup**: Enable/verify/disable 2FA flow
- **Login Flow**: Temporary tokens for 2FA verification
- **Enforcement**: Requires 2FA verification when enabled

### Task 3.7 - Property Test: 2FA ✅
**Property 5: 2FA enforcement**
- Tests that 2FA-enabled users require secondary verification
- Verifies users without 2FA can login normally
- Runs 50 iterations for each scenario

### Task 3.8 - Profile Management ✅
- **Get Profile**: Retrieve user profile information
- **Update Profile**: Partial updates with field validation
- **Preferences**: Theme, notifications, language settings
- **Skills & Goals**: Array-based tracking
- **Experience Level**: Beginner to expert tracking

### Task 3.9 - Property Test: Profile Updates ✅
**Property 3: Profile update round-trip**
- Tests that profile updates preserve data correctly
- Verifies partial updates merge with existing data
- Tests preferences updates independently
- Runs 100+ iterations with random profile data

## API Endpoints

### Public Endpoints
```
POST /api/auth/register       - Register new user
POST /api/auth/login          - Login user
POST /api/auth/refresh        - Refresh access token
POST /api/auth/2fa/verify     - Verify 2FA during login
```

### Protected Endpoints (Require JWT)
```
GET  /api/auth/me             - Get current user
GET  /api/auth/profile        - Get user profile
PUT  /api/auth/profile        - Update user profile
POST /api/auth/2fa/enable     - Enable 2FA
POST /api/auth/2fa/verify-setup - Verify 2FA setup
DELETE /api/auth/2fa/disable  - Disable 2FA
```

## Authentication Flow

### Standard Login
1. User submits email/password
2. System validates credentials
3. If valid, generates JWT tokens
4. Returns access token + refresh token

### 2FA Login
1. User submits email/password
2. System validates credentials
3. If 2FA enabled, returns temporary token
4. User submits 2FA code + temp token
5. System validates 2FA code
6. Returns full JWT tokens

### Token Refresh
1. Client sends refresh token
2. System validates refresh token
3. Generates new access token
4. Returns new tokens

## Security Features

- **Password Hashing**: bcrypt with 10 salt rounds
- **JWT Tokens**: Signed with secret key
- **Token Expiration**: Access tokens expire after 1 hour
- **Refresh Tokens**: Long-lived (7 days) for seamless re-auth
- **2FA Support**: TOTP-based two-factor authentication
- **Role-Based Access**: Guards for role-specific endpoints
- **Input Validation**: class-validator on all DTOs

## Property-Based Testing

All authentication features are tested with property-based tests using fast-check:

- **100+ iterations** per property test
- **Random data generation** for comprehensive coverage
- **Edge case discovery** through fuzzing
- **Correctness guarantees** for critical auth flows

## Usage Examples

### Register
```typescript
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe",
  "role": "developer"
}
```

### Login
```typescript
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

### Update Profile
```typescript
PUT /api/auth/profile
Authorization: Bearer <access_token>
{
  "skills": ["JavaScript", "TypeScript", "React"],
  "goals": ["Learn Node.js", "Build a SaaS"],
  "preferences": {
    "theme": "dark",
    "notifications": true
  }
}
```

### Enable 2FA
```typescript
POST /api/auth/2fa/enable
Authorization: Bearer <access_token>

// Returns QR code and secret
```

## Next Steps

The authentication system is complete and ready for:
1. Integration with other modules
2. Frontend implementation
3. Production deployment with proper secrets
4. Rate limiting and brute force protection
5. Session management and logout

## Dependencies

- `@nestjs/jwt` - JWT token generation
- `@nestjs/passport` - Authentication strategies
- `passport-jwt` - JWT strategy
- `bcrypt` - Password hashing
- `otplib` - TOTP generation
- `qrcode` - QR code generation
- `fast-check` - Property-based testing
