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

  // Finance can work in both contexts, but data must be isolated
  // Pass null for self view, groupId for group view (never empty string)
  const groupId = isSelfView || !currentGroup ? null : currentGroup.id;

  return <FinancePage groupId={groupId} />;
}
