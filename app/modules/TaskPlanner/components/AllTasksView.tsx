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
  onAddSubtask?: (taskId: string) => void;
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
  onAddSubtask,
  selectedTimezone,
  selectedStatusFilter,
  selectedTypeFilter,
  handlePriorityUpdate,
  handleUpdateTask,
  handleUpdateTime,
  handleUpdateException,
}: AllTasksViewProps) {
  // Organize tasks into parent-child hierarchy
  const organizeTasks = (taskList: Task[]) => {
    const parentTasks = taskList.filter(task => {
      const parentId = task.parentId || task.parent_id;
      return !parentId;
    });
    const childTasks = taskList.filter(task => {
      const parentId = task.parentId || task.parent_id;
      return !!parentId;
    });
    
    // Group children by parent
    const childrenByParent = childTasks.reduce((acc, child) => {
      const parentId = (child.parentId || child.parent_id)!;
      if (!acc[parentId]) {
        acc[parentId] = [];
      }
      acc[parentId].push(child);
      return acc;
    }, {} as Record<string, Task[]>);

    return { parentTasks, childrenByParent };
  };

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

  // Organize filtered tasks
  const { parentTasks, childrenByParent } = organizeTasks(filteredTasks);

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
        <div className="space-y-3">
          {parentTasks.map((parentTask) => {
            const children = childrenByParent[parentTask.id] || [];
            return (
              <div key={parentTask.id} className="space-y-2">
                {/* Parent Task */}
                <div
                  className={selectedTask?.id === parentTask.id ? 'ring-2 ring-blue-500 rounded-lg' : ''}
                  onClick={() => setSelectedTask(parentTask)}
                >
                  <TaskItem
                    task={parentTask}
                    tasks={filteredTasks}
                    goals={goals}
                    onTaskToggle={onTaskToggle}
                    onTaskDelete={onTaskDelete}
                    onTaskEdit={handleEdit}
                    onAddSubtask={onAddSubtask}
                    onToggleComplete={(taskId: string) => onTaskToggle?.({ ...parentTask, id: taskId } as Task)}
                    onDelete={onTaskDelete || (() => {})}
                    onAddNested={onAddSubtask ? (taskId: string) => onAddSubtask(taskId) : () => {}}
                    onMoveUp={() => {}}
                    onMoveDown={() => {}}
                    isPriorityEditMode={false}
                    handlePriorityUpdate={handlePriorityUpdate || (async () => {})}
                    handleUpdateTask={handleUpdateTask || (async () => {})}
                    handleUpdateException={handleUpdateException || (async () => {})}
                    handleUpdateTime={handleUpdateTime || (async () => {})}
                    isSelected={selectedTask?.id === parentTask.id}
                    onSelect={() => setSelectedTask(parentTask)}
                    selectedTimezone={selectedTimezone}
                    showGoalLabel={true}
                  />
                </div>
                
                {/* Subtasks - Indented */}
                {children.length > 0 && (
                  <div className="ml-8 space-y-2 border-l-2 border-gray-200 pl-4">
                    {children.map((childTask) => (
                      <div
                        key={childTask.id}
                        className={selectedTask?.id === childTask.id ? 'ring-2 ring-blue-500 rounded-lg' : ''}
                        onClick={() => setSelectedTask(childTask)}
                      >
                        <TaskItem
                          task={childTask}
                          tasks={filteredTasks}
                          goals={goals}
                          onTaskToggle={onTaskToggle}
                          onTaskDelete={onTaskDelete}
                          onTaskEdit={handleEdit}
                          onAddSubtask={onAddSubtask}
                          onToggleComplete={(taskId: string) => onTaskToggle?.({ ...childTask, id: taskId } as Task)}
                          onDelete={onTaskDelete || (() => {})}
                          onAddNested={onAddSubtask ? (taskId: string) => onAddSubtask(taskId) : () => {}}
                          onMoveUp={() => {}}
                          onMoveDown={() => {}}
                          isPriorityEditMode={false}
                          handlePriorityUpdate={handlePriorityUpdate || (async () => {})}
                          handleUpdateTask={handleUpdateTask || (async () => {})}
                          handleUpdateException={handleUpdateException || (async () => {})}
                          handleUpdateTime={handleUpdateTime || (async () => {})}
                          isSelected={selectedTask?.id === childTask.id}
                          onSelect={() => setSelectedTask(childTask)}
                          selectedTimezone={selectedTimezone}
                          showGoalLabel={true}
                        />
                      </div>
                    ))}
                  </div>
                )}
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

