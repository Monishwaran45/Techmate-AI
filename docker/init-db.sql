-- Initialize TechMate AI Database
-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Create initial database schema
-- Tables will be created by TypeORM migrations

-- Create a test user for development
-- Password: 'password' (hashed with bcrypt)
-- This will be replaced by proper user registration in the application

-- Set up database permissions
GRANT ALL PRIVILEGES ON DATABASE techmate_dev TO postgres;

-- Log initialization
DO $$
BEGIN
  RAISE NOTICE 'TechMate AI database initialized successfully';
  RAISE NOTICE 'pgvector extension enabled';
END $$;
