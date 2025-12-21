"use client";

import { useWishlist } from '../hooks/useWishlist';
import { WishlistComponent } from '../components/WishlistComponent';

export function WishlistPage({ groupId }: { groupId: string }) {
  const {
    items,
    members,
    loading,
    error,
    addItem,
    removeItem,
  } = useWishlist(groupId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading wishlist...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-destructive">Error: {error}</div>
      </div>
    );
  }

  // Get current user from members (in real app, get from session)
  const currentUser = members[0] || { id: '', name: '', avatar: '', role: 'Parent' as const };

  return (
    <WishlistComponent
      items={items}
      members={members}
      currentUser={currentUser}
      onAddItem={addItem}
      onRemoveItem={removeItem}
    />
  );
}
