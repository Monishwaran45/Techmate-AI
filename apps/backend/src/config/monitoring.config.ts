export const monitoringConfig = {
  sentry: {
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    enabled: !!process.env.SENTRY_DSN,
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: 'json',
    includeTimestamp: true,
  },
  health: {
    memoryHeapThreshold: 300 * 1024 * 1024, // 300MB
    memoryRssThreshold: 300 * 1024 * 1024, // 300MB
    diskThresholdPercent: 0.9, // 90%
  },
  alerts: {
    slackWebhook: process.env.SLACK_WEBHOOK_URL,
    emailRecipients: process.env.ALERT_EMAIL_RECIPIENTS?.split(',') || [],
  },
};
