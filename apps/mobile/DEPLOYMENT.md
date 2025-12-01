# Mobile App Deployment Guide

This guide covers building and deploying the TechMate AI mobile app to Google Play Store and Apple App Store.

## Prerequisites

- Expo account (https://expo.dev)
- Google Play Console account ($25 one-time fee)
- Apple Developer account ($99/year, optional)
- EAS CLI installed: `npm install -g eas-cli`

## Initial Setup

### 1. Configure Expo Project

```bash
cd apps/mobile

# Login to Expo
eas login

# Configure EAS Build
eas build:configure
```

This creates `eas.json` with build profiles.

### 2. Update app.json

Update the following fields in `app.json`:
- `expo.owner`: Your Expo username
- `expo.extra.eas.projectId`: Your project ID (from Expo dashboard)
- `expo.ios.bundleIdentifier`: Your iOS bundle ID
- `expo.android.package`: Your Android package name

### 3. Configure Credentials

#### Android

```bash
eas credentials

# Select:
# - Android
# - Production
# - Generate new keystore

# This creates and stores your signing key securely
```

#### iOS (Optional)

```bash
eas credentials

# Select:
# - iOS
# - Production
# - Generate new credentials

# This creates certificates and provisioning profiles
```

## Building the App

### Development Build

For testing on physical devices:

```bash
# Android APK
eas build --profile development --platform android

# iOS Simulator
eas build --profile development --platform ios
```

### Preview Build

For internal testing:

```bash
# Android
eas build --profile preview --platform android

# iOS
eas build --profile preview --platform ios
```

### Production Build

For app store submission:

```bash
# Android AAB
eas build --profile production --platform android

# iOS IPA
eas build --profile production --platform ios

# Both platforms
eas build --profile production --platform all
```

### Download Build

```bash
# List builds
eas build:list

# Download latest
eas build:download --platform android --latest
eas build:download --platform ios --latest
```

## Google Play Store Deployment

### 1. Create App in Play Console

1. Go to https://play.google.com/console
2. Click "Create app"
3. Fill in app details:
   - App name: TechMate AI
   - Default language: English
   - App or game: App
   - Free or paid: Free
4. Accept declarations
5. Click "Create app"

### 2. Set Up App Content

#### Store Listing

1. Go to "Store presence" > "Main store listing"
2. Fill in:
   - Short description (80 chars max)
   - Full description (4000 chars max)
   - App icon (512x512 PNG)
   - Feature graphic (1024x500 PNG)
   - Screenshots (at least 2, max 8)
     - Phone: 16:9 or 9:16 ratio
     - Tablet: Optional
3. Save

#### App Category

1. Go to "Store presence" > "Store settings"
2. Select:
   - Category: Education
   - Tags: Learning, AI, Career
3. Save

#### Content Rating

1. Go to "Policy" > "App content"
2. Click "Start questionnaire"
3. Answer questions honestly
4. Submit for rating

#### Target Audience

1. Go to "Policy" > "Target audience"
2. Select age groups
3. Save

#### Privacy Policy

1. Go to "Policy" > "App content"
2. Add privacy policy URL
3. Save

### 3. Set Up Release

#### Internal Testing (Recommended First)

1. Go to "Release" > "Testing" > "Internal testing"
2. Click "Create new release"
3. Upload AAB file
4. Add release notes
5. Review and rollout
6. Add testers via email list

#### Production Release

1. Go to "Release" > "Production"
2. Click "Create new release"
3. Upload AAB file
4. Add release notes:
   ```
   Version 1.0.0
   - Initial release
   - AI-powered learning roadmaps
   - Project code generation
   - Interview preparation
   - Job matching
   - Productivity tools
   ```
5. Review and rollout

### 4. Automated Submission

Create service account for CI/CD:

1. Go to Google Cloud Console
2. Create service account
3. Grant "Service Account User" role
4. Download JSON key
5. In Play Console:
   - Go to "Setup" > "API access"
   - Link service account
   - Grant "Release manager" access

Add to GitHub secrets:
```
GOOGLE_PLAY_SERVICE_ACCOUNT=<json-content>
```

## Apple App Store Deployment (Optional)

### 1. Create App in App Store Connect

1. Go to https://appstoreconnect.apple.com
2. Click "My Apps" > "+"
3. Select "New App"
4. Fill in:
   - Platform: iOS
   - Name: TechMate AI
   - Primary Language: English
   - Bundle ID: com.techmate.ai
   - SKU: techmate-ai-001
5. Create

### 2. Set Up App Information

#### App Information

1. Go to "App Information"
2. Fill in:
   - Subtitle (30 chars)
   - Category: Education
   - Content Rights: No
3. Save

#### Pricing and Availability

1. Go to "Pricing and Availability"
2. Select:
   - Price: Free
   - Availability: All countries
3. Save

#### App Privacy

1. Go to "App Privacy"
2. Click "Get Started"
3. Answer privacy questions
4. Submit

### 3. Prepare for Submission

#### Screenshots

Required sizes:
- 6.5" Display (iPhone 14 Pro Max): 1290x2796
- 5.5" Display (iPhone 8 Plus): 1242x2208

Optional:
- iPad Pro (12.9"): 2048x2732

#### App Preview Video (Optional)

- 15-30 seconds
- Same sizes as screenshots

#### Description

```
TechMate AI - Your AI-Powered Tech Career Companion

Master new skills, build projects, ace interviews, and land your dream job with personalized AI guidance.

FEATURES:

🎓 Learning Mentor
- Personalized learning roadmaps
- AI-powered concept explanations
- Progress tracking
- Tech news summaries

💻 Project Generator
- AI-generated project ideas
- Complete architecture design
- Starter code generation
- GitHub integration

🎤 Interview Prep
- Mock interview practice
- Real-time feedback
- Voice mode support
- Performance analytics

💼 Job Matching
- Resume parsing and scoring
- ATS optimization
- Intelligent job matching
- Application tracking

✅ Productivity Hub
- Task management
- Focus timer
- Smart notes
- Reminders

Perfect for students, developers, and professionals looking to advance their tech careers.

Download now and start your journey!
```

### 4. Submit for Review

1. Create new version
2. Upload build (via EAS or Xcode)
3. Fill in "What's New"
4. Add screenshots
5. Submit for review

Review typically takes 24-48 hours.

### 5. Automated Submission

```bash
# Configure App Store Connect API
eas submit --platform ios

# Or use GitHub Actions (see .github/workflows/mobile-release.yml)
```

## Over-The-Air (OTA) Updates

For minor updates without app store review:

### 1. Configure Updates

Already configured in `app.json`:
```json
{
  "updates": {
    "url": "https://u.expo.dev/your-project-id"
  }
}
```

### 2. Publish Update

```bash
# Publish to production
eas update --branch production --message "Bug fixes and improvements"

# Publish to staging
eas update --branch staging --message "Testing new features"
```

### 3. View Updates

```bash
eas update:list
```

### 4. Rollback

```bash
eas update:rollback
```

## Version Management

### Incrementing Versions

#### Android

Update in `app.json`:
```json
{
  "android": {
    "versionCode": 2  // Increment for each release
  }
}
```

#### iOS

Update in `app.json`:
```json
{
  "ios": {
    "buildNumber": "2"  // Increment for each release
  },
  "version": "1.0.1"  // Semantic version
}
```

### Semantic Versioning

- **Major** (1.0.0 → 2.0.0): Breaking changes
- **Minor** (1.0.0 → 1.1.0): New features
- **Patch** (1.0.0 → 1.0.1): Bug fixes

## Testing

### Internal Testing

1. Build preview version
2. Share link with testers
3. Collect feedback
4. Fix issues
5. Rebuild

### Beta Testing

#### Android (Internal Testing Track)

1. Upload to internal track
2. Add testers
3. Testers download from Play Store
4. Collect feedback

#### iOS (TestFlight)

1. Submit build
2. Add testers
3. Testers download from TestFlight
4. Collect feedback

## Monitoring

### Crash Reporting

Sentry is configured for crash reporting:

```typescript
// Already set up in app
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'your-dsn',
  environment: 'production',
});
```

### Analytics

Track user behavior:

```typescript
import * as Analytics from 'expo-analytics';

Analytics.logEvent('feature_used', {
  feature: 'roadmap_generation',
});
```

## Troubleshooting

### Build Failures

1. Check EAS build logs:
   ```bash
   eas build:list
   eas build:view BUILD_ID
   ```

2. Common issues:
   - Invalid credentials
   - Missing dependencies
   - Configuration errors

3. Solutions:
   - Regenerate credentials
   - Update dependencies
   - Check app.json and eas.json

### Submission Rejections

#### Google Play

Common reasons:
- Privacy policy missing
- Content rating incomplete
- Screenshots don't match app

#### Apple App Store

Common reasons:
- Missing privacy descriptions
- App crashes on review
- Incomplete metadata
- Guideline violations

### OTA Update Issues

1. Check update status:
   ```bash
   eas update:list
   ```

2. Rollback if needed:
   ```bash
   eas update:rollback
   ```

## Best Practices

### Before Release

- [ ] Test on multiple devices
- [ ] Test all features thoroughly
- [ ] Check for crashes
- [ ] Verify API connectivity
- [ ] Test offline functionality
- [ ] Review privacy policy
- [ ] Prepare marketing materials

### Release Process

1. Increment version numbers
2. Update release notes
3. Build production version
4. Test build thoroughly
5. Submit to stores
6. Monitor for issues
7. Respond to reviews

### Post-Release

- Monitor crash reports
- Track user feedback
- Plan next release
- Fix critical bugs quickly
- Use OTA for minor fixes

## Resources

- [Expo EAS Documentation](https://docs.expo.dev/eas/)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer)
- [App Store Connect Help](https://developer.apple.com/app-store-connect/)
- [Expo Updates Documentation](https://docs.expo.dev/eas-update/introduction/)
- [React Native Best Practices](https://reactnative.dev/docs/performance)
