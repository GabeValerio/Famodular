import { Fund, Subscription } from '../types';

const API_BASE = '/api/modules/group/finance';

export const financeService = {
  async getFunds(groupId: string): Promise<Fund[]> {
    const response = await fetch(`${API_BASE}/funds?groupId=${groupId}`);
    if (!response.ok) throw new Error('Failed to fetch funds');
    return response.json();
  },

  async createFund(fund: Omit<Fund, 'id'>): Promise<Fund> {
    const response = await fetch(`${API_BASE}/funds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fund),
    });
    if (!response.ok) throw new Error('Failed to create fund');
    return response.json();
  },

  async updateFund(fund: Fund): Promise<Fund> {
    const response = await fetch(`${API_BASE}/funds/${fund.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fund),
    });
    if (!response.ok) throw new Error('Failed to update fund');
    return response.json();
  },

  async deleteFund(fundId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/funds/${fundId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete fund');
  },

  async getSubscriptions(groupId: string): Promise<Subscription[]> {
    const response = await fetch(`${API_BASE}/subscriptions?groupId=${groupId}`);
    if (!response.ok) throw new Error('Failed to fetch subscriptions');
    return response.json();
  },

  async createSubscription(subscription: Omit<Subscription, 'id'>): Promise<Subscription> {
    const response = await fetch(`${API_BASE}/subscriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription),
    });
    if (!response.ok) throw new Error('Failed to create subscription');
    return response.json();
  },

  async deleteSubscription(subscriptionId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/subscriptions/${subscriptionId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete subscription');
  },
};
