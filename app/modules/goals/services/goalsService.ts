import { Goal, FamilyMember } from '../types';

const API_BASE = '/api/modules/group/goals';

export const goalsService = {
  async getGoals(groupId: string): Promise<Goal[]> {
    const response = await fetch(`${API_BASE}?groupId=${groupId}`);
    if (!response.ok) throw new Error('Failed to fetch goals');
    return response.json();
  },

  async getMembers(groupId: string): Promise<FamilyMember[]> {
    const response = await fetch(`${API_BASE}/members?groupId=${groupId}`);
    if (!response.ok) throw new Error('Failed to fetch members');
    return response.json();
  },

  async createGoal(goal: Omit<Goal, 'id'>): Promise<Goal> {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(goal),
    });
    if (!response.ok) throw new Error('Failed to create goal');
    return response.json();
  },

  async updateGoal(goal: Goal): Promise<Goal> {
    const response = await fetch(`${API_BASE}/${goal.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(goal),
    });
    if (!response.ok) throw new Error('Failed to update goal');
    return response.json();
  },

  async deleteGoal(goalId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/${goalId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete goal');
  },
};
