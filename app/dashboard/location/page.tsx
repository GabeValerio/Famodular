"use client";

import { LocationPage } from '@/app/modules/location';
import { useGroup } from '@/lib/GroupContext';
import { useModuleAccess } from '@/app/modules/shared/hooks/useModuleAccess';

export default function LocationRoute() {
  const { currentGroup, isSelfView } = useGroup();
  const { enabled, AccessDenied } = useModuleAccess('location');

  if (!enabled) {
    return AccessDenied ? <AccessDenied /> : null;
  }

  // Location requires a group - don't show in self view
  if (isSelfView || !currentGroup) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Location Sharing Requires a Group</h2>
          <p className="text-muted-foreground">
            Please select a group to view and share locations.
          </p>
        </div>
      </div>
    );
  }

  return <LocationPage groupId={currentGroup.id} />;
}

