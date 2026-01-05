-- Migration: Add Kitchen module to the modules table
-- This enables the Kitchen module in the settings for groups to enable/disable

-- Insert the Kitchen module
INSERT INTO modules (id, name, description, icon, category, default_enabled, route) VALUES
('kitchen', 'Kitchen', 'Manage inventory, meal planning, and groceries with AI', 'ChefHat', 'group', false, '/dashboard/kitchen');

-- Update comment to reflect new module
COMMENT ON TABLE modules IS 'Available modules that can be enabled for groups and users - includes Kitchen module for AI-powered meal planning and inventory management';
