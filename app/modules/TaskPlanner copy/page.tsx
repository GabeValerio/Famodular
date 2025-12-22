'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Plus, Calendar, Clock, User, DollarSign, Zap, Music, Bug, Book, Home, Car } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from 'next/link';
import WeeklyView from './components/WeeklyView';
import AllTasksView from './components/AllTasksView';
import AllGoalsView from './components/AllGoalsView';
import GoalsListView from './components/GoalsListView';
import AddTaskForm from './components/AddTaskForm';
import AddGoalForm, { NewGoalForm } from './components/AddGoalForm';
import { Task, Goal, NewTaskForm } from './types';
import { TASK_TYPES } from './components/TaskTypeIcon';

export default function TaskPlanner() {
  // Sample data - in a real app, this would come from your API/database
  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [selectedTimezone] = useState('America/New_York');
  
  // View and filter state
  const [currentView, setCurrentView] = useState<'All Tasks' | 'All Goals' | 'Goals List' | 'Weekly'>('Weekly');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('All Types');
  const [currentWeek, setCurrentWeek] = useState<Date>(new Date(2025, 11, 15)); // December 15, 2025

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
  const [taskDateToAdd, setTaskDateToAdd] = useState<Date | null>(null);

  // Initialize new goal form
  const initialNewGoal: NewGoalForm = {
    text: '',
    goal: '',
    progress: 0,
  };

  const [newGoal, setNewGoal] = useState<NewGoalForm>(initialNewGoal);

  // Timezones - in a real app, this might come from a library or API
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

    // Create new task object
    const taskDate = taskDateToAdd || new Date();
    const task: Task = {
      id: Date.now().toString(),
      text: newTask.title,
      title: newTask.title,
      description: newTask.description,
      type: newTask.type,
      goal_id: newTask.goal_id,
      parent_id: newTask.parent_id,
      due_date: newTask.date 
        ? new Date(newTask.date + 'T' + (newTask.time || '12:00') + ':00').toISOString()
        : taskDate.toISOString(),
      timezone: newTask.timezone,
      is_recurring: newTask.is_recurring,
      recurrence_pattern: newTask.recurrence_pattern,
      recurrence_interval: newTask.recurrence_interval,
      recurrence_day_of_week: newTask.recurrence_day_of_week,
      recurrence_day_of_month: newTask.recurrence_day_of_month,
      recurrence_month: newTask.recurrence_month,
      recurrence_end_date: newTask.recurrence_end_date,
      recurrence_count: newTask.recurrence_count,
      image_url: newTask.image_url,
      completed: false,
      created_at: new Date().toISOString(),
    };

    // In a real app, you would save to your database here
    setTasks(prev => [...prev, task]);

    // Reset form
    setNewTask(initialNewTask);
    setIsAddingTask(false);
    setTaskDateToAdd(null);
  }, [newTask, initialNewTask, taskDateToAdd]);

  const handleTaskToggle = useCallback((task: Task) => {
    setTasks(prev => prev.map(t =>
      t.id === task.id ? { ...t, completed: !t.completed } : t
    ));
  }, []);

  const handleTaskDelete = useCallback((taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  }, []);

  // Goal handlers
  const handleAddGoal = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    // Create new goal object
    const goal: Goal = {
      id: Date.now().toString(),
      text: newGoal.text,
      goal: newGoal.goal || newGoal.text,
      progress: newGoal.progress || 0,
      created_at: new Date().toISOString(),
    };

    // In a real app, you would save to your database here
    setGoals(prev => [...prev, goal]);

    // Reset form
    setNewGoal(initialNewGoal);
    setIsAddingGoal(false);
  }, [newGoal, initialNewGoal]);

  const handleGoalClick = useCallback((goal: Goal) => {
    setSelectedGoal(goal);
  }, []);

  const handleGoalUpdate = useCallback(async (goalId: string, updates: Partial<Goal>) => {
    setGoals(prev => prev.map(g => 
      g.id === goalId ? { ...g, ...updates } : g
    ));
  }, []);

  const handleGoalDelete = useCallback(async (goalId: string) => {
    if (confirm('Are you sure you want to delete this goal?')) {
      setGoals(prev => prev.filter(g => g.id !== goalId));
      // Also remove goal_id from tasks
      setTasks(prev => prev.map(t => 
        t.goal_id === goalId ? { ...t, goal_id: undefined } : t
      ));
      if (selectedGoal?.id === goalId) {
        setSelectedGoal(null);
      }
    }
  }, [selectedGoal]);

  const handleAddTaskForDate = (date: Date) => {
    setTaskDateToAdd(date);
    const dateStr = date.toISOString().split('T')[0];
    setNewTask({ ...newTask, date: dateStr });
    setIsAddingTask(true);
  };

  const handlePreviousWeek = () => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() - 7);
    setCurrentWeek(newWeek);
  };

  const handleNextWeek = () => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() + 7);
    setCurrentWeek(newWeek);
  };

  // Status filter options
  const statusFilters = [
    { id: 'All', label: 'All' },
    { id: 'Completed', label: 'Completed' },
    { id: 'In Progress', label: 'In Progress' },
    { id: 'Overdue', label: 'Overdue', icon: Clock },
  ];

  // Type filter options
  const typeFilters = [
    { id: 'All Types', label: 'All Types' },
    { id: 'personal', label: 'Personal', icon: User },
    { id: 'finance', label: 'Finance', icon: DollarSign },
    { id: 'quick', label: 'Quick', icon: Zap },
    { id: 'music', label: 'Music', icon: Music },
    { id: 'code', label: 'Code', icon: Bug },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'book', label: 'Book', icon: Book },
    { id: 'home', label: 'Home', icon: Home },
    { id: 'roadtrip', label: 'Roadtrip', icon: Car },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumbs */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/dashboard">Dashboard</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Task Planner</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Top Action Buttons */}
        <div className="flex justify-end gap-3 mb-6">
          <Button
            variant="outline"
            onClick={() => setIsAddingGoal(true)}
            className="rounded-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Goal
          </Button>
          <Button
            onClick={() => {
              setTaskDateToAdd(null);
              setIsAddingTask(true);
            }}
            className="rounded-full bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </Button>
        </div>

        {/* Primary View Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          {['All Tasks', 'All Goals', 'Goals List', 'Weekly'].map((view) => (
            <Button
              key={view}
              variant={currentView === view ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentView(view as any)}
              className={`rounded-full ${
                currentView === view
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-white hover:bg-gray-50'
              }`}
            >
              {view === 'Weekly' && <Calendar className="w-4 h-4 mr-2" />}
              {view}
            </Button>
          ))}
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          {statusFilters.map((filter) => {
            const Icon = filter.icon;
            return (
              <Button
                key={filter.id}
                variant={selectedStatusFilter === filter.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedStatusFilter(filter.id)}
                className={`rounded-full ${
                  selectedStatusFilter === filter.id
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-white hover:bg-gray-50'
                }`}
              >
                {Icon && <Icon className="w-4 h-4 mr-2" />}
                {filter.label}
              </Button>
            );
          })}
        </div>

        {/* Type Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {typeFilters.map((filter) => {
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
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
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

        {/* Main Content - Views */}
        {currentView === 'Weekly' && (
          <WeeklyView
            currentWeek={currentWeek}
            tasks={tasks}
            onPreviousWeek={handlePreviousWeek}
            onNextWeek={handleNextWeek}
            onAddTask={handleAddTaskForDate}
            selectedTask={selectedTask}
            setSelectedTask={setSelectedTask}
            onTaskToggle={handleTaskToggle}
            onTaskDelete={handleTaskDelete}
            selectedTimezone={selectedTimezone}
            selectedStatusFilter={selectedStatusFilter}
            selectedTypeFilter={selectedTypeFilter}
          />
        )}

        {currentView === 'All Tasks' && (
          <AllTasksView
            tasks={tasks}
            goals={goals}
            selectedTask={selectedTask}
            setSelectedTask={setSelectedTask}
            onTaskToggle={handleTaskToggle}
            onTaskDelete={handleTaskDelete}
            onTaskEdit={(task) => {
              // Handle task edit - could open a modal or inline edit
              console.log('Edit task:', task);
            }}
            selectedTimezone={selectedTimezone}
            selectedStatusFilter={selectedStatusFilter}
            selectedTypeFilter={selectedTypeFilter}
          />
        )}

        {currentView === 'All Goals' && (
          <AllGoalsView
            goals={goals}
            tasks={tasks}
            onGoalClick={handleGoalClick}
            onTaskToggle={handleTaskToggle}
            onTaskDelete={handleTaskDelete}
            onTaskEdit={(task) => {
              console.log('Edit task:', task);
            }}
            selectedTimezone={selectedTimezone}
          />
        )}

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
            onAddTask={(goalId) => {
              setNewTask({ ...initialNewTask, goal_id: goalId });
              setIsAddingTask(true);
            }}
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
      </div>
    </div>
  );
}