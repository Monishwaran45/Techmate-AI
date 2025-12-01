# Security Headers Configuration

This document describes the security headers implemented in the TechMate AI backend application.

## Overview

The application uses [Helmet](https://helmetjs.github.io/) middleware to set various HTTP security headers that help protect against common web vulnerabilities.

## Implemented Security Headers

### 1. Content Security Policy (CSP)

Prevents XSS attacks by controlling which resources can be loaded.

```typescript
contentSecurityPolicy: {
  directives: {
    defaultSrc: ["'self'"],                    // Only load resources from same origin
    styleSrc: ["'self'", "'unsafe-inline'"],   // Allow inline styles (for UI libraries)
    scriptSrc: ["'self'"],                     // Only execute scripts from same origin
    imgSrc: ["'self'", 'data:', 'https:'],     // Allow images from same origin, data URIs, and HTTPS
    connectSrc: ["'self'"],                    // Only connect to same origin APIs
    fontSrc: ["'self'"],                       // Only load fonts from same origin
    objectSrc: ["'none'"],                     // Disallow plugins (Flash, Java, etc.)
    mediaSrc: ["'self'"],                      // Only load media from same origin
    frameSrc: ["'none'"],                      // Disallow embedding in frames
    baseUri: ["'self'"],                       // Restrict base tag URLs
    formAction: ["'self'"],                    // Restrict form submission targets
    frameAncestors: ["'none'"],                // Prevent clickjacking
    upgradeInsecureRequests: []                // Upgrade HTTP to HTTPS in production
  }
}
```

### 2. HTTP Strict Transport Security (HSTS)

Forces browsers to use HTTPS connections only.

```typescript
hsts: {
  maxAge: 31536000,        // 1 year in seconds
  includeSubDomains: true, // Apply to all subdomains
  preload: true            // Allow inclusion in browser preload lists
}
```

**Note:** HSTS is only effective when the application is served over HTTPS.

### 3. X-Content-Type-Options

Prevents MIME type sniffing attacks.

```typescript
noSniff: true  // Sets X-Content-Type-Options: nosniff
```

### 4. X-Frame-Options

Prevents clickjacking attacks by controlling iframe embedding.

```typescript
frameguard: {
  action: 'deny'  // Completely disallow embedding in frames
}
```

### 5. X-XSS-Protection

Enables browser XSS filtering (legacy browsers).

```typescript
xssFilter: true  // Sets X-XSS-Protection: 1; mode=block
```

### 6. Referrer-Policy

Controls how much referrer information is sent with requests.

```typescript
referrerPolicy: {
  policy: 'strict-origin-when-cross-origin'
}
```

This policy:
- Sends full URL for same-origin requests
- Sends only origin for cross-origin HTTPS requests
- Sends nothing for HTTPS → HTTP requests

### 7. Cross-Origin Policies

Controls cross-origin resource sharing and embedding.

```typescript
crossOriginEmbedderPolicy: false,                              // Disabled for compatibility
crossOriginResourcePolicy: { policy: 'cross-origin' },         // Allow cross-origin resources
crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' } // Isolate browsing context
```

### 8. Hide X-Powered-By

Removes the X-Powered-By header to avoid revealing technology stack.

```typescript
hidePoweredBy: true
```

### 9. Permitted Cross-Domain Policies

Controls Adobe Flash and PDF cross-domain policies.

```typescript
permittedCrossDomainPolicies: {
  permittedPolicies: 'none'  // Disallow all cross-domain policies
}
```

## CORS Configuration

The application implements strict CORS policies:

### Development Mode
- Allows requests without origin header (for tools like Postman)
- Allows localhost origins: `http://localhost:5173`, `http://localhost:3000`

### Production Mode
- Requires origin header for all requests
- Only allows origins specified in `FRONTEND_URL` environment variable
- Supports multiple origins (comma-separated)

### CORS Settings

```typescript
{
  origin: (origin, callback) => { /* Dynamic validation */ },
  credentials: true,                                    // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  exposedHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset'
  ],
  maxAge: 86400,                // Cache preflight for 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204
}
```

## Environment Configuration

### Required Environment Variables

```bash
# Frontend URLs (comma-separated for multiple origins)
FRONTEND_URL=https://app.techmate.ai,https://www.techmate.ai

# Node environment
NODE_ENV=production
```

### Development Setup

For local development, the default configuration allows:
- `http://localhost:5173` (Vite dev server)
- `http://localhost:3000` (Alternative port)

## Security Best Practices

### 1. Always Use HTTPS in Production
HSTS and CSP upgrade directives only work over HTTPS.

### 2. Keep Helmet Updated
Regularly update the helmet package to get the latest security improvements:
```bash
npm update helmet
```

### 3. Monitor CSP Violations
Consider implementing CSP violation reporting:
```typescript
contentSecurityPolicy: {
  directives: {
    // ... other directives
    reportUri: '/api/csp-report'
  }
}
```

### 4. Test Security Headers
Use online tools to verify headers:
- [Security Headers](https://securityheaders.com/)
- [Mozilla Observatory](https://observatory.mozilla.org/)

### 5. Review CORS Origins
Regularly audit the allowed origins in production to ensure only trusted domains are whitelisted.

## Testing Security Headers

### Manual Testing

Test headers using curl:
```bash
curl -I https://api.techmate.ai/api/health
```

Expected headers:
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'; ...
```

### Automated Testing

Consider adding integration tests to verify security headers:

```typescript
describe('Security Headers', () => {
  it('should set security headers', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/health')
      .expect(200);
    
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBe('DENY');
    expect(response.headers['strict-transport-security']).toBeDefined();
  });
});
```

## Troubleshooting

### Issue: CSP Blocking Resources

If legitimate resources are blocked by CSP:
1. Check browser console for CSP violation reports
2. Update the appropriate CSP directive
3. Avoid using `'unsafe-inline'` or `'unsafe-eval'` when possible

### Issue: CORS Errors

If CORS errors occur:
1. Verify the origin is in the allowed list
2. Check that credentials are properly configured
3. Ensure preflight requests (OPTIONS) are handled correctly

### Issue: HSTS Not Working

HSTS requires:
1. Application served over HTTPS
2. Valid SSL certificate
3. First visit must be over HTTPS (or use preload list)

## References

- [Helmet Documentation](https://helmetjs.github.io/)
- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
- [Content Security Policy Reference](https://content-security-policy.com/)
