// Module-specific utilities for Finance
import { Fund, Subscription } from './types';

export function calculateFundProgress(fund: Fund): number {
  return Math.min((fund.currentAmount / fund.targetAmount) * 100, 100);
}

export function calculateMonthlyRecurring(subscriptions: Subscription[]): number {
  return subscriptions
    .filter(s => s.frequency === 'Monthly')
    .reduce((sum, s) => sum + s.cost, 0);
}

export function calculateYearlyRecurring(subscriptions: Subscription[]): number {
  return subscriptions.reduce((sum, s) => {
    if (s.frequency === 'Monthly') {
      return sum + (s.cost * 12);
    }
    return sum + s.cost;
  }, 0);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}
