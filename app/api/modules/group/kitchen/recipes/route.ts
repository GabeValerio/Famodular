import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';

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
      .eq('groupId', groupId)
      .eq('userId', session.user.id)
      .single();

    if (!groupMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch recipes
    const { data: recipes, error } = await supabase
      .from('kitchen_recipes')
      .select(`
        *,
        ingredients:kitchen_recipe_ingredients(*)
      `)
      .or(`group_id.eq.${groupId},is_public.eq.true`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(recipes);
  } catch (error) {
    console.error('Error fetching recipes:', error);
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
    const { name, description, instructions, prepTime, cookTime, servings, dietaryTags, imageUrl, nutritionalInfo, source, groupId, isPublic, ingredients } = body;

    if (!groupId || !name) {
      return NextResponse.json({ error: 'groupId and name required' }, { status: 400 });
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

    // Create recipe
    const { data: recipe, error: recipeError } = await supabase
      .from('kitchen_recipes')
      .insert({
        name,
        description,
        instructions: instructions || [],
        prep_time: prepTime || 0,
        cook_time: cookTime || 0,
        servings: servings || 4,
        dietary_tags: dietaryTags || [],
        image_url: imageUrl,
        nutritional_info: nutritionalInfo,
        source: source || 'User Created',
        created_by: session.user.id,
        group_id: groupId,
        is_public: isPublic || false,
      })
      .select()
      .single();

    if (recipeError) throw recipeError;

    // Add ingredients if provided
    if (ingredients && ingredients.length > 0) {
      const ingredientsToInsert = ingredients.map((ing: any) => ({
        recipe_id: recipe.id,
        inventory_item_id: ing.inventoryItemId,
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

    // Return complete recipe
    const { data: completeRecipe, error: fetchError } = await supabase
      .from('kitchen_recipes')
      .select(`
        *,
        ingredients:kitchen_recipe_ingredients(*)
      `)
      .eq('id', recipe.id)
      .single();

    if (fetchError) throw fetchError;

    return NextResponse.json(completeRecipe, { status: 201 });
  } catch (error) {
    console.error('Error creating recipe:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
