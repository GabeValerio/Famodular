import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { listId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { listId } = params;
    const updates = await request.json();

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
      .eq('groupId', list.group_id)
      .eq('userId', session.user.id)
      .single();

    if (!groupMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update the list
    const { data: updatedList, error } = await supabase
      .from('kitchen_grocery_lists')
      .update(updates)
      .eq('id', listId)
      .select(`
        *,
        items:kitchen_grocery_items(*)
      `)
      .single();

    if (error) throw error;

    return NextResponse.json(updatedList);
  } catch (error) {
    console.error('Error updating grocery list:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { listId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { listId } = params;

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
      .eq('groupId', list.group_id)
      .eq('userId', session.user.id)
      .single();

    if (!groupMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete the list (items will be cascade deleted)
    const { error } = await supabase
      .from('kitchen_grocery_lists')
      .delete()
      .eq('id', listId);

    if (error) throw error;

    return NextResponse.json({ message: 'List deleted successfully' });
  } catch (error) {
    console.error('Error deleting grocery list:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
