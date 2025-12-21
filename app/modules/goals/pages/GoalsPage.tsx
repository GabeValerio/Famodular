"use client";

import { useGoals } from '../hooks/useGoals';
import { GoalsComponent } from '../components/GoalsComponent';
import { useSession } from 'next-auth/react';

export function GoalsPage({ groupId, group }: { groupId: string; group?: any }) {
  const { data: session } = useSession();
  const {
    goals,
    members,
    loading,
    error,
    addGoal,
    updateGoal: updateGoalRaw,
    deleteGoal,
  } = useGoals(groupId);

  // Wrap updateGoal to match component prop type (Promise<void>)
  const updateGoal = async (goal: import('../types').Goal) => {
    await updateGoalRaw(goal);
  };

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

  // Get current user from members based on session
  const currentUser = members.find(m => m.id === session?.user?.id) || members[0] || { id: '', name: '', avatar: '', role: 'Parent' as const };

  return (
    <GoalsComponent
      goals={goals}
      members={members}
      currentUser={currentUser}
      group={group}
      onAddGoal={addGoal}
      onUpdateGoal={updateGoal}
      onDeleteGoal={deleteGoal}
    />
  );
}
