# TechMate AI - Database Schema Documentation

## Overview

Complete database schema implementation for the TechMate AI platform using TypeORM with PostgreSQL and pgvector extension for vector similarity search.

## Entities Created

### Core Entities (Task 2.1)
- **User** - Authentication and user management
- **UserProfile** - User profile information with skills and goals
- **Subscription** - Subscription tier and payment tracking

### Learning Domain (Task 2.2)
- **Roadmap** - Learning paths for users
- **Milestone** - Individual learning milestones within roadmaps
- **Progress** - User progress tracking for milestones

### Project Domain (Task 2.3)
- **ProjectIdea** - AI-generated project ideas
- **ProjectArchitecture** - Project structure and architecture
- **CodeFile** - Generated starter code files

### Interview Domain (Task 2.4)
- **InterviewSession** - Mock interview sessions
- **Question** - Interview questions
- **Answer** - User answers with AI evaluations

### Job Matching Domain (Task 2.5)
- **Resume** - Uploaded resumes with parsed data
- **ResumeScore** - ATS compatibility scores
- **JobMatch** - Matched job opportunities

### Productivity Domain (Task 2.6)
- **Task** - User tasks with status and priority
- **Note** - User notes with tags
- **TimerSession** - Focus timer sessions
- **Reminder** - Scheduled reminders

### Vector Storage (Task 2.7)
- **EmbeddingDocument** - Vector embeddings for RAG with pgvector

## Key Features

### Relationships
- One-to-One: User ↔ UserProfile, User ↔ Subscription
- One-to-Many: User → Roadmaps, Roadmap → Milestones
- Many-to-One: All entities → User (ownership)

### Indexes
- Email uniqueness on User
- Composite indexes for efficient querying (userId + status, userId + createdAt)
- Vector similarity index using HNSW for fast nearest neighbor search

### Data Types
- UUID primary keys for all entities
- JSONB for flexible structured data (preferences, metadata, parsed data)
- Enums for constrained values (role, tier, status, difficulty)
- Timestamp columns for temporal tracking
- Vector type (pgvector) for embeddings

### Migrations
- `1700000000000-CreateCoreEntities.ts` - Core user and subscription tables
- `1700000001000-CreateVectorStorage.ts` - Vector storage with pgvector extension

## Vector Search

### VectorSearchService
Provides methods for:
- `findSimilar()` - Cosine similarity search
- `upsertEmbedding()` - Create/update embeddings
- `deleteBySource()` - Remove embeddings by source
- `deleteByUser()` - Remove all user embeddings

### Vector Index
- Uses HNSW (Hierarchical Navigable Small World) algorithm
- Optimized for cosine similarity
- Supports 1536-dimensional embeddings (OpenAI text-embedding-3-large)

## Migration Commands

```bash
# Run migrations
npm run migration:run --workspace=apps/backend

# Revert last migration
npm run migration:revert --workspace=apps/backend

# Generate new migration
npm run migration:generate --workspace=apps/backend -- src/database/migrations/MigrationName
```

## Database Configuration

### Environment Variables
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/techmate_dev
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=password
DATABASE_NAME=techmate_dev
```

### TypeORM Configuration
- Auto-load entities from `src/entities/**/*.entity.ts`
- Migrations in `src/database/migrations/`
- Synchronize disabled in production (use migrations)
- Logging enabled in development

## Entity Relationships Diagram

```
User
├── UserProfile (1:1)
├── Subscription (1:1)
├── Roadmaps (1:N)
│   └── Milestones (1:N)
├── Progress (1:N)
├── ProjectIdeas (1:N)
│   └── ProjectArchitecture (1:1)
│       └── CodeFiles (1:N)
├── InterviewSessions (1:N)
│   ├── Questions (1:N)
│   └── Answers (1:N)
├── Resumes (1:N)
│   └── ResumeScore (1:1)
├── JobMatches (1:N)
├── Tasks (1:N)
├── Notes (1:N)
├── TimerSessions (1:N)
├── Reminders (1:N)
└── EmbeddingDocuments (1:N)
```

## Next Steps

1. Run migrations to create database schema
2. Implement repository patterns in service layers
3. Add data validation and business logic
4. Create seed data for development
5. Set up database backups and replication for production

## Notes

- All entities use soft deletes where appropriate (CASCADE on foreign keys)
- Timestamps (created_at, updated_at) are automatically managed
- JSONB columns allow flexible schema evolution
- Vector search requires pgvector extension (included in docker-compose)
