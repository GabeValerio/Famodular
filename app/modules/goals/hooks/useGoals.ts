import { useState, useEffect } from 'react';
import { goalsService } from '../services/goalsService';
import { Goal, FamilyMember } from '../types';

export function useGoals(groupId: string) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>([]);
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
      const [goalsData, membersData] = await Promise.all([
        goalsService.getGoals(groupId),
        goalsService.getMembers(groupId),
      ]);
      setGoals(goalsData);
      setMembers(membersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  const addGoal = async (goal: Omit<Goal, 'id'>) => {
    try {
      const newGoal = await goalsService.createGoal(goal);
      setGoals(prev => [...prev, newGoal]);
      return newGoal;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add goal');
      throw err;
    }
  };

  const updateGoal = async (goal: Goal) => {
    try {
      const updatedGoal = await goalsService.updateGoal(goal);
      setGoals(prev => prev.map(g => g.id === goal.id ? updatedGoal : g));
      return updatedGoal;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update goal');
      throw err;
    }
  };

  const deleteGoal = async (goalId: string) => {
    try {
      await goalsService.deleteGoal(goalId);
      setGoals(prev => prev.filter(g => g.id !== goalId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete goal');
      throw err;
    }
  };

  return {
    goals,
    members,
    loading,
    error,
    addGoal,
    updateGoal,
    deleteGoal,
    refresh: loadData,
  };
}
