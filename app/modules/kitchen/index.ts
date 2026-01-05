// Kitchen Module Public API
// This exports the components, hooks, and types that other parts of the application can use

// Main page component
export { KitchenPage } from './pages/KitchenPage';

// Hooks for data management
export {
  useKitchen,
  useInventory,
  useMealPlanning,
  type UseKitchenReturn,
  type UseInventoryReturn,
  type UseMealPlanningReturn
} from './hooks';

// Services (for advanced usage)
export { kitchenService } from './services/kitchenService';

// Types (for TypeScript support)
export type {
  KitchenInventoryItem,
  KitchenGroceryList,
  KitchenGroceryItem,
  MealPlan,
  Meal,
  Recipe,
  RecipeIngredient,
  NutritionalInfo,
  InventoryAnalysis,
  MealPlanningRequest,
  GroceryListSuggestion,
  KitchenItemCategory,
  KitchenLocation,
  MealType,
  DietaryPreference
} from './types';

// Note: AI services are only available on the server side (API routes)
// Client components should use the service layer which calls API endpoints
