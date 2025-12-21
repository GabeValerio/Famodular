import { WishlistItem } from '../types';

const API_BASE = '/api/modules/group/wishlist';

export const wishlistService = {
  async getItems(groupId: string): Promise<WishlistItem[]> {
    const response = await fetch(`${API_BASE}?groupId=${groupId}`);
    if (!response.ok) throw new Error('Failed to fetch wishlist items');
    return response.json();
  },

  async createItem(item: Omit<WishlistItem, 'id'>): Promise<WishlistItem> {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    if (!response.ok) throw new Error('Failed to create wishlist item');
    return response.json();
  },

  async deleteItem(itemId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/${itemId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete wishlist item');
  },
};
