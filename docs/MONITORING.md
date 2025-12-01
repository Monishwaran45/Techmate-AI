# Monitoring and Logging Guide

This document describes the monitoring, logging, and alerting setup for the TechMate AI platform.

## Overview

The platform uses a comprehensive monitoring stack:
- **Sentry**: Error tracking and performance monitoring
- **Structured Logging**: JSON-formatted logs for easy parsing
- **Health Checks**: Kubernetes-style readiness and liveness probes
- **Alerting**: Slack and email notifications for critical issues

## Sentry Integration

### Setup

1. Create a Sentry project at https://sentry.io
2. Copy the DSN from project settings
3. Add to environment variables:
   ```bash
   SENTRY_DSN=https://your-key@sentry.io/project-id
   ```

### Features

**Error Tracking**
- Automatic capture of unhandled exceptions
- Stack traces with source maps
- User context (ID, email)
- Request context (URL, method, headers)
- Custom tags and metadata

**Performance Monitoring**
- Transaction tracing for API endpoints
- Database query performance
- External API call timing
- Memory and CPU profiling

**Configuration**

```typescript
// apps/backend/src/main.ts
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // 10% of transactions
  profilesSampleRate: 0.1, // 10% of transactions
});
```

### Usage

Errors are automatically captured by the global exception filter. For manual error reporting:

```typescript
import * as Sentry from '@sentry/node';

try {
  // risky operation
} catch (error) {
  Sentry.captureException(error, {
    tags: { feature: 'learning' },
    extra: { userId: user.id },
  });
}
```

## Structured Logging

### Log Format

All logs are output in JSON format for easy parsing by log aggregation tools:

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "info",
  "message": "Request completed",
  "requestId": "uuid-here",
  "method": "GET",
  "url": "/api/learning/roadmap",
  "statusCode": 200,
  "duration": 145,
  "userId": "user-123"
}
```

### Log Levels

- **error**: Errors that need immediate attention
- **warn**: Warning conditions that should be reviewed
- **info**: General informational messages
- **debug**: Detailed debugging information (dev only)
- **verbose**: Very detailed information (dev only)

### Usage

```typescript
import { LoggerService } from './common/logger/logger.service';

constructor(private logger: LoggerService) {}

// Simple log
this.logger.log('User logged in');

// Log with context
this.logger.log('Roadmap generated', {
  userId: user.id,
  roadmapId: roadmap.id,
  duration: 1500,
});

// Error log
this.logger.error('Failed to generate roadmap', error.stack, {
  userId: user.id,
  error: error.message,
});
```

### Request Logging

The `LoggingMiddleware` automatically logs all HTTP requests:
- Request ID (UUID)
- Method and URL
- User agent and IP
- Response status code
- Request duration

## Health Checks

### Endpoints

**Comprehensive Health Check**
```
GET /health
```

Checks:
- Database connectivity
- Memory usage (heap and RSS)
- Disk space
- Redis connectivity (if configured)

Response:
```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "memory_heap": { "status": "up" },
    "memory_rss": { "status": "up" },
    "storage": { "status": "up" }
  },
  "error": {},
  "details": {
    "database": { "status": "up" },
    "memory_heap": { "status": "up", "used": 150000000, "limit": 314572800 },
    "memory_rss": { "status": "up", "used": 200000000, "limit": 314572800 },
    "storage": { "status": "up", "used": 0.45, "threshold": 0.9 }
  }
}
```

**Readiness Probe**
```
GET /health/ready
```

Returns 200 if the application is ready to accept traffic.

**Liveness Probe**
```
GET /health/live
```

Returns 200 if the application is running.

### Kubernetes Configuration

```yaml
livenessProbe:
  httpGet:
    path: /health/live
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /health/ready
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 5
```

## Alerting

### Slack Notifications

Configure Slack webhook for critical alerts:

```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

Alerts are sent for:
- Production deployment failures
- Smoke test failures
- Critical errors (5xx responses)
- Health check failures

### Email Alerts

Configure email recipients:

```bash
ALERT_EMAIL_RECIPIENTS=admin@techmate.ai,ops@techmate.ai
```

## Metrics and Dashboards

### Key Metrics to Monitor

**Application Metrics**
- Request rate (requests/second)
- Error rate (errors/second)
- Response time (p50, p95, p99)
- Active users
- API endpoint usage

**Infrastructure Metrics**
- CPU usage
- Memory usage
- Disk usage
- Network I/O
- Database connections

**Business Metrics**
- User registrations
- Roadmaps generated
- Projects created
- Interview sessions
- Subscription conversions

### Sentry Dashboards

1. **Errors Dashboard**
   - Error frequency over time
   - Top errors by count
   - Errors by endpoint
   - Errors by user

2. **Performance Dashboard**
   - Transaction throughput
   - Average response time
   - Slowest transactions
   - Database query performance

3. **User Impact Dashboard**
   - Users affected by errors
   - User sessions with errors
   - Error-free sessions percentage

## Log Aggregation

### Cloud Provider Logs

**Google Cloud Run**
```bash
gcloud logging read "resource.type=cloud_run_revision" --limit 100
```

**Vercel**
- View logs in Vercel dashboard
- Real-time log streaming
- Log search and filtering

### Local Development

Logs are output to stdout in JSON format. Use tools like `jq` for parsing:

```bash
# View logs
npm run start:dev | jq

# Filter by level
npm run start:dev | jq 'select(.level == "error")'

# Filter by user
npm run start:dev | jq 'select(.userId == "user-123")'
```

## Best Practices

### Logging

1. **Use appropriate log levels**
   - Don't log sensitive data (passwords, tokens)
   - Use debug/verbose for development only
   - Log errors with full context

2. **Include context**
   - Always include requestId
   - Include userId when available
   - Add relevant business context

3. **Structured data**
   - Use JSON format
   - Consistent field names
   - Avoid nested objects when possible

### Error Handling

1. **Catch and log errors**
   - Never swallow errors silently
   - Log with full stack trace
   - Include user and request context

2. **User-friendly messages**
   - Don't expose internal errors to users
   - Provide actionable error messages
   - Include support contact for critical errors

3. **Error categorization**
   - Tag errors by feature/module
   - Distinguish between client and server errors
   - Track error trends over time

### Monitoring

1. **Set up alerts**
   - Alert on error rate spikes
   - Alert on performance degradation
   - Alert on health check failures

2. **Regular reviews**
   - Review error trends weekly
   - Investigate performance issues
   - Update alert thresholds as needed

3. **Incident response**
   - Document incident procedures
   - Maintain runbooks for common issues
   - Post-mortem analysis for major incidents

## Troubleshooting

### High Error Rate

1. Check Sentry for error details
2. Review recent deployments
3. Check external service status
4. Review application logs
5. Check database performance

### Performance Issues

1. Check Sentry performance dashboard
2. Review slow transactions
3. Check database query performance
4. Review memory usage
5. Check external API latency

### Health Check Failures

1. Check specific failing component
2. Review resource usage (CPU, memory, disk)
3. Check database connectivity
4. Review recent changes
5. Check infrastructure status

## Security Considerations

1. **Sensitive Data**
   - Never log passwords or tokens
   - Redact PII in logs
   - Use Sentry's data scrubbing

2. **Access Control**
   - Restrict access to logs
   - Use role-based access for Sentry
   - Rotate API keys regularly

3. **Compliance**
   - Follow data retention policies
   - Comply with GDPR/privacy laws
   - Document data handling procedures

## Resources

- [Sentry Documentation](https://docs.sentry.io/)
- [NestJS Logging](https://docs.nestjs.com/techniques/logger)
- [Terminus Health Checks](https://docs.nestjs.com/recipes/terminus)
- [Structured Logging Best Practices](https://www.loggly.com/ultimate-guide/node-logging-basics/)
