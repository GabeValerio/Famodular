import { Goal } from '../types';

const API_BASE = '/api/modules/user/taskplanner/goals';

export interface CreateGoalInput {
  text: string;
  goal?: string;
  progress?: number;
  groupId?: string | null;
}

export interface UpdateGoalInput {
  text?: string;
  goal?: string;
  progress?: number;
}

export const goalsService = {
  async getGoals(groupId?: string | null): Promise<Goal[]> {
    const params = new URLSearchParams();
    // Only append groupId if it's a valid non-empty string
    if (groupId && groupId.trim() !== '') {
      params.append('groupId', groupId);
    }
    
    const queryString = params.toString();
    const url = queryString ? `${API_BASE}?${queryString}` : API_BASE;
    
    const response = await fetch(url);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to fetch goals' }));
      throw new Error(errorData.error || 'Failed to fetch goals');
    }
    return response.json();
  },

  async getGoal(id: string): Promise<Goal> {
    const response = await fetch(`${API_BASE}/${id}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to fetch goal' }));
      throw new Error(errorData.error || 'Failed to fetch goal');
    }
    return response.json();
  },

  async createGoal(goal: CreateGoalInput): Promise<Goal> {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(goal),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to create goal' }));
      throw new Error(errorData.error || 'Failed to create goal');
    }
    return response.json();
  },

  async updateGoal(id: string, updates: UpdateGoalInput): Promise<Goal> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to update goal' }));
      throw new Error(errorData.error || 'Failed to update goal');
    }
    return response.json();
  },

  async deleteGoal(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to delete goal' }));
      throw new Error(errorData.error || 'Failed to delete goal');
    }
  },
};






