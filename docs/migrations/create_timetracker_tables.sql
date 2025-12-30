-- Migration: Create timetracker_entries table for time tracking module
-- Uses existing projects table for project management (avoids duplication)
-- Supports both self (user) and group contexts with data isolation

-- Note: This migration uses the existing 'projects' table instead of creating
-- a separate timetracker_projects table. This ensures consistency across modules.

-- Create timetracker_entries table
-- Stores time tracking entries
CREATE TABLE timetracker_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL, -- Reference existing projects table
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE, -- NULL for personal entries, UUID for group entries
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE, -- NULL if still tracking
    duration_minutes INTEGER, -- Calculated duration in minutes (NULL if still tracking)
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_timetracker_entries_user_id ON timetracker_entries(user_id);
CREATE INDEX idx_timetracker_entries_group_id ON timetracker_entries(group_id);
CREATE INDEX idx_timetracker_entries_project_id ON timetracker_entries(project_id);
CREATE INDEX idx_timetracker_entries_user_group ON timetracker_entries(user_id, group_id);
CREATE INDEX idx_timetracker_entries_start_time ON timetracker_entries(start_time);
CREATE INDEX idx_timetracker_entries_created_at ON timetracker_entries(created_at);

-- Add constraints
ALTER TABLE timetracker_entries
ADD CONSTRAINT timetracker_entries_valid_duration CHECK (duration_minutes IS NULL OR duration_minutes >= 0);

-- Add comments
COMMENT ON TABLE timetracker_entries IS 'Time tracking entries';
COMMENT ON COLUMN timetracker_entries.group_id IS 'NULL for personal entries, UUID for group entries';
COMMENT ON COLUMN timetracker_entries.duration_minutes IS 'Calculated duration in minutes (NULL if still tracking)';
COMMENT ON COLUMN timetracker_entries.project_id IS 'References projects table for time tracking projects';

-- Create trigger for updated_at
CREATE TRIGGER update_timetracker_entries_updated_at
    BEFORE UPDATE ON timetracker_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE timetracker_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for timetracker_entries
-- Users can view their own entries and entries in groups they belong to
CREATE POLICY "Users can view their own entries and group entries" ON timetracker_entries
    FOR SELECT USING (
        user_id = auth.uid() OR
        group_id IN (
            SELECT group_id FROM group_members
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Users can insert their own entries
CREATE POLICY "Users can create their own entries" ON timetracker_entries
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own entries and entries in groups they belong to
CREATE POLICY "Users can update their own entries and group entries" ON timetracker_entries
    FOR UPDATE USING (
        user_id = auth.uid() OR
        group_id IN (
            SELECT group_id FROM group_members
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Users can delete their own entries and entries in groups they belong to
CREATE POLICY "Users can delete their own entries and group entries" ON timetracker_entries
    FOR DELETE USING (
        user_id = auth.uid() OR
        group_id IN (
            SELECT group_id FROM group_members
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- RLS Policies for timetracker_projects
-- Users can view their own projects and projects in groups they belong to
CREATE POLICY "Users can view their own projects and group projects" ON timetracker_projects
    FOR SELECT USING (
        user_id = auth.uid() OR
        group_id IN (
            SELECT group_id FROM group_members
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Users can insert their own projects
CREATE POLICY "Users can create their own projects" ON timetracker_projects
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own projects and projects in groups they belong to
CREATE POLICY "Users can update their own projects and group projects" ON timetracker_projects
    FOR UPDATE USING (
        user_id = auth.uid() OR
        group_id IN (
            SELECT group_id FROM group_members
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Users can delete their own projects and projects in groups they belong to
CREATE POLICY "Users can delete their own projects and group projects" ON timetracker_projects
    FOR DELETE USING (
        user_id = auth.uid() OR
        group_id IN (
            SELECT group_id FROM group_members
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- RLS Policies for timetracker_entries
-- Users can view their own entries and entries in groups they belong to
CREATE POLICY "Users can view their own entries and group entries" ON timetracker_entries
    FOR SELECT USING (
        user_id = auth.uid() OR
        group_id IN (
            SELECT group_id FROM group_members
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Users can insert their own entries
CREATE POLICY "Users can create their own entries" ON timetracker_entries
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own entries and entries in groups they belong to
CREATE POLICY "Users can update their own entries and group entries" ON timetracker_entries
    FOR UPDATE USING (
        user_id = auth.uid() OR
        group_id IN (
            SELECT group_id FROM group_members
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Users can delete their own entries and entries in groups they belong to
CREATE POLICY "Users can delete their own entries and group entries" ON timetracker_entries
    FOR DELETE USING (
        user_id = auth.uid() OR
        group_id IN (
            SELECT group_id FROM group_members
            WHERE user_id = auth.uid() AND is_active = true
        )
    );
