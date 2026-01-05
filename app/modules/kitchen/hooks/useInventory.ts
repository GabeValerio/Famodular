import { useState, useCallback } from 'react';
import { KitchenInventoryItem, InventoryAnalysis, KitchenLocation, KitchenItemCategory } from '../types';
import { kitchenService } from '../services/kitchenService';

export interface UseInventoryReturn {
  // State
  items: KitchenInventoryItem[];
  analysis: InventoryAnalysis | null;
  loading: boolean;
  error: string | null;

  // Actions
  loadItems: (groupId: string) => Promise<void>;
  addItem: (item: Omit<KitchenInventoryItem, 'id' | 'addedDate'>) => Promise<void>;
  updateItem: (itemId: string, updates: Partial<KitchenInventoryItem>) => Promise<void>;
  deleteItem: (itemId: string) => Promise<void>;
  addFromPhoto: (imageData: string, groupId: string, addedBy: string) => Promise<void>;
  analyze: (groupId: string) => Promise<void>;

  // Computed values
  expiringSoon: KitchenInventoryItem[];
  lowStock: KitchenInventoryItem[];
  byLocation: Record<KitchenLocation, KitchenInventoryItem[]>;
  byCategory: Record<KitchenItemCategory, KitchenInventoryItem[]>;
}

export function useInventory(): UseInventoryReturn {
  const [items, setItems] = useState<KitchenInventoryItem[]>([]);
  const [analysis, setAnalysis] = useState<InventoryAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadItems = useCallback(async (groupId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await kitchenService.inventory.getInventory(groupId);
      setItems(data);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load inventory';
      setError(errorMsg);
      console.error('Error loading inventory:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const addItem = useCallback(async (item: Omit<KitchenInventoryItem, 'id' | 'addedDate'>) => {
    try {
      const newItem = await kitchenService.inventory.addInventoryItem(item);
      setItems(prev => [newItem, ...prev]);
    } catch (err) {
      console.error('Error adding inventory item:', err);
      throw err;
    }
  }, []);

  const updateItem = useCallback(async (itemId: string, updates: Partial<KitchenInventoryItem>) => {
    try {
      const updatedItem = await kitchenService.inventory.updateInventoryItem(itemId, updates);
      setItems(prev => prev.map(item => item.id === itemId ? updatedItem : item));
    } catch (err) {
      console.error('Error updating inventory item:', err);
      throw err;
    }
  }, []);

  const deleteItem = useCallback(async (itemId: string) => {
    try {
      await kitchenService.inventory.deleteInventoryItem(itemId);
      setItems(prev => prev.filter(item => item.id !== itemId));
    } catch (err) {
      console.error('Error deleting inventory item:', err);
      throw err;
    }
  }, []);

  const addFromPhoto = useCallback(async (imageData: string, groupId: string, addedBy: string) => {
    try {
      const newItems = await kitchenService.inventory.addItemFromPhoto(imageData, groupId, addedBy);
      setItems(prev => [...newItems, ...prev]);
    } catch (err) {
      console.error('Error adding items from photo:', err);
      throw err;
    }
  }, []);

  const analyze = useCallback(async (groupId: string) => {
    try {
      setLoading(true);
      setError(null);
      const analysisResult = await kitchenService.inventory.analyzeInventory(groupId);
      setAnalysis(analysisResult);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to analyze inventory';
      setError(errorMsg);
      console.error('Error analyzing inventory:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Computed values
  const expiringSoon = analysis?.expiringSoon || [];
  const lowStock = analysis?.lowStock || [];

  const byLocation = items.reduce((acc, item) => {
    if (!acc[item.location]) {
      acc[item.location] = [];
    }
    acc[item.location].push(item);
    return acc;
  }, {} as Record<KitchenLocation, KitchenInventoryItem[]>);

  const byCategory = items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<KitchenItemCategory, KitchenInventoryItem[]>);

  return {
    items,
    analysis,
    loading,
    error,
    loadItems,
    addItem,
    updateItem,
    deleteItem,
    addFromPhoto,
    analyze,
    expiringSoon,
    lowStock,
    byLocation,
    byCategory,
  };
}
