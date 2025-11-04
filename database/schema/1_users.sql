-- Initial schema file
-- Add your database schema here
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Example table (remove or modify as needed)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    is_system_account BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
-- Note: UNIQUE constraint on email automatically creates an index, but we're explicit here
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Primary key automatically creates an index on id, but we're explicit for clarity
CREATE INDEX IF NOT EXISTS idx_users_id ON users(id);

CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
