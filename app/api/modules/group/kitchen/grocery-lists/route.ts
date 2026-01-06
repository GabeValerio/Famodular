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
      .eq('group_id', groupId)
      .eq('user_id', session.user.id)
      .eq('is_active', true)
      .single();

    if (!groupMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch grocery lists with their items
    const { data: lists, error } = await supabase
      .from('kitchen_grocery_lists')
      .select(`
        *,
        items:kitchen_grocery_items(*)
      `)
      .eq('group_id', groupId)
      .order('created_date', { ascending: false });

    if (error) throw error;

    return NextResponse.json(lists);
  } catch (error) {
    console.error('Error fetching grocery lists:', error);
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
    const { name, description, groupId } = body;

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

    // Create grocery list
    const { data: list, error } = await supabase
      .from('kitchen_grocery_lists')
      .insert({
        name,
        description,
        created_by: session.user.id,
        group_id: groupId,
      })
      .select(`
        *,
        items:kitchen_grocery_items(*)
      `)
      .single();

    if (error) throw error;

    return NextResponse.json(list, { status: 201 });
  } catch (error) {
    console.error('Error creating grocery list:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
