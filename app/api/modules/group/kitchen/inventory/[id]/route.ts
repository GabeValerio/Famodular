import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const updates = await request.json();

    // Transform camelCase to snake_case for database
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.location !== undefined) dbUpdates.location = updates.location;
    if (updates.quantity !== undefined) dbUpdates.quantity = updates.quantity;
    if (updates.unit !== undefined) dbUpdates.unit = updates.unit;
    if (updates.expirationDate !== undefined) dbUpdates.expiration_date = updates.expirationDate;
    if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl;
    if (updates.nutritionalInfo !== undefined) dbUpdates.nutritional_info = updates.nutritionalInfo;
    if (updates.barcode !== undefined) dbUpdates.barcode = updates.barcode;

    // First, get the item to verify ownership
    const { data: item, error: fetchError } = await supabase
      .from('kitchen_inventory')
      .select('group_id')
      .eq('id', id)
      .single();

    if (fetchError || !item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Verify user has access to this group
    const { data: groupMember } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', item.group_id)
      .eq('user_id', session.user.id)
      .eq('is_active', true)
      .single();

    if (!groupMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update the item
    const { data: updatedItem, error } = await supabase
      .from('kitchen_inventory')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Transform snake_case to camelCase for frontend
    const transformedItem = {
      id: updatedItem.id,
      name: updatedItem.name,
      category: updatedItem.category,
      location: updatedItem.location,
      quantity: updatedItem.quantity,
      unit: updatedItem.unit,
      expirationDate: updatedItem.expiration_date || null,
      addedDate: updatedItem.added_date,
      addedBy: updatedItem.added_by,
      groupId: updatedItem.group_id,
      imageUrl: updatedItem.image_url || null,
      nutritionalInfo: updatedItem.nutritional_info || null,
      barcode: updatedItem.barcode || null,
    };

    return NextResponse.json(transformedItem);
  } catch (error) {
    console.error('Error updating inventory item:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // First, get the item to verify ownership
    const { data: item, error: fetchError } = await supabase
      .from('kitchen_inventory')
      .select('group_id')
      .eq('id', id)
      .single();

    if (fetchError || !item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Verify user has access to this group
    const { data: groupMember } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', item.group_id)
      .eq('user_id', session.user.id)
      .eq('is_active', true)
      .single();

    if (!groupMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete the item
    const { error } = await supabase
      .from('kitchen_inventory')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
