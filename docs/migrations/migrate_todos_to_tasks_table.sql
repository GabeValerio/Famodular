-- Migration: Migrate todos table data to tasks table
-- Date: 2025-01-XX
-- Description: 
--   This migration consolidates the todos and tasks tables into a single tasks table.
--   Todos and tasks serve the same purpose, so we migrated all todos data to tasks
--   and updated the todos API routes to use the tasks table.
--
--   Key mappings:
--   - todos.category -> tasks.type (personal/work/group)
--   - todos.priority (text: 'low'/'medium'/'high') -> tasks.priority (integer: 3/2/1)
--
--   The todos API routes now use the tasks table but maintain backward compatibility
--   by converting type->category and integer priority->text priority in API responses.

-- Migrate todos data to tasks table
INSERT INTO tasks (
  id,
  user_id,
  group_id,
  title,
  text,
  description,
  type,
  completed,
  completed_at,
  priority,
  due_date,
  end_date,
  timezone,
  scheduled_time,
  end_time,
  estimated_time,
  completed_time,
  goal_id,
  parent_id,
  project_id,
  is_recurring,
  recurrence_pattern,
  recurrence_interval,
  recurrence_day_of_week,
  recurrence_day_of_month,
  recurrence_month,
  recurrence_end_date,
  recurrence_count,
  original_task_id,
  exception,
  image_url,
  created_at,
  updated_at
)
SELECT 
  id,
  user_id,
  group_id,
  title,
  COALESCE(text, title) as text,
  description,
  -- Map category to type: category 'personal' -> type 'personal', 'work' -> 'work', 'group' -> 'group'
  COALESCE(category, 'personal') as type,
  COALESCE(completed, false),
  completed_at,
  -- Convert text priority to integer: 'high'->1, 'medium'->2, 'low'->3, default->0
  CASE 
    WHEN priority::text = 'high' THEN 1
    WHEN priority::text = 'medium' THEN 2
    WHEN priority::text = 'low' THEN 3
    ELSE COALESCE(priority::integer, 0)
  END as priority,
  due_date,
  end_date,
  COALESCE(timezone, 'America/New_York'),
  scheduled_time,
  end_time,
  estimated_time,
  completed_time,
  goal_id,
  parent_id,
  project_id,
  COALESCE(is_recurring, false),
  recurrence_pattern,
  recurrence_interval,
  recurrence_day_of_week,
  recurrence_day_of_month,
  recurrence_month,
  recurrence_end_date,
  recurrence_count,
  original_task_id,
  COALESCE(exception, false),
  image_url,
  created_at,
  updated_at
FROM todos
WHERE NOT EXISTS (
  SELECT 1 FROM tasks WHERE tasks.id = todos.id
)
ON CONFLICT (id) DO NOTHING;

-- Note: The todos table is left intact for now but is no longer used.
-- All todos API routes now use the tasks table instead.
-- You can drop the todos table in a future migration if desired:
--   DROP TABLE IF EXISTS todos CASCADE;





