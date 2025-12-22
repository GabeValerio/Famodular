'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Plus, Calendar, Settings, Target, CheckCircle2, Clock, User, DollarSign, Zap, Music, Bug, Book, Home, Car, AlertCircle } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/app/components/ui/sheet";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import TaskList from '../components/TaskList';
import WeeklyView from '../components/WeeklyView';
import AllTasksView from '../components/AllTasksView';
import AllGoalsView from '../components/AllGoalsView';
import GoalsListView from '../components/GoalsListView';
import AddTaskForm from '../components/AddTaskForm';
import AddGoalForm, { NewGoalForm } from '../components/AddGoalForm';
import { Task, Goal, NewTaskForm } from '../types';
import { useTasks } from '../hooks/useTasks';
import { useGroup } from '@/lib/GroupContext';
import { tasksService } from '../services/tasksService';
import { goalsService } from '../services/goalsService';
import { TASK_TYPES } from '../components/TaskTypeIcon';

export default function TaskPlannerPage() {
  const { currentGroup, isSelfView } = useGroup();
  
  // CRITICAL: Pass undefined for self view, groupId for group view (never empty string)
  const groupId = isSelfView || !currentGroup ? undefined : currentGroup.id;
  
  const {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    toggleTask,
  } = useTasks(groupId);

  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalsLoading, setGoalsLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [selectedTimezone, setSelectedTimezone] = useState('America/New_York');
  
  // View and filter state
  const [currentView, setCurrentView] = useState<'All Tasks' | 'All Goals' | 'Goals List' | 'Weekly'>('Weekly');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('All Types');
  const [currentWeek, setCurrentWeek] = useState<Date>(new Date());
  const [taskDateToAdd, setTaskDateToAdd] = useState<Date | null>(null);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  // Initialize new task form
  const initialNewTask: NewTaskForm = {
    title: '',
    description: '',
    date: '',
    end_date: '',
    time: '',
    end_time: '',
    timezone: selectedTimezone,
    type: 'personal',
    goal_id: null,
    parent_id: null,
    is_recurring: false,
    recurrence_pattern: 'daily',
    recurrence_interval: 1,
    recurrence_day_of_week: [],
    recurrence_day_of_month: [],
    recurrence_month: [],
    recurrence_end_type: 'never',
    recurrence_end_date: '',
    recurrence_count: 1,
  };

  const [newTask, setNewTask] = useState<NewTaskForm>(initialNewTask);

  // Initialize new goal form
  const initialNewGoal: NewGoalForm = {
    text: '',
    goal: '',
    progress: 0,
  };

  const [newGoal, setNewGoal] = useState<NewGoalForm>(initialNewGoal);

  // Load goals on mount and when groupId changes
  useEffect(() => {
    const loadGoals = async () => {
      try {
        setGoalsLoading(true);
        const goalsData = await goalsService.getGoals(groupId);
        setGoals(goalsData);
      } catch (err) {
        // Error loading goals
      } finally {
        setGoalsLoading(false);
      }
    };
    loadGoals();
  }, [groupId]);

  // Timezones
  const timezones = [
    { value: 'America/New_York', label: 'Eastern Time' },
    { value: 'America/Chicago', label: 'Central Time' },
    { value: 'America/Denver', label: 'Mountain Time' },
    { value: 'America/Los_Angeles', label: 'Pacific Time' },
    { value: 'UTC', label: 'UTC' },
  ];

  // Task handlers
  const handleAddTask = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Use taskDateToAdd if set (from WeeklyView), otherwise use form date
      const taskDate = taskDateToAdd || (newTask.date ? new Date(newTask.date + 'T' + (newTask.time || '12:00') + ':00') : new Date());
      
      // Build task input from form
      const taskInput = {
        title: newTask.title,
        text: newTask.title, // For compatibility
        description: newTask.description,
        type: newTask.type,
        goalId: newTask.goal_id,
        parentId: newTask.parent_id,
        groupId: groupId || null,
        dueDate: newTask.date 
          ? new Date(newTask.date + 'T' + (newTask.time || '12:00') + ':00').toISOString()
          : taskDate.toISOString(),
        endDate: newTask.end_date ? new Date(newTask.end_date + 'T' + (newTask.end_time || '12:00') + ':00').toISOString() : undefined,
        timezone: newTask.timezone,
        scheduledTime: newTask.time || undefined,
        endTime: newTask.end_time || undefined,
        isRecurring: newTask.is_recurring,
        recurrencePattern: newTask.recurrence_pattern,
        recurrenceInterval: newTask.recurrence_interval,
        recurrenceDayOfWeek: newTask.recurrence_day_of_week,
        recurrenceDayOfMonth: newTask.recurrence_day_of_month,
        recurrenceMonth: newTask.recurrence_month,
        recurrenceEndDate: newTask.recurrence_end_date || undefined,
        recurrenceCount: newTask.recurrence_count,
        imageUrl: newTask.image_url,
      };

      await createTask(taskInput);

      // Reset form
      setNewTask(initialNewTask);
      setIsAddingTask(false);
      setTaskDateToAdd(null);
    } catch (err) {
      // Error adding task
    }
  }, [newTask, initialNewTask, createTask, groupId, taskDateToAdd]);

  const handleTaskToggle = useCallback(async (task: Task) => {
    await toggleTask(task.id);
  }, [toggleTask]);

  const handleTaskDelete = useCallback(async (taskId: string) => {
    await deleteTask(taskId);
  }, [deleteTask]);

  // Goal handlers
  const handleAddGoal = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const goalInput = {
        text: newGoal.text,
        goal: newGoal.goal || newGoal.text,
        progress: newGoal.progress || 0,
        groupId: groupId || null,
      };

      const createdGoal = await goalsService.createGoal(goalInput);
      setGoals(prev => [createdGoal, ...prev]);

      // Reset form
      setNewGoal(initialNewGoal);
      setIsAddingGoal(false);
    } catch (err) {
      alert(`Failed to create goal: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [newGoal, initialNewGoal, groupId]);

  const handleGoalClick = useCallback((goal: Goal) => {
    setSelectedGoal(goal);
  }, []);

  const handleGoalUpdate = useCallback(async (goalId: string, updates: Partial<Goal>) => {
    try {
      const updatedGoal = await goalsService.updateGoal(goalId, updates);
      setGoals(prev => prev.map(g => 
        g.id === goalId ? updatedGoal : g
      ));
      // Update selectedGoal if it's the one being updated
      if (selectedGoal?.id === goalId) {
        setSelectedGoal(updatedGoal);
      }
    } catch (err) {
      alert(`Failed to update goal: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [selectedGoal]);

  const handleGoalDelete = useCallback(async (goalId: string) => {
    if (!confirm('Are you sure you want to delete this goal?')) {
      return;
    }

    try {
      await goalsService.deleteGoal(goalId);
      setGoals(prev => prev.filter(g => g.id !== goalId));
      // Clear selectedGoal if it's the one being deleted
      if (selectedGoal?.id === goalId) {
        setSelectedGoal(null);
      }
    } catch (err) {
      alert(`Failed to delete goal: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [selectedGoal]);

  // Task update handlers for TaskItem component
  const handlePriorityUpdate = useCallback(async (taskId: string, newPriority: number) => {
    await updateTask(taskId, { priority: newPriority });
  }, [updateTask]);

  const handleUpdateTask = useCallback(async (
    taskId: string, 
    newText: string, 
    newType: string, 
    newDueDate?: Date | null, 
    newGoalId?: string, 
    newImageUrl?: string | null
  ) => {
    await updateTask(taskId, {
      title: newText,
      text: newText,
      type: newType,
      dueDate: newDueDate || null,
      goalId: newGoalId || null,
      imageUrl: newImageUrl || null,
    });
  }, [updateTask]);

  const handleUpdateTime = useCallback(async (
    taskId: string, 
    estimatedTime?: number | null, 
    completedTime?: number | null
  ) => {
    await updateTask(taskId, {
      estimatedTime,
      completedTime,
    });
  }, [updateTask]);

  const handleUpdateException = useCallback(async (taskId: string, isException: boolean) => {
    // This can be implemented later if needed
  }, []);

  const handleAddTaskForDate = useCallback((date: Date) => {
    setTaskDateToAdd(date);
    const dateStr = date.toISOString().split('T')[0];
    setNewTask(prev => ({ ...prev, date: dateStr }));
    setIsAddingTask(true);
  }, []);

  const handlePreviousWeek = useCallback(() => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() - 7);
    setCurrentWeek(newWeek);
  }, [currentWeek]);

  const handleNextWeek = useCallback(() => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() + 7);
    setCurrentWeek(newWeek);
  }, [currentWeek]);

  const handleWeekChange = useCallback((date: Date) => {
    setCurrentWeek(date);
  }, []);

  // Statistics calculations
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const overdue = tasks.filter(t => {
      const dueDate = t.dueDate || t.due_date;
      if (!dueDate) return false;
      const due = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
      return due < new Date() && !t.completed;
    }).length;

    return { total, completed, pending, overdue };
  }, [tasks]);

  // Filter tasks based on status and type (must be before conditional returns)
  const filteredTasks = useMemo(() => {
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

      return true;
    });
  }, [tasks, selectedStatusFilter, selectedTypeFilter]);

  if (loading) {
    return (
      <div className="-mt-4 md:-mt-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-lg text-muted-foreground">Loading tasks...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="-mt-4 md:-mt-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-lg text-destructive">Error: {error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Action Buttons */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-3xl font-bold tracking-tight">Task Planner</h1>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button
            variant="outline"
            onClick={() => setIsAddingGoal(true)}
            className="rounded-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Goal
          </Button>
          <Button
            onClick={() => {
              setTaskDateToAdd(null);
              setIsAddingTask(true);
            }}
            className="rounded-full bg-black hover:bg-gray-800"
          >
            <Plus className="w-4 h-4 mr-2" />
            Task
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsFilterSheetOpen(true)}
            className="rounded-full"
            size="icon"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

        {/* Statistics Cards - Only show in All Tasks view */}
        {currentView === 'All Tasks' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-black">{stats.pending}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content - Weekly View */}
        {currentView === 'Weekly' && (
          <WeeklyView
            currentWeek={currentWeek}
            tasks={tasks}
            onPreviousWeek={handlePreviousWeek}
            onNextWeek={handleNextWeek}
            onWeekChange={handleWeekChange}
            onAddTask={handleAddTaskForDate}
            selectedTask={selectedTask}
            setSelectedTask={setSelectedTask}
            onTaskToggle={handleTaskToggle}
            onTaskDelete={handleTaskDelete}
            selectedTimezone={selectedTimezone}
            selectedStatusFilter={selectedStatusFilter}
            selectedTypeFilter={selectedTypeFilter}
            onStatusFilterChange={setSelectedStatusFilter}
            onTypeFilterChange={setSelectedTypeFilter}
            handlePriorityUpdate={handlePriorityUpdate}
            handleUpdateTask={handleUpdateTask}
            handleUpdateTime={handleUpdateTime}
            handleUpdateException={handleUpdateException}
          />
        )}

        {/* Main Content - All Tasks View */}
        {currentView === 'All Tasks' && (
          <AllTasksView
            tasks={tasks}
            goals={goals}
            selectedTask={selectedTask}
            setSelectedTask={setSelectedTask}
            onTaskToggle={handleTaskToggle}
            onTaskDelete={handleTaskDelete}
            onTaskEdit={(task) => {
              // Set task as selected and could open edit modal
              setSelectedTask(task);
              // For now, we can use handleUpdateTask when user edits inline
            }}
            selectedTimezone={selectedTimezone}
            selectedStatusFilter={selectedStatusFilter}
            selectedTypeFilter={selectedTypeFilter}
            handlePriorityUpdate={handlePriorityUpdate}
            handleUpdateTask={handleUpdateTask}
            handleUpdateTime={handleUpdateTime}
            handleUpdateException={handleUpdateException}
          />
        )}

        {/* Main Content - All Goals View */}
        {currentView === 'All Goals' && (
          <AllGoalsView
            goals={goals}
            tasks={tasks}
            onGoalClick={handleGoalClick}
            onTaskToggle={handleTaskToggle}
            onTaskDelete={handleTaskDelete}
            onTaskEdit={(task) => {
              setSelectedTask(task);
            }}
            selectedTimezone={selectedTimezone}
          />
        )}

        {/* Main Content - Goals List View */}
        {currentView === 'Goals List' && (
          <GoalsListView
            goals={goals}
            tasks={tasks}
            selectedGoal={selectedGoal}
            onGoalClick={handleGoalClick}
            onGoalUpdate={handleGoalUpdate}
            onGoalDelete={handleGoalDelete}
            onTaskToggle={handleTaskToggle}
            onTaskDelete={handleTaskDelete}
            onTaskEdit={(task) => {
              setSelectedTask(task);
            }}
            onAddTask={(goalId) => {
              setNewTask({ ...initialNewTask, goal_id: goalId });
              setIsAddingTask(true);
            }}
            selectedTimezone={selectedTimezone}
          />
        )}

        {/* Add Task Modal/Form */}
        {isAddingTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">Add New Task</h2>
              <AddTaskForm
                newTask={newTask}
                setNewTask={setNewTask}
                handleAddTask={handleAddTask}
                setIsAddingTask={setIsAddingTask}
                goals={goals}
                tasks={tasks}
                timezones={timezones}
                selectedTimezone={selectedTimezone}
              />
            </div>
          </div>
        )}

        {/* Add Goal Modal/Form */}
        {isAddingGoal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-4">Add New Goal</h2>
              <AddGoalForm
                newGoal={newGoal}
                setNewGoal={setNewGoal}
                handleAddGoal={handleAddGoal}
                setIsAddingGoal={setIsAddingGoal}
              />
            </div>
          </div>
        )}

        {/* Filter Sheet */}
        <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
          <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
            <SheetHeader>
              <SheetTitle>View & Filters</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-6">
              {/* View Selection */}
              <div>
                <h3 className="text-sm font-semibold mb-3">View</h3>
                <div className="flex flex-wrap gap-2">
                  {['All Tasks', 'All Goals', 'Goals List', 'Weekly'].map((view) => (
                    <Button
                      key={view}
                      variant={currentView === view ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setCurrentView(view as any);
                        setIsFilterSheetOpen(false);
                      }}
                      className={`rounded-full ${
                        currentView === view
                          ? 'bg-black hover:bg-gray-800 text-white'
                          : 'bg-white hover:bg-gray-50'
                      }`}
                    >
                      {view === 'Weekly' && <Calendar className="w-4 h-4 mr-2" />}
                      {view}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Status Filters - Only show for Weekly view */}
              {currentView === 'Weekly' && (
                <div>
                  <h3 className="text-sm font-semibold mb-3">Status</h3>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'All', label: 'All', icon: null },
                      { id: 'Completed', label: 'Completed', icon: CheckCircle2 },
                      { id: 'In Progress', label: 'In Progress', icon: AlertCircle },
                      { id: 'Overdue', label: 'Overdue', icon: Clock },
                    ].map((filter) => {
                      const Icon = filter.icon;
                      return (
                        <Button
                          key={filter.id}
                          variant={selectedStatusFilter === filter.id ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedStatusFilter(filter.id)}
                          className={`rounded-full ${
                            selectedStatusFilter === filter.id
                              ? 'bg-black hover:bg-gray-800 text-white'
                              : 'bg-white hover:bg-gray-50'
                          }`}
                        >
                          {Icon && <Icon className="w-4 h-4 mr-2" />}
                          {filter.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Type Filters - Only show for Weekly view */}
              {currentView === 'Weekly' && (
                <div>
                  <h3 className="text-sm font-semibold mb-3">Type</h3>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'All Types', label: 'All Types', icon: null },
                      { id: 'personal', label: 'Personal', icon: User },
                      { id: 'finance', label: 'Finance', icon: DollarSign },
                      { id: 'quick', label: 'Quick', icon: Zap },
                      { id: 'music', label: 'Music', icon: Music },
                      { id: 'code', label: 'Code', icon: Bug },
                      { id: 'calendar', label: 'Calendar', icon: Calendar },
                      { id: 'book', label: 'Book', icon: Book },
                      { id: 'home', label: 'Home', icon: Home },
                      { id: 'roadtrip', label: 'Roadtrip', icon: Car },
                    ].map((filter) => {
                      const Icon = filter.icon;
                      const taskTypeConfig = filter.id !== 'All Types' ? TASK_TYPES[filter.id.toUpperCase()] : null;
                      return (
                        <Button
                          key={filter.id}
                          variant={selectedTypeFilter === filter.id ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedTypeFilter(filter.id)}
                          className={`rounded-full ${
                            selectedTypeFilter === filter.id
                              ? 'bg-black hover:bg-gray-800 text-white'
                              : 'bg-white hover:bg-gray-50'
                          }`}
                        >
                          {Icon && (
                            <Icon
                              className={`w-4 h-4 mr-2 ${
                                selectedTypeFilter === filter.id
                                  ? ''
                                  : taskTypeConfig?.className || ''
                              }`}
                            />
                          )}
                          {filter.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
    </div>
  );
}

