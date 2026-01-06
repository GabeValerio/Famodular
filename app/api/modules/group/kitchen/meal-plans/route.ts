import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';
import { RecipeIngredient } from '@/app/modules/kitchen/types';
import { generateMealPlan } from '@/app/modules/kitchen/services/kitchen_geminiservice';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');

    if (!groupId) {
      return NextResponse.json({ error: 'groupId required' }, { status: 400 });
    }

    // Verify user has access to this group
    const { data: groupMember } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', groupId)
      .eq('user_id', session.user.id)
      .eq('is_active', true)
      .single();

    if (!groupMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch meal plans with their meals and ingredients
    const { data: plans, error } = await supabase
      .from('kitchen_meal_plans')
      .select(`
        *,
        meals:kitchen_meals(
          *,
          ingredients:kitchen_meal_ingredients(*)
        )
      `)
      .eq('group_id', groupId)
      .order('created_date', { ascending: false });

    if (error) throw error;

    return NextResponse.json(plans);
  } catch (error) {
    console.error('Error fetching meal plans:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, dietaryPreferences, totalPrepTime, totalCost, servings, groupId, meals } = body;

    if (!groupId || !name) {
      return NextResponse.json({ error: 'groupId and name required' }, { status: 400 });
    }

    // Verify user has access to this group
    const { data: groupMember } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', groupId)
      .eq('user_id', session.user.id)
      .eq('is_active', true)
      .single();

    if (!groupMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Start a transaction to create meal plan with meals and ingredients
    const { data: plan, error: planError } = await supabase
      .from('kitchen_meal_plans')
      .insert({
        name,
        description,
        dietary_preferences: dietaryPreferences || [],
        total_prep_time: totalPrepTime || 0,
        total_cost: totalCost || 0,
        created_by: session.user.id,
        group_id: groupId,
        servings: servings || 4,
      })
      .select()
      .single();

    if (planError) throw planError;

    // If meals are provided, add them
    if (meals && meals.length > 0) {
      for (const meal of meals) {
        const { data: mealData, error: mealError } = await supabase
          .from('kitchen_meals')
          .insert({
            meal_plan_id: plan.id,
            name: meal.name,
            type: meal.type,
            day_of_week: meal.dayOfWeek,
            prep_time: meal.prepTime || 0,
            cook_time: meal.cookTime || 0,
          })
          .select()
          .single();

        if (mealError) throw mealError;

        // Add ingredients for this meal
        if (meal.ingredients && meal.ingredients.length > 0) {
          const ingredientsToInsert = meal.ingredients.map((ing: RecipeIngredient) => ({
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
    }

    // Fetch the complete plan with meals
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

    return NextResponse.json(completePlan, { status: 201 });
  } catch (error) {
    console.error('Error creating meal plan:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
