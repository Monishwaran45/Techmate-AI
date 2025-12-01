# Security Hardening Implementation

This document outlines the security measures implemented in the TechMate AI backend.

## Overview

The backend has been hardened with comprehensive security measures including rate limiting, security headers, and input validation to protect against common web vulnerabilities.

## 1. Rate Limiting

### Implementation
- **Library**: `@nestjs/throttler`
- **Storage**: In-memory (can be configured to use Redis for distributed systems)
- **Global Guard**: `CustomThrottlerGuard` applied to all routes

### Configuration
- **Default Limit**: 100 requests per hour (free tier)
- **TTL**: 3600000ms (1 hour)
- **Tracking**: By user ID (if authenticated) or IP address

### Custom Rate Limits
Rate limits can be customized per endpoint using the `@Throttle()` decorator:

```typescript
import { Throttle, ThrottleConfig } from './common/decorators/throttle.decorator';

@Throttle(ThrottleConfig.AI_ENDPOINT) // 20 requests per hour
async generateRoadmap() { ... }
```

### Predefined Configurations
- `DEFAULT`: 100 requests/hour - Standard API endpoints
- `AI_ENDPOINT`: 20 requests/hour - AI-powered endpoints
- `AUTH`: 5 requests/15min - Authentication endpoints
- `UPLOAD`: 10 requests/hour - File upload endpoints
- `PREMIUM`: 1000 requests/hour - Premium tier users

### Rate Limit Headers
All responses include rate limit information:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Time when the limit resets (ISO format)

## 2. Security Headers

### Implementation
- **Library**: `helmet`
- **Applied**: Globally in `main.ts`

### Headers Configured

#### Content Security Policy (CSP)
```javascript
{
  defaultSrc: ["'self'"],
  styleSrc: ["'self'", "'unsafe-inline'"],
  scriptSrc: ["'self'"],
  imgSrc: ["'self'", 'data:', 'https:'],
  connectSrc: ["'self'"],
  fontSrc: ["'self'"],
  objectSrc: ["'none'"],
  mediaSrc: ["'self'"],
  frameSrc: ["'none'"]
}
```

#### Other Security Headers
- **X-Content-Type-Options**: nosniff
- **X-Frame-Options**: DENY
- **X-XSS-Protection**: 1; mode=block
- **Strict-Transport-Security**: max-age=31536000; includeSubDomains
- **Referrer-Policy**: no-referrer

### CORS Configuration
- **Allowed Origins**: Configurable via `FRONTEND_URL` environment variable
- **Credentials**: Enabled
- **Methods**: GET, POST, PUT, PATCH, DELETE, OPTIONS
- **Allowed Headers**: Content-Type, Authorization, X-Requested-With
- **Exposed Headers**: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
- **Max Age**: 86400 seconds (24 hours)

## 3. Input Validation

### Global Validation Pipe
Configured in `main.ts`:
```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,              // Strip unknown properties
    transform: true,              // Auto-transform to DTO types
    forbidNonWhitelisted: true,   // Throw error on unknown properties
  })
);
```

### DTO Validation Rules

#### String Fields
- **MaxLength**: Prevents buffer overflow attacks
- **MinLength**: Ensures meaningful input
- **Transform**: Trims whitespace and normalizes input
- **Matches**: Validates format (e.g., password complexity)

Example:
```typescript
@IsString()
@MinLength(1)
@MaxLength(200)
@Transform(({ value }) => value?.trim())
title: string;
```

#### Email Fields
```typescript
@IsEmail({}, { message: 'Invalid email format' })
@MaxLength(255)
@Transform(({ value }) => value?.toLowerCase().trim())
email: string;
```

#### Password Fields
```typescript
@MinLength(8)
@MaxLength(128)
@Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, {
  message: 'Password must contain uppercase, lowercase, number, and special character'
})
password: string;
```

#### Array Fields
```typescript
@IsArray()
@ArrayMinSize(1)
@ArrayMaxSize(10)
@IsString({ each: true })
@MaxLength(50, { each: true })
tags?: string[];
```

### File Upload Validation

#### FileValidationPipe
Validates uploaded files for:
- **File Size**: Configurable maximum size
- **MIME Type**: Whitelist of allowed types
- **File Extension**: Whitelist of allowed extensions
- **Filename**: Prevents path traversal attacks

#### Predefined Configurations
```typescript
// Resume uploads
ResumeFileValidation: {
  maxSize: 5MB,
  allowedTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  allowedExtensions: ['pdf', 'doc', 'docx']
}

// Image uploads
ImageFileValidation: {
  maxSize: 2MB,
  allowedTypes: ['image/jpeg', 'image/png', 'image/gif'],
  allowedExtensions: ['jpg', 'jpeg', 'png', 'gif']
}
```

Usage:
```typescript
@Post('resume/upload')
@UseInterceptors(FileInterceptor('file'))
async uploadResume(
  @UploadedFile(ResumeFileValidation) file: Express.Multer.File,
) { ... }
```

### Custom Validators

#### IsSanitizedString
Validates and sanitizes string inputs by:
- Checking maximum length
- Detecting SQL injection patterns
- Detecting XSS patterns
- Removing dangerous characters

#### IsValidFile
Validates file uploads by:
- Checking file size limits
- Validating file extensions
- Validating MIME types
- Preventing path traversal

### Sanitization Functions

#### sanitizeHtml(html: string)
Removes dangerous HTML:
- `<script>` tags
- `<iframe>` tags
- Event handlers (onclick, onerror, etc.)
- javascript: protocol
- data: protocol

#### sanitizeInput(input: string)
Cleans user input:
- Trims whitespace
- Removes control characters
- Normalizes whitespace

## Security Best Practices

### For Developers

1. **Always validate input** - Use validation decorators on all DTO properties
2. **Set maximum lengths** - Prevent buffer overflow attacks
3. **Sanitize HTML content** - Use `sanitizeHtml()` for user-generated HTML
4. **Validate file uploads** - Use `FileValidationPipe` for all file uploads
5. **Use enums** - For fixed value sets to prevent invalid values
6. **Transform input** - Normalize data (trim, lowercase, etc.)
7. **Limit array sizes** - Use `ArrayMaxSize` to prevent DoS attacks
8. **Validate dates** - Use `IsDateString` for date inputs

### For Operations

1. **Configure CORS** - Set `FRONTEND_URL` environment variable
2. **Enable HTTPS** - Always use HTTPS in production
3. **Monitor rate limits** - Watch for rate limit violations
4. **Review logs** - Check for suspicious patterns
5. **Update dependencies** - Keep security patches current
6. **Use environment variables** - Never hardcode secrets

## Testing Security

### Rate Limiting
```bash
# Test rate limiting
for i in {1..101}; do
  curl http://localhost:3000/api/health
done
# Should return 429 Too Many Requests after 100 requests
```

### Input Validation
```bash
# Test SQL injection prevention
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"'; DROP TABLE users;--","name":"Test"}'
# Should return 400 Bad Request
```

### File Upload Validation
```bash
# Test file size limit
curl -X POST http://localhost:3000/api/jobs/resume/upload \
  -F "file=@large_file.pdf"
# Should return 400 Bad Request if file > 5MB
```

## Monitoring and Alerts

### Metrics to Monitor
- Rate limit violations per endpoint
- Failed authentication attempts
- Invalid input attempts
- File upload rejections
- CORS violations

### Recommended Alerts
- High rate of 429 responses (potential DoS)
- High rate of 400 responses (potential attack)
- Multiple failed login attempts (brute force)
- Large file upload attempts (resource exhaustion)

## Future Enhancements

1. **Redis-based rate limiting** - For distributed systems
2. **IP-based blocking** - Automatic blocking of malicious IPs
3. **Request signing** - HMAC-based request authentication
4. **API key management** - For third-party integrations
5. **Advanced WAF rules** - Web Application Firewall integration
6. **Audit logging** - Comprehensive security event logging

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NestJS Security](https://docs.nestjs.com/security/helmet)
- [Helmet.js](https://helmetjs.github.io/)
- [class-validator](https://github.com/typestack/class-validator)
