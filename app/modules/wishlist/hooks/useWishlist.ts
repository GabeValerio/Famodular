import { useState, useEffect } from 'react';
import { wishlistService } from '../services/wishlistService';
import { WishlistItem, FamilyMember } from '../types';

export function useWishlist(groupId: string) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (groupId) {
      loadData();
    }
  }, [groupId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const itemsData = await wishlistService.getItems(groupId);
      setItems(itemsData);
      // TODO: Load members from a shared service
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  };

  const addItem = async (item: Omit<WishlistItem, 'id'>) => {
    try {
      const newItem = await wishlistService.createItem(item);
      setItems(prev => [...prev, newItem]);
      return newItem;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item');
      throw err;
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      await wishlistService.deleteItem(itemId);
      setItems(prev => prev.filter(i => i.id !== itemId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove item');
      throw err;
    }
  };

  return {
    items,
    members,
    loading,
    error,
    addItem,
    removeItem,
    refresh: loadData,
  };
}
