"use client";

import { PlantsPage } from '@/app/modules/plants';
import { useGroup } from '@/lib/GroupContext';
import { useModuleAccess } from '@/app/modules/shared/hooks/useModuleAccess';

export default function PlantsRoute() {
  const { currentGroup, isSelfView } = useGroup();
  const { enabled, AccessDenied } = useModuleAccess('plants');

  if (!enabled) {
    return AccessDenied ? <AccessDenied /> : null;
  }

  // Plants require a group - don't show in self view
  if (isSelfView || !currentGroup) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Plants Require a Group</h2>
          <p className="text-muted-foreground">
            Please select a group to view and manage plants.
          </p>
        </div>
      </div>
    );
  }

  return <PlantsPage groupId={currentGroup.id} />;
}




