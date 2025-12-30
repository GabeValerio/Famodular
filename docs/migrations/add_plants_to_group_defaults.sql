-- Migration: Add plants module to group enabled_modules defaults
-- This adds plants: false to the default enabled_modules for new groups
-- Existing groups will get plants: false when they update their settings

-- Update the default value for the enabled_modules column in groups table
ALTER TABLE groups
ALTER COLUMN enabled_modules
SET DEFAULT '{
  "checkins": false,
  "finance": false,
  "goals": false,
  "chat": true,
  "wishlist": false,
  "location": false,
  "calendar": true,
  "todos": false,
  "plants": false
}'::jsonb;

-- Add plants: false to existing groups that don't have it
-- This ensures consistency across all groups
UPDATE groups
SET enabled_modules = enabled_modules || '{"plants": false}'::jsonb
WHERE enabled_modules::jsonb ? 'plants' = false;




