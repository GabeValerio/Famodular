"use client";

import { WishlistPage } from '@/app/modules/wishlist';
import { useGroup } from '@/lib/GroupContext';
import { useModuleAccess } from '@/app/modules/shared/hooks/useModuleAccess';

export default function WishlistRoute() {
  const { currentGroup, isSelfView } = useGroup();
  const { enabled, AccessDenied } = useModuleAccess('wishlist');

  if (!enabled) {
    return AccessDenied ? <AccessDenied /> : null;
  }

  // Wishlist requires a group - don't show in self view
  if (isSelfView || !currentGroup) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Wishlist Requires a Group</h2>
          <p className="text-muted-foreground">
            Please select a group to view and manage wishlist items.
          </p>
        </div>
      </div>
    );
  }

  return <WishlistPage groupId={currentGroup.id} />;
}
