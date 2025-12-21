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

  // Goals can work in both contexts, but data must be isolated
  // Pass null for self view, groupId for group view (never empty string)
  const groupId = isSelfView || !currentGroup ? null : currentGroup.id;

  return <GoalsPage groupId={groupId} />;
}
