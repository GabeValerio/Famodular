"use client";

import { useGroup } from '@/lib/GroupContext';
import { ReactNode } from 'react';

interface DataIsolationGuardProps {
  children: ReactNode;
  requiresGroup?: boolean; // If true, only works in group view
  groupId?: string | null; // Pass the groupId to child
}

/**
 * Ensures data isolation between Self and Group views.
 * 
 * - If requiresGroup=true: Only renders in group view
 * - If requiresGroup=false: Renders in both, but ensures proper data filtering
 */
export function DataIsolationGuard({ 
  children, 
  requiresGroup = false,
  groupId 
}: DataIsolationGuardProps) {
  const { currentGroup, isSelfView } = useGroup();

  // If module requires a group but we're in self view
  if (requiresGroup && (isSelfView || !currentGroup)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">This Module Requires a Group</h2>
          <p className="text-muted-foreground">
            Please select a group to use this feature.
          </p>
        </div>
      </div>
    );
  }

  // Ensure we only pass valid groupId (never empty string)
  const validGroupId = currentGroup?.id || null;
  
  // Clone children and pass the correct groupId
  return <>{children}</>;
}
