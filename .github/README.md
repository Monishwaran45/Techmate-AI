# CI/CD Pipeline Documentation

This directory contains GitHub Actions workflows for continuous integration and deployment of the TechMate AI platform.

## Workflows

### 1. CI Pipeline (`ci.yml`)

Runs on every pull request and push to main/develop branches.

**Jobs:**
- **Lint and Type Check**: ESLint, Prettier, TypeScript validation
- **Backend Tests**: Unit tests, property-based tests with PostgreSQL and Redis
- **Web Tests**: Frontend unit tests
- **Mobile Tests**: Mobile app unit tests
- **Build Backend**: Compile backend application
- **Build Web**: Build web frontend
- **Integration Tests**: End-to-end API tests

**Required Secrets:**
- None (uses test databases from services)

### 2. Staging Deployment (`deploy-staging.yml`)

Deploys to staging environment on push to main branch.

**Jobs:**
- **Build and Push Backend**: Build Docker image and push to GitHub Container Registry
- **Deploy Backend**: Deploy to Google Cloud Run (staging)
- **Deploy Web**: Deploy to Vercel (staging)
- **E2E Tests**: Run Playwright tests on staging

**Required Secrets:**
- `GCP_SA_KEY`: Google Cloud service account key
- `VERCEL_TOKEN`: Vercel deployment token
- `VERCEL_ORG_ID`: Vercel organization ID
- `VERCEL_PROJECT_ID`: Vercel project ID
- `STRIPE_PUBLIC_KEY_TEST`: Stripe test public key
- `TEST_USER_EMAIL`: Test user email for E2E tests
- `TEST_USER_PASSWORD`: Test user password for E2E tests

**Required GCP Secrets:**
- `DATABASE_URL_STAGING`: PostgreSQL connection string
- `REDIS_URL_STAGING`: Redis connection string
- `JWT_SECRET`: JWT signing secret
- `OPENAI_API_KEY`: OpenAI API key

### 3. Production Deployment (`deploy-production.yml`)

Manual deployment to production with approval gates.

**Trigger:** Manual workflow dispatch with version input

**Jobs:**
- **Build and Push Backend**: Build production Docker image
- **Deploy Backend**: Deploy to Google Cloud Run (production)
- **Deploy Web**: Deploy to Vercel (production)
- **Smoke Tests**: Basic health checks
- **Create Release**: Create GitHub release

**Required Secrets:**
- Same as staging, plus:
- `STRIPE_PUBLIC_KEY_LIVE`: Stripe live public key
- `STRIPE_SECRET_KEY`: Stripe secret key
- `SLACK_WEBHOOK`: Slack webhook for notifications

**Required GCP Secrets:**
- `DATABASE_URL_PRODUCTION`: PostgreSQL connection string
- `REDIS_URL_PRODUCTION`: Redis connection string
- All other secrets from staging

### 4. Mobile Release (`mobile-release.yml`)

Builds and deploys mobile apps to app stores.

**Trigger:** Push to tags matching `mobile-v*` or manual dispatch

**Jobs:**
- **Build Android**: Build Android AAB with EAS
- **Deploy Android**: Upload to Play Store internal track
- **Build iOS**: Build iOS IPA with EAS
- **Deploy iOS**: Upload to TestFlight
- **Notify**: Send Slack notification

**Required Secrets:**
- `EXPO_TOKEN`: Expo account token
- `GOOGLE_PLAY_SERVICE_ACCOUNT`: Google Play service account JSON
- `APP_STORE_CONNECT_API_KEY`: App Store Connect API key
- `APP_STORE_CONNECT_KEY_ID`: App Store Connect key ID
- `APP_STORE_CONNECT_ISSUER_ID`: App Store Connect issuer ID
- `SLACK_WEBHOOK`: Slack webhook for notifications

## Environment Setup

### GitHub Environments

Create the following environments in GitHub repository settings:

1. **staging**
   - URL: https://staging.techmate.ai
   - No approval required

2. **production**
   - URL: https://techmate.ai
   - Require approval from maintainers
   - Deployment branch: main only

3. **play-store-internal**
   - For Android internal testing

4. **testflight**
   - For iOS TestFlight releases

### Google Cloud Setup

1. Create a service account with Cloud Run Admin role
2. Generate JSON key and add as `GCP_SA_KEY` secret
3. Create secrets in Google Secret Manager:
   - DATABASE_URL_STAGING
   - DATABASE_URL_PRODUCTION
   - REDIS_URL_STAGING
   - REDIS_URL_PRODUCTION
   - JWT_SECRET
   - OPENAI_API_KEY
   - STRIPE_SECRET_KEY

### Vercel Setup

1. Create Vercel project
2. Get deployment token from Vercel dashboard
3. Add secrets:
   - VERCEL_TOKEN
   - VERCEL_ORG_ID
   - VERCEL_PROJECT_ID

### Mobile App Setup

1. Create Expo account and project
2. Configure EAS Build:
   ```bash
   cd apps/mobile
   eas build:configure
   ```
3. Set up Android signing:
   ```bash
   eas credentials
   ```
4. Set up iOS certificates:
   ```bash
   eas credentials
   ```

## Usage

### Running CI Checks Locally

```bash
# Lint and format
npm run lint
npm run format:check

# Type check
npm run type-check

# Run tests
npm test

# Build all apps
npm run build
```

### Deploying to Staging

Push to main branch or merge a PR:
```bash
git push origin main
```

### Deploying to Production

1. Create a version tag:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. Go to GitHub Actions
3. Select "Deploy to Production" workflow
4. Click "Run workflow"
5. Enter version (e.g., v1.0.0)
6. Approve deployment when prompted

### Releasing Mobile App

1. Update version in `apps/mobile/app.json`
2. Create a mobile version tag:
   ```bash
   git tag mobile-v1.0.0
   git push origin mobile-v1.0.0
   ```
3. Workflow will automatically build and deploy

## Monitoring

### Build Status

Check workflow status at:
https://github.com/[org]/[repo]/actions

### Deployment Status

- **Staging Backend**: https://api-staging.techmate.ai/health
- **Production Backend**: https://api.techmate.ai/health
- **Staging Web**: https://staging.techmate.ai
- **Production Web**: https://techmate.ai

### Logs

- **Cloud Run**: Google Cloud Console > Cloud Run > Logs
- **Vercel**: Vercel Dashboard > Deployments > Logs
- **GitHub Actions**: Actions tab > Select workflow run

## Troubleshooting

### Failed Tests

1. Check test logs in GitHub Actions
2. Run tests locally to reproduce
3. Fix issues and push again

### Failed Deployment

1. Check deployment logs
2. Verify secrets are configured correctly
3. Check service health endpoints
4. Rollback if necessary:
   ```bash
   gcloud run services update-traffic techmate-backend-production \
     --to-revisions=PREVIOUS_REVISION=100
   ```

### Mobile Build Failures

1. Check EAS build logs:
   ```bash
   eas build:list
   ```
2. Verify credentials are valid
3. Check app.json configuration
4. Rebuild with:
   ```bash
   eas build --platform android --profile production
   ```

## Best Practices

1. **Always run tests locally** before pushing
2. **Use feature branches** and create PRs
3. **Wait for CI to pass** before merging
4. **Test on staging** before production deployment
5. **Tag releases** with semantic versioning
6. **Monitor deployments** after release
7. **Keep secrets secure** and rotate regularly
8. **Document changes** in commit messages

## Security Notes

- Never commit secrets to the repository
- Use GitHub Secrets for sensitive data
- Rotate API keys and tokens regularly
- Review security alerts from Dependabot
- Keep dependencies up to date
- Use least privilege for service accounts
