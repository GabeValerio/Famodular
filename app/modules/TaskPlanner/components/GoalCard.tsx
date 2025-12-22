'use client';

import React, { useState } from 'react';
import { Goal, Task } from '../types';
import { ChevronDown, Pencil, Trash2, Plus } from 'lucide-react';
import { Button } from "@/app/components/ui/button";
import TaskItem from './TaskItem';
import type { TaskItemProps } from './TaskItem';

interface GoalCardProps {
  goal: Goal;
  tasks: Task[];
  selectedGoal: Goal | null;
  onGoalClick?: (goal: Goal) => void;
  onGoalUpdate?: (goalId: string, updates: Partial<Goal>) => Promise<void>;
  onGoalDelete?: (goalId: string) => Promise<void>;
  onTaskToggle?: (task: Task) => void;
  onTaskDelete?: (taskId: string) => void;
  onTaskEdit?: (task: Task) => void;
  onAddTask?: (goalId: string) => void;
  selectedTimezone?: string;
}

export default function GoalCard({
  goal,
  tasks,
  selectedGoal,
  onGoalClick,
  onGoalUpdate,
  onGoalDelete,
  onTaskToggle,
  onTaskDelete,
  onTaskEdit,
  onAddTask,
  selectedTimezone = 'America/New_York',
}: GoalCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(goal.goal || goal.text);

  const goalTasks = tasks.filter(task => {
    const goalId = task.goalId || task.goal_id;
    return goalId === goal.id;
  });

  const handleEditSave = async () => {
    if (onGoalUpdate && editText.trim()) {
      await onGoalUpdate(goal.id, { goal: editText, text: editText });
    }
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setEditText(goal.goal || goal.text);
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      {/* Goal Header */}
      <div className={`p-4 border-b ${isEditing ? 'flex flex-col gap-3' : 'flex items-center justify-between'}`}>
        {isEditing ? (
          <>
            {/* Mobile-friendly: Input takes full width when editing */}
            <input
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onBlur={handleEditSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleEditSave();
                } else if (e.key === 'Escape') {
                  handleEditCancel();
                }
              }}
              className="w-full px-3 py-2 text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-0"
              autoFocus
              style={{ fontSize: '16px' }} // Prevents zoom on iOS
            />
            {/* Action buttons when editing */}
            <div className="flex items-center gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleEditCancel}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleEditSave}
                className="text-xs"
              >
                Save
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex-1 min-w-0">
              <h3 
                className="font-semibold text-lg cursor-pointer truncate"
                onClick={() => onGoalClick?.(goal)}
              >
                {goal.goal || goal.text}
              </h3>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs hidden sm:inline-flex"
              >
                {isExpanded ? 'Hide Tasks' : 'Show Tasks'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Are you sure you want to delete this goal?')) {
                    onGoalDelete?.(goal.id);
                  }
                }}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Expanded Tasks */}
      {isExpanded && (
        <div className="p-4 space-y-2">
          {goalTasks.length > 0 ? (
            goalTasks.map((task) => {
              const itemProps: TaskItemProps = {
                task,
                tasks: goalTasks,
                goals: [],
                onTaskToggle: onTaskToggle,
                onTaskDelete: onTaskDelete,
                onTaskEdit: onTaskEdit,
                onToggleComplete: (taskId: string) => onTaskToggle?.({ ...task, id: taskId } as Task),
                onDelete: onTaskDelete || (() => {}),
                onAddNested: () => {},
                onMoveUp: () => {},
                onMoveDown: () => {},
                isPriorityEditMode: false,
                handlePriorityUpdate: async () => {},
                handleUpdateTask: async () => {},
                handleUpdateException: async () => {},
                handleUpdateTime: async () => {},
                isSelected: false,
                onSelect: () => {},
                selectedTimezone,
                compact: true,
                showGoalLabel: false,
              };
              return <TaskItem key={task.id} {...itemProps} />;
            })
          ) : (
            <div className="text-center py-4 text-gray-500 text-sm">
              No tasks yet
            </div>
          )}
          {onAddTask && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddTask(goal.id)}
              className="w-full mt-2"
            >
              <Plus className="w-4 h-4 mr-2" />
              Task
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

