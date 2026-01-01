-- Migration: Add plants module to the modules table
-- This adds the plants module so it can be enabled in group settings

-- Insert the plants module
INSERT INTO modules (id, name, description, icon, category, default_enabled, route) 
VALUES ('plants', 'Plants', 'Track and care for house plants', 'Sprout', 'group', false, '/dashboard/plants')
ON CONFLICT (id) DO UPDATE
SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  category = EXCLUDED.category,
  route = EXCLUDED.route,
  is_active = true;






