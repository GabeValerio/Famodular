import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';
import { analyzeInventoryPhoto } from '@/app/modules/kitchen/services/kitchen_geminiservice';

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

    // Handle both single image (string) and multiple images (array)
    const images = Array.isArray(imageData) ? imageData : [imageData];
    let allDetectedItems: any[] = [];
    let allSuggestions: string[] = [];

    // Process each image
    for (const image of images) {
      try {
        // Analyze the photo with AI
        const analysis = await analyzeInventoryPhoto(image);

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
    const itemsToAdd = allDetectedItems.map(item => ({
      name: item.name,
      category: item.category,
      location: 'Counter', // Default location, user can change later
      quantity: item.quantity,
      unit: item.unit,
      added_by: addedBy || session.user.id,
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
