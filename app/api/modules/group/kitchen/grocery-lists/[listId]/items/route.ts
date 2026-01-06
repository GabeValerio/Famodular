import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';

export async function POST(
  request: NextRequest,
  { params }: { params: { listId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { listId } = params;
    const body = await request.json();
    const { name, quantity, unit, category, estimatedCost, notes } = body;

    if (!name) {
      return NextResponse.json({ error: 'name required' }, { status: 400 });
    }

    // First, get the list to verify ownership
    const { data: list, error: fetchError } = await supabase
      .from('kitchen_grocery_lists')
      .select('group_id')
      .eq('id', listId)
      .single();

    if (fetchError || !list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }

    // Verify user has access to this group
    const { data: groupMember } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', list.group_id)
      .eq('user_id', session.user.id)
      .eq('is_active', true)
      .single();

    if (!groupMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Add grocery item
    const { data: item, error } = await supabase
      .from('kitchen_grocery_items')
      .insert({
        list_id: listId,
        name,
        quantity: quantity || 1,
        unit: unit || 'pieces',
        category: category || 'Other',
        estimated_cost: estimatedCost || 0,
        notes,
        added_by: session.user.id,
        group_id: list.group_id,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Error adding grocery item:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
