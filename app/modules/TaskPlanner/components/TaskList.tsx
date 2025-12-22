'use client'
import { Task } from '../types'
import TaskItem from './TaskItem'
import type { TaskItemProps } from './TaskItem'

interface TaskListProps {
  tasks: Task[]
  selectedTask: Task | null
  setSelectedTask: (task: Task | null) => void
  onTaskToggle?: (task: Task) => void
  onTaskDelete?: (taskId: string) => void
  onDragStart?: (task: Task) => void
  selectedTimezone: string
  handlePriorityUpdate?: (taskId: string, newPriority: number) => Promise<void>
  handleUpdateTask?: (taskId: string, newText: string, newType: string, newDueDate?: Date | null, newGoalId?: string, newImageUrl?: string | null) => Promise<void>
  handleUpdateTime?: (taskId: string, estimatedTime?: number | null, completedTime?: number | null) => Promise<void>
  handleUpdateException?: (taskId: string, isException: boolean) => Promise<void>
}

export default function TaskList({
  tasks,
  selectedTask,
  setSelectedTask,
  onTaskToggle,
  onTaskDelete,
  onDragStart,
  selectedTimezone,
  handlePriorityUpdate,
  handleUpdateTask,
  handleUpdateTime,
  handleUpdateException,
}: TaskListProps) {
  return (
    <div className="space-y-2">
      {tasks.map((task) => {
        // Change this to explicitly type itemProps as TaskItemProps
        const itemProps: TaskItemProps = {
          task,
          tasks,
          isSelected: selectedTask?.id === task.id,
          onSelect: () => setSelectedTask(task),

          // These props are required by TaskItem
          onToggleComplete: () => onTaskToggle?.(task),
          onDelete: (taskId: string) => onTaskDelete?.(taskId),
          onAddNested: () => {},
          onMoveUp: () => {},
          onMoveDown: () => {},
          isPriorityEditMode: false,
          handlePriorityUpdate: handlePriorityUpdate || (async () => {}),
          handleUpdateTask: handleUpdateTask || (async () => {}),
          handleUpdateException: handleUpdateException || (async () => {}),
          handleUpdateTime: handleUpdateTime || (async () => {}),
          selectedTimezone,
        };

        // Optional props
        if (onTaskToggle) {
          itemProps.onToggle = () => onTaskToggle(task);
        }

        if (onDragStart) {
          itemProps.onDragStart = () => onDragStart(task);
        }

        return <TaskItem key={task.id} {...itemProps} />;
      })}
    </div>
  )
}
