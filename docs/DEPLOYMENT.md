# Deployment Guide

This guide covers deploying the TechMate AI platform to production environments.

## Prerequisites

- Google Cloud Platform account (for backend)
- Vercel account (for web frontend)
- Expo account (for mobile apps)
- Google Play Console account (for Android)
- Apple Developer account (for iOS, optional)
- Domain name configured
- SSL certificates (handled by platforms)

## Backend Deployment (Google Cloud Run)

### Initial Setup

1. **Install Google Cloud SDK**
   ```bash
   # macOS
   brew install google-cloud-sdk
   
   # Windows
   # Download from https://cloud.google.com/sdk/docs/install
   
   # Linux
   curl https://sdk.cloud.google.com | bash
   ```

2. **Authenticate**
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```

3. **Enable Required APIs**
   ```bash
   gcloud services enable run.googleapis.com
   gcloud services enable containerregistry.googleapis.com
   gcloud services enable secretmanager.googleapis.com
   ```

4. **Create Service Account**
   ```bash
   gcloud iam service-accounts create techmate-backend \
     --display-name="TechMate Backend Service Account"
   
   gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
     --member="serviceAccount:techmate-backend@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
     --role="roles/run.admin"
   
   gcloud iam service-accounts keys create key.json \
     --iam-account=techmate-backend@YOUR_PROJECT_ID.iam.gserviceaccount.com
   ```

5. **Store Secrets**
   ```bash
   # Database URL
   echo -n "postgresql://user:pass@host:5432/db" | \
     gcloud secrets create DATABASE_URL_PRODUCTION --data-file=-
   
   # Redis URL
   echo -n "redis://host:6379" | \
     gcloud secrets create REDIS_URL_PRODUCTION --data-file=-
   
   # JWT Secret
   echo -n "your-jwt-secret" | \
     gcloud secrets create JWT_SECRET --data-file=-
   
   # OpenAI API Key
   echo -n "sk-your-key" | \
     gcloud secrets create OPENAI_API_KEY --data-file=-
   
   # Stripe Secret Key
   echo -n "sk_live_your-key" | \
     gcloud secrets create STRIPE_SECRET_KEY --data-file=-
   ```

### Manual Deployment

1. **Build Docker Image**
   ```bash
   docker build -t gcr.io/YOUR_PROJECT_ID/techmate-backend:latest \
     -f apps/backend/Dockerfile .
   ```

2. **Push to Container Registry**
   ```bash
   docker push gcr.io/YOUR_PROJECT_ID/techmate-backend:latest
   ```

3. **Deploy to Cloud Run**
   ```bash
   gcloud run deploy techmate-backend-production \
     --image gcr.io/YOUR_PROJECT_ID/techmate-backend:latest \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars "NODE_ENV=production" \
     --set-secrets "DATABASE_URL=DATABASE_URL_PRODUCTION:latest,REDIS_URL=REDIS_URL_PRODUCTION:latest,JWT_SECRET=JWT_SECRET:latest,OPENAI_API_KEY=OPENAI_API_KEY:latest,STRIPE_SECRET_KEY=STRIPE_SECRET_KEY:latest" \
     --min-instances 2 \
     --max-instances 50 \
     --memory 1Gi \
     --cpu 2 \
     --timeout 300 \
     --concurrency 80
   ```

4. **Configure Custom Domain**
   ```bash
   gcloud run domain-mappings create \
     --service techmate-backend-production \
     --domain api.techmate.ai \
     --region us-central1
   ```

### Alternative: Render Deployment

1. **Create Render Account** at https://render.com

2. **Create Web Service**
   - Connect GitHub repository
   - Select Docker environment
   - Set Dockerfile path: `apps/backend/Dockerfile`
   - Configure environment variables
   - Set health check path: `/health`

3. **Configure Environment Variables**
   ```
   NODE_ENV=production
   DATABASE_URL=postgresql://...
   REDIS_URL=redis://...
   JWT_SECRET=...
   OPENAI_API_KEY=...
   STRIPE_SECRET_KEY=...
   ```

4. **Deploy**
   - Render auto-deploys on push to main branch
   - Manual deploy via dashboard

## Database Setup

### Managed PostgreSQL (Supabase)

1. **Create Project** at https://supabase.com

2. **Get Connection String**
   - Go to Project Settings > Database
   - Copy connection string
   - Add to secrets

3. **Run Migrations**
   ```bash
   DATABASE_URL="postgresql://..." npm run migration:run --workspace=apps/backend
   ```

4. **Enable pgvector Extension**
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

### Alternative: Neon

1. **Create Project** at https://neon.tech

2. **Get Connection String**
   - Copy from dashboard
   - Add to secrets

3. **Run Migrations** (same as above)

### Redis Setup (Upstash)

1. **Create Database** at https://upstash.com

2. **Get Connection String**
   - Copy from dashboard
   - Add to secrets

## Web Frontend Deployment (Vercel)

### Initial Setup

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login**
   ```bash
   vercel login
   ```

3. **Link Project**
   ```bash
   cd apps/web
   vercel link
   ```

### Manual Deployment

1. **Build**
   ```bash
   cd apps/web
   VITE_API_URL=https://api.techmate.ai npm run build
   ```

2. **Deploy**
   ```bash
   vercel --prod
   ```

### Automatic Deployment

1. **Connect GitHub** in Vercel dashboard

2. **Configure Build Settings**
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm ci`
   - Root Directory: `apps/web`

3. **Configure Environment Variables**
   ```
   VITE_API_URL=https://api.techmate.ai
   VITE_STRIPE_PUBLIC_KEY=pk_live_...
   ```

4. **Configure Domains**
   - Add custom domain: `techmate.ai`
   - Add www redirect: `www.techmate.ai`

## Mobile App Deployment

### Prerequisites

1. **Install EAS CLI**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo**
   ```bash
   eas login
   ```

3. **Configure Project**
   ```bash
   cd apps/mobile
   eas build:configure
   ```

### Android Deployment

#### 1. Generate Signing Key

```bash
eas credentials
# Select Android > Production > Generate new keystore
```

#### 2. Build AAB

```bash
eas build --platform android --profile production
```

#### 3. Download Build

```bash
eas build:download --platform android --latest
```

#### 4. Upload to Play Store

**Manual Upload:**
1. Go to Google Play Console
2. Create app if not exists
3. Go to Release > Production
4. Create new release
5. Upload AAB file
6. Fill in release notes
7. Review and rollout

**Automated Upload (via CI/CD):**
- Handled by `.github/workflows/mobile-release.yml`
- Requires Google Play service account JSON

#### 5. Configure Play Store Listing

1. **App Details**
   - App name: TechMate AI
   - Short description
   - Full description
   - Category: Education

2. **Graphics**
   - App icon (512x512)
   - Feature graphic (1024x500)
   - Screenshots (at least 2)

3. **Content Rating**
   - Complete questionnaire
   - Get rating

4. **Pricing & Distribution**
   - Free app
   - Select countries
   - Accept terms

### iOS Deployment (Optional)

#### 1. Configure Certificates

```bash
eas credentials
# Select iOS > Production > Generate new credentials
```

#### 2. Build IPA

```bash
eas build --platform ios --profile production
```

#### 3. Upload to TestFlight

```bash
eas submit --platform ios
```

#### 4. Configure App Store Listing

1. **App Information**
   - Name: TechMate AI
   - Subtitle
   - Category: Education

2. **Pricing**
   - Free

3. **App Privacy**
   - Complete privacy questionnaire

4. **Screenshots**
   - iPhone screenshots (required)
   - iPad screenshots (optional)

## Environment Configuration

### Staging Environment

```bash
# Backend
DATABASE_URL=postgresql://staging-db
REDIS_URL=redis://staging-redis
NODE_ENV=staging

# Frontend
VITE_API_URL=https://api-staging.techmate.ai
```

### Production Environment

```bash
# Backend
DATABASE_URL=postgresql://production-db
REDIS_URL=redis://production-redis
NODE_ENV=production
SENTRY_DSN=https://...

# Frontend
VITE_API_URL=https://api.techmate.ai
VITE_STRIPE_PUBLIC_KEY=pk_live_...
```

## Post-Deployment Checklist

### Backend

- [ ] Health check endpoint responding
- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] Secrets properly set
- [ ] Monitoring enabled (Sentry)
- [ ] Logs accessible
- [ ] Auto-scaling configured
- [ ] Backup strategy in place

### Frontend

- [ ] Site accessible via custom domain
- [ ] SSL certificate active
- [ ] API calls working
- [ ] Authentication flow working
- [ ] Error tracking enabled
- [ ] Analytics configured
- [ ] CDN caching working

### Mobile

- [ ] App available in store
- [ ] Deep linking configured
- [ ] Push notifications working
- [ ] Crash reporting enabled
- [ ] Analytics configured
- [ ] OTA updates configured

## Rollback Procedures

### Backend (Cloud Run)

```bash
# List revisions
gcloud run revisions list --service techmate-backend-production

# Rollback to previous revision
gcloud run services update-traffic techmate-backend-production \
  --to-revisions=PREVIOUS_REVISION=100
```

### Frontend (Vercel)

1. Go to Vercel dashboard
2. Select deployment
3. Click "Promote to Production"

### Mobile

1. **Android**: Use staged rollout in Play Console
2. **iOS**: Remove version from App Store
3. **Emergency**: Push OTA update with fix

## Monitoring Production

### Health Checks

```bash
# Backend health
curl https://api.techmate.ai/health

# Frontend
curl https://techmate.ai
```

### Logs

```bash
# Cloud Run logs
gcloud logging read "resource.type=cloud_run_revision" --limit 100

# Vercel logs
vercel logs
```

### Metrics

- Check Sentry dashboard
- Review Cloud Run metrics
- Monitor database performance
- Check API response times

## Troubleshooting

### Backend Not Starting

1. Check logs: `gcloud logging read`
2. Verify environment variables
3. Check database connectivity
4. Verify secrets are accessible

### Frontend Build Failing

1. Check build logs in Vercel
2. Verify environment variables
3. Test build locally
4. Check dependencies

### Mobile Build Failing

1. Check EAS build logs: `eas build:list`
2. Verify credentials
3. Check app.json configuration
4. Test build locally

## Security Best Practices

1. **Secrets Management**
   - Use secret managers (Google Secret Manager, Vercel env vars)
   - Never commit secrets to git
   - Rotate secrets regularly

2. **Access Control**
   - Use service accounts with minimal permissions
   - Enable 2FA for all accounts
   - Review access logs regularly

3. **Network Security**
   - Use HTTPS everywhere
   - Configure CORS properly
   - Enable rate limiting
   - Use WAF if available

4. **Monitoring**
   - Enable error tracking
   - Set up alerts for anomalies
   - Monitor for security issues
   - Regular security audits

## Cost Optimization

### Cloud Run

- Use min instances = 0 for staging
- Use min instances = 1-2 for production
- Set appropriate memory/CPU limits
- Monitor and adjust based on usage

### Vercel

- Free tier for hobby projects
- Pro tier for production ($20/month)
- Monitor bandwidth usage

### Database

- Right-size instance
- Use connection pooling
- Enable query caching
- Regular maintenance

## Support and Resources

- [Google Cloud Run Docs](https://cloud.google.com/run/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Expo EAS Docs](https://docs.expo.dev/eas/)
- [Play Console Help](https://support.google.com/googleplay/android-developer)
- [App Store Connect Help](https://developer.apple.com/app-store-connect/)
