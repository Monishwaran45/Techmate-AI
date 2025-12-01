# TechMate AI Platform

A comprehensive AI-powered tech mentorship platform for learning, project generation, interview preparation, and job matching.

## Project Structure

```
techmate-ai-platform/
├── apps/
│   ├── backend/          # NestJS backend API
│   ├── web/              # React web application
│   └── mobile/           # React Native mobile app
├── packages/
│   └── shared-types/     # Shared TypeScript types
├── docker-compose.yml    # Docker development environment
└── package.json          # Monorepo configuration
```

## Prerequisites

- Node.js 20+
- npm 9+
- Docker and Docker Compose
- Git

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Start Development Environment

```bash
# Start Docker services (PostgreSQL, Redis, pgvector)
docker-compose up -d

# Run all applications in development mode
npm run dev
```

### 4. Access Applications

- Backend API: http://localhost:3000
- Web Frontend: http://localhost:5173
- API Documentation: http://localhost:3000/api/docs

## Available Scripts

- `npm run dev` - Start all applications in development mode
- `npm run build` - Build all applications
- `npm run test` - Run all tests
- `npm run lint` - Lint all code
- `npm run format` - Format all code with Prettier

## Technology Stack

### Frontend
- React 18+ with TypeScript
- Vite for build tooling
- Tailwind CSS + shadcn/ui
- Zustand for state management
- React Query for server state

### Backend
- Node.js 20+ with TypeScript
- NestJS framework
- TypeORM for database ORM
- PostgreSQL with pgvector
- Redis for caching and queues
- Bull for job processing

### Mobile
- React Native with Expo
- TypeScript
- NativeWind for styling
- React Navigation

### AI Integration
- OpenAI API (GPT-4)
- LangChain for RAG
- Vector embeddings for semantic search

## Development Workflow

1. Create feature branches from `main`
2. Write tests for new features
3. Ensure all tests pass: `npm test`
4. Format code: `npm run format`
5. Lint code: `npm run lint`
6. Submit pull request

## Testing

The project uses a dual testing approach:

- **Unit Tests**: Jest for specific examples and edge cases
- **Property-Based Tests**: fast-check for universal correctness properties

Run tests:
```bash
npm test
```

## Documentation

Comprehensive documentation is available in the `docs/` directory:

### Development
- **[Setup Guide](SETUP.md)** - Initial project setup
- **[Developer Guide](docs/DEVELOPER_GUIDE.md)** - Development setup and best practices
- **[API Usage Guide](docs/API_USAGE_GUIDE.md)** - Complete API reference with examples
- **[Troubleshooting Guide](docs/TROUBLESHOOTING.md)** - Common issues and solutions

### Architecture
- **[Authentication Guide](AUTHENTICATION.md)** - Authentication flow and security
- **[Database Schema](DATABASE_SCHEMA.md)** - Database structure and migrations

### Deployment & Operations
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Production deployment instructions
- **[Mobile Deployment](apps/mobile/DEPLOYMENT.md)** - Mobile app store deployment
- **[Monitoring Guide](docs/MONITORING.md)** - Monitoring, logging, and alerting
- **[DevOps Summary](docs/DEVOPS_SUMMARY.md)** - CI/CD and infrastructure overview
- **[CI/CD Setup](.github/README.md)** - GitHub Actions workflows

### Quick Links

- **API Documentation**: http://localhost:3000/api/docs (Swagger UI)
- **Architecture Overview**: See [Developer Guide](docs/DEVELOPER_GUIDE.md#project-architecture)
- **API Examples**: See [API Usage Guide](docs/API_USAGE_GUIDE.md#code-examples)

## License

Proprietary - All rights reserved
