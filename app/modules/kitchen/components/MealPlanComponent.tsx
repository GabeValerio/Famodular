"use client";

import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Badge } from '@/app/components/ui/badge';
import { Textarea } from '@/app/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog';
import { Checkbox } from '@/app/components/ui/checkbox';
import {
  ChefHat,
  Plus,
  Calendar,
  Clock,
  Users,
  DollarSign,
  Sparkles,
  Trash2,
  Edit,
  BookOpen,
  Apple,
  Wheat,
  Leaf,
  Zap
} from 'lucide-react';
import { MealPlan, MealPlanningRequest, DietaryPreference, MealType } from '../types';
import { useMealPlanning } from '../hooks';

interface MealPlanComponentProps {
  groupId: string;
}

const dietaryOptions = [
  { value: DietaryPreference.VEGETARIAN, label: 'Vegetarian', icon: Leaf },
  { value: DietaryPreference.VEGAN, label: 'Vegan', icon: Leaf },
  { value: DietaryPreference.GLUTEN_FREE, label: 'Gluten Free', icon: Wheat },
  { value: DietaryPreference.DAIRY_FREE, label: 'Dairy Free', icon: Apple },
  { value: DietaryPreference.KETO, label: 'Keto', icon: Zap },
  { value: DietaryPreference.PALEO, label: 'Paleo', icon: Apple },
  { value: DietaryPreference.LOW_CARB, label: 'Low Carb', icon: Zap },
  { value: DietaryPreference.HIGH_PROTEIN, label: 'High Protein', icon: Apple },
  { value: DietaryPreference.MEDITERRANEAN, label: 'Mediterranean', icon: Leaf },
  { value: DietaryPreference.HEALTHY, label: 'Healthy', icon: Apple },
  { value: DietaryPreference.QUICK_EASY, label: 'Quick & Easy', icon: Clock },
  { value: DietaryPreference.BUDGET_FRIENDLY, label: 'Budget Friendly', icon: DollarSign },
];

const mealTypeLabels = {
  [MealType.BREAKFAST]: 'Breakfast',
  [MealType.LUNCH]: 'Lunch',
  [MealType.DINNER]: 'Dinner',
  [MealType.SNACK]: 'Snack',
  [MealType.DESSERT]: 'Dessert',
};

export function MealPlanComponent({ groupId }: MealPlanComponentProps) {
  const {
    mealPlans,
    recipes,
    loading,
    generateMealPlan,
    saveMealPlan,
    deleteMealPlan,
    generateRecipe,
  } = useMealPlanning();

  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [isRecipeDialogOpen, setIsRecipeDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<MealPlan | null>(null);

  // Meal plan generation form
  const [mealPlanForm, setMealPlanForm] = useState<MealPlanningRequest>({
    dietaryPreferences: [],
    availableIngredients: [],
    numberOfDays: 7,
    servings: 4,
    budget: undefined,
    excludedIngredients: [],
  });

  // Recipe generation form
  const [recipeForm, setRecipeForm] = useState({
    mealIdea: '',
    ingredients: '',
    dietaryPreferences: [] as DietaryPreference[],
  });

  const handleGenerateMealPlan = async () => {
    try {
      await generateMealPlan(mealPlanForm, groupId);
      setIsGenerateDialogOpen(false);
      resetMealPlanForm();
    } catch (error) {
      console.error('Error generating meal plan:', error);
    }
  };

  const handleGenerateRecipe = async () => {
    if (!recipeForm.mealIdea.trim()) return;
    try {
      const ingredients = recipeForm.ingredients.split(',').map(i => i.trim()).filter(Boolean);
      await generateRecipe(recipeForm.mealIdea, ingredients, recipeForm.dietaryPreferences, groupId);
      setIsRecipeDialogOpen(false);
      resetRecipeForm();
    } catch (error) {
      console.error('Error generating recipe:', error);
    }
  };

  const handleSaveMealPlan = async (plan: MealPlan) => {
    try {
      await saveMealPlan(plan);
    } catch (error) {
      console.error('Error saving meal plan:', error);
    }
  };

  const handleDeleteMealPlan = async (planId: string) => {
    if (confirm('Are you sure you want to delete this meal plan?')) {
      try {
        await deleteMealPlan(planId);
      } catch (error) {
        console.error('Error deleting meal plan:', error);
      }
    }
  };

  const resetMealPlanForm = () => {
    setMealPlanForm({
      dietaryPreferences: [],
      availableIngredients: [],
      numberOfDays: 7,
      servings: 4,
      budget: undefined,
      excludedIngredients: [],
    });
  };

  const resetRecipeForm = () => {
    setRecipeForm({
      mealIdea: '',
      ingredients: '',
      dietaryPreferences: [],
    });
  };

  const toggleDietaryPreference = (preference: DietaryPreference, isMealPlan: boolean) => {
    if (isMealPlan) {
      const current = mealPlanForm.dietaryPreferences;
      setMealPlanForm({
        ...mealPlanForm,
        dietaryPreferences: current.includes(preference)
          ? current.filter(p => p !== preference)
          : [...current, preference]
      });
    } else {
      const current = recipeForm.dietaryPreferences;
      setRecipeForm({
        ...recipeForm,
        dietaryPreferences: current.includes(preference)
          ? current.filter(p => p !== preference)
          : [...current, preference]
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading meal plans...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Meal Planning</h2>
          <p className="text-muted-foreground">AI-powered meal planning and recipe generation</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isRecipeDialogOpen} onOpenChange={setIsRecipeDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <BookOpen className="h-4 w-4 mr-2" />
                Generate Recipe
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Generate Recipe with AI</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="mealIdea">What do you want to cook?</Label>
                  <Input
                    id="mealIdea"
                    value={recipeForm.mealIdea}
                    onChange={(e) => setRecipeForm({ ...recipeForm, mealIdea: e.target.value })}
                    placeholder="e.g., Chicken stir fry, Chocolate cake, Pasta primavera"
                  />
                </div>

                <div>
                  <Label htmlFor="ingredients">Available ingredients (optional)</Label>
                  <Textarea
                    id="ingredients"
                    value={recipeForm.ingredients}
                    onChange={(e) => setRecipeForm({ ...recipeForm, ingredients: e.target.value })}
                    placeholder="e.g., chicken, rice, broccoli, garlic, soy sauce"
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Dietary preferences</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {dietaryOptions.map(({ value, label, icon: Icon }) => (
                      <div key={value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`recipe-${value}`}
                          checked={recipeForm.dietaryPreferences.includes(value)}
                          onCheckedChange={() => toggleDietaryPreference(value, false)}
                        />
                        <label
                          htmlFor={`recipe-${value}`}
                          className="flex items-center gap-2 text-sm cursor-pointer"
                        >
                          <Icon className="h-3 w-3" />
                          {label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleGenerateRecipe} disabled={!recipeForm.mealIdea.trim()} className="flex-1">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Recipe
                  </Button>
                  <Button variant="outline" onClick={() => setIsRecipeDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <ChefHat className="h-4 w-4 mr-2" />
                Generate Meal Plan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Generate Meal Plan with AI</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="days">Number of days</Label>
                    <Select
                      value={mealPlanForm.numberOfDays.toString()}
                      onValueChange={(value) => setMealPlanForm({ ...mealPlanForm, numberOfDays: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 days</SelectItem>
                        <SelectItem value="7">7 days</SelectItem>
                        <SelectItem value="14">14 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="servings">Servings per meal</Label>
                    <Select
                      value={mealPlanForm.servings.toString()}
                      onValueChange={(value) => setMealPlanForm({ ...mealPlanForm, servings: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2 people</SelectItem>
                        <SelectItem value="4">4 people</SelectItem>
                        <SelectItem value="6">6 people</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="budget">Budget (optional)</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={mealPlanForm.budget || ''}
                    onChange={(e) => setMealPlanForm({ ...mealPlanForm, budget: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="Total budget in dollars"
                  />
                </div>

                <div>
                  <Label htmlFor="ingredients">Available ingredients (optional)</Label>
                  <Textarea
                    id="ingredients"
                    value={mealPlanForm.availableIngredients.join(', ')}
                    onChange={(e) => setMealPlanForm({
                      ...mealPlanForm,
                      availableIngredients: e.target.value.split(',').map(i => i.trim()).filter(Boolean)
                    })}
                    placeholder="e.g., chicken, rice, broccoli, garlic, soy sauce"
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Dietary preferences</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {dietaryOptions.map(({ value, label, icon: Icon }) => (
                      <div key={value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`mealplan-${value}`}
                          checked={mealPlanForm.dietaryPreferences.includes(value)}
                          onCheckedChange={() => toggleDietaryPreference(value, true)}
                        />
                        <label
                          htmlFor={`mealplan-${value}`}
                          className="flex items-center gap-2 text-sm cursor-pointer"
                        >
                          <Icon className="h-3 w-3" />
                          {label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleGenerateMealPlan} className="flex-1">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Meal Plan
                  </Button>
                  <Button variant="outline" onClick={() => setIsGenerateDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Meal Plans Grid */}
      <div className="grid gap-6">
        {mealPlans.map((plan) => (
          <Card key={plan.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <p className="text-muted-foreground">{plan.description}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleSaveMealPlan(plan)}>
                    Save Plan
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteMealPlan(plan.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {plan.meals.length} meals
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {plan.servings} servings
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {plan.totalPrepTime}min prep
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  ${plan.totalCost.toFixed(2)}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {plan.dietaryPreferences.map((pref) => (
                  <Badge key={pref} variant="secondary" className="text-xs">
                    {pref}
                  </Badge>
                ))}
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                {/* Meals by day */}
                <div className="grid gap-4">
                  {Array.from({ length: 7 }, (_, dayIndex) => {
                    const dayMeals = plan.meals.filter(meal => meal.dayOfWeek === dayIndex);
                    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayIndex];

                    return (
                      <div key={dayIndex} className="border rounded-lg p-4">
                        <h4 className="font-medium mb-3">{dayName}</h4>
                        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
                          {Object.values(MealType).map((mealType) => {
                            const meal = dayMeals.find(m => m.type === mealType);
                            return (
                              <div key={mealType} className="text-sm">
                                <div className="font-medium text-muted-foreground">{mealTypeLabels[mealType]}</div>
                                <div className="text-foreground">{meal?.name || '—'}</div>
                                {meal && (
                                  <div className="text-xs text-muted-foreground">
                                    {meal.prepTime + meal.cookTime}min • ${meal.ingredients.length * 2} est.
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Recipes Section */}
        {recipes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Generated Recipes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {recipes.map((recipe) => (
                  <Card key={recipe.id} className="hover:shadow-sm">
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">{recipe.name}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{recipe.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {recipe.prepTime + recipe.cookTime}min
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {recipe.servings} servings
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {recipe.dietaryTags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty state */}
        {mealPlans.length === 0 && recipes.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <ChefHat className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No meal plans yet</h3>
              <p className="text-muted-foreground mb-4">
                Generate your first AI-powered meal plan
              </p>
              <Button onClick={() => setIsGenerateDialogOpen(true)}>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Meal Plan
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
