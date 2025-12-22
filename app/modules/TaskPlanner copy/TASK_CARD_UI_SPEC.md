# Task Card UI Specification

This document provides the exact UI specifications for the Task Card component to enable replication in other projects.

## Visual Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  [Icon]  Task Title Text                          [+] [✏️] [🗑️] [○] │
│          06/21                                                      │
│                                                   Goal Label      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Component Structure

### Layout (Flexbox, Row Direction)
- **Container**: `flex items-start gap-3 p-3`
- **Icon Section**: Left, fixed width, top-aligned
- **Content Section**: Center, flexible (flex-1), min-width-0 for text truncation
- **Action Buttons**: Right, fixed width, horizontally aligned

## Detailed Specifications

### 1. Icon (Left Side)
- **Size**: 20px × 20px (w-5 h-5)
- **Position**: Left side, top-aligned (mt-0.5 for slight offset)
- **Type**: Dynamic based on task type (from TaskTypeIcon component)
- **Colors**: Varies by task type (Personal, Finance, Quick, Music, etc.)

### 2. Task Title (Center)
- **Font**: Bold/Semibold (font-semibold)
- **Color**: 
  - Default: `text-gray-900` (black)
  - Completed: `text-gray-500` with `line-through`
- **Behavior**: 
  - Can wrap (break-words)
  - Takes remaining horizontal space
- **Text**: From `task.text` or `task.title`

### 3. Date (Below Title, Left-Aligned)
- **Format**: MM/DD (e.g., "06/21", "11/23")
- **Font Size**: Extra small (text-xs)
- **Color**: `text-gray-500` (medium gray)
- **Position**: Below title, left-aligned
- **Spacing**: `mt-1` (4px margin-top)
- **Visibility**: Only shown if `task.due_date` exists

### 4. Goal Label (Bottom Right, Optional)
- **Font Size**: Extra small (text-xs)
- **Color**: `text-gray-400` (light gray)
- **Position**: Bottom right of content area
- **Spacing**: `mt-1` (4px margin-top)
- **Alignment**: `text-right`
- **Visibility**: Only shown if `showGoalLabel={true}` and task has a `goal_id`
- **Content**: Goal name from `goals` array

### 5. Action Buttons (Right Side)

#### Container
- **Layout**: `flex items-center gap-1`
- **Width**: Fixed (flex-shrink-0)
- **Position**: Right side of card
- **Gap**: 4px between buttons (gap-1)

#### Individual Buttons
All buttons share these base styles:
- **Size**: 28px × 28px (h-7 w-7)
- **Padding**: 0 (p-0)
- **Variant**: Ghost (no background, only on hover)
- **Shape**: Rounded (`rounded`)
- **Hover**: Light gray background (`hover:bg-gray-100`)

#### Button 1: Plus (+) - Add Subtask
- **Icon**: Plus (Plus from lucide-react)
- **Size**: 16px × 16px (w-4 h-4)
- **Color**: `text-gray-700` (dark gray)
- **Action**: Calls `onAddSubtask(task.id)`
- **Tooltip**: "Add subtask"

#### Button 2: Pencil (✏️) - Edit Task
- **Icon**: Pencil (Pencil from lucide-react)
- **Size**: 16px × 16px (w-4 h-4)
- **Color**: `text-gray-700` (dark gray)
- **Action**: Calls `onTaskEdit(task)`
- **Tooltip**: "Edit task"

#### Button 3: Trash (🗑️) - Delete Task
- **Icon**: Trash2 (Trash2 from lucide-react)
- **Size**: 16px × 16px (w-4 h-4)
- **Color**: 
  - Default: `text-gray-600` (medium gray)
  - Hover: `text-red-600` (red) with `hover:bg-red-50`
- **Action**: Calls `onTaskDelete(task.id)`
- **Tooltip**: "Delete task"

#### Button 4: Circle/Check (○/✓) - Toggle Completion
- **Icon**: 
  - Incomplete: Circle (Circle from lucide-react)
  - Complete: CheckCircle2 (CheckCircle2 from lucide-react)
- **Size**: 20px × 20px (w-5 h-5)
- **Color**: 
  - Incomplete: `text-gray-400` (light gray)
  - Complete: `text-green-600` (green)
- **Action**: Calls `onTaskToggle(task)`
- **Tooltip**: "Mark complete" or "Mark incomplete"

## Styling Details

### Card Container
- **Background**: White (`bg-white`)
- **Border**: Subtle border (`border`)
- **Border Radius**: Rounded corners (`rounded-lg` = 8px)
- **Padding**: 12px all sides (`p-3`)
- **Shadow**: 
  - Default: None
  - Hover: Medium shadow (`hover:shadow-md`)
- **Transition**: Smooth shadow transition (`transition-shadow`)
- **Opacity**: 
  - Default: 100%
  - Completed: 75% (`opacity-75`)

### Compact Version (for nested tasks)
- **Background**: 
  - Default: `bg-purple-50` (light purple)
  - Completed: `bg-gray-50` (light gray)
- **Border**: `border-purple-100` (light purple border)
- **Other styles**: Same as full version

## Spacing & Layout

### Gaps
- **Main container gap**: 12px (`gap-3`) - between icon, content, and buttons
- **Button gap**: 4px (`gap-1`) - between action buttons

### Padding
- **Card padding**: 12px (`p-3`)
- **Button padding**: 0 (`p-0`) - icons fill the button

### Margins
- **Date margin-top**: 4px (`mt-1`)
- **Goal label margin-top**: 4px (`mt-1`)
- **Icon top offset**: 2px (`mt-0.5`) - slight visual alignment

## Interactive States

### Hover States
- **Card**: Shows shadow (`hover:shadow-md`)
- **Buttons**: Light gray background (`hover:bg-gray-100`)
- **Delete button**: Red text and light red background on hover

### Completed State
- **Title**: Strikethrough + gray color
- **Card**: 75% opacity
- **Checkbox**: Green checkmark icon

### Click Behavior
- **Card click**: Selects task (if `setSelectedTask` provided)
- **Button clicks**: `e.stopPropagation()` to prevent card selection
- **All buttons**: Have `type="button"` to prevent form submission

## TypeScript Interface

```typescript
interface TaskCardProps {
  task: Task;                                    // Required task object
  goals: Goal[];                                 // Goals array for label lookup
  onTaskToggle?: (task: Task) => void;          // Completion toggle handler
  onTaskDelete?: (taskId: string) => void;      // Delete handler
  onTaskEdit?: (task: Task) => void;            // Edit handler
  onAddSubtask?: (taskId: string) => void;      // Add subtask handler
  showGoalLabel?: boolean;                       // Show goal label (default: false)
  compact?: boolean;                             // Use compact style (default: false)
}
```

## CSS Classes Summary

### Container
```
bg-white rounded-lg border p-3 flex items-start gap-3
hover:shadow-md transition-shadow cursor-pointer
```

### Icon
```
flex-shrink-0 mt-0.5
w-5 h-5 (via TaskTypeIcon)
```

### Content
```
flex-1 min-w-0
```

### Title
```
font-semibold text-gray-900 break-words
line-through text-gray-500 (when completed)
```

### Date
```
text-xs text-gray-500 mt-1
```

### Goal Label
```
text-xs text-gray-400 mt-1 text-right
```

### Action Buttons Container
```
flex items-center gap-1 flex-shrink-0
```

### Individual Buttons
```
variant="ghost"
size="sm"
h-7 w-7 p-0
hover:bg-gray-100 rounded
```

### Delete Button (special)
```
text-gray-600 hover:text-red-600 hover:bg-red-50
```

## Example Usage

```tsx
<TaskCard
  task={task}
  goals={goals}
  onTaskToggle={(task) => handleToggle(task)}
  onTaskDelete={(taskId) => handleDelete(taskId)}
  onTaskEdit={(task) => handleEdit(task)}
  onAddSubtask={(taskId) => handleAddSubtask(taskId)}
  showGoalLabel={true}
  compact={false}
/>
```

## Color Palette

- **Text Primary**: `gray-900` (#111827)
- **Text Secondary**: `gray-500` (#6B7280)
- **Text Tertiary**: `gray-400` (#9CA3AF)
- **Background**: White (#FFFFFF)
- **Background Hover**: `gray-100` (#F3F4F6)
- **Border**: Default border color
- **Completed Check**: `green-600` (#16A34A)
- **Delete Hover**: `red-600` (#DC2626), `red-50` (#FEF2F2)
- **Purple Background** (compact): `purple-50` (#FAF5FF), `purple-100` (#F3E8FF)

## Accessibility

- All buttons have `title` attributes for tooltips
- Buttons have `type="button"` to prevent form submission
- Interactive elements have hover states for feedback
- Icons use appropriate sizes (16px for actions, 20px for status)
- Color contrast meets WCAG guidelines
