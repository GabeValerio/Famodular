# Task Planner - Data Storage Guide

This document explains how tasks should be saved and managed in your Task Planner application.

## Data Structure Overview

### Core Entities

#### Task
The main entity representing a task in the system:

```typescript
interface Task {
  id: string;                    // Unique identifier
  text?: string;                 // Task description/title
  title?: string;                // Alternative title field
  completed?: boolean;           // Completion status
  completed_at?: string | null;  // ISO timestamp when completed
  type?: string;                 // Task category (personal, finance, quick, etc.)
  goal_id?: string;              // Associated goal ID
  parent_id?: string | null;     // Parent task ID for subtasks
  created_at?: string;           // ISO timestamp when created
  priority?: number;             // Priority level (1=highest, higher numbers=lower priority)
  due_date?: string | null;      // Due date in ISO format
  end_date?: string | null;      // End date for multi-day tasks
  datetime?: Date;               // Alternative datetime field
  children?: Task[];             // Nested subtasks
  exception?: boolean;           // Exception flag
  estimated_time?: number | null; // Estimated minutes to complete
  completed_time?: number | null; // Actual minutes spent
  description?: string;          // Detailed description
  timezone?: string;             // IANA timezone identifier
  // Recurring task fields
  is_recurring?: boolean;
  recurrence_pattern?: string;   // 'daily', 'weekly', 'monthly', 'yearly'
  recurrence_interval?: number;  // Every N units
  recurrence_day_of_week?: number[]; // [0-6] for Sunday-Saturday
  recurrence_day_of_month?: number[]; // [1-31]
  recurrence_month?: number[];   // [0-11] for January-December
  recurrence_end_date?: string | null;
  recurrence_count?: number | null;
  // Additional fields
  end_time?: string;
  image_url?: string | null;
  scheduled_time?: string;
}
```

#### Goal
Represents a goal that tasks can be associated with:

```typescript
interface Goal {
  id: string;
  text: string;
  goal?: string;        // Goal description
  progress?: number;    // Progress percentage (0-100)
  created_at?: string;
}
```

#### TaskCompletion
Tracks daily completion status for recurring tasks:

```typescript
interface TaskCompletion {
  id: string;
  task_id: string;
  user_id: string;
  completion_date: string;  // YYYY-MM-DD format
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}
```

## Database Schema Recommendations

### Tables

#### tasks
```sql
CREATE TABLE tasks (
  id VARCHAR(255) PRIMARY KEY,
  text TEXT,
  title TEXT,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP NULL,
  type VARCHAR(50),
  goal_id VARCHAR(255),
  parent_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  priority INTEGER,
  due_date TIMESTAMP NULL,
  end_date TIMESTAMP NULL,
  exception BOOLEAN DEFAULT FALSE,
  estimated_time INTEGER NULL,
  completed_time INTEGER NULL,
  description TEXT,
  timezone VARCHAR(100),
  -- Recurring fields
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_pattern VARCHAR(20),
  recurrence_interval INTEGER DEFAULT 1,
  recurrence_day_of_week JSON, -- Array of integers [0-6]
  recurrence_day_of_month JSON, -- Array of integers [1-31]
  recurrence_month JSON, -- Array of integers [0-11]
  recurrence_end_date DATE NULL,
  recurrence_count INTEGER NULL,
  -- Additional fields
  end_time TIME,
  image_url TEXT,
  scheduled_time TIME,
  -- Foreign keys
  FOREIGN KEY (goal_id) REFERENCES goals(id),
  FOREIGN KEY (parent_id) REFERENCES tasks(id)
);
```

#### goals
```sql
CREATE TABLE goals (
  id VARCHAR(255) PRIMARY KEY,
  text TEXT NOT NULL,
  goal TEXT,
  progress INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### task_completions
```sql
CREATE TABLE task_completions (
  id VARCHAR(255) PRIMARY KEY,
  task_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  completion_date DATE NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  -- Foreign keys
  FOREIGN KEY (task_id) REFERENCES tasks(id),
  -- Composite unique constraint
  UNIQUE(task_id, completion_date)
);
```

## API Endpoints

### Task Management

#### GET /api/tasks
- **Purpose**: Fetch all tasks for the current user
- **Query Parameters**:
  - `completed`: Filter by completion status
  - `type`: Filter by task type
  - `goal_id`: Filter by associated goal
  - `due_before`: Filter tasks due before date
  - `due_after`: Filter tasks due after date
- **Response**: Array of Task objects

#### POST /api/tasks
- **Purpose**: Create a new task
- **Body**: Task object (without id, created_at)
- **Response**: Created Task object with id and timestamps

#### PUT /api/tasks/:id
- **Purpose**: Update an existing task
- **Body**: Partial Task object
- **Response**: Updated Task object

#### DELETE /api/tasks/:id
- **Purpose**: Delete a task
- **Response**: Success confirmation

### Task Completion Tracking

#### POST /api/tasks/:id/complete
- **Purpose**: Mark a task as completed
- **Body**: `{ completed: boolean, completed_time?: number }`
- **Response**: Updated Task object

#### POST /api/tasks/:id/daily-completion
- **Purpose**: Record daily completion for recurring tasks
- **Body**: `{ date: "YYYY-MM-DD", completed: boolean }`
- **Response**: Created/Updated TaskCompletion object

### Goal Management

#### GET /api/goals
- **Purpose**: Fetch all goals
- **Response**: Array of Goal objects

#### POST /api/goals
- **Purpose**: Create a new goal
- **Body**: Goal object (without id, created_at)
- **Response**: Created Goal object

## Data Flow Patterns

### Creating a Task

1. **Client-side**: User fills out AddTaskForm
2. **API Call**: POST /api/tasks with task data
3. **Server-side**:
   - Validate input data
   - Generate unique ID
   - Set created_at timestamp
   - Handle recurring task logic (generate future instances if needed)
   - Save to database
4. **Response**: Return created task with all fields populated

### Completing a Task

1. **Client-side**: User clicks complete checkbox
2. **API Call**: PUT /api/tasks/:id with `{ completed: true, completed_at: timestamp }`
3. **Server-side**:
   - Update task completion status
   - If recurring task, create/update TaskCompletion record
   - Update any parent task progress if applicable
4. **Response**: Return updated task

### Recurring Tasks

For recurring tasks, you have two approaches:

#### Approach 1: Generate Future Instances
- When creating a recurring task, generate all future instances upfront
- Each instance is a separate Task record with `original_task_id` pointing to the parent

#### Approach 2: Dynamic Generation (Recommended)
- Store only the recurring rule in the original task
- Generate instances on-demand when displaying the calendar
- Create actual Task records only when instances are modified individually

## File Upload Handling

### Image Uploads

Tasks support image attachments:

1. **Client-side**: User selects image file
2. **API Call**: POST /api/upload with FormData containing file
3. **Server-side**: Upload to cloud storage (Cloudinary, AWS S3, etc.)
4. **Response**: Return secure URL
5. **Update Task**: PUT /api/tasks/:id with `{ image_url: url }`

### Recommended Storage Solutions

- **Cloudinary**: Excellent for image optimization and transformation
- **AWS S3**: Scalable object storage
- **Supabase Storage**: If using Supabase as your backend

## Timezone Handling

### Best Practices

1. **Store all dates in UTC**: Convert to UTC before saving to database
2. **Store timezone information**: Keep track of user's preferred timezone
3. **Display in user's timezone**: Convert UTC dates to user's timezone for display
4. **Use IANA timezone identifiers**: e.g., "America/New_York", "Europe/London"

### Implementation

```typescript
// When saving a due date
const utcDate = new Date(dateInput + 'T' + timeInput + ':00');
task.due_date = utcDate.toISOString();

// When displaying
const userDate = new Date(task.due_date).toLocaleString('en-US', {
  timeZone: userTimezone,
  dateStyle: 'medium'
});
```

## Priority System

### Implementation

- **Priority 1**: Highest priority (urgent, important)
- **Priority 2-5**: Medium priority
- **Priority 6+**: Lower priority
- **Default**: Priority 0 (no priority set)

Tasks are typically sorted by priority ascending (1 first), then by due date.

## Error Handling

### Common Error Scenarios

1. **Invalid dates**: Due dates in the past, invalid date formats
2. **Circular dependencies**: Parent task cannot be a child of its own child
3. **Missing required fields**: Title/text is required
4. **Invalid recurrence rules**: End date before start date
5. **File upload failures**: Network errors, unsupported file types

### Error Response Format

```json
{
  "error": "ValidationError",
  "message": "Task title is required",
  "field": "title"
}
```

## Performance Considerations

### Indexing Strategy

```sql
-- Essential indexes
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_completed ON tasks(completed);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_type ON tasks(type);
CREATE INDEX idx_tasks_goal_id ON tasks(goal_id);
CREATE INDEX idx_task_completions_task_date ON task_completions(task_id, completion_date);
```

### Query Optimization

1. **Pagination**: Use LIMIT/OFFSET for large task lists
2. **Filtering**: Implement efficient filtering on commonly used fields
3. **Caching**: Cache frequently accessed data (goals, task types)
4. **Batch operations**: Allow bulk updates for multiple tasks

## Migration Strategy

When implementing this in an existing project:

1. **Create tables**: Start with basic task/goal tables
2. **Migrate existing data**: Convert existing task data to new format
3. **Add features incrementally**: Start with basic CRUD, then add advanced features
4. **Update frontend**: Modify existing components to use new data structure
5. **Add validation**: Implement server-side validation for all endpoints

## Testing Strategy

### Unit Tests
- Task creation/validation logic
- Date conversion and timezone handling
- Recurring task generation
- Priority sorting

### Integration Tests
- API endpoints
- Database operations
- File upload functionality
- User authentication (if applicable)

### E2E Tests
- Complete task creation workflow
- Task completion and updating
- Recurring task management
- Goal association
