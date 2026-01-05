import { useState, useEffect, useCallback } from 'react';
import {
  KitchenInventoryItem,
  KitchenGroceryList,
  MealPlan,
  Recipe,
  InventoryAnalysis,
  MealPlanningRequest,
  GroceryListSuggestion
} from '../types';
import { kitchenService } from '../services/kitchenService';

export interface UseKitchenReturn {
  // Data
  inventory: KitchenInventoryItem[];
  groceryLists: KitchenGroceryList[];
  mealPlans: MealPlan[];
  recipes: Recipe[];
  inventoryAnalysis: InventoryAnalysis | null;
  expiringSoon: KitchenInventoryItem[];
  lowStock: KitchenInventoryItem[];

  // Loading states
  loading: {
    inventory: boolean;
    groceryLists: boolean;
    mealPlans: boolean;
    recipes: boolean;
    analysis: boolean;
  };

  // Errors
  errors: {
    inventory: string | null;
    groceryLists: string | null;
    mealPlans: string | null;
    recipes: string | null;
    analysis: string | null;
  };

  // Actions
  refreshInventory: () => Promise<void>;
  refreshGroceryLists: () => Promise<void>;
  refreshMealPlans: () => Promise<void>;
  refreshRecipes: () => Promise<void>;
  analyzeInventory: () => Promise<void>;

  // Inventory actions
  addInventoryItem: (item: Omit<KitchenInventoryItem, 'id' | 'addedDate'>) => Promise<void>;
  updateInventoryItem: (itemId: string, updates: Partial<KitchenInventoryItem>) => Promise<void>;
  deleteInventoryItem: (itemId: string) => Promise<void>;
  addItemFromPhoto: (imageData: string, addedBy: string) => Promise<void>;

  // Grocery actions
  createGroceryList: (list: Omit<KitchenGroceryList, 'id' | 'createdDate' | 'items'>) => Promise<void>;
  updateGroceryList: (listId: string, updates: Partial<KitchenGroceryList>) => Promise<void>;
  deleteGroceryList: (listId: string) => Promise<void>;
  addGroceryItem: (listId: string, item: Omit<any, 'id'>) => Promise<void>;
  updateGroceryItem: (listId: string, itemId: string, updates: Partial<any>) => Promise<void>;
  deleteGroceryItem: (listId: string, itemId: string) => Promise<void>;
  generateGrocerySuggestions: (mealPlanId: string) => Promise<GroceryListSuggestion>;

  // Meal planning actions
  generateMealPlan: (request: MealPlanningRequest) => Promise<void>;
  saveMealPlan: (mealPlan: Omit<MealPlan, 'id' | 'createdDate'>) => Promise<void>;
  updateMealPlan: (planId: string, updates: Partial<MealPlan>) => Promise<void>;
  deleteMealPlan: (planId: string) => Promise<void>;

  // Recipe actions
  generateRecipe: (mealIdea: string, ingredients: string[], dietaryPreferences: string[]) => Promise<void>;
  saveRecipe: (recipe: Omit<Recipe, 'id'>) => Promise<void>;
  updateRecipe: (recipeId: string, updates: Partial<Recipe>) => Promise<void>;
  deleteRecipe: (recipeId: string) => Promise<void>;
}

export function useKitchen(groupId: string): UseKitchenReturn {
  // Data state
  const [inventory, setInventory] = useState<KitchenInventoryItem[]>([]);
  const [groceryLists, setGroceryLists] = useState<KitchenGroceryList[]>([]);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [inventoryAnalysis, setInventoryAnalysis] = useState<InventoryAnalysis | null>(null);

  // Loading states
  const [loading, setLoading] = useState({
    inventory: true,
    groceryLists: true,
    mealPlans: true,
    recipes: true,
    analysis: false,
  });

  // Error states
  const [errors, setErrors] = useState({
    inventory: null as string | null,
    groceryLists: null as string | null,
    mealPlans: null as string | null,
    recipes: null as string | null,
    analysis: null as string | null,
  });

  // Load all data on mount and when groupId changes
  useEffect(() => {
    loadAllData();
  }, [groupId]);

  const loadAllData = useCallback(async () => {
    await Promise.all([
      refreshInventory(),
      refreshGroceryLists(),
      refreshMealPlans(),
      refreshRecipes(),
    ]);
  }, [groupId]);

  // Inventory methods
  const refreshInventory = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, inventory: true }));
      setErrors(prev => ({ ...prev, inventory: null }));

      const data = await kitchenService.inventory.getInventory(groupId);
      setInventory(data);
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to load inventory';
      setErrors(prev => ({ ...prev, inventory: error }));
      console.error('Error loading inventory:', err);
    } finally {
      setLoading(prev => ({ ...prev, inventory: false }));
    }
  }, [groupId]);

  const addInventoryItem = useCallback(async (item: Omit<KitchenInventoryItem, 'id' | 'addedDate'>) => {
    try {
      const newItem = await kitchenService.inventory.addInventoryItem(item);
      setInventory(prev => [newItem, ...prev]);
    } catch (err) {
      console.error('Error adding inventory item:', err);
      throw err;
    }
  }, []);

  const updateInventoryItem = useCallback(async (itemId: string, updates: Partial<KitchenInventoryItem>) => {
    try {
      const updatedItem = await kitchenService.inventory.updateInventoryItem(itemId, updates);
      setInventory(prev => prev.map(item => item.id === itemId ? updatedItem : item));
    } catch (err) {
      console.error('Error updating inventory item:', err);
      throw err;
    }
  }, []);

  const deleteInventoryItem = useCallback(async (itemId: string) => {
    try {
      await kitchenService.inventory.deleteInventoryItem(itemId);
      setInventory(prev => prev.filter(item => item.id !== itemId));
    } catch (err) {
      console.error('Error deleting inventory item:', err);
      throw err;
    }
  }, []);

  const addItemFromPhoto = useCallback(async (imageData: string, addedBy: string) => {
    try {
      const newItems = await kitchenService.inventory.addItemFromPhoto(imageData, groupId, addedBy);
      setInventory(prev => [...newItems, ...prev]);
    } catch (err) {
      console.error('Error adding items from photo:', err);
      throw err;
    }
  }, [groupId]);

  const analyzeInventory = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, analysis: true }));
      setErrors(prev => ({ ...prev, analysis: null }));

      const analysis = await kitchenService.inventory.analyzeInventory(groupId);
      setInventoryAnalysis(analysis);
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to analyze inventory';
      setErrors(prev => ({ ...prev, analysis: error }));
      console.error('Error analyzing inventory:', err);
    } finally {
      setLoading(prev => ({ ...prev, analysis: false }));
    }
  }, [groupId]);

  // Grocery list methods
  const refreshGroceryLists = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, groceryLists: true }));
      setErrors(prev => ({ ...prev, groceryLists: null }));

      const data = await kitchenService.grocery.getGroceryLists(groupId);
      setGroceryLists(data);
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to load grocery lists';
      setErrors(prev => ({ ...prev, groceryLists: error }));
      console.error('Error loading grocery lists:', err);
    } finally {
      setLoading(prev => ({ ...prev, groceryLists: false }));
    }
  }, [groupId]);

  const createGroceryList = useCallback(async (list: Omit<KitchenGroceryList, 'id' | 'createdDate' | 'items'>) => {
    try {
      const newList = await kitchenService.grocery.createGroceryList(list);
      setGroceryLists(prev => [newList, ...prev]);
    } catch (err) {
      console.error('Error creating grocery list:', err);
      throw err;
    }
  }, []);

  const updateGroceryList = useCallback(async (listId: string, updates: Partial<KitchenGroceryList>) => {
    try {
      const updatedList = await kitchenService.grocery.updateGroceryList(listId, updates);
      setGroceryLists(prev => prev.map(list => list.id === listId ? updatedList : list));
    } catch (err) {
      console.error('Error updating grocery list:', err);
      throw err;
    }
  }, []);

  const deleteGroceryList = useCallback(async (listId: string) => {
    try {
      await kitchenService.grocery.deleteGroceryList(listId);
      setGroceryLists(prev => prev.filter(list => list.id !== listId));
    } catch (err) {
      console.error('Error deleting grocery list:', err);
      throw err;
    }
  }, []);

  const addGroceryItem = useCallback(async (listId: string, item: Omit<any, 'id'>) => {
    try {
      const newItem = await kitchenService.grocery.addGroceryItem(listId, item);
      setGroceryLists(prev => prev.map(list =>
        list.id === listId
          ? { ...list, items: [...list.items, newItem] }
          : list
      ));
    } catch (err) {
      console.error('Error adding grocery item:', err);
      throw err;
    }
  }, []);

  const updateGroceryItem = useCallback(async (listId: string, itemId: string, updates: Partial<any>) => {
    try {
      const updatedItem = await kitchenService.grocery.updateGroceryItem(listId, itemId, updates);
      setGroceryLists(prev => prev.map(list =>
        list.id === listId
          ? {
              ...list,
              items: list.items.map(item => item.id === itemId ? updatedItem : item)
            }
          : list
      ));
    } catch (err) {
      console.error('Error updating grocery item:', err);
      throw err;
    }
  }, []);

  const deleteGroceryItem = useCallback(async (listId: string, itemId: string) => {
    try {
      await kitchenService.grocery.deleteGroceryItem(listId, itemId);
      setGroceryLists(prev => prev.map(list =>
        list.id === listId
          ? { ...list, items: list.items.filter(item => item.id !== itemId) }
          : list
      ));
    } catch (err) {
      console.error('Error deleting grocery item:', err);
      throw err;
    }
  }, []);

  const generateGrocerySuggestions = useCallback(async (mealPlanId: string): Promise<GroceryListSuggestion> => {
    try {
      return await kitchenService.grocery.generateGrocerySuggestions(groupId, mealPlanId);
    } catch (err) {
      console.error('Error generating grocery suggestions:', err);
      throw err;
    }
  }, [groupId]);

  // Meal planning methods
  const refreshMealPlans = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, mealPlans: true }));
      setErrors(prev => ({ ...prev, mealPlans: null }));

      const data = await kitchenService.mealPlanning.getMealPlans(groupId);
      setMealPlans(data);
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to load meal plans';
      setErrors(prev => ({ ...prev, mealPlans: error }));
      console.error('Error loading meal plans:', err);
    } finally {
      setLoading(prev => ({ ...prev, mealPlans: false }));
    }
  }, [groupId]);

  const generateMealPlan = useCallback(async (request: MealPlanningRequest) => {
    try {
      const newPlan = await kitchenService.mealPlanning.generateMealPlan({
        ...request,
        groupId,
        createdBy: 'current-user', // This should come from auth context
      });
      setMealPlans(prev => [newPlan, ...prev]);
    } catch (err) {
      console.error('Error generating meal plan:', err);
      throw err;
    }
  }, [groupId]);

  const saveMealPlan = useCallback(async (mealPlan: Omit<MealPlan, 'id' | 'createdDate'>) => {
    try {
      const savedPlan = await kitchenService.mealPlanning.saveMealPlan(mealPlan);
      setMealPlans(prev => [savedPlan, ...prev]);
    } catch (err) {
      console.error('Error saving meal plan:', err);
      throw err;
    }
  }, []);

  const updateMealPlan = useCallback(async (planId: string, updates: Partial<MealPlan>) => {
    try {
      const updatedPlan = await kitchenService.mealPlanning.updateMealPlan(planId, updates);
      setMealPlans(prev => prev.map(plan => plan.id === planId ? updatedPlan : plan));
    } catch (err) {
      console.error('Error updating meal plan:', err);
      throw err;
    }
  }, []);

  const deleteMealPlan = useCallback(async (planId: string) => {
    try {
      await kitchenService.mealPlanning.deleteMealPlan(planId);
      setMealPlans(prev => prev.filter(plan => plan.id !== planId));
    } catch (err) {
      console.error('Error deleting meal plan:', err);
      throw err;
    }
  }, []);

  // Recipe methods
  const refreshRecipes = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, recipes: true }));
      setErrors(prev => ({ ...prev, recipes: null }));

      const data = await kitchenService.recipes.getRecipes(groupId);
      setRecipes(data);
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to load recipes';
      setErrors(prev => ({ ...prev, recipes: error }));
      console.error('Error loading recipes:', err);
    } finally {
      setLoading(prev => ({ ...prev, recipes: false }));
    }
  }, [groupId]);

  const generateRecipe = useCallback(async (mealIdea: string, ingredients: string[], dietaryPreferences: string[]) => {
    try {
      const newRecipe = await kitchenService.recipes.generateRecipe(mealIdea, ingredients, dietaryPreferences, groupId);
      setRecipes(prev => [newRecipe, ...prev]);
    } catch (err) {
      console.error('Error generating recipe:', err);
      throw err;
    }
  }, [groupId]);

  const saveRecipe = useCallback(async (recipe: Omit<Recipe, 'id'>) => {
    try {
      const savedRecipe = await kitchenService.recipes.saveRecipe(recipe);
      setRecipes(prev => [savedRecipe, ...prev]);
    } catch (err) {
      console.error('Error saving recipe:', err);
      throw err;
    }
  }, []);

  const updateRecipe = useCallback(async (recipeId: string, updates: Partial<Recipe>) => {
    try {
      const updatedRecipe = await kitchenService.recipes.updateRecipe(recipeId, updates);
      setRecipes(prev => prev.map(recipe => recipe.id === recipeId ? updatedRecipe : recipe));
    } catch (err) {
      console.error('Error updating recipe:', err);
      throw err;
    }
  }, []);

  const deleteRecipe = useCallback(async (recipeId: string) => {
    try {
      await kitchenService.recipes.deleteRecipe(recipeId);
      setRecipes(prev => prev.filter(recipe => recipe.id !== recipeId));
    } catch (err) {
      console.error('Error deleting recipe:', err);
      throw err;
    }
  }, []);

  // Computed values from inventory analysis
  const expiringSoon = inventoryAnalysis?.expiringSoon || [];
  const lowStock = inventoryAnalysis?.lowStock || [];

  return {
    // Data
    inventory,
    groceryLists,
    mealPlans,
    recipes,
    inventoryAnalysis,
    expiringSoon,
    lowStock,

    // Loading states
    loading,

    // Errors
    errors,

    // Actions
    refreshInventory,
    refreshGroceryLists,
    refreshMealPlans,
    refreshRecipes,
    analyzeInventory,

    // Inventory actions
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    addItemFromPhoto,

    // Grocery actions
    createGroceryList,
    updateGroceryList,
    deleteGroceryList,
    addGroceryItem,
    updateGroceryItem,
    deleteGroceryItem,
    generateGrocerySuggestions,

    // Meal planning actions
    generateMealPlan,
    saveMealPlan,
    updateMealPlan,
    deleteMealPlan,

    // Recipe actions
    generateRecipe,
    saveRecipe,
    updateRecipe,
    deleteRecipe,
  };
}
