import { useState, useCallback } from 'react';
import { MealPlan, Recipe, MealPlanningRequest, DietaryPreference } from '../types';
import { kitchenService } from '../services/kitchenService';

export interface UseMealPlanningReturn {
  // State
  mealPlans: MealPlan[];
  recipes: Recipe[];
  loading: boolean;
  error: string | null;

  // Actions
  loadMealPlans: (groupId: string) => Promise<void>;
  loadRecipes: (groupId: string) => Promise<void>;
  generateMealPlan: (request: MealPlanningRequest, groupId: string) => Promise<MealPlan>;
  saveMealPlan: (mealPlan: Omit<MealPlan, 'id' | 'createdDate'>) => Promise<void>;
  updateMealPlan: (planId: string, updates: Partial<MealPlan>) => Promise<void>;
  deleteMealPlan: (planId: string) => Promise<void>;
  generateRecipe: (mealIdea: string, ingredients: string[], dietaryPreferences: string[], groupId: string) => Promise<Recipe>;
  saveRecipe: (recipe: Omit<Recipe, 'id'>) => Promise<void>;
  updateRecipe: (recipeId: string, updates: Partial<Recipe>) => Promise<void>;
  deleteRecipe: (recipeId: string) => Promise<void>;

  // Computed values
  recentMealPlans: MealPlan[];
  favoriteRecipes: Recipe[];
}

export function useMealPlanning(): UseMealPlanningReturn {
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMealPlans = useCallback(async (groupId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await kitchenService.mealPlanning.getMealPlans(groupId);
      setMealPlans(data);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load meal plans';
      setError(errorMsg);
      console.error('Error loading meal plans:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRecipes = useCallback(async (groupId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await kitchenService.recipes.getRecipes(groupId);
      setRecipes(data);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load recipes';
      setError(errorMsg);
      console.error('Error loading recipes:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const generateMealPlan = useCallback(async (request: MealPlanningRequest, groupId: string): Promise<MealPlan> => {
    try {
      setLoading(true);
      setError(null);
      const newPlan = await kitchenService.mealPlanning.generateMealPlan({
        ...request,
        groupId,
        createdBy: 'current-user', // This should come from auth context
      });
      setMealPlans(prev => [newPlan, ...prev]);
      return newPlan;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to generate meal plan';
      setError(errorMsg);
      console.error('Error generating meal plan:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

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

  const generateRecipe = useCallback(async (
    mealIdea: string,
    ingredients: string[],
    dietaryPreferences: string[],
    groupId: string
  ): Promise<Recipe> => {
    try {
      setLoading(true);
      setError(null);
      const newRecipe = await kitchenService.recipes.generateRecipe(mealIdea, ingredients, dietaryPreferences, groupId);
      setRecipes(prev => [newRecipe, ...prev]);
      return newRecipe;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to generate recipe';
      setError(errorMsg);
      console.error('Error generating recipe:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

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

  // Computed values
  const recentMealPlans = mealPlans
    .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime())
    .slice(0, 5);

  // For now, consider recipes with certain tags as "favorites" - this could be extended with a favorites system
  const favoriteRecipes = recipes.filter(recipe =>
    recipe.dietaryTags.includes(DietaryPreference.HEALTHY) ||
    recipe.dietaryTags.includes(DietaryPreference.QUICK_EASY)
  );

  return {
    mealPlans,
    recipes,
    loading,
    error,
    loadMealPlans,
    loadRecipes,
    generateMealPlan,
    saveMealPlan,
    updateMealPlan,
    deleteMealPlan,
    generateRecipe,
    saveRecipe,
    updateRecipe,
    deleteRecipe,
    recentMealPlans,
    favoriteRecipes,
  };
}

