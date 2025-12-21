"use client";

import { CheckInsPage } from '@/app/modules/checkins';
import { useGroup } from '@/lib/GroupContext';
import { useModuleAccess } from '@/app/modules/shared/hooks/useModuleAccess';

export default function CheckInsRoute() {
  const { currentGroup, isSelfView } = useGroup();
  const { enabled, AccessDenied } = useModuleAccess('checkins');

  if (!enabled) {
    return AccessDenied ? <AccessDenied /> : null;
  }

  // Check-ins require a group - don't show in self view
  if (isSelfView || !currentGroup) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Check-ins Require a Group</h2>
          <p className="text-muted-foreground">
            Please select a group to view and create check-ins.
          </p>
        </div>
      </div>
    );
  }

  return <CheckInsPage groupId={currentGroup.id} />;
}
