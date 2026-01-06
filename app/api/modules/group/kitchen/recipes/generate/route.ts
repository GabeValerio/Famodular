import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';
import { generateRecipe } from '@/app/modules/kitchen/services/kitchen_geminiservice';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { mealIdea, ingredients, dietaryPreferences, groupId } = body;

    if (!groupId || !mealIdea) {
      return NextResponse.json({ error: 'groupId and mealIdea required' }, { status: 400 });
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

    // Generate recipe with AI
    const aiRecipe = await generateRecipe(
      mealIdea,
      ingredients || [],
      dietaryPreferences || []
    );

    // Save to database
    const { data: recipe, error: recipeError } = await supabase
      .from('kitchen_recipes')
      .insert({
        name: aiRecipe.name,
        description: aiRecipe.description,
        instructions: aiRecipe.instructions,
        prep_time: aiRecipe.prepTime,
        cook_time: aiRecipe.cookTime,
        servings: aiRecipe.servings,
        dietary_tags: aiRecipe.dietaryTags,
        nutritional_info: aiRecipe.nutritionalInfo,
        source: aiRecipe.source,
        created_by: session.user.id,
        group_id: groupId,
        is_public: false,
      })
      .select()
      .single();

    if (recipeError) throw recipeError;

    // Save ingredients
    if (aiRecipe.ingredients && aiRecipe.ingredients.length > 0) {
      const ingredientsToInsert = aiRecipe.ingredients.map(ing => ({
        recipe_id: recipe.id,
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit,
        notes: ing.notes,
      }));

      const { error: ingredientsError } = await supabase
        .from('kitchen_recipe_ingredients')
        .insert(ingredientsToInsert);

      if (ingredientsError) throw ingredientsError;
    }

    // Return the complete saved recipe
    const { data: completeRecipe, error: fetchError } = await supabase
      .from('kitchen_recipes')
      .select(`
        *,
        ingredients:kitchen_recipe_ingredients(*)
      `)
      .eq('id', recipe.id)
      .single();

    if (fetchError) throw fetchError;

    return NextResponse.json(completeRecipe);
  } catch (error) {
    console.error('Error generating recipe:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
