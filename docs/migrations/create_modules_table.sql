-- Migration: Create modules table for dynamic module management
-- This replaces hardcoded modules with database-driven module configuration

-- Create modules table
CREATE TABLE modules (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL, -- Lucide icon name
    category TEXT NOT NULL CHECK (category IN ('group', 'user')),
    default_enabled BOOLEAN NOT NULL DEFAULT false,
    route TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_modules_category ON modules (category);
CREATE INDEX idx_modules_is_active ON modules (is_active);

-- Add comment
COMMENT ON TABLE modules IS 'Available modules that can be enabled for groups and users';
COMMENT ON COLUMN modules.icon IS 'Lucide icon name (e.g., Calendar, HeartHandshake)';
COMMENT ON COLUMN modules.category IS 'Module category: group (for groups) or user (for personal view)';
COMMENT ON COLUMN modules.default_enabled IS 'Whether this module is enabled by default';
COMMENT ON COLUMN modules.route IS 'Dashboard route path (e.g., /dashboard/calendar)';

-- Insert existing modules
INSERT INTO modules (id, name, description, icon, category, default_enabled, route) VALUES
('checkins', 'Check-ins', 'Share feelings and daily updates', 'HeartHandshake', 'group', false, '/dashboard/checkins'),
('finance', 'Finance', 'Track expenses and savings', 'Wallet', 'group', false, '/dashboard/finance'),
('goals', 'Goals', 'Set and track family goals', 'Target', 'group', false, '/dashboard/goals'),
('chat', 'Chat', 'Family messaging', 'MessagesSquare', 'group', true, '/dashboard/chat'),
('wishlist', 'Wishlist', 'Share wants and needs', 'ShoppingBag', 'group', false, '/dashboard/wishlist'),
('location', 'Location', 'Share locations', 'Map', 'group', false, '/dashboard/location'),
('calendar', 'Calendar', 'Shared calendar events', 'Calendar', 'user', true, '/dashboard/calendar'),
('todos', 'To Do', 'Personal, work, and group tasks', 'CheckSquare', 'user', true, '/dashboard/todos');

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON modules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();