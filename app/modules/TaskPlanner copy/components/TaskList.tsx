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
}

export default function TaskList({
  tasks,
  selectedTask,
  setSelectedTask,
  onTaskToggle,
  onTaskDelete,
  onDragStart,
  selectedTimezone
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

          // These props are required by TaskItem but will be handled safely
          onToggleComplete: () => onTaskToggle?.(task),
          onDelete: (taskId: string) => onTaskDelete?.(taskId),
          onAddNested: () => {},
          onMoveUp: () => {},
          onMoveDown: () => {},
          isPriorityEditMode: false,
          handlePriorityUpdate: async () => {},
          handleUpdateTask: async () => {},
          handleUpdateException: async () => {},
          handleUpdateTime: async () => {},
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
