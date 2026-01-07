-- Add group_id column to projects table for data isolation
-- NULL = self/personal projects
-- UUID = group projects

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES groups(id) ON DELETE CASCADE;

-- Add index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_projects_group_id ON projects(group_id);

-- Add index for user_id + group_id queries (common filter pattern)
CREATE INDEX IF NOT EXISTS idx_projects_user_group ON projects(user_id, group_id);

-- Add comment
COMMENT ON COLUMN projects.group_id IS 'NULL for self/personal projects, UUID for group projects. Enables data isolation between self and group contexts.';







