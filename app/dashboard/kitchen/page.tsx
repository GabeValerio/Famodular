"use client";

import { Suspense } from 'react';
import { useGroup } from '@/lib/GroupContext';
import { useModules } from '@/app/modules/hooks/useModules';
import { KitchenPage } from '@/app/modules/kitchen';
import { notFound } from 'next/navigation';

export default function KitchenRoute() {
  const { currentGroup } = useGroup();
  const { isModuleEnabled } = useModules();

  // Check if module is enabled for this group
  if (!isModuleEnabled(currentGroup, 'kitchen')) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Module Disabled</h2>
        <p className="text-muted-foreground">
          Kitchen module is not enabled for this group.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Ask a group admin to enable this module in settings.
        </p>
      </div>
    );
  }

  // Check if we have a valid group
  if (!currentGroup) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">No Group Selected</h2>
        <p className="text-muted-foreground">
          Please select a group to access the Kitchen module.
        </p>
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="text-center py-8">Loading Kitchen...</div>}>
      <KitchenPage groupId={currentGroup.id} />
    </Suspense>
  );
}
