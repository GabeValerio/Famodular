'use client';

import React from 'react';
import { Goal, Task } from '../types';
import GoalCard from './GoalCard';

interface GoalsListViewProps {
  goals: Goal[];
  tasks: Task[];
  selectedGoal: Goal | null;
  onGoalClick?: (goal: Goal) => void;
  onGoalUpdate?: (goalId: string, updates: Partial<Goal>) => Promise<void>;
  onGoalDelete?: (goalId: string) => Promise<void>;
  onTaskToggle?: (task: Task) => void;
  onTaskDelete?: (taskId: string) => void;
  onTaskEdit?: (task: Task) => void;
  onAddTask?: (goalId: string) => void;
  onAddSubtask?: (taskId: string) => void;
  selectedTimezone?: string;
}

export default function GoalsListView({
  goals,
  tasks,
  selectedGoal,
  onGoalClick,
  onGoalUpdate,
  onGoalDelete,
  onTaskToggle,
  onTaskDelete,
  onTaskEdit,
  onAddTask,
  onAddSubtask,
  selectedTimezone,
}: GoalsListViewProps) {
  return (
    <div className="bg-gray-50 p-6 rounded-lg">
      {goals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              tasks={tasks}
              selectedGoal={selectedGoal}
              onGoalClick={onGoalClick}
              onGoalUpdate={onGoalUpdate}
              onGoalDelete={onGoalDelete}
              onTaskToggle={onTaskToggle}
              onTaskDelete={onTaskDelete}
              onTaskEdit={onTaskEdit}
              onAddTask={onAddTask}
              onAddSubtask={onAddSubtask}
              selectedTimezone={selectedTimezone}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500 bg-white rounded-lg">
          <div className="mb-2">No goals yet</div>
          <div className="text-sm">Create your first goal to get started</div>
        </div>
      )}
    </div>
  );
}

