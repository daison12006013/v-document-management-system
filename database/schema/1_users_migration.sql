-- Migration: Add is_system_account column to users table
-- This migration adds protection for system accounts (like admin@vistra.com)

-- Add the column if it doesn't exist
ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_system_account BOOLEAN DEFAULT FALSE NOT NULL;

-- Update admin@vistra.com to be a system account
UPDATE users
SET is_system_account = TRUE
WHERE email = 'admin@vistra.com';

-- Add an index for quick lookups
CREATE INDEX IF NOT EXISTS idx_users_is_system_account ON users(is_system_account);

