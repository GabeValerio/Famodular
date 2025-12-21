import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';
import { supabase } from '@/lib/supabaseClient';

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
    const { data: membership, error: membershipError } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', groupId)
      .eq('user_id', session.user.id)
      .eq('is_active', true)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch goals from database
    const { data: goals, error: goalsError } = await supabase
      .from('goals')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });

    if (goalsError) throw goalsError;

    return NextResponse.json(goals || []);
  } catch (error) {
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
      return NextResponse.json({ error: 'Unauthorized - Please log in first' }, { status: 401 });
    }

    const body = await request.json();
    const { groupId, ...goalData } = body;

    if (!groupId) {
      return NextResponse.json({ error: 'groupId is required' }, { status: 400 });
    }

    // Verify user has access to this group
    const { data: membership, error: membershipError } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', groupId)
      .eq('user_id', session.user.id)
      .eq('is_active', true)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json({
        error: 'Access denied - You are not a member of this group',
        details: `User ${session.user.id} does not have access to group ${groupId}`
      }, { status: 403 });
    }

    // Validate required fields
    if (!goalData.title || (!goalData.ownerId && !goalData.owner_id) || !goalData.type || !goalData.timeframe) {
      return NextResponse.json({
        error: 'Missing required fields',
        required: ['title', 'ownerId (or owner_id)', 'type', 'timeframe'],
        received: Object.keys(goalData)
      }, { status: 400 });
    }

    // Create goal in database
    const { data: newGoal, error: createError } = await supabase
      .from('goals')
      .insert({
        title: goalData.title,
        description: goalData.description || '',
        owner_id: goalData.ownerId || goalData.owner_id,
        type: goalData.type,
        timeframe: goalData.timeframe,
        progress: goalData.progress || 0,
        group_id: groupId,
      })
      .select()
      .single();

    if (createError) {
      return NextResponse.json({
        error: 'Database error while creating goal',
        details: createError.message,
        code: createError.code
      }, { status: 500 });
    }

    return NextResponse.json(newGoal, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Unexpected error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

