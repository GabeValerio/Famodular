'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from "@/app/components/ui/button";
import { Task } from '../types';
import TaskItem from './TaskItem';
import type { TaskItemProps } from './TaskItem';

interface PlanViewProps {
  currentDate: Date;
  tasks: Task[];
  onPreviousPeriod: () => void;
  onNextPeriod: () => void;
  onPeriodChange?: (date: Date) => void;
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

type PlanPeriod = {
  start: Date;
  end: Date;
  label: string;
};

export default function PlanView({
  currentDate,
  tasks,
  onPreviousPeriod,
  onNextPeriod,
  onPeriodChange,
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
}: PlanViewProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Format date for comparison (YYYY-MM-DD)
  const formatDateKey = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  // Get start of month
  const getMonthStart = (date: Date): Date => {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  };

  // Get end of month
  const getMonthEnd = (date: Date): Date => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  };

  // Get start of year
  const getYearStart = (date: Date): Date => {
    return new Date(date.getFullYear(), 0, 1);
  };

  // Get end of year
  const getYearEnd = (date: Date): Date => {
    return new Date(date.getFullYear(), 11, 31);
  };

  // Generate 3 month plan periods
  const get3MonthPeriods = (): PlanPeriod[] => {
    const periods: PlanPeriod[] = [];
    const start = getMonthStart(currentDate);
    
    for (let i = 0; i < 3; i++) {
      const monthDate = new Date(start);
      monthDate.setMonth(start.getMonth() + i);
      periods.push({
        start: getMonthStart(monthDate),
        end: getMonthEnd(monthDate),
        label: monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      });
    }
    return periods;
  };

  // Generate 6 month plan periods
  const get6MonthPeriods = (): PlanPeriod[] => {
    const periods: PlanPeriod[] = [];
    const start = getMonthStart(currentDate);
    
    for (let i = 0; i < 6; i++) {
      const monthDate = new Date(start);
      monthDate.setMonth(start.getMonth() + i);
      periods.push({
        start: getMonthStart(monthDate),
        end: getMonthEnd(monthDate),
        label: monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      });
    }
    return periods;
  };

  // Generate 12 month plan periods
  const get12MonthPeriods = (): PlanPeriod[] => {
    const periods: PlanPeriod[] = [];
    const start = getMonthStart(currentDate);
    
    for (let i = 0; i < 12; i++) {
      const monthDate = new Date(start);
      monthDate.setMonth(start.getMonth() + i);
      periods.push({
        start: getMonthStart(monthDate),
        end: getMonthEnd(monthDate),
        label: monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      });
    }
    return periods;
  };

  // Generate 3 year plan periods
  const get3YearPeriods = (): PlanPeriod[] => {
    const periods: PlanPeriod[] = [];
    const startYear = currentDate.getFullYear();
    
    for (let i = 0; i < 3; i++) {
      const year = startYear + i;
      periods.push({
        start: getYearStart(new Date(year, 0, 1)),
        end: getYearEnd(new Date(year, 0, 1)),
        label: year.toString()
      });
    }
    return periods;
  };

  // Generate 5 year plan periods
  const get5YearPeriods = (): PlanPeriod[] => {
    const periods: PlanPeriod[] = [];
    const startYear = currentDate.getFullYear();
    
    for (let i = 0; i < 5; i++) {
      const year = startYear + i;
      periods.push({
        start: getYearStart(new Date(year, 0, 1)),
        end: getYearEnd(new Date(year, 0, 1)),
        label: year.toString()
      });
    }
    return periods;
  };

  // Filter tasks for a specific period
  const getTasksForPeriod = (period: PlanPeriod): Task[] => {
    const periodStart = formatDateKey(period.start);
    const periodEnd = formatDateKey(period.end);
    
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

      // Check if task is within this period
      const taskDueDate = task.dueDate || task.due_date;
      if (taskDueDate) {
        const taskDate = formatDateKey(typeof taskDueDate === 'string' ? new Date(taskDueDate) : taskDueDate);
        return taskDate >= periodStart && taskDate <= periodEnd;
      }
      return false;
    });
  };

  const formatDateRange = (start: Date, end: Date): string => {
    const monthFormat = isMobile ? 'short' : 'long';
    const options: Intl.DateTimeFormatOptions = { month: monthFormat, year: 'numeric' };
    const startStr = start.toLocaleDateString('en-US', options);
    const endStr = end.toLocaleDateString('en-US', options);
    return `${startStr} - ${endStr}`;
  };

  const formatYearRange = (start: Date, end: Date): string => {
    const startYear = start.getFullYear();
    const endYear = end.getFullYear();
    return startYear === endYear ? startYear.toString() : `${startYear} - ${endYear}`;
  };

  const threeMonthPeriods = get3MonthPeriods();
  const sixMonthPeriods = get6MonthPeriods();
  const twelveMonthPeriods = get12MonthPeriods();
  const threeYearPeriods = get3YearPeriods();
  const fiveYearPeriods = get5YearPeriods();

  const threeMonthStart = threeMonthPeriods[0].start;
  const threeMonthEnd = threeMonthPeriods[threeMonthPeriods.length - 1].end;
  const sixMonthStart = sixMonthPeriods[0].start;
  const sixMonthEnd = sixMonthPeriods[sixMonthPeriods.length - 1].end;
  const twelveMonthStart = twelveMonthPeriods[0].start;
  const twelveMonthEnd = twelveMonthPeriods[twelveMonthPeriods.length - 1].end;
  const threeYearStart = threeYearPeriods[0].start;
  const threeYearEnd = threeYearPeriods[threeYearPeriods.length - 1].end;
  const fiveYearStart = fiveYearPeriods[0].start;
  const fiveYearEnd = fiveYearPeriods[fiveYearPeriods.length - 1].end;

  return (
    <div className="space-y-8">
      {/* Navigation */}
      <div className="flex flex-col items-center mb-4">
        <div className="flex items-center gap-2 sm:gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onPreviousPeriod}
            className="flex items-center gap-1 sm:gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Previous</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onNextPeriod}
            className="flex items-center gap-1 sm:gap-2"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 3 Month Plan */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">3 Month Plan</h2>
          <div className="text-sm text-gray-600">{formatDateRange(threeMonthStart, threeMonthEnd)}</div>
        </div>
        <div className="bg-white rounded-xl overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
            {threeMonthPeriods.map((period, index) => {
              const periodTasks = getTasksForPeriod(period);
              return (
                <div key={index} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold">{period.label}</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full flex items-center gap-1"
                      onClick={() => onAddTask(period.start)}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {periodTasks.length > 0 ? (
                      periodTasks.map(task => {
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
                      })
                    ) : (
                      <div className="text-center py-4 text-gray-500 text-sm">
                        No tasks
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 6 Month Plan */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">6 Month Plan</h2>
          <div className="text-sm text-gray-600">{formatDateRange(sixMonthStart, sixMonthEnd)}</div>
        </div>
        <div className="bg-white rounded-xl overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 p-4">
            {sixMonthPeriods.map((period, index) => {
              const periodTasks = getTasksForPeriod(period);
              return (
                <div key={index} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-semibold">{period.label}</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full flex items-center gap-1"
                      onClick={() => onAddTask(period.start)}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {periodTasks.length > 0 ? (
                      periodTasks.map(task => {
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
                      })
                    ) : (
                      <div className="text-center py-4 text-gray-500 text-sm">
                        No tasks
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 12 Month Plan */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">12 Month Plan</h2>
          <div className="text-sm text-gray-600">{formatDateRange(twelveMonthStart, twelveMonthEnd)}</div>
        </div>
        <div className="bg-white rounded-xl overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 p-4">
            {twelveMonthPeriods.map((period, index) => {
              const periodTasks = getTasksForPeriod(period);
              return (
                <div key={index} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold">{period.label}</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full flex items-center gap-1"
                      onClick={() => onAddTask(period.start)}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {periodTasks.length > 0 ? (
                      periodTasks.map(task => {
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
                      })
                    ) : (
                      <div className="text-center py-4 text-gray-500 text-sm">
                        No tasks
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3 Year Plan */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">3 Year Plan</h2>
          <div className="text-sm text-gray-600">{formatYearRange(threeYearStart, threeYearEnd)}</div>
        </div>
        <div className="bg-white rounded-xl overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
            {threeYearPeriods.map((period, index) => {
              const periodTasks = getTasksForPeriod(period);
              return (
                <div key={index} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold">{period.label}</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full flex items-center gap-1"
                      onClick={() => onAddTask(period.start)}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {periodTasks.length > 0 ? (
                      periodTasks.map(task => {
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
                      })
                    ) : (
                      <div className="text-center py-4 text-gray-500 text-sm">
                        No tasks
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5 Year Plan */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">5 Year Plan</h2>
          <div className="text-sm text-gray-600">{formatYearRange(fiveYearStart, fiveYearEnd)}</div>
        </div>
        <div className="bg-white rounded-xl overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 p-4">
            {fiveYearPeriods.map((period, index) => {
              const periodTasks = getTasksForPeriod(period);
              return (
                <div key={index} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold">{period.label}</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full flex items-center gap-1"
                      onClick={() => onAddTask(period.start)}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {periodTasks.length > 0 ? (
                      periodTasks.map(task => {
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
                      })
                    ) : (
                      <div className="text-center py-4 text-gray-500 text-sm">
                        No tasks
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

