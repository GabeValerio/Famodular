'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Clock, Calendar } from 'lucide-react';
import { Button } from "@/app/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Task } from '../types';
import TaskItem from './TaskItem';
import type { TaskItemProps } from './TaskItem';

interface WeeklyViewProps {
  currentWeek: Date;
  tasks: Task[];
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onWeekChange?: (date: Date) => void;
  onAddTask: (date: Date) => void;
  selectedTask: Task | null;
  setSelectedTask: (task: Task | null) => void;
  onTaskToggle?: (task: Task) => void;
  onTaskDelete?: (taskId: string) => void;
  selectedTimezone: string;
  selectedStatusFilter: string;
  selectedTypeFilter: string;
  onStatusFilterChange: (filter: string) => void;
  onTypeFilterChange: (filter: string) => void;
  handlePriorityUpdate?: (taskId: string, newPriority: number) => Promise<void>;
  handleUpdateTask?: (taskId: string, newText: string, newType: string, newDueDate?: Date | null, newGoalId?: string, newImageUrl?: string | null) => Promise<void>;
  handleUpdateTime?: (taskId: string, estimatedTime?: number | null, completedTime?: number | null) => Promise<void>;
  handleUpdateException?: (taskId: string, isException: boolean) => Promise<void>;
}

export default function WeeklyView({
  currentWeek,
  tasks,
  onPreviousWeek,
  onNextWeek,
  onWeekChange,
  onAddTask,
  selectedTask,
  setSelectedTask,
  onTaskToggle,
  onTaskDelete,
  selectedTimezone,
  selectedStatusFilter,
  selectedTypeFilter,
  onStatusFilterChange,
  onTypeFilterChange,
  handlePriorityUpdate,
  handleUpdateTask,
  handleUpdateTime,
  handleUpdateException,
}: WeeklyViewProps) {
  const [isWeekDialogOpen, setIsWeekDialogOpen] = useState(false);
  const [weekInput, setWeekInput] = useState('');
  const [yearInput, setYearInput] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  // Get the start of the week (Sunday)
  const getWeekStart = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const diff = d.getDate() - day; // Subtract the day of the week to get to Sunday
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
  const currentYear = currentWeek.getFullYear();

  // Get date from week number and year (week starts on Sunday)
  const getDateFromWeek = (week: number, year: number): Date => {
    // Get January 1st of the year
    const jan1 = new Date(year, 0, 1);
    // Find the first Sunday of the year (or use Jan 1 if it's a Sunday)
    const dayOfWeek = jan1.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const daysToFirstSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
    const firstSunday = new Date(year, 0, 1 + daysToFirstSunday);
    // Add the appropriate number of weeks (week - 1, since week 1 starts at firstSunday)
    const targetDate = new Date(firstSunday);
    targetDate.setDate(firstSunday.getDate() + (week - 1) * 7);
    return targetDate;
  };

  // Handle week change dialog
  const handleWeekNumberClick = () => {
    setWeekInput(weekNumber.toString());
    setYearInput(currentYear.toString());
    setIsWeekDialogOpen(true);
  };

  const handleWeekChange = () => {
    const week = parseInt(weekInput);
    const year = parseInt(yearInput);
    
    if (week >= 1 && week <= 53 && year >= 1900 && year <= 2100) {
      const newDate = getDateFromWeek(week, year);
      // Adjust to Sunday (start of week)
      const dayOfWeek = newDate.getDay();
      const sundayDate = new Date(newDate);
      sundayDate.setDate(newDate.getDate() - dayOfWeek);
      
      if (onWeekChange) {
        onWeekChange(sundayDate);
      }
      setIsWeekDialogOpen(false);
    }
  };

  // Format date range
  const formatDateRange = (start: Date, end: Date): string => {
    const monthFormat = isMobile ? 'short' : 'long';
    const options: Intl.DateTimeFormatOptions = { month: monthFormat, day: 'numeric', year: 'numeric' };
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
    const monthNames = isMobile 
      ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
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
        const dueDate = task.dueDate || task.due_date;
        if (!dueDate || task.completed) return false;
        const due = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
        if (due >= new Date()) return false;
      }

      // Filter by type
      if (selectedTypeFilter !== 'All Types' && task.type !== selectedTypeFilter.toLowerCase()) return false;

      // Check if task is for this day
      const taskDueDate = task.dueDate || task.due_date;
      if (taskDueDate) {
        const taskDate = formatDateKey(typeof taskDueDate === 'string' ? new Date(taskDueDate) : taskDueDate);
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
    <div className="space-y-4">

      {/* Date Range and Week Number */}
      <div className="flex flex-col items-center mb-4">
        <div className="text-lg font-medium text-gray-700 mb-0.5">
          {formatDateRange(weekStart, weekEnd)}
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onPreviousWeek}
            className="flex items-center gap-1 sm:gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Previous Week</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="rounded-full"
            onClick={handleWeekNumberClick}
          >
            {weekNumber}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onNextWeek}
            className="flex items-center gap-1 sm:gap-2"
          >
            <span className="hidden sm:inline">Next Week</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Daily Sections */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {daysOfWeek.map((day, index) => {
          const dayTasks = getTasksForDay(day);
          const dayIsToday = isToday(day);

          return (
            <div key={index} className="p-3 sm:p-6 border-b last:border-b-0 border-slate-100">
              {/* Day Header */}
              <h3 className={`text-lg sm:text-xl font-bold mb-1 sm:mb-2 text-center ${dayIsToday ? 'text-black' : 'text-gray-900'}`}>
                {formatDayHeader(day)}
              </h3>

              {/* Day Actions */}
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full flex items-center gap-2"
                  onClick={() => onAddTask(day)}
                >
                  <Plus className="w-4 h-4" />
                  Task
                </Button>
              </div>

              {/* Tasks or Empty State */}
              {dayTasks.length > 0 ? (
                <div className="space-y-2">
                  {dayTasks.map(task => {
                    const itemProps: TaskItemProps = {
                      task,
                      tasks,
                      isSelected: selectedTask?.id === task.id,
                      onSelect: () => setSelectedTask(task),
                      onToggleComplete: () => onTaskToggle?.(task),
                      onDelete: (taskId: string) => onTaskDelete?.(taskId),
                      onAddNested: () => {},
                      onMoveUp: () => {},
                      onMoveDown: () => {},
                      isPriorityEditMode: false,
                      handlePriorityUpdate: handlePriorityUpdate || (async () => {}),
                      handleUpdateTask: handleUpdateTask || (async () => {}),
                      handleUpdateException: handleUpdateException || (async () => {}),
                      handleUpdateTime: handleUpdateTime || (async () => {}),
                      selectedTimezone,
                    };

                    return (
                      <div key={task.id}>
                        <TaskItem {...itemProps} />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <div className="mb-2">No tasks for this day</div>
                  <div className="text-sm">Add your first task</div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Week Number Change Dialog */}
      <Dialog open={isWeekDialogOpen} onOpenChange={setIsWeekDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Jump to Week</DialogTitle>
            <DialogDescription>
              Enter a week number and year to navigate to that week.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="week">Week Number (1-53)</Label>
              <Input
                id="week"
                type="number"
                min="1"
                max="53"
                value={weekInput}
                onChange={(e) => setWeekInput(e.target.value)}
                placeholder="Enter week number"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                min="1900"
                max="2100"
                value={yearInput}
                onChange={(e) => setYearInput(e.target.value)}
                placeholder="Enter year"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsWeekDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleWeekChange}>
              Go to Week
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

