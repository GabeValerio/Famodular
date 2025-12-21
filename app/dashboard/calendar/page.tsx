"use client";

import { CalendarPage } from '@/app/modules/calendar';
import { useGroup } from '@/lib/GroupContext';
import { useModuleAccess } from '@/app/modules/shared/hooks/useModuleAccess';

export default function CalendarRoute() {
  const { currentGroup, isSelfView } = useGroup();
  const { enabled, AccessDenied } = useModuleAccess('calendar');

  if (!enabled) {
    return AccessDenied ? <AccessDenied /> : null;
  }

  // Calendar can work in both contexts, but data must be isolated
  // Pass null for self view, groupId for group view (never empty string)
  const groupId = isSelfView || !currentGroup ? null : currentGroup.id;

  return <CalendarPage groupId={groupId} />;
}

