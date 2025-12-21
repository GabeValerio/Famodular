-- Migration: Add default_view column to users table
-- This allows users to configure their preferred starting view (Self vs specific group)

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS default_view TEXT DEFAULT 'self';

COMMENT ON COLUMN users.default_view IS 'Preferred starting view for the user. Can be "self" or a group ID.';

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_users_default_view ON users(default_view);

