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

  // Calendar module requires a group context
  // If in self view or no group, show a message
  if (isSelfView || !currentGroup) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">
          Calendar is only available in group context. Please select or create a group.
        </div>
      </div>
    );
  }

  return <CalendarPage groupId={currentGroup.id} />;
}

