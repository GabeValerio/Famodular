import { Task, Goal, NewTaskForm } from '../types';

const API_BASE = '/api/modules/user/taskplanner';

export interface CreateTaskInput {
  title?: string;
  text?: string;
  description?: string;
  type?: string;
  completed?: boolean;
  groupId?: string | null;
  goalId?: string | null;
  parentId?: string | null;
  projectId?: string | null;
  dueDate?: string | Date;
  endDate?: string | Date;
  timezone?: string;
  scheduledTime?: string;
  endTime?: string;
  priority?: number;
  estimatedTime?: number | null;
  completedTime?: number | null;
  isRecurring?: boolean;
  recurrencePattern?: string;
  recurrenceInterval?: number;
  recurrenceDayOfWeek?: number[];
  recurrenceDayOfMonth?: number[];
  recurrenceMonth?: number[];
  recurrenceEndDate?: string;
  recurrenceCount?: number;
  imageUrl?: string | null;
}

export interface UpdateTaskInput {
  title?: string;
  text?: string;
  description?: string;
  type?: string;
  completed?: boolean;
  priority?: number;
  dueDate?: string | Date | null;
  endDate?: string | Date | null;
  timezone?: string;
  scheduledTime?: string;
  endTime?: string;
  estimatedTime?: number | null;
  completedTime?: number | null;
  goalId?: string | null;
  parentId?: string | null;
  projectId?: string | null;
  isRecurring?: boolean;
  recurrencePattern?: string;
  recurrenceInterval?: number;
  recurrenceDayOfWeek?: number[];
  recurrenceDayOfMonth?: number[];
  recurrenceMonth?: number[];
  recurrenceEndDate?: string | null;
  recurrenceCount?: number | null;
  imageUrl?: string | null;
}

export const tasksService = {
  async getTasks(groupId?: string | null, completed?: boolean, type?: string, goalId?: string): Promise<Task[]> {
    const params = new URLSearchParams();
    if (completed !== undefined) params.append('completed', completed.toString());
    if (type) params.append('type', type);
    if (goalId) params.append('goalId', goalId);
    // Only append groupId if it's a valid non-empty string
    if (groupId && groupId.trim() !== '') {
      params.append('groupId', groupId);
    }
    
    const queryString = params.toString();
    const url = queryString ? `${API_BASE}?${queryString}` : API_BASE;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch tasks');
    return response.json();
  },

  async getTask(id: string): Promise<Task> {
    const response = await fetch(`${API_BASE}/${id}`);
    if (!response.ok) throw new Error('Failed to fetch task');
    return response.json();
  },

  async createTask(task: CreateTaskInput): Promise<Task> {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to create task' }));
      throw new Error(errorData.error || 'Failed to create task');
    }
    return response.json();
  },

  async updateTask(id: string, updates: UpdateTaskInput): Promise<Task> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to update task' }));
      throw new Error(errorData.error || 'Failed to update task');
    }
    return response.json();
  },

  async deleteTask(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete task');
  },

  async toggleTask(id: string): Promise<Task> {
    const response = await fetch(`${API_BASE}/${id}/toggle`, {
      method: 'PATCH',
    });
    if (!response.ok) throw new Error('Failed to toggle task');
    return response.json();
  },
};





