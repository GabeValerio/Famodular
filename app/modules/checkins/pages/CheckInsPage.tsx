"use client";

import { useCheckIns } from '../hooks/useCheckIns';
import { CheckInsComponent } from '../components/CheckInsComponent';
import { useGroup } from '@/lib/GroupContext';

export function CheckInsPage({ groupId }: { groupId: string }) {
  const { currentGroup } = useGroup();
  const actualGroupId = groupId || currentGroup?.id || '';
  
  const {
    checkIns,
    members,
    questions,
    loading,
    error,
    addCheckIn,
    addQuestion,
  } = useCheckIns(actualGroupId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading check-ins...</div>
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
    <CheckInsComponent
      checkIns={checkIns}
      members={members}
      currentUser={currentUser}
      onAddCheckIn={addCheckIn}
      questions={questions}
      onAddQuestion={addQuestion}
    />
  );
}
