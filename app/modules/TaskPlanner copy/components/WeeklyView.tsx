'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Task } from '../types';
import TaskItem from './TaskItem';

interface WeeklyViewProps {
  currentWeek: Date;
  tasks: Task[];
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onAddTask: (date: Date) => void;
  selectedTask: Task | null;
  setSelectedTask: (task: Task | null) => void;
  onTaskToggle?: (task: Task) => void;
  onTaskDelete?: (taskId: string) => void;
  selectedTimezone: string;
  selectedStatusFilter: string;
  selectedTypeFilter: string;
}

export default function WeeklyView({
  currentWeek,
  tasks,
  onPreviousWeek,
  onNextWeek,
  onAddTask,
  selectedTask,
  setSelectedTask,
  onTaskToggle,
  onTaskDelete,
  selectedTimezone,
  selectedStatusFilter,
  selectedTypeFilter,
}: WeeklyViewProps) {
  // Get the start of the week (Monday)
  const getWeekStart = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  };

  // Get week number
  const getWeekNumber = (date: Date): number => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };

  const weekStart = getWeekStart(currentWeek);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const weekNumber = getWeekNumber(currentWeek);
  const totalWeeks = 52; // Approximate

  // Format date range
  const formatDateRange = (start: Date, end: Date): string => {
    const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' };
    const startStr = start.toLocaleDateString('en-US', options);
    const endStr = end.toLocaleDateString('en-US', options);
    return `${startStr} - ${endStr}`;
  };

  // Get days of the week
  const daysOfWeek: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(weekStart);
    day.setDate(day.getDate() + i);
    daysOfWeek.push(day);
  }

  // Format day header
  const formatDayHeader = (date: Date): string => {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const dayName = dayNames[date.getDay()];
    const month = monthNames[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    const suffix = day === 1 || day === 21 || day === 31 ? 'st' : day === 2 || day === 22 ? 'nd' : day === 3 || day === 23 ? 'rd' : 'th';
    return `${dayName} ${month} ${day}${suffix} ${year}`;
  };

  // Format date for comparison (YYYY-MM-DD)
  const formatDateKey = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  // Filter tasks for a specific day
  const getTasksForDay = (date: Date): Task[] => {
    const dateKey = formatDateKey(date);
    return tasks.filter(task => {
      // Filter by status
      if (selectedStatusFilter === 'Completed' && !task.completed) return false;
      if (selectedStatusFilter === 'In Progress' && task.completed) return false;
      if (selectedStatusFilter === 'Overdue') {
        if (!task.due_date || task.completed) return false;
        if (new Date(task.due_date) >= new Date()) return false;
      }

      // Filter by type
      if (selectedTypeFilter !== 'All Types' && task.type !== selectedTypeFilter.toLowerCase()) return false;

      // Check if task is for this day
      if (task.due_date) {
        const taskDate = formatDateKey(new Date(task.due_date));
        return taskDate === dateKey;
      }
      return false;
    });
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return formatDateKey(date) === formatDateKey(today);
  };

  return (
    <div className="bg-white rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Weekly Task Planner</h2>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onPreviousWeek}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous Week
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onNextWeek}
            className="flex items-center gap-2"
          >
            Next Week
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Date Range and Week Number */}
      <div className="flex flex-col items-center mb-8">
        <div className="text-lg font-medium text-gray-700 mb-2">
          {formatDateRange(weekStart, weekEnd)}
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" className="rounded-full">
            Week {weekNumber}/{totalWeeks}
          </Button>
        </div>
      </div>

      {/* Daily Sections */}
      <div className="space-y-8">
        {daysOfWeek.map((day, index) => {
          const dayTasks = getTasksForDay(day);
          const dayIsToday = isToday(day);

          return (
            <div key={index} className="border-b pb-6 last:border-b-0">
              {/* Day Header */}
              <h3 className={`text-xl font-bold mb-4 ${dayIsToday ? 'text-blue-600' : 'text-gray-900'}`}>
                {formatDayHeader(day)}
              </h3>

              {/* Day Filters */}
              <div className="flex items-center gap-2 mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => onAddTask(day)}
                >
                  Today's Tasks
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => onAddTask(day)}
                >
                  Daily Tasks
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full flex items-center gap-2"
                  onClick={() => onAddTask(day)}
                >
                  <Plus className="w-4 h-4" />
                  Add Task
                </Button>
              </div>

              {/* Tasks or Empty State */}
              {dayTasks.length > 0 ? (
                <div className="space-y-2">
                  {dayTasks.map(task => (
                    <div key={task.id}>
                      <TaskItem
                        task={task}
                        tasks={tasks}
                        isSelected={selectedTask?.id === task.id}
                        onSelect={() => setSelectedTask(task)}
                        onToggleComplete={() => onTaskToggle?.(task)}
                        onDelete={(taskId) => onTaskDelete?.(taskId)}
                        onAddNested={() => {}}
                        onMoveUp={() => {}}
                        onMoveDown={() => {}}
                        isPriorityEditMode={false}
                        handlePriorityUpdate={async () => {}}
                        handleUpdateTask={async () => {}}
                        handleUpdateException={async () => {}}
                        handleUpdateTime={async () => {}}
                        selectedTimezone={selectedTimezone}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="mb-2">No tasks for this day</div>
                  <div className="text-sm">Add your first task</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
