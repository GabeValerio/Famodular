-- Migration: Add social media columns to users table
-- This allows users to add their social media profiles (Instagram, X/Twitter, Facebook, LinkedIn, etc.)

-- Add social media columns as TEXT fields (nullable)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS instagram TEXT,
ADD COLUMN IF NOT EXISTS x_twitter TEXT,
ADD COLUMN IF NOT EXISTS facebook TEXT,
ADD COLUMN IF NOT EXISTS linkedin TEXT,
ADD COLUMN IF NOT EXISTS tiktok TEXT,
ADD COLUMN IF NOT EXISTS youtube TEXT,
ADD COLUMN IF NOT EXISTS github TEXT,
ADD COLUMN IF NOT EXISTS website TEXT;

-- Add comments to document the columns
COMMENT ON COLUMN users.instagram IS 'Instagram profile username or URL';
COMMENT ON COLUMN users.x_twitter IS 'X (Twitter) profile username or URL';
COMMENT ON COLUMN users.facebook IS 'Facebook profile username or URL';
COMMENT ON COLUMN users.linkedin IS 'LinkedIn profile username or URL';
COMMENT ON COLUMN users.tiktok IS 'TikTok profile username or URL';
COMMENT ON COLUMN users.youtube IS 'YouTube channel username or URL';
COMMENT ON COLUMN users.github IS 'GitHub profile username or URL';
COMMENT ON COLUMN users.website IS 'Personal website URL';





