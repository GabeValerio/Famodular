import { GoogleGenAI } from '@google/genai';
import {
  MealPlanningRequest,
  MealPlan,
  Recipe,
  KitchenInventoryItem,
  DietaryPreference,
  NutritionalInfo,
  InventoryAnalysis
} from '../types';

// Check if Google Gemini API key is configured
const getApiKey = () => {
  return process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
};

const getGenAI = () => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('Google Gemini API key is not configured. Please set NEXT_PUBLIC_GEMINI_API_KEY or GOOGLE_GEMINI_API_KEY environment variable.');
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Analyze inventory items from a photo using Gemini Vision
 */
export const analyzeInventoryPhoto = async (imageData: string): Promise<{
  items: Array<{
    name: string;
    category: string;
    quantity: number;
    unit: string;
    confidence: number;
  }>;
  suggestions: string[];
}> => {
  try {
    const genAI = getGenAI();

    const prompt = `Analyze this kitchen inventory photo and identify all food items visible.

Return a JSON response with this exact structure:
{
  "items": [
    {
      "name": "Item Name",
      "category": "Produce|Dairy|Meat|Pantry|Beverages|Other",
      "quantity": 1,
      "unit": "pieces|lbs|oz|cups|cans|bottles|packages",
      "confidence": 0.95
    }
  ],
  "suggestions": [
    "Suggestion about organization or items to use soon"
  ]
}

Be specific about quantities and units. Only include items you can clearly identify.`;

    // Remove data: URL prefix if present
    const base64Data = imageData.includes(',') ? imageData.split(',')[1] : imageData;

    const result = await genAI.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: [{
        role: 'user',
        parts: [
          { text: prompt },
          {
            inlineData: {
              data: base64Data,
              mimeType: 'image/jpeg'
            }
          }
        ]
      }],
      config: { responseMimeType: 'application/json' }
    });

    const text = result.text;
    if (!text) {
      throw new Error('No response text from AI');
    }

    // Parse JSON response (API returns JSON directly when responseMimeType is set)
    let parsed;
    try {
      parsed = typeof text === 'string' ? JSON.parse(text) : text;
    } catch {
      // Fallback: try to extract JSON from text
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not parse AI response as JSON');
      }
      parsed = JSON.parse(jsonMatch[0]);
    }

    // Validate the response structure
    if (!parsed.items || !Array.isArray(parsed.items)) {
      throw new Error('Invalid response structure from AI');
    }

    return {
      items: parsed.items,
      suggestions: parsed.suggestions || []
    };

  } catch (error) {
    console.error('Error analyzing inventory photo:', error);
    throw new Error('Failed to analyze inventory photo');
  }
};

/**
 * Generate meal plan based on dietary preferences and available ingredients
 */
export const generateMealPlan = async (request: MealPlanningRequest): Promise<MealPlan> => {
  try {
    const genAI = getGenAI();

    const prompt = `Create a ${request.numberOfDays}-day meal plan for ${request.servings} people with these preferences: ${request.dietaryPreferences.join(', ')}

Available ingredients: ${request.availableIngredients.join(', ')}
${request.budget ? `Budget: $${request.budget}` : ''}
${request.excludedIngredients?.length ? `Exclude: ${request.excludedIngredients.join(', ')}` : ''}

Return a JSON response with this exact structure:
{
  "name": "Meal Plan Title",
  "description": "Brief description of the meal plan",
  "meals": [
    {
      "name": "Meal Name",
      "type": "Breakfast|Lunch|Dinner|Snack",
      "dayOfWeek": 0,
      "prepTime": 15,
      "cookTime": 30,
      "ingredients": [
        {
          "name": "Ingredient Name",
          "quantity": 2,
          "unit": "cups"
        }
      ]
    }
  ],
  "totalPrepTime": 120,
  "totalCost": 85.50
}

Focus on healthy, balanced meals that use the available ingredients. Include variety and nutritional balance.`;

    const result = await genAI.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { responseMimeType: 'application/json' }
    });

    const text = result.text;
    if (!text) {
      throw new Error('No response text from AI');
    }

    // Parse JSON response
    let mealPlanData;
    try {
      mealPlanData = typeof text === 'string' ? JSON.parse(text) : text;
    } catch {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not parse meal plan response as JSON');
      }
      mealPlanData = JSON.parse(jsonMatch[0]);
    }

    return {
      id: crypto.randomUUID(),
      ...mealPlanData,
      dietaryPreferences: request.dietaryPreferences,
      createdDate: new Date().toISOString(),
      servings: request.servings,
      groupId: '' // Will be set by the calling service
    };

  } catch (error) {
    console.error('Error generating meal plan:', error);
    throw new Error('Failed to generate meal plan');
  }
};

/**
 * Generate a recipe from a meal idea or ingredients
 */
export const generateRecipe = async (
  mealIdea: string,
  ingredients: string[],
  dietaryPreferences: DietaryPreference[] = []
): Promise<Recipe> => {
  try {
    const genAI = getGenAI();

    const prompt = `Create a detailed recipe for: "${mealIdea}"

Available ingredients: ${ingredients.join(', ')}
Dietary preferences: ${dietaryPreferences.join(', ') || 'None specified'}

Return a JSON response with this exact structure:
{
  "name": "Recipe Name",
  "description": "Brief description",
  "instructions": [
    "Step 1: Do something",
    "Step 2: Do something else"
  ],
  "ingredients": [
    {
      "name": "Ingredient Name",
      "quantity": 2,
      "unit": "cups"
    }
  ],
  "prepTime": 15,
  "cookTime": 30,
  "servings": 4,
  "nutritionalInfo": {
    "calories": 450,
    "protein": 25,
    "carbs": 35,
    "fat": 20,
    "fiber": 8,
    "sugar": 12,
    "sodium": 800
  }
}

Make the recipe practical, healthy, and use the available ingredients where possible. Include detailed instructions.`;

    const result = await genAI.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { responseMimeType: 'application/json' }
    });

    const text = result.text;
    if (!text) {
      throw new Error('No response text from AI');
    }

    // Parse JSON response
    let recipeData;
    try {
      recipeData = typeof text === 'string' ? JSON.parse(text) : text;
    } catch {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not parse recipe response as JSON');
      }
      recipeData = JSON.parse(jsonMatch[0]);
    }

    return {
      id: crypto.randomUUID(),
      ...recipeData,
      dietaryTags: dietaryPreferences,
      source: 'AI Generated'
    };

  } catch (error) {
    console.error('Error generating recipe:', error);
    throw new Error('Failed to generate recipe');
  }
};

/**
 * Analyze inventory and provide insights
 */
export const analyzeInventory = async (
  inventory: KitchenInventoryItem[]
): Promise<InventoryAnalysis> => {
  try {
    const genAI = getGenAI();

    const inventoryText = inventory.map(item =>
      `${item.name} (${item.quantity} ${item.unit}) in ${item.location} - expires ${item.expirationDate || 'unknown'}`
    ).join('\n');

    const prompt = `Analyze this kitchen inventory and provide insights:

${inventoryText}

Return a JSON response with this exact structure:
{
  "expiringSoon": ["Item names that will expire within 3 days"],
  "lowStock": ["Item names that are running low"],
  "suggestions": [
    "Specific suggestions for meals or shopping"
  ]
}

Be specific and actionable in your suggestions. Consider food safety and waste reduction.`;

    const result = await genAI.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { responseMimeType: 'application/json' }
    });

    const text = result.text;
    if (!text) {
      throw new Error('No response text from AI');
    }

    // Parse JSON response
    let analysis;
    try {
      analysis = typeof text === 'string' ? JSON.parse(text) : text;
    } catch {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not parse inventory analysis response as JSON');
      }
      analysis = JSON.parse(jsonMatch[0]);
    }

    // Map back to actual inventory items
    const expiringSoon = inventory.filter(item =>
      analysis.expiringSoon?.includes(item.name)
    );

    const lowStock = inventory.filter(item =>
      analysis.lowStock?.includes(item.name)
    );

    return {
      expiringSoon,
      lowStock,
      suggestions: analysis.suggestions || []
    };

  } catch (error) {
    console.error('Error analyzing inventory:', error);
    // Return basic analysis if AI fails
    return {
      expiringSoon: [],
      lowStock: [],
      suggestions: ['Unable to analyze inventory at this time']
    };
  }
};

/**
 * Generate grocery list suggestions based on meal plan and current inventory
 */
export const generateGrocerySuggestions = async (
  mealPlan: MealPlan,
  currentInventory: KitchenInventoryItem[]
): Promise<{
  neededItems: Array<{
    name: string;
    quantity: number;
    unit: string;
    estimatedCost: number;
  }>;
  reasoning: string;
}> => {
  try {
    const genAI = getGenAI();

    const mealIngredients = mealPlan.meals.flatMap(meal =>
      meal.ingredients.map(ing => `${ing.quantity} ${ing.unit} ${ing.name}`)
    ).join('\n');

    const currentInventoryText = currentInventory.map(item =>
      `${item.quantity} ${item.unit} ${item.name}`
    ).join('\n');

    const prompt = `Based on this meal plan and current inventory, suggest what groceries to buy.

Meal Plan Ingredients Needed:
${mealIngredients}

Current Inventory:
${currentInventoryText}

Return a JSON response with this exact structure:
{
  "neededItems": [
    {
      "name": "Item Name",
      "quantity": 2,
      "unit": "cups",
      "estimatedCost": 4.99
    }
  ],
  "reasoning": "Explanation of why these items are needed and any substitutions"
}

Be specific about quantities and consider what might already be in inventory. Estimate realistic costs.`;

    const result = await genAI.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { responseMimeType: 'application/json' }
    });

    const text = result.text;
    if (!text) {
      throw new Error('No response text from AI');
    }

    // Parse JSON response
    try {
      return typeof text === 'string' ? JSON.parse(text) : text;
    } catch {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not parse grocery suggestions response as JSON');
      }
      return JSON.parse(jsonMatch[0]);
    }

  } catch (error) {
    console.error('Error generating grocery suggestions:', error);
    throw new Error('Failed to generate grocery suggestions');
  }
};

/**
 * Extract nutritional information for an ingredient
 */
export const getNutritionalInfo = async (ingredientName: string): Promise<NutritionalInfo | null> => {
  try {
    const genAI = getGenAI();

    const prompt = `Provide nutritional information for "${ingredientName}" per 100g serving.

Return a JSON response with this exact structure:
{
  "calories": 150,
  "protein": 10.5,
  "carbs": 25.0,
  "fat": 2.5,
  "fiber": 4.2,
  "sugar": 12.0,
  "sodium": 45
}

Use approximate values based on common nutritional data. Return null if you cannot provide accurate information.`;

    const result = await genAI.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { responseMimeType: 'application/json' }
    });

    const text = result.text;
    if (!text) {
      return null;
    }

    // Parse JSON response
    let nutrition;
    try {
      nutrition = typeof text === 'string' ? JSON.parse(text) : text;
    } catch {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return null;
      }
      nutrition = JSON.parse(jsonMatch[0]);
    }

    // Validate that we got numeric values
    if (typeof nutrition.calories !== 'number') {
      return null;
    }

    return nutrition;

  } catch (error) {
    console.error('Error getting nutritional info:', error);
    return null;
  }
};
