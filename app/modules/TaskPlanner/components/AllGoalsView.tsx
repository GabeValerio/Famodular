'use client';

import React from 'react';
import { Goal, Task } from '../types';
import TaskItem from './TaskItem';
import type { TaskItemProps } from './TaskItem';

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
  // Group tasks by goal, but also include goals without tasks
  const tasksByGoal = goals.map(goal => {
    const goalTasks = tasks.filter(task => {
      const goalId = task.goalId || task.goal_id;
      return goalId === goal.id;
    });
    return { goal, tasks: goalTasks };
  });

  // Separate goals with tasks and goals without tasks
  const goalsWithTasks = tasksByGoal.filter(group => group.tasks.length > 0);
  const goalsWithoutTasks = tasksByGoal.filter(group => group.tasks.length === 0);

  if (goalsWithTasks.length === 0 && goalsWithoutTasks.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-6">All Goals</h2>
        <div className="text-center py-12 text-gray-500">
          <div className="mb-2">No goals yet</div>
          <div className="text-sm">Create goals to see them here</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Goals with tasks */}
      {goalsWithTasks.map(({ goal, tasks: goalTasks }) => (
        <div key={goal.id} className="bg-white rounded-lg">
          {/* Goal Section Header */}
          <h2 className="text-xl font-bold text-center py-4 border-b">{goal.goal || goal.text}</h2>
          
          {/* Tasks List */}
          <div className="p-4 space-y-2">
            {goalTasks.map((task) => {
              const itemProps: TaskItemProps = {
                task,
                tasks: goalTasks,
                goals,
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
                showGoalLabel: false,
              };
              return <TaskItem key={task.id} {...itemProps} />;
            })}
          </div>
        </div>
      ))}

      {/* Goals without tasks */}
      {goalsWithoutTasks.length > 0 && (
        <div className="bg-white rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Goals Without Tasks</h3>
          <div className="space-y-3">
            {goalsWithoutTasks.map(({ goal }) => (
              <div
                key={goal.id}
                className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="font-medium">{goal.goal || goal.text}</div>
                {goal.progress !== undefined && goal.progress > 0 && (
                  <div className="mt-2">
                    <div className="text-sm text-gray-600 mb-1">Progress: {goal.progress}%</div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

