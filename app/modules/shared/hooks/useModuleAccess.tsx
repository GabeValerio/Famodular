"use client";

import React from 'react';
import { useGroup } from '@/lib/GroupContext';
import { isModuleEnabled, ModuleId } from '../../registry';

export function useModuleAccess(moduleId: ModuleId) {
  const { currentGroup, currentUser, isSelfView } = useGroup();
  const enabled = isModuleEnabled(currentGroup, moduleId, currentUser);
  
  const AccessDeniedComponent: React.FC = () => (
    <div className="text-center py-12">
      <h2 className="text-2xl font-bold mb-2">Module Disabled</h2>
      <p className="text-muted-foreground">
        {isSelfView 
          ? "This module is only available in group view."
          : `This module is not enabled for ${currentGroup?.name || 'this group'}.`}
      </p>
      {!isSelfView && (
        <p className="text-sm text-muted-foreground mt-2">
          Ask a group admin to enable this module in settings.
        </p>
      )}
    </div>
  );
  
  return {
    enabled,
    group: currentGroup,
    isSelfView,
    // Helper to show access denied message
    AccessDenied: enabled ? null : AccessDeniedComponent,
  };
}
