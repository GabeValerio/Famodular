-- Migration: Update group module defaults
-- Change group default modules to only enable calendar and chat by default
-- This provides a cleaner starting experience for new groups

-- Update the default value for the enabled_modules column in groups table
-- New default: Only Calendar and Chat enabled for new groups
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
  "todos": false
}'::jsonb;

-- Update existing groups that have the old default (all modules enabled)
-- Only update groups that have all modules enabled (indicating they haven't been customized)
UPDATE groups
SET enabled_modules = '{
  "checkins": false,
  "finance": false,
  "goals": false,
  "chat": true,
  "wishlist": false,
  "location": false,
  "calendar": true,
  "todos": false
}'::jsonb
WHERE enabled_modules::text = '{
  "checkins": true,
  "finance": true,
  "goals": true,
  "chat": true,
  "wishlist": true,
  "location": true,
  "calendar": true,
  "todos": true
}'::text;

-- Add comment to document the change
COMMENT ON COLUMN groups.enabled_modules IS 'Module configuration for groups. Defaults to calendar and chat enabled for cleaner group setup.';







