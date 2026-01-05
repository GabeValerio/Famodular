import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';
import { generateMealPlan } from '@/app/modules/kitchen/services/kitchen_geminiservice';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { dietaryPreferences, availableIngredients, numberOfDays, servings, budget, excludedIngredients, groupId, createdBy } = body;

    if (!groupId) {
      return NextResponse.json({ error: 'groupId required' }, { status: 400 });
    }

    // Verify user has access to this group
    const { data: groupMember } = await supabase
      .from('group_members')
      .select('*')
      .eq('groupId', groupId)
      .eq('userId', session.user.id)
      .single();

    if (!groupMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Generate meal plan with AI
    const mealPlanRequest = {
      dietaryPreferences: dietaryPreferences || [],
      availableIngredients: availableIngredients || [],
      numberOfDays: numberOfDays || 7,
      servings: servings || 4,
      budget,
      excludedIngredients: excludedIngredients || [],
    };

    const aiMealPlan = await generateMealPlan(mealPlanRequest);

    // Save to database
    const { data: plan, error: planError } = await supabase
      .from('kitchen_meal_plans')
      .insert({
        name: aiMealPlan.name,
        description: aiMealPlan.description,
        dietary_preferences: aiMealPlan.dietaryPreferences,
        total_prep_time: aiMealPlan.totalPrepTime,
        total_cost: aiMealPlan.totalCost,
        created_by: createdBy || session.user.id,
        group_id: groupId,
        servings: aiMealPlan.servings,
      })
      .select()
      .single();

    if (planError) throw planError;

    // Save meals and ingredients
    for (const meal of aiMealPlan.meals) {
      const { data: mealData, error: mealError } = await supabase
        .from('kitchen_meals')
        .insert({
          meal_plan_id: plan.id,
          name: meal.name,
          type: meal.type,
          day_of_week: meal.dayOfWeek,
          prep_time: meal.prepTime,
          cook_time: meal.cookTime,
        })
        .select()
        .single();

      if (mealError) throw mealError;

      // Save ingredients
      if (meal.ingredients && meal.ingredients.length > 0) {
        const ingredientsToInsert = meal.ingredients.map(ing => ({
          meal_id: mealData.id,
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
          notes: ing.notes,
        }));

        const { error: ingredientsError } = await supabase
          .from('kitchen_meal_ingredients')
          .insert(ingredientsToInsert);

        if (ingredientsError) throw ingredientsError;
      }
    }

    // Return the complete saved plan
    const { data: completePlan, error: fetchError } = await supabase
      .from('kitchen_meal_plans')
      .select(`
        *,
        meals:kitchen_meals(
          *,
          ingredients:kitchen_meal_ingredients(*)
        )
      `)
      .eq('id', plan.id)
      .single();

    if (fetchError) throw fetchError;

    return NextResponse.json(completePlan);
  } catch (error) {
    console.error('Error generating meal plan:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
