"use client";

import { FinancePage } from '@/app/modules/finance';
import { useGroup } from '@/lib/GroupContext';
import { useModuleAccess } from '@/app/modules/shared/hooks/useModuleAccess';

export default function FinanceRoute() {
  const { currentGroup, isSelfView } = useGroup();
  const { enabled, AccessDenied } = useModuleAccess('finance');

  if (!enabled) {
    return AccessDenied ? <AccessDenied /> : null;
  }

  // Finance module requires a group context
  // If in self view or no group, show a message
  if (isSelfView || !currentGroup) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">
          Finance is only available in group context. Please select or create a group.
        </div>
      </div>
    );
  }

  return <FinancePage groupId={currentGroup.id} />;
}
