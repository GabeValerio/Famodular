// Kitchen module types
export interface KitchenInventoryItem {
  id: string;
  name: string;
  category: KitchenItemCategory;
  location: KitchenLocation;
  quantity: number;
  unit: string;
  expirationDate?: string;
  addedDate: string;
  addedBy: string;
  groupId: string;
  imageUrl?: string;
  nutritionalInfo?: NutritionalInfo;
  barcode?: string;
}

export interface KitchenGroceryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: KitchenItemCategory;
  isCompleted: boolean;
  addedBy: string;
  groupId: string;
  estimatedCost?: number;
  notes?: string;
}

export interface KitchenGroceryList {
  id: string;
  name: string;
  items: KitchenGroceryItem[];
  createdDate: string;
  createdBy: string;
  groupId: string;
  isCompleted: boolean;
  totalEstimatedCost?: number;
}

export interface MealPlan {
  id: string;
  name: string;
  description: string;
  meals: Meal[];
  dietaryPreferences: DietaryPreference[];
  totalPrepTime: number;
  totalCost: number;
  createdDate: string;
  createdBy: string;
  groupId: string;
  servings: number;
}

export interface Meal {
  id: string;
  name: string;
  type: MealType; // breakfast, lunch, dinner, snack
  recipe: Recipe;
  dayOfWeek: number; // 0-6, Sunday = 0
  prepTime: number;
  cookTime: number;
  ingredients: RecipeIngredient[];
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  instructions: string[];
  ingredients: RecipeIngredient[];
  prepTime: number;
  cookTime: number;
  servings: number;
  dietaryTags: DietaryPreference[];
  imageUrl?: string;
  nutritionalInfo?: NutritionalInfo;
  source?: string; // AI generated, user created, etc.
}

export interface RecipeIngredient {
  id: string;
  inventoryItemId?: string; // Links to kitchen inventory
  name: string;
  quantity: number;
  unit: string;
  notes?: string;
}

export interface NutritionalInfo {
  calories: number;
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
  fiber: number; // grams
  sugar: number; // grams
  sodium: number; // mg
  vitamins?: Record<string, number>; // vitamin name -> amount
}

export enum KitchenItemCategory {
  PRODUCE = 'Produce',
  DAIRY = 'Dairy',
  MEAT = 'Meat',
  SEAFOOD = 'Seafood',
  BAKERY = 'Bakery',
  PANTRY = 'Pantry',
  BEVERAGES = 'Beverages',
  SNACKS = 'Snacks',
  FROZEN = 'Frozen',
  CONDIMENTS = 'Condiments',
  SPICES = 'Spices',
  OTHER = 'Other'
}

export enum KitchenLocation {
  FRIDGE = 'Fridge',
  FREEZER = 'Freezer',
  PANTRY = 'Pantry',
  CABINET = 'Cabinet',
  COUNTER = 'Counter'
}

export enum MealType {
  BREAKFAST = 'Breakfast',
  LUNCH = 'Lunch',
  DINNER = 'Dinner',
  SNACK = 'Snack',
  DESSERT = 'Dessert'
}

export enum DietaryPreference {
  VEGETARIAN = 'Vegetarian',
  VEGAN = 'Vegan',
  GLUTEN_FREE = 'Gluten Free',
  DAIRY_FREE = 'Dairy Free',
  KETO = 'Keto',
  PALEO = 'Paleo',
  LOW_CARB = 'Low Carb',
  HIGH_PROTEIN = 'High Protein',
  MEDITERRANEAN = 'Mediterranean',
  HEALTHY = 'Healthy',
  QUICK_EASY = 'Quick & Easy',
  BUDGET_FRIENDLY = 'Budget Friendly'
}

// Service response types
export interface InventoryAnalysis {
  expiringSoon: KitchenInventoryItem[];
  lowStock: KitchenInventoryItem[];
  suggestions: string[];
}

export interface MealPlanningRequest {
  dietaryPreferences: DietaryPreference[];
  availableIngredients: string[];
  numberOfDays: number;
  servings: number;
  budget?: number;
  excludedIngredients?: string[];
}

export interface GroceryListSuggestion {
  neededItems: KitchenGroceryItem[];
  reason: string;
  estimatedCost: number;
}


