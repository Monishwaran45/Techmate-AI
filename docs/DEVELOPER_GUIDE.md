# TechMate AI - Developer Guide

## Table of Contents
1. [Getting Started](#getting-started)
2. [Project Architecture](#project-architecture)
3. [Development Workflow](#development-workflow)
4. [Code Style and Standards](#code-style-and-standards)
5. [Testing Guidelines](#testing-guidelines)
6. [API Development](#api-development)
7. [Frontend Development](#frontend-development)
8. [Database Management](#database-management)
9. [Deployment](#deployment)

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 20.x or higher
- **npm** 9.x or higher
- **Docker** and **Docker Compose**
- **Git**
- **Code Editor** (VS Code recommended)

### Initial Setup

1. **Clone the repository:**
```bash
git clone https://github.com/techmate/platform.git
cd platform
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/techmate_dev

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_SECRET=your-refresh-secret
REFRESH_TOKEN_EXPIRES_IN=7d

# OpenAI
OPENAI_API_KEY=sk-your-api-key

# Stripe (for subscription features)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

4. **Start Docker services:**
```bash
docker-compose up -d
```

5. **Run database migrations:**
```bash
npm run migration:run --workspace=apps/backend
```

6. **Start development servers:**
```bash
npm run dev
```

This will start:
- Backend API: http://localhost:3000
- Web Frontend: http://localhost:5173
- API Docs: http://localhost:3000/api/docs

### Recommended VS Code Extensions

Install these extensions for the best development experience:

- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript Vue Plugin (Volar)** - TypeScript support
- **REST Client** - API testing
- **Docker** - Docker management
- **GitLens** - Git integration
- **Thunder Client** - API testing

## Project Architecture

### Monorepo Structure

```
techmate-ai-platform/
├── apps/
│   ├── backend/          # NestJS backend API
│   ├── web/              # React web application
│   └── mobile/           # React Native mobile app
├── packages/
│   └── shared-types/     # Shared TypeScript types
├── docs/                 # Documentation
├── docker/               # Docker configuration
└── .kiro/                # Kiro specs and tasks
```

### Backend Architecture (NestJS)

```
apps/backend/src/
├── modules/              # Feature modules
│   ├── auth/            # Authentication & authorization
│   ├── learning/        # Learning roadmaps & concepts
│   ├── projects/        # Project generation
│   ├── interview/       # Interview preparation
│   ├── jobs/            # Job matching & resumes
│   ├── productivity/    # Tasks, notes, timers
│   ├── subscription/    # Subscription management
│   ├── sync/            # Real-time synchronization
│   └── ai/              # AI service integration
├── entities/            # TypeORM entities
├── database/            # Database configuration & migrations
├── test/                # Test utilities
├── app.module.ts        # Root module
└── main.ts              # Application entry point
```

### Module Structure

Each feature module follows this structure:

```
module-name/
├── dto/                 # Data Transfer Objects
│   ├── create-*.dto.ts
│   ├── update-*.dto.ts
│   └── query-*.dto.ts
├── guards/              # Route guards
├── decorators/          # Custom decorators
├── jobs/                # Background jobs (Bull)
├── module-name.controller.ts
├── module-name.service.ts
├── module-name.service.spec.ts
└── module-name.module.ts
```

### Frontend Architecture (React)

```
apps/web/src/
├── components/          # React components
│   ├── auth/           # Authentication components
│   ├── learning/       # Learning feature components
│   ├── projects/       # Project feature components
│   ├── interview/      # Interview feature components
│   ├── jobs/           # Job matching components
│   ├── productivity/   # Productivity components
│   ├── layout/         # Layout components
│   └── common/         # Shared components
├── pages/              # Page components
├── store/              # Zustand stores
├── lib/                # Utilities & API client
├── contexts/           # React contexts
├── utils/              # Helper functions
└── test/               # Test setup
```

## Development Workflow

### Creating a New Feature

1. **Create a spec (optional but recommended):**
```bash
# Create spec directory
mkdir -p .kiro/specs/my-feature

# Create requirements, design, and tasks documents
touch .kiro/specs/my-feature/requirements.md
touch .kiro/specs/my-feature/design.md
touch .kiro/specs/my-feature/tasks.md
```

2. **Generate NestJS module:**
```bash
cd apps/backend
npx nest generate module modules/my-feature
npx nest generate service modules/my-feature
npx nest generate controller modules/my-feature
```

3. **Create entity:**
```typescript
// apps/backend/src/entities/my-entity.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { User } from './user.entity';

@Entity('my_entities')
export class MyEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @ManyToOne(() => User)
  user: User;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
```

4. **Create migration:**
```bash
npm run migration:generate --workspace=apps/backend -- src/database/migrations/CreateMyEntity
```

5. **Implement service:**
```typescript
// apps/backend/src/modules/my-feature/my-feature.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MyEntity } from '../../entities/my-entity.entity';

@Injectable()
export class MyFeatureService {
  constructor(
    @InjectRepository(MyEntity)
    private myEntityRepository: Repository<MyEntity>,
  ) {}

  async create(userId: string, data: CreateMyEntityDto): Promise<MyEntity> {
    const entity = this.myEntityRepository.create({
      ...data,
      user: { id: userId },
    });
    return await this.myEntityRepository.save(entity);
  }

  async findAll(userId: string): Promise<MyEntity[]> {
    return await this.myEntityRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });
  }
}
```

6. **Create controller:**
```typescript
// apps/backend/src/modules/my-feature/my-feature.controller.ts
import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MyFeatureService } from './my-feature.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('My Feature')
@Controller('my-feature')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MyFeatureController {
  constructor(private readonly myFeatureService: MyFeatureService) {}

  @Post()
  @ApiOperation({ summary: 'Create new entity' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateMyEntityDto,
  ) {
    return await this.myFeatureService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all entities' })
  async findAll(@CurrentUser('id') userId: string) {
    return await this.myFeatureService.findAll(userId);
  }
}
```

7. **Write tests:**
```typescript
// apps/backend/src/modules/my-feature/my-feature.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MyFeatureService } from './my-feature.service';
import { MyEntity } from '../../entities/my-entity.entity';

describe('MyFeatureService', () => {
  let service: MyFeatureService;
  let mockRepository: any;

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MyFeatureService,
        {
          provide: getRepositoryToken(MyEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<MyFeatureService>(MyFeatureService);
  });

  it('should create entity', async () => {
    const dto = { name: 'Test' };
    const userId = 'user-id';
    const entity = { id: 'entity-id', ...dto };

    mockRepository.create.mockReturnValue(entity);
    mockRepository.save.mockResolvedValue(entity);

    const result = await service.create(userId, dto);

    expect(result).toEqual(entity);
    expect(mockRepository.create).toHaveBeenCalledWith({
      ...dto,
      user: { id: userId },
    });
  });
});
```

8. **Create frontend component:**
```typescript
// apps/web/src/components/my-feature/MyFeatureList.tsx
import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

export function MyFeatureList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const { data } = await api.get('/my-feature');
      setItems(data);
    } catch (error) {
      console.error('Failed to load items:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {items.map((item) => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
}
```

### Git Workflow

1. **Create feature branch:**
```bash
git checkout -b feature/my-feature
```

2. **Make changes and commit:**
```bash
git add .
git commit -m "feat: add my feature"
```

3. **Push to remote:**
```bash
git push origin feature/my-feature
```

4. **Create pull request**

5. **After review and approval, merge to main**

### Commit Message Convention

Follow conventional commits:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Examples:
```
feat: add resume upload endpoint
fix: resolve token expiration issue
docs: update API usage guide
test: add property tests for authentication
```

## Code Style and Standards

### TypeScript

- Use TypeScript strict mode
- Define interfaces for all data structures
- Use type inference where possible
- Avoid `any` type

```typescript
// Good
interface User {
  id: string;
  email: string;
  role: 'student' | 'developer' | 'professional';
}

function getUser(id: string): Promise<User> {
  // ...
}

// Bad
function getUser(id: any): any {
  // ...
}
```

### Naming Conventions

- **Files**: kebab-case (`user-profile.service.ts`)
- **Classes**: PascalCase (`UserProfileService`)
- **Functions/Variables**: camelCase (`getUserProfile`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRY_ATTEMPTS`)
- **Interfaces**: PascalCase with 'I' prefix optional (`User` or `IUser`)

### Code Organization

- Keep files under 300 lines
- One class/component per file
- Group related functionality in modules
- Use barrel exports (index.ts)

```typescript
// modules/auth/index.ts
export * from './auth.service';
export * from './auth.controller';
export * from './auth.module';
export * from './dto';
export * from './guards';
```

### Error Handling

Always handle errors gracefully:

```typescript
// Backend
try {
  const result = await this.someOperation();
  return result;
} catch (error) {
  this.logger.error('Operation failed', error.stack);
  throw new InternalServerErrorException('Failed to complete operation');
}

// Frontend
try {
  const { data } = await api.post('/endpoint', payload);
  return data;
} catch (error) {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.error?.message || 'An error occurred';
    toast.error(message);
  }
  throw error;
}
```

## Testing Guidelines

### Unit Tests

Write unit tests for:
- Service methods
- Utility functions
- Complex business logic

```typescript
describe('AuthService', () => {
  it('should hash password on registration', async () => {
    const password = 'password123';
    const user = await service.register({
      email: 'test@example.com',
      password,
      name: 'Test User',
      role: 'developer',
    });

    expect(user.passwordHash).not.toBe(password);
    expect(user.passwordHash).toMatch(/^\$2[aby]\$/);
  });
});
```

### Property-Based Tests

Use fast-check for universal properties:

```typescript
import * as fc from 'fast-check';

describe('Profile Updates', () => {
  it('should preserve data on round-trip', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 100 }),
          skills: fc.array(fc.string(), { minLength: 1 }),
        }),
        async (profileData) => {
          const user = await createTestUser();
          await service.updateProfile(user.id, profileData);
          const retrieved = await service.getProfile(user.id);
          
          expect(retrieved.name).toBe(profileData.name);
          expect(retrieved.skills).toEqual(profileData.skills);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Integration Tests

Test complete flows:

```typescript
describe('Authentication Flow (e2e)', () => {
  it('should register, login, and access protected route', async () => {
    // Register
    const registerResponse = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        role: 'developer',
      })
      .expect(201);

    const { accessToken } = registerResponse.body;

    // Access protected route
    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- auth.service.spec.ts

# Run property-based tests
npm test -- --testNamePattern="Property"
```

## API Development

### Creating DTOs

```typescript
import { IsString, IsEmail, MinLength, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePassword123!', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ enum: ['student', 'developer', 'professional'] })
  @IsEnum(['student', 'developer', 'professional'])
  role: string;
}
```

### Adding Swagger Documentation

```typescript
@Controller('users')
@ApiTags('Users')
@ApiBearerAuth()
export class UsersController {
  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async create(@Body() dto: CreateUserDto) {
    return await this.usersService.create(dto);
  }
}
```

### Background Jobs

Use Bull for async tasks:

```typescript
// In service
@InjectQueue('email')
private emailQueue: Queue;

async sendWelcomeEmail(userId: string) {
  await this.emailQueue.add('welcome', { userId });
}

// In processor
@Processor('email')
export class EmailProcessor {
  @Process('welcome')
  async handleWelcome(job: Job<{ userId: string }>) {
    const { userId } = job.data;
    // Send email
  }
}
```

## Frontend Development

### State Management with Zustand

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      setUser: (user) => set({ user }),
      setToken: (accessToken) => set({ accessToken }),
      logout: () => set({ user: null, accessToken: null }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
```

### API Client

```typescript
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Handle token refresh
    }
    return Promise.reject(error);
  }
);
```

### Component Best Practices

```typescript
// Use TypeScript
interface Props {
  userId: string;
  onUpdate?: (user: User) => void;
}

// Extract logic to custom hooks
function useUser(userId: string) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, [userId]);

  const loadUser = async () => {
    try {
      const { data } = await api.get(`/users/${userId}`);
      setUser(data);
    } finally {
      setLoading(false);
    }
  };

  return { user, loading, reload: loadUser };
}

// Keep components focused
export function UserProfile({ userId, onUpdate }: Props) {
  const { user, loading } = useUser(userId);

  if (loading) return <Skeleton />;
  if (!user) return <NotFound />;

  return <div>{user.name}</div>;
}
```

## Database Management

### Creating Migrations

```bash
# Generate migration from entity changes
npm run migration:generate --workspace=apps/backend -- src/database/migrations/AddUserPreferences

# Create empty migration
npm run typeorm migration:create --workspace=apps/backend -- src/database/migrations/AddIndexes
```

### Writing Migrations

```typescript
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddUserPreferences1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'user_profiles',
      new TableColumn({
        name: 'preferences',
        type: 'jsonb',
        isNullable: true,
        default: "'{}'",
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('user_profiles', 'preferences');
  }
}
```

### Running Migrations

```bash
# Run pending migrations
npm run migration:run --workspace=apps/backend

# Revert last migration
npm run migration:revert --workspace=apps/backend

# Show migration status
npm run typeorm migration:show --workspace=apps/backend
```

## Deployment

### Environment Configuration

Create environment-specific .env files:

```env
# .env.production
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@prod-db:5432/techmate
REDIS_URL=redis://prod-redis:6379
OPENAI_API_KEY=sk-prod-key
FRONTEND_URL=https://app.techmate.ai
```

### Building for Production

```bash
# Build all apps
npm run build

# Build specific app
npm run build --workspace=apps/backend
npm run build --workspace=apps/web
```

### Docker Deployment

```bash
# Build Docker images
docker build -t techmate-backend -f apps/backend/Dockerfile .
docker build -t techmate-web -f apps/web/Dockerfile .

# Run containers
docker run -p 3000:3000 --env-file .env.production techmate-backend
docker run -p 80:80 techmate-web
```

### Health Checks

Implement health check endpoints:

```typescript
@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('db')
  async checkDatabase() {
    // Check database connection
  }
}
```

## Additional Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [React Documentation](https://react.dev)
- [TypeORM Documentation](https://typeorm.io)
- [fast-check Documentation](https://fast-check.dev)
- [API Documentation](http://localhost:3000/api/docs)

## Support

For questions or issues:
- **Internal Wiki**: https://wiki.techmate.ai
- **Slack**: #engineering channel
- **Email**: engineering@techmate.ai
