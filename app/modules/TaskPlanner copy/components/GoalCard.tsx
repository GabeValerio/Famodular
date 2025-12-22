'use client';

import React, { useState } from 'react';
import { Goal, Task } from '../types';
import { ChevronDown, Pencil, Trash2, Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import TaskCard from './TaskCard';

interface GoalCardProps {
  goal: Goal;
  tasks: Task[];
  selectedGoal: Goal | null;
  onGoalClick?: (goal: Goal) => void;
  onGoalUpdate?: (goalId: string, updates: Partial<Goal>) => Promise<void>;
  onGoalDelete?: (goalId: string) => Promise<void>;
  onTaskToggle?: (task: Task) => void;
  onTaskDelete?: (taskId: string) => void;
  onAddTask?: (goalId: string) => void;
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
  onAddTask,
}: GoalCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(goal.goal || goal.text);

  const goalTasks = tasks.filter(task => task.goal_id === goal.id);

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
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex-1">
          {isEditing ? (
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
              className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          ) : (
            <h3 className="font-semibold text-lg">{goal.goal || goal.text}</h3>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs"
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
              onGoalDelete?.(goal.id);
            }}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Expanded Tasks */}
      {isExpanded && (
        <div className="p-4 space-y-2">
          {goalTasks.length > 0 ? (
            goalTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                goals={[]}
                onTaskToggle={onTaskToggle}
                onTaskDelete={onTaskDelete}
                onAddSubtask={() => {}}
                compact={true}
                showGoalLabel={false}
              />
            ))
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
              Add Task
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
