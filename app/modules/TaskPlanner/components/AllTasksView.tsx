'use client';

import React from 'react';
import { Task, Goal } from '../types';
import TaskItem from './TaskItem';
import type { TaskItemProps } from './TaskItem';

interface AllTasksViewProps {
  tasks: Task[];
  goals: Goal[];
  selectedTask: Task | null;
  setSelectedTask: (task: Task | null) => void;
  onTaskToggle?: (task: Task) => void;
  onTaskDelete?: (taskId: string) => void;
  onTaskEdit?: (task: Task) => void;
  selectedTimezone: string;
  selectedStatusFilter: string;
  selectedTypeFilter: string;
  handlePriorityUpdate?: (taskId: string, newPriority: number) => Promise<void>;
  handleUpdateTask?: (taskId: string, newText: string, newType: string, newDueDate?: Date | null, newGoalId?: string, newImageUrl?: string | null) => Promise<void>;
  handleUpdateTime?: (taskId: string, estimatedTime?: number | null, completedTime?: number | null) => Promise<void>;
  handleUpdateException?: (taskId: string, isException: boolean) => Promise<void>;
}

export default function AllTasksView({
  tasks,
  goals,
  selectedTask,
  setSelectedTask,
  onTaskToggle,
  onTaskDelete,
  onTaskEdit,
  selectedTimezone,
  selectedStatusFilter,
  selectedTypeFilter,
  handlePriorityUpdate,
  handleUpdateTask,
  handleUpdateTime,
  handleUpdateException,
}: AllTasksViewProps) {
  // Filter tasks based on status and type
  const filteredTasks = tasks.filter(task => {
    // Filter by status
    if (selectedStatusFilter === 'Completed' && !task.completed) return false;
    if (selectedStatusFilter === 'In Progress' && task.completed) return false;
    if (selectedStatusFilter === 'Overdue') {
      const dueDate = task.dueDate || task.due_date;
      if (!dueDate || task.completed) return false;
      const due = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
      if (due >= new Date()) return false;
    }

    // Filter by type
    if (selectedTypeFilter !== 'All Types' && task.type !== selectedTypeFilter.toLowerCase()) return false;

    return true;
  });

  // Task edit handler that uses handleUpdateTask
  const handleEdit = (task: Task) => {
    if (onTaskEdit) {
      onTaskEdit(task);
    } else if (handleUpdateTask) {
      // If onTaskEdit not provided, use handleUpdateTask directly
      // This would typically open an edit modal or inline editor
    }
  };

  return (
    <div className="bg-gray-50 p-6 rounded-lg">
      <h2 className="text-2xl font-bold mb-6">All Tasks</h2>
      
      {filteredTasks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredTasks.map((task) => {
            const itemProps: TaskItemProps = {
              task,
              tasks: filteredTasks,
              goals,
              onTaskToggle: onTaskToggle,
              onTaskDelete: onTaskDelete,
              onTaskEdit: handleEdit,
              onToggleComplete: (taskId: string) => onTaskToggle?.({ ...task, id: taskId } as Task),
              onDelete: onTaskDelete || (() => {}),
              onAddNested: () => {},
              onMoveUp: () => {},
              onMoveDown: () => {},
              isPriorityEditMode: false,
              handlePriorityUpdate: handlePriorityUpdate || (async () => {}),
              handleUpdateTask: handleUpdateTask || (async () => {}),
              handleUpdateException: handleUpdateException || (async () => {}),
              handleUpdateTime: handleUpdateTime || (async () => {}),
              isSelected: selectedTask?.id === task.id,
              onSelect: () => setSelectedTask(task),
              selectedTimezone,
              showGoalLabel: true,
            };
            return (
              <div
                key={task.id}
                className={selectedTask?.id === task.id ? 'ring-2 ring-blue-500 rounded-lg' : ''}
              >
                <TaskItem {...itemProps} />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500 bg-white rounded-lg">
          <div className="mb-2">No tasks found</div>
          <div className="text-sm">Try adjusting your filters or add a new task</div>
        </div>
      )}
    </div>
  );
}

