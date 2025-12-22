'use client';

import React from 'react';
import { Goal, Task } from '../types';
import TaskCard from './TaskCard';

interface AllGoalsViewProps {
  goals: Goal[];
  tasks: Task[];
  onGoalClick?: (goal: Goal) => void;
  onTaskToggle?: (task: Task) => void;
  onTaskDelete?: (taskId: string) => void;
  onTaskEdit?: (task: Task) => void;
  selectedTimezone: string;
}

export default function AllGoalsView({
  goals,
  tasks,
  onGoalClick,
  onTaskToggle,
  onTaskDelete,
  onTaskEdit,
  selectedTimezone,
}: AllGoalsViewProps) {
  // Group tasks by goal
  const tasksByGoal = goals.map(goal => {
    const goalTasks = tasks.filter(task => task.goal_id === goal.id);
    return { goal, tasks: goalTasks };
  }).filter(group => group.tasks.length > 0);


  if (tasksByGoal.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-6">All Goals</h2>
        <div className="text-center py-12 text-gray-500">
          <div className="mb-2">No tasks with goals yet</div>
          <div className="text-sm">Create goals and assign tasks to see them here</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {tasksByGoal.map(({ goal, tasks: goalTasks }) => (
        <div key={goal.id} className="bg-white rounded-lg">
          {/* Goal Section Header */}
          <h2 className="text-xl font-bold text-center py-4 border-b">{goal.goal || goal.text}</h2>
          
          {/* Tasks List */}
          <div className="p-4 space-y-2">
            {goalTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                goals={goals}
                onTaskToggle={onTaskToggle}
                onTaskDelete={onTaskDelete}
                onTaskEdit={onTaskEdit}
                showGoalLabel={false}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}