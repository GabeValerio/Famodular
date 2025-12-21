"use client";

import { GoalsPage } from '@/app/modules/goals';
import { useGroup } from '@/lib/GroupContext';
import { useModuleAccess } from '@/app/modules/shared/hooks/useModuleAccess';

export default function GoalsRoute() {
  const { currentGroup, isSelfView } = useGroup();
  const { enabled, AccessDenied } = useModuleAccess('goals');

  if (!enabled) {
    return AccessDenied ? <AccessDenied /> : null;
  }

  // Goals module requires a group context
  // If in self view or no group, show a message
  if (isSelfView || !currentGroup) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">
          Goals is only available in group context. Please select or create a group.
        </div>
      </div>
    );
  }

  return <GoalsPage groupId={currentGroup.id} group={currentGroup} />;
}
