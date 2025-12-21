# Todos Module Database Schema

## Table: `projects`

This table stores projects that can contain multiple todos for better organization.

### SQL Schema

```sql
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6366f1', -- Hex color for UI customization
  userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_projects_user_id ON projects(userId);
CREATE INDEX idx_projects_created_at ON projects(createdAt DESC);

-- RLS (Row Level Security) policies
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Users can only see their own projects
CREATE POLICY "Users can view their own projects"
  ON projects FOR SELECT
  USING (auth.uid()::text = "userId"::text);

-- Users can insert their own projects
CREATE POLICY "Users can insert their own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid()::text = "userId"::text);

-- Users can update their own projects
CREATE POLICY "Users can update their own projects"
  ON projects FOR UPDATE
  USING (auth.uid()::text = "userId"::text);

-- Users can delete their own projects
CREATE POLICY "Users can delete their own projects"
  ON projects FOR DELETE
  USING (auth.uid()::text = "userId"::text);
```

## Table: `todos`

This table stores todos with support for Personal, Work, and Group categories. Todos can optionally belong to a project.

### SQL Schema

```sql
CREATE TABLE todos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT false,
  category TEXT NOT NULL CHECK (category IN ('personal', 'work', 'group')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  groupId UUID REFERENCES groups(id) ON DELETE CASCADE,
  projectId UUID REFERENCES projects(id) ON DELETE SET NULL, -- Optional - todos can belong to a project
  dueDate TIMESTAMP WITH TIME ZONE,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_todos_user_id ON todos(userId);
CREATE INDEX idx_todos_group_id ON todos(groupId);
CREATE INDEX idx_todos_project_id ON todos(projectId);
CREATE INDEX idx_todos_category ON todos(category);
CREATE INDEX idx_todos_completed ON todos(completed);
CREATE INDEX idx_todos_created_at ON todos(createdAt DESC);

-- RLS (Row Level Security) policies
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- Users can only see their own todos
CREATE POLICY "Users can view their own todos"
  ON todos FOR SELECT
  USING (auth.uid()::text = "userId"::text);

-- Users can insert their own todos
CREATE POLICY "Users can insert their own todos"
  ON todos FOR INSERT
  WITH CHECK (auth.uid()::text = "userId"::text);

-- Users can update their own todos
CREATE POLICY "Users can update their own todos"
  ON todos FOR UPDATE
  USING (auth.uid()::text = "userId"::text);

-- Users can delete their own todos
CREATE POLICY "Users can delete their own todos"
  ON todos FOR DELETE
  USING (auth.uid()::text = "userId"::text);
```

### Notes

**Projects:**
- `name` is required
- `color` defaults to '#6366f1' (indigo) but can be customized
- `description` is optional
- `createdAt` and `updatedAt` are automatically managed

**Todos:**
- `category` must be one of: 'personal', 'work', 'group'
- `priority` must be one of: 'low', 'medium', 'high' (defaults to 'medium')
- `groupId` is optional - only required for 'group' category todos
- `projectId` is optional - todos can be organized under projects
- When `category` is 'group', `groupId` should be provided
- When a project is deleted, todos with that `projectId` will have it set to NULL (not deleted)
- `completed` defaults to `false`
- `createdAt` and `updatedAt` are automatically managed

### Example Queries

```sql
-- Get all projects for a user
SELECT * FROM projects 
WHERE userId = 'user-id'
ORDER BY createdAt DESC;

-- Get all todos for a specific project
SELECT * FROM todos 
WHERE projectId = 'project-id' AND userId = 'user-id'
ORDER BY createdAt DESC;

-- Get all personal todos for a user
SELECT * FROM todos 
WHERE userId = 'user-id' AND category = 'personal' AND completed = false
ORDER BY createdAt DESC;

-- Get all group todos for a specific group
SELECT * FROM todos 
WHERE groupId = 'group-id' AND category = 'group'
ORDER BY createdAt DESC;

-- Get todos by priority
SELECT * FROM todos 
WHERE userId = 'user-id' AND priority = 'high' AND completed = false
ORDER BY dueDate ASC NULLS LAST;

-- Get todos grouped by project
SELECT 
  p.id as project_id,
  p.name as project_name,
  p.color as project_color,
  COUNT(t.id) as todo_count,
  COUNT(CASE WHEN t.completed = false THEN 1 END) as active_count
FROM projects p
LEFT JOIN todos t ON t.projectId = p.id AND t.userId = p.userId
WHERE p.userId = 'user-id'
GROUP BY p.id, p.name, p.color
ORDER BY p.createdAt DESC;
```
