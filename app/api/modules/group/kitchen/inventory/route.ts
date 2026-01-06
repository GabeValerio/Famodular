import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';
import { analyzeInventoryPhoto } from '@/app/modules/kitchen/services/kitchen_geminiservice';

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

    // Fetch inventory items
    const { data: inventory, error } = await supabase
      .from('kitchen_inventory')
      .select('*')
      .eq('group_id', groupId)
      .order('added_date', { ascending: false });

    if (error) throw error;

    // Transform snake_case to camelCase for frontend
    const transformedInventory = (inventory || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      location: item.location,
      quantity: item.quantity,
      unit: item.unit,
      expirationDate: item.expiration_date || null,
      addedDate: item.added_date,
      addedBy: item.added_by,
      groupId: item.group_id,
      imageUrl: item.image_url || null,
      nutritionalInfo: item.nutritional_info || null,
      barcode: item.barcode || null,
    }));

    return NextResponse.json(transformedInventory);
  } catch (error) {
    console.error('Error fetching inventory:', error);
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
    const { name, category, location, quantity, unit, expirationDate, groupId, imageUrl } = body;

    if (!groupId || !name || !category || !location || !quantity || !unit) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
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

    // Add inventory item
    const { data: item, error } = await supabase
      .from('kitchen_inventory')
      .insert({
        name,
        category,
        location,
        quantity,
        unit,
        expiration_date: expirationDate,
        added_by: session.user.id,
        group_id: groupId,
        image_url: imageUrl,
      })
      .select()
      .single();

    if (error) throw error;

    // Transform snake_case to camelCase for frontend
    const transformedItem = {
      id: item.id,
      name: item.name,
      category: item.category,
      location: item.location,
      quantity: item.quantity,
      unit: item.unit,
      expirationDate: item.expiration_date || null,
      addedDate: item.added_date,
      addedBy: item.added_by,
      groupId: item.group_id,
      imageUrl: item.image_url || null,
      nutritionalInfo: item.nutritional_info || null,
      barcode: item.barcode || null,
    };

    return NextResponse.json(transformedItem, { status: 201 });
  } catch (error) {
    console.error('Error adding inventory item:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
