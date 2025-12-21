"use client";

import { useGoals } from '../hooks/useGoals';
import { GoalsComponent } from '../components/GoalsComponent';

export function GoalsPage({ groupId }: { groupId: string }) {
  const {
    goals,
    members,
    loading,
    error,
    addGoal,
    updateGoal,
    deleteGoal,
  } = useGoals(groupId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading goals...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-destructive">Error: {error}</div>
      </div>
    );
  }

  // Get current user from members (in real app, get from session)
  const currentUser = members[0] || { id: '', name: '', avatar: '', role: 'Parent' as const };

  return (
    <GoalsComponent
      goals={goals}
      members={members}
      currentUser={currentUser}
      onAddGoal={addGoal}
      onUpdateGoal={updateGoal}
      onDeleteGoal={deleteGoal}
    />
  );
}
