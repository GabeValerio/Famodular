import { useState, useEffect, useCallback } from 'react';
import { tasksService, CreateTaskInput, UpdateTaskInput } from '../services/tasksService';
import { Task, Goal } from '../types';

export function useTasks(groupId?: string) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial data
  useEffect(() => {
    loadTasks();
  }, [groupId]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const tasksData = await tasksService.getTasks(groupId);
      setTasks(tasksData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load tasks';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (taskInput: CreateTaskInput) => {
    try {
      const newTask = await tasksService.createTask(taskInput);
      setTasks(prev => [newTask, ...prev]);
      return newTask;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
      throw err;
    }
  };

  const updateTask = async (id: string, updates: UpdateTaskInput) => {
    try {
      const updatedTask = await tasksService.updateTask(id, updates);
      setTasks(prev => prev.map(t => t.id === id ? updatedTask : t));
      return updatedTask;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task');
      throw err;
    }
  };

  const deleteTask = async (id: string) => {
    try {
      await tasksService.deleteTask(id);
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task');
      throw err;
    }
  };

  const toggleTask = async (id: string) => {
    try {
      const updatedTask = await tasksService.toggleTask(id);
      setTasks(prev => prev.map(t => t.id === id ? updatedTask : t));
      return updatedTask;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle task');
      throw err;
    }
  };

  // Helper to get task by ID with fallback for both camelCase and snake_case
  const getTask = useCallback((id: string): Task | undefined => {
    return tasks.find(t => t.id === id);
  }, [tasks]);

  // Helper to get field value with fallback for both formats
  const getTaskField = useCallback((task: Task, field: 'goalId' | 'parentId' | 'dueDate' | 'completedAt'): string | null | undefined => {
    // Try camelCase first, then snake_case
    if (field === 'goalId') return task.goalId || task.goal_id;
    if (field === 'parentId') return task.parentId || task.parent_id;
    if (field === 'dueDate') return (task.dueDate || task.due_date) as string | null | undefined;
    if (field === 'completedAt') return (task.completedAt || task.completed_at) as string | null | undefined;
    return undefined;
  }, []);

  return {
    tasks,
    goals,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    toggleTask,
    refreshTasks: loadTasks,
    getTask,
    getTaskField,
  };
}

