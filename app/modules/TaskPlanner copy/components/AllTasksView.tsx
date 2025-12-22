'use client';

import React from 'react';
import { Task, Goal } from '../types';
import { Plus, Pencil, Trash2, CheckCircle2, Circle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import TaskCard from './TaskCard';

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
}: AllTasksViewProps) {
  // Filter tasks based on status and type
  const filteredTasks = tasks.filter(task => {
    // Filter by status
    if (selectedStatusFilter === 'Completed' && !task.completed) return false;
    if (selectedStatusFilter === 'In Progress' && task.completed) return false;
    if (selectedStatusFilter === 'Overdue') {
      if (!task.due_date || task.completed) return false;
      if (new Date(task.due_date) >= new Date()) return false;
    }

    // Filter by type
    if (selectedTypeFilter !== 'All Types' && task.type !== selectedTypeFilter.toLowerCase()) return false;

    return true;
  });


  return (
    <div className="bg-gray-50 p-6 rounded-lg">
      <h2 className="text-2xl font-bold mb-6">All Tasks</h2>
      
      {filteredTasks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className={selectedTask?.id === task.id ? 'ring-2 ring-blue-500 rounded-lg' : ''}
              onClick={() => setSelectedTask(task)}
            >
              <TaskCard
                task={task}
                goals={goals}
                onTaskToggle={onTaskToggle}
                onTaskDelete={onTaskDelete}
                onTaskEdit={onTaskEdit}
                showGoalLabel={true}
              />
            </div>
          ))}
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