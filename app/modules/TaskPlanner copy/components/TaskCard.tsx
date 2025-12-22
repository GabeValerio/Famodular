'use client';

import React from 'react';
import { Task, Goal } from '../types';
import { Plus, Pencil, Trash2, CheckCircle2, Circle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { TaskTypeIcon } from './TaskTypeIcon';

interface TaskCardProps {
  task: Task;
  goals: Goal[];
  onTaskToggle?: (task: Task) => void;
  onTaskDelete?: (taskId: string) => void;
  onTaskEdit?: (task: Task) => void;
  onAddSubtask?: (taskId: string) => void;
  showGoalLabel?: boolean;
  compact?: boolean;
}

/**
 * TaskCard Component - Exact UI Specification
 * 
 * LAYOUT STRUCTURE:
 * ┌─────────────────────────────────────────────────────────────┐
 * │ [Icon] Task Title Text              [+] [✏️] [🗑️] [○/✓] │
 * │         06/21                                    Goal Label │
 * └─────────────────────────────────────────────────────────────┘
 * 
 * POSITIONING:
 * - Icon: Left side, aligned top
 * - Title: Next to icon, bold, black text
 * - Date: Below title, left-aligned, gray text (MM/DD format)
 * - Goal Label: Bottom right, small gray text
 * - 4 Action Buttons: Right side, horizontally aligned
 *   1. Plus (+) - Add subtask
 *   2. Pencil (✏️) - Edit task
 *   3. Trash (🗑️) - Delete task (red on hover)
 *   4. Circle/Check (○/✓) - Toggle completion
 * 
 * STYLING:
 * - Background: White card with rounded corners
 * - Border: Subtle border
 * - Shadow: Subtle shadow on hover
 * - Padding: 12px (p-3)
 * - Gap between elements: 12px (gap-3)
 * - Completed tasks: Strikethrough text, reduced opacity
 */
export default function TaskCard({
  task,
  goals,
  onTaskToggle,
  onTaskDelete,
  onTaskEdit,
  onAddSubtask,
  showGoalLabel = false,
  compact = false,
}: TaskCardProps) {
  const isCompleted = task.completed;

  // Format date as MM/DD
  const formatDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { 
        month: '2-digit', 
        day: '2-digit' 
      });
    } catch {
      return '';
    }
  };

  // Get goal name for label
  const getGoalName = (goalId: string | undefined): string => {
    if (!goalId) return '';
    const goal = goals.find(g => g.id === goalId);
    return goal?.goal || goal?.text || '';
  };

  const goalName = showGoalLabel ? getGoalName(task.goal_id) : '';

  // Compact version for nested tasks in GoalCard (purple background)
  if (compact) {
    return (
      <div className={`
        flex items-start gap-3 p-3 rounded-lg border
        ${isCompleted ? 'bg-gray-50 opacity-75' : 'bg-purple-50'}
        border-purple-100
      `}>
        {/* Left: Icon */}
        <div className="flex-shrink-0 mt-0.5">
          <TaskTypeIcon type={task.type} className="w-5 h-5" />
        </div>

        {/* Center: Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <div className={`${isCompleted ? 'line-through text-gray-500' : 'text-gray-900'} font-medium break-words`}>
            {task.text || task.title}
          </div>
          
          {/* Date - Left aligned below title */}
          {task.due_date && (
            <div className="text-xs text-gray-500 mt-1">
              {formatDate(task.due_date)}
            </div>
          )}
          
          {/* Goal Label - Bottom right */}
          {goalName && (
            <div className="text-xs text-gray-400 mt-1 text-right">
              {goalName}
            </div>
          )}
        </div>

        {/* Right: 4 Action Buttons - Always visible */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Button 1: Plus - Add subtask */}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 hover:bg-gray-100"
            onClick={(e) => {
              e.stopPropagation();
              onAddSubtask?.(task.id);
            }}
            title="Add subtask"
          >
            <Plus className="w-4 h-4" />
          </Button>

          {/* Button 2: Pencil - Edit task */}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 hover:bg-gray-100"
            onClick={(e) => {
              e.stopPropagation();
              onTaskEdit?.(task);
            }}
            title="Edit task"
          >
            <Pencil className="w-4 h-4" />
          </Button>

          {/* Button 3: Trash - Delete task */}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-gray-600 hover:text-red-600 hover:bg-red-50"
            onClick={(e) => {
              e.stopPropagation();
              onTaskDelete?.(task.id);
            }}
            title="Delete task"
          >
            <Trash2 className="w-4 h-4" />
          </Button>

          {/* Button 4: Circle/Check - Toggle completion */}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 hover:bg-gray-100"
            onClick={(e) => {
              e.stopPropagation();
              onTaskToggle?.(task);
            }}
            title={isCompleted ? 'Mark incomplete' : 'Mark complete'}
          >
            {isCompleted ? (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            ) : (
              <Circle className="w-5 h-5 text-gray-400" />
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Full card version for standalone tasks (white background)
  return (
    <div className={`
      bg-white rounded-lg border p-3 flex items-start gap-3
      ${isCompleted ? 'opacity-75' : ''}
      hover:shadow-md transition-shadow cursor-pointer
    `}>
      {/* Left: Icon - 20px (w-5 h-5), top aligned */}
      <div className="flex-shrink-0 mt-0.5">
        <TaskTypeIcon type={task.type} className="w-5 h-5" />
      </div>

      {/* Center: Content - Takes remaining space */}
      <div className="flex-1 min-w-0">
        {/* Title - Bold, black, can wrap */}
        <div className={`${isCompleted ? 'line-through text-gray-500' : 'text-gray-900 font-semibold'} break-words`}>
          {task.text || task.title}
        </div>
        
        {/* Date - Below title, left-aligned, small gray text */}
        {task.due_date && (
          <div className="text-xs text-gray-500 mt-1">
            {formatDate(task.due_date)}
          </div>
        )}
        
        {/* Goal Label - Bottom right, small gray text (only if showGoalLabel is true) */}
        {goalName && (
          <div className="text-xs text-gray-400 mt-1 text-right">
            {goalName}
          </div>
        )}
      </div>

      {/* Right: 4 Action Buttons - Always visible, horizontally aligned */}
      <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        {/* Button 1: Plus (+) - Add subtask */}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 hover:bg-gray-100 rounded"
          onClick={(e) => {
            e.stopPropagation();
            onAddSubtask?.(task.id);
          }}
          title="Add subtask"
          type="button"
        >
          <Plus className="w-4 h-4 text-gray-700" />
        </Button>

        {/* Button 2: Pencil (✏️) - Edit task */}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 hover:bg-gray-100 rounded"
          onClick={(e) => {
            e.stopPropagation();
            onTaskEdit?.(task);
          }}
          title="Edit task"
          type="button"
        >
          <Pencil className="w-4 h-4 text-gray-700" />
        </Button>

        {/* Button 3: Trash (🗑️) - Delete task - Red on hover */}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
          onClick={(e) => {
            e.stopPropagation();
            onTaskDelete?.(task.id);
          }}
          title="Delete task"
          type="button"
        >
          <Trash2 className="w-4 h-4" />
        </Button>

        {/* Button 4: Circle/Check (○/✓) - Toggle completion */}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 hover:bg-gray-100 rounded"
          onClick={(e) => {
            e.stopPropagation();
            onTaskToggle?.(task);
          }}
          title={isCompleted ? 'Mark incomplete' : 'Mark complete'}
          type="button"
        >
          {isCompleted ? (
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          ) : (
            <Circle className="w-5 h-5 text-gray-400" />
          )}
        </Button>
      </div>
    </div>
  );
}