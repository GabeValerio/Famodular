-- Migration: Fix user module defaults
-- Users who were created with the old defaults might have all modules enabled.
-- This migration updates those users to the new clean default (only Calendar and To Do).

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
WHERE enabled_modules::text LIKE '%"finance": true%' 
  AND enabled_modules::text LIKE '%"goals": true%'
  AND enabled_modules::text LIKE '%"checkins": true%';







