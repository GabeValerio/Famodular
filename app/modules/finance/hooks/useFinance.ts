import { useState, useEffect } from 'react';
import { financeService } from '../services/financeService';
import { Fund, Subscription } from '../types';

export function useFinance(groupId: string) {
  const [funds, setFunds] = useState<Fund[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (groupId) {
      loadData();
    }
  }, [groupId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [fundsData, subscriptionsData] = await Promise.all([
        financeService.getFunds(groupId),
        financeService.getSubscriptions(groupId),
      ]);
      setFunds(fundsData);
      setSubscriptions(subscriptionsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load finance data');
    } finally {
      setLoading(false);
    }
  };

  const addFund = async (fund: Omit<Fund, 'id'>) => {
    try {
      const newFund = await financeService.createFund(fund);
      setFunds(prev => [...prev, newFund]);
      return newFund;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add fund');
      throw err;
    }
  };

  const updateFund = async (fund: Fund) => {
    try {
      const updatedFund = await financeService.updateFund(fund);
      setFunds(prev => prev.map(f => f.id === fund.id ? updatedFund : f));
      return updatedFund;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update fund');
      throw err;
    }
  };

  const deleteFund = async (fundId: string) => {
    try {
      await financeService.deleteFund(fundId);
      setFunds(prev => prev.filter(f => f.id !== fundId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete fund');
      throw err;
    }
  };

  const addSubscription = async (subscription: Omit<Subscription, 'id'>) => {
    try {
      const newSubscription = await financeService.createSubscription(subscription);
      setSubscriptions(prev => [...prev, newSubscription]);
      return newSubscription;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add subscription');
      throw err;
    }
  };

  const removeSubscription = async (subscriptionId: string) => {
    try {
      await financeService.deleteSubscription(subscriptionId);
      setSubscriptions(prev => prev.filter(s => s.id !== subscriptionId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove subscription');
      throw err;
    }
  };

  return {
    funds,
    subscriptions,
    loading,
    error,
    addFund,
    updateFund,
    deleteFund,
    addSubscription,
    removeSubscription,
    refresh: loadData,
  };
}
