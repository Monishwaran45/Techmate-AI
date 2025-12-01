# TechMate AI - Troubleshooting Guide

## Table of Contents
1. [Installation Issues](#installation-issues)
2. [Docker Issues](#docker-issues)
3. [Database Issues](#database-issues)
4. [Authentication Issues](#authentication-issues)
5. [API Issues](#api-issues)
6. [Frontend Issues](#frontend-issues)
7. [Performance Issues](#performance-issues)
8. [Common Error Messages](#common-error-messages)

## Installation Issues

### Problem: `npm install` fails with dependency conflicts

**Symptoms:**
```
npm ERR! ERESOLVE unable to resolve dependency tree
```

**Solutions:**
1. Clear npm cache:
```bash
npm cache clean --force
```

2. Delete node_modules and package-lock.json:
```bash
rm -rf node_modules package-lock.json
rm -rf apps/*/node_modules apps/*/package-lock.json
npm install
```

3. Use legacy peer deps (if needed):
```bash
npm install --legacy-peer-deps
```

### Problem: Node version mismatch

**Symptoms:**
```
error: The engine "node" is incompatible with this module
```

**Solution:**
1. Check required Node version:
```bash
cat package.json | grep "node"
```

2. Install correct Node version (using nvm):
```bash
nvm install 20
nvm use 20
```

3. Verify installation:
```bash
node --version  # Should be 20.x.x
```

### Problem: TypeScript compilation errors

**Symptoms:**
```
error TS2307: Cannot find module '@techmate/shared-types'
```

**Solution:**
1. Build shared types package first:
```bash
npm run build --workspace=packages/shared-types
```

2. Clean and rebuild:
```bash
npm run clean
npm run build
```

## Docker Issues

### Problem: Docker containers won't start

**Symptoms:**
```
ERROR: for postgres  Cannot start service postgres: driver failed
```

**Solutions:**
1. Check if ports are already in use:
```bash
# Check PostgreSQL port
lsof -i :5432
# Check Redis port
lsof -i :6379
```

2. Stop conflicting services:
```bash
# macOS/Linux
sudo systemctl stop postgresql
sudo systemctl stop redis

# Or kill specific processes
kill -9 <PID>
```

3. Remove existing containers and volumes:
```bash
docker-compose down -v
docker-compose up -d
```

### Problem: Database connection refused

**Symptoms:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solutions:**
1. Check if PostgreSQL container is running:
```bash
docker-compose ps
```

2. Check container logs:
```bash
docker-compose logs postgres
```

3. Restart containers:
```bash
docker-compose restart postgres
```

4. Verify DATABASE_URL in .env:
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/techmate_dev
```

### Problem: pgvector extension not found

**Symptoms:**
```
ERROR: extension "vector" does not exist
```

**Solution:**
1. Recreate database with pgvector:
```bash
docker-compose down -v
docker-compose up -d
```

2. Manually install extension:
```bash
docker-compose exec postgres psql -U postgres -d techmate_dev -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

### Problem: Docker out of disk space

**Symptoms:**
```
ERROR: no space left on device
```

**Solutions:**
1. Clean up Docker resources:
```bash
docker system prune -a --volumes
```

2. Remove unused images:
```bash
docker image prune -a
```

## Database Issues

### Problem: Migrations fail to run

**Symptoms:**
```
Error: Migration failed: relation "users" already exists
```

**Solutions:**
1. Check migration status:
```bash
npm run typeorm migration:show --workspace=apps/backend
```

2. Revert last migration:
```bash
npm run migration:revert --workspace=apps/backend
```

3. Drop and recreate database (development only):
```bash
docker-compose exec postgres psql -U postgres -c "DROP DATABASE techmate_dev;"
docker-compose exec postgres psql -U postgres -c "CREATE DATABASE techmate_dev;"
npm run migration:run --workspace=apps/backend
```

### Problem: Connection pool exhausted

**Symptoms:**
```
Error: Connection pool exhausted
```

**Solutions:**
1. Increase connection pool size in data-source.ts:
```typescript
{
  type: 'postgres',
  url: process.env.DATABASE_URL,
  extra: {
    max: 20,  // Increase from default 10
    min: 5,
  }
}
```

2. Check for connection leaks:
```typescript
// Always use transactions properly
await queryRunner.release();
```

### Problem: Slow queries

**Symptoms:**
- API responses taking > 1 second
- Database CPU usage high

**Solutions:**
1. Enable query logging:
```typescript
// In data-source.ts
{
  logging: true,
  logger: 'advanced-console',
}
```

2. Add indexes for frequently queried fields:
```typescript
@Index(['userId', 'createdAt'])
@Entity()
export class Task {
  // ...
}
```

3. Use query builder for complex queries:
```typescript
const tasks = await this.taskRepository
  .createQueryBuilder('task')
  .where('task.userId = :userId', { userId })
  .andWhere('task.status = :status', { status: 'todo' })
  .orderBy('task.createdAt', 'DESC')
  .limit(10)
  .getMany();
```

## Authentication Issues

### Problem: JWT token expired

**Symptoms:**
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Token expired"
  }
}
```

**Solution:**
1. Implement automatic token refresh:
```typescript
// In your API client
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      const { data } = await axios.post('/api/auth/refresh', { refreshToken });
      localStorage.setItem('accessToken', data.accessToken);
      // Retry original request
      error.config.headers.Authorization = `Bearer ${data.accessToken}`;
      return api(error.config);
    }
    return Promise.reject(error);
  }
);
```

### Problem: 2FA code not working

**Symptoms:**
```json
{
  "error": {
    "code": "INVALID_2FA_TOKEN",
    "message": "Invalid 2FA token"
  }
}
```

**Solutions:**
1. Check device time synchronization:
   - TOTP codes are time-based
   - Ensure device clock is accurate

2. Use backup codes if available

3. Disable and re-enable 2FA:
```bash
# Contact support or use recovery method
```

### Problem: Password reset not working

**Symptoms:**
- Reset email not received
- Reset link expired

**Solutions:**
1. Check email service configuration:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

2. Check spam folder

3. Verify email service logs:
```bash
docker-compose logs backend | grep "email"
```

## API Issues

### Problem: CORS errors in browser

**Symptoms:**
```
Access to XMLHttpRequest has been blocked by CORS policy
```

**Solutions:**
1. Check CORS configuration in main.ts:
```typescript
app.enableCors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
});
```

2. Add frontend URL to .env:
```env
FRONTEND_URL=http://localhost:5173
```

3. For multiple origins:
```typescript
app.enableCors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3001',
    'https://app.techmate.ai'
  ],
  credentials: true,
});
```

### Problem: Rate limit exceeded

**Symptoms:**
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests"
  }
}
```

**Solutions:**
1. Check rate limit headers:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1640000000
```

2. Implement exponential backoff:
```typescript
async function retryWithBackoff(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.response?.status === 429) {
        const waitTime = Math.pow(2, i) * 1000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else {
        throw error;
      }
    }
  }
}
```

3. Upgrade subscription tier for higher limits

### Problem: File upload fails

**Symptoms:**
```json
{
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "File size exceeds limit"
  }
}
```

**Solutions:**
1. Check file size limits:
```typescript
// In main.ts
app.use(json({ limit: '10mb' }));
app.use(urlencoded({ extended: true, limit: '10mb' }));
```

2. Compress files before upload:
```typescript
// For images
import imageCompression from 'browser-image-compression';

const compressedFile = await imageCompression(file, {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
});
```

3. Use multipart upload for large files

### Problem: AI requests timing out

**Symptoms:**
```json
{
  "error": {
    "code": "TIMEOUT",
    "message": "Request timeout"
  }
}
```

**Solutions:**
1. Increase timeout in AI service:
```typescript
const response = await openai.chat.completions.create({
  // ...
  timeout: 60000,  // 60 seconds
});
```

2. Implement streaming for long responses:
```typescript
const stream = await openai.chat.completions.create({
  // ...
  stream: true,
});

for await (const chunk of stream) {
  // Process chunk
}
```

3. Use background jobs for long-running tasks:
```typescript
@InjectQueue('ai-processing')
private aiQueue: Queue;

await this.aiQueue.add('generate-roadmap', { userId, goals });
```

## Frontend Issues

### Problem: Blank page after build

**Symptoms:**
- Production build shows blank page
- Console shows module errors

**Solutions:**
1. Check build output:
```bash
npm run build --workspace=apps/web
```

2. Verify base URL in vite.config.ts:
```typescript
export default defineConfig({
  base: '/',  // Or your deployment path
});
```

3. Check for environment variable issues:
```typescript
// Use import.meta.env in Vite
const API_URL = import.meta.env.VITE_API_URL;
```

### Problem: State not persisting

**Symptoms:**
- User logged out on refresh
- Data lost on navigation

**Solutions:**
1. Implement state persistence with Zustand:
```typescript
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
```

2. Use localStorage for tokens:
```typescript
localStorage.setItem('accessToken', token);
```

### Problem: Mobile app crashes on startup

**Symptoms:**
- App crashes immediately
- Error in Metro bundler

**Solutions:**
1. Clear Metro cache:
```bash
cd apps/mobile
npx expo start -c
```

2. Reinstall dependencies:
```bash
cd apps/mobile
rm -rf node_modules
npm install
```

3. Check for native module issues:
```bash
npx expo doctor
```

## Performance Issues

### Problem: Slow API responses

**Symptoms:**
- Requests taking > 2 seconds
- High server CPU usage

**Solutions:**
1. Enable Redis caching:
```typescript
@Injectable()
export class LearningService {
  constructor(
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {}

  async getRoadmap(userId: string) {
    const cacheKey = `roadmap:${userId}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const roadmap = await this.fetchRoadmap(userId);
    await this.cacheManager.set(cacheKey, roadmap, 3600);
    return roadmap;
  }
}
```

2. Implement database query optimization:
```typescript
// Use select to fetch only needed fields
const users = await this.userRepository.find({
  select: ['id', 'email', 'name'],
  where: { role: 'developer' },
});

// Use relations efficiently
const user = await this.userRepository.findOne({
  where: { id: userId },
  relations: ['profile', 'subscription'],
});
```

3. Add pagination:
```typescript
const [tasks, total] = await this.taskRepository.findAndCount({
  where: { userId },
  take: 20,
  skip: (page - 1) * 20,
  order: { createdAt: 'DESC' },
});
```

### Problem: High memory usage

**Symptoms:**
- Node process using > 2GB RAM
- Out of memory errors

**Solutions:**
1. Increase Node memory limit:
```json
{
  "scripts": {
    "start": "node --max-old-space-size=4096 dist/main"
  }
}
```

2. Implement streaming for large datasets:
```typescript
const stream = await this.repository
  .createQueryBuilder('entity')
  .stream();

stream.on('data', (row) => {
  // Process row
});
```

3. Use pagination instead of loading all data

### Problem: Slow frontend bundle

**Symptoms:**
- Initial page load > 5 seconds
- Large bundle size

**Solutions:**
1. Implement code splitting:
```typescript
// Use React.lazy for route-based splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));

<Suspense fallback={<Loading />}>
  <Dashboard />
</Suspense>
```

2. Analyze bundle size:
```bash
npm run build --workspace=apps/web
npx vite-bundle-visualizer
```

3. Optimize dependencies:
```typescript
// Import only what you need
import { debounce } from 'lodash-es';
// Instead of
import _ from 'lodash';
```

## Common Error Messages

### "Cannot find module '@techmate/shared-types'"

**Cause:** Shared types package not built

**Solution:**
```bash
npm run build --workspace=packages/shared-types
```

### "Port 3000 is already in use"

**Cause:** Another process using port 3000

**Solution:**
```bash
# Find process
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 npm run start:dev --workspace=apps/backend
```

### "OpenAI API key not found"

**Cause:** Missing OPENAI_API_KEY in .env

**Solution:**
```env
OPENAI_API_KEY=sk-...
```

### "Stripe webhook signature verification failed"

**Cause:** Invalid webhook secret

**Solution:**
1. Get webhook secret from Stripe dashboard
2. Update .env:
```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

### "Redis connection refused"

**Cause:** Redis not running

**Solution:**
```bash
docker-compose up -d redis
```

### "TypeORM entity not found"

**Cause:** Entity not imported in module

**Solution:**
```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserProfile, Subscription]),
  ],
})
export class AuthModule {}
```

## Getting Help

If you're still experiencing issues:

1. **Check logs:**
```bash
# Backend logs
docker-compose logs backend

# Database logs
docker-compose logs postgres

# All logs
docker-compose logs -f
```

2. **Enable debug mode:**
```env
NODE_ENV=development
LOG_LEVEL=debug
```

3. **Search existing issues:**
   - GitHub Issues: https://github.com/techmate/platform/issues
   - Stack Overflow: Tag with `techmate-ai`

4. **Contact support:**
   - Email: support@techmate.ai
   - Discord: https://discord.gg/techmate
   - Documentation: https://docs.techmate.ai

5. **Provide information when reporting:**
   - Error message and stack trace
   - Steps to reproduce
   - Environment (OS, Node version, Docker version)
   - Relevant logs
   - Configuration (sanitized .env)
