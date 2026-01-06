import {
  KitchenInventoryItem,
  KitchenGroceryList,
  KitchenGroceryItem,
  MealPlan,
  Recipe,
  InventoryAnalysis,
  MealPlanningRequest,
  GroceryListSuggestion
} from '../types';

const API_BASE = '/api/modules/group/kitchen';

// Inventory Management
export const kitchenInventoryService = {
  // Get all inventory items for a group
  async getInventory(groupId: string): Promise<KitchenInventoryItem[]> {
    const response = await fetch(`${API_BASE}/inventory?groupId=${groupId}`);
    if (!response.ok) throw new Error('Failed to fetch inventory');
    return response.json();
  },

  // Add inventory item
  async addInventoryItem(item: Omit<KitchenInventoryItem, 'id' | 'addedDate'>): Promise<KitchenInventoryItem> {
    const response = await fetch(`${API_BASE}/inventory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    if (!response.ok) throw new Error('Failed to add inventory item');
    return response.json();
  },

  // Update inventory item
  async updateInventoryItem(itemId: string, updates: Partial<KitchenInventoryItem>): Promise<KitchenInventoryItem> {
    const response = await fetch(`${API_BASE}/inventory/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update inventory item');
    return response.json();
  },

  // Delete inventory item
  async deleteInventoryItem(itemId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/inventory/${itemId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete inventory item');
  },

  // Analyze inventory with AI
  async analyzeInventory(groupId: string): Promise<InventoryAnalysis> {
    const response = await fetch(`${API_BASE}/inventory/analyze?groupId=${groupId}`);
    if (!response.ok) throw new Error('Failed to analyze inventory');
    return response.json();
  },

  // Add item via photo analysis
  async addItemFromPhoto(imageData: string, groupId: string, addedBy: string): Promise<KitchenInventoryItem[]> {
    const response = await fetch(`${API_BASE}/inventory/photo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageData, groupId, addedBy }),
    });
    if (!response.ok) throw new Error('Failed to add items from photo');
    const result = await response.json();
    // API returns { items: [...], suggestions: [...], message: "..." }
    // Extract the items array
    return result.items || [];
  },
};

// Grocery List Management
export const kitchenGroceryService = {
  // Get all grocery lists for a group
  async getGroceryLists(groupId: string): Promise<KitchenGroceryList[]> {
    const response = await fetch(`${API_BASE}/grocery-lists?groupId=${groupId}`);
    if (!response.ok) throw new Error('Failed to fetch grocery lists');
    return response.json();
  },

  // Create new grocery list
  async createGroceryList(list: Omit<KitchenGroceryList, 'id' | 'createdDate' | 'items'>): Promise<KitchenGroceryList> {
    const response = await fetch(`${API_BASE}/grocery-lists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(list),
    });
    if (!response.ok) throw new Error('Failed to create grocery list');
    return response.json();
  },

  // Update grocery list
  async updateGroceryList(listId: string, updates: Partial<KitchenGroceryList>): Promise<KitchenGroceryList> {
    const response = await fetch(`${API_BASE}/grocery-lists/${listId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update grocery list');
    return response.json();
  },

  // Delete grocery list
  async deleteGroceryList(listId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/grocery-lists/${listId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete grocery list');
  },

  // Add item to grocery list
  async addGroceryItem(listId: string, item: Omit<KitchenGroceryItem, 'id'>): Promise<KitchenGroceryItem> {
    const response = await fetch(`${API_BASE}/grocery-lists/${listId}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    if (!response.ok) throw new Error('Failed to add grocery item');
    return response.json();
  },

  // Update grocery item
  async updateGroceryItem(listId: string, itemId: string, updates: Partial<KitchenGroceryItem>): Promise<KitchenGroceryItem> {
    const response = await fetch(`${API_BASE}/grocery-lists/${listId}/items/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update grocery item');
    return response.json();
  },

  // Delete grocery item
  async deleteGroceryItem(listId: string, itemId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/grocery-lists/${listId}/items/${itemId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete grocery item');
  },

  // Generate grocery suggestions based on meal plan
  async generateGrocerySuggestions(groupId: string, mealPlanId: string): Promise<GroceryListSuggestion> {
    const response = await fetch(`${API_BASE}/grocery-lists/suggestions?groupId=${groupId}&mealPlanId=${mealPlanId}`);
    if (!response.ok) throw new Error('Failed to generate grocery suggestions');
    return response.json();
  },
};

// Meal Planning
export const kitchenMealPlanningService = {
  // Get all meal plans for a group
  async getMealPlans(groupId: string): Promise<MealPlan[]> {
    const response = await fetch(`${API_BASE}/meal-plans?groupId=${groupId}`);
    if (!response.ok) throw new Error('Failed to fetch meal plans');
    return response.json();
  },

  // Generate new meal plan with AI
  async generateMealPlan(request: MealPlanningRequest & { groupId: string; createdBy: string }): Promise<MealPlan> {
    const response = await fetch(`${API_BASE}/meal-plans/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error('Failed to generate meal plan');
    return response.json();
  },

  // Save meal plan
  async saveMealPlan(mealPlan: Omit<MealPlan, 'id' | 'createdDate'>): Promise<MealPlan> {
    const response = await fetch(`${API_BASE}/meal-plans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mealPlan),
    });
    if (!response.ok) throw new Error('Failed to save meal plan');
    return response.json();
  },

  // Update meal plan
  async updateMealPlan(planId: string, updates: Partial<MealPlan>): Promise<MealPlan> {
    const response = await fetch(`${API_BASE}/meal-plans/${planId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update meal plan');
    return response.json();
  },

  // Delete meal plan
  async deleteMealPlan(planId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/meal-plans/${planId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete meal plan');
  },
};

// Recipes
export const kitchenRecipeService = {
  // Get all recipes for a group
  async getRecipes(groupId: string): Promise<Recipe[]> {
    const response = await fetch(`${API_BASE}/recipes?groupId=${groupId}`);
    if (!response.ok) throw new Error('Failed to fetch recipes');
    return response.json();
  },

  // Generate recipe with AI
  async generateRecipe(mealIdea: string, ingredients: string[], dietaryPreferences: string[], groupId: string): Promise<Recipe> {
    const response = await fetch(`${API_BASE}/recipes/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mealIdea,
        ingredients,
        dietaryPreferences,
        groupId,
      }),
    });
    if (!response.ok) throw new Error('Failed to generate recipe');
    return response.json();
  },

  // Save recipe
  async saveRecipe(recipe: Omit<Recipe, 'id'>): Promise<Recipe> {
    const response = await fetch(`${API_BASE}/recipes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(recipe),
    });
    if (!response.ok) throw new Error('Failed to save recipe');
    return response.json();
  },

  // Update recipe
  async updateRecipe(recipeId: string, updates: Partial<Recipe>): Promise<Recipe> {
    const response = await fetch(`${API_BASE}/recipes/${recipeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update recipe');
    return response.json();
  },

  // Delete recipe
  async deleteRecipe(recipeId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/recipes/${recipeId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete recipe');
  },
};

// Main kitchen service that combines all sub-services
export const kitchenService = {
  inventory: kitchenInventoryService,
  grocery: kitchenGroceryService,
  mealPlanning: kitchenMealPlanningService,
  recipes: kitchenRecipeService,
};
