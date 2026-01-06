import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';
import { analyzeInventoryPhoto } from '@/app/modules/kitchen/services/kitchen_geminiservice';

// Map Gemini categories to database categories
function mapGeminiCategoryToDbCategory(geminiCategory: string): string {
  const categoryMap: Record<string, string> = {
    'Produce': 'Produce',
    'Dairy': 'Dairy',
    'Meat': 'Meat',
    'Seafood': 'Seafood',
    'Bakery': 'Bakery',
    'Pantry': 'Pantry',
    'Beverages': 'Beverages',
    'Snacks': 'Snacks',
    'Frozen': 'Frozen',
    'Condiments': 'Condiments',
    'Spices': 'Spices',
    'Other': 'Other'
  };

  // Return the mapped category or 'Other' as fallback
  return categoryMap[geminiCategory] || 'Other';
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { imageData, groupId, addedBy } = body;

    if (!imageData || !groupId) {
      return NextResponse.json({ error: 'imageData and groupId required' }, { status: 400 });
    }

    // Verify user exists in the database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', session.user.id)
      .single();

    if (userError || !user) {
      console.error('User not found in database:', session.user.id, userError);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
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

    // Handle both single image (string) and multiple images (array)
    const images = Array.isArray(imageData) ? imageData : [imageData];
    let allDetectedItems: any[] = [];
    let allSuggestions: string[] = [];

    console.log('API: Processing', images.length, 'images');

    // Process each image
    for (const image of images) {
      try {
        console.log('API: Analyzing image, size:', image.length);
        // Analyze the photo with AI
        const analysis = await analyzeInventoryPhoto(image);
        console.log('API: Analysis result:', analysis);

        if (analysis.items && analysis.items.length > 0) {
          allDetectedItems.push(...analysis.items);
        }

        if (analysis.suggestions && analysis.suggestions.length > 0) {
          allSuggestions.push(...analysis.suggestions);
        }
      } catch (error) {
        console.error('Error analyzing individual photo:', error);
        // Continue with other images even if one fails
      }
    }

    if (allDetectedItems.length === 0) {
      return NextResponse.json({
        message: 'No items detected in the photos',
        suggestions: allSuggestions.length > 0 ? allSuggestions : ['Try taking clearer photos with better lighting']
      });
    }

    // Add detected items to inventory
    // Use the verified user.id from the database query to ensure type consistency
    const itemsToAdd = allDetectedItems.map(item => ({
      name: item.name,
      category: mapGeminiCategoryToDbCategory(item.category),
      location: 'Counter', // Default location, user can change later
      quantity: item.quantity,
      unit: item.unit,
      added_by: user.id, // Use the verified user ID from database
      group_id: groupId,
    }));

    const { data: addedItems, error } = await supabase
      .from('kitchen_inventory')
      .insert(itemsToAdd)
      .select();

    if (error) throw error;

    return NextResponse.json({
      items: addedItems,
      suggestions: allSuggestions,
      message: `Analyzed ${images.length} photo${images.length !== 1 ? 's' : ''} and added ${addedItems.length} items to inventory`
    });
  } catch (error) {
    console.error('Error processing photos:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
