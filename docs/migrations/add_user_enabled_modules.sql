-- Migration: Add enabled_modules column to users table
-- This allows users to configure which modules are enabled for their personal view
-- All modules can be enabled/disabled in personal context (no category restrictions)

-- Add enabled_modules JSONB column with default values
-- Default: Only Calendar and To Do enabled for new users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS enabled_modules JSONB DEFAULT '{
  "checkins": false,
  "finance": false,
  "goals": false,
  "chat": false,
  "wishlist": false,
  "location": false,
  "calendar": true,
  "todos": true
}'::jsonb;

-- Add comment to document the column
COMMENT ON COLUMN users.enabled_modules IS 'Configuration for user-level modules. All modules can be enabled/disabled in personal context. Stored as JSONB with boolean values for each module.';

-- Create index for faster queries (optional, but recommended for JSONB columns)
CREATE INDEX IF NOT EXISTS idx_users_enabled_modules ON users USING GIN (enabled_modules);

-- Update existing users to have default module configuration if they don't have one
-- Default: Only Calendar and To Do enabled
UPDATE users 
SET enabled_modules = '{
  "checkins": false,
  "finance": false,
  "goals": false,
  "chat": false,
  "wishlist": false,
  "location": false,
  "calendar": true,
  "todos": true
}'::jsonb
WHERE enabled_modules IS NULL;



