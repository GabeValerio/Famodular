import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabaseClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!session.user?.id) {
      return NextResponse.json({ error: 'User ID not found in session' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const groupIdParam = searchParams.get('groupId');
    
    // Normalize groupId: treat empty string, null, or undefined as null
    const groupId = groupIdParam && groupIdParam.trim() !== '' ? groupIdParam : null;

    // Use server client (bypasses RLS)
    const supabase = getSupabaseServerClient();
    
    // Build query
    let query = supabase
      .from('goals')
      .select('*')
      .eq('user_id', session.user.id);

    // Filter by group_id if provided
    if (groupId) {
      query = query.eq('group_id', groupId);
    } else {
      // If no groupId, only return goals with null group_id (personal goals)
      query = query.is('group_id', null);
    }

    const { data: goals, error } = await query.order('created_at', { ascending: false });

    // Handle table doesn't exist or other errors gracefully
    if (error) {
      // If table doesn't exist or query fails, return empty array
      if (
        error.code === '42P01' ||
        error.code === 'PGRST116' ||
        error.message?.includes('does not exist') ||
        error.message?.includes('relation') ||
        error.message?.includes('Could not find a relationship')
      ) {
        return NextResponse.json([]);
      }
      throw error;
    }

    // Transform to match Goal interface (convert snake_case to camelCase)
    // Map database fields: title -> text/goal, text -> text/goal
    const transformedGoals = goals.map((goal: any) => ({
      id: goal.id,
      text: goal.text || goal.title || '',
      goal: goal.goal || goal.text || goal.title || '',
      progress: goal.progress || 0,
      created_at: goal.created_at,
    }));

    return NextResponse.json(transformedGoals);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch goals' },
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

    if (!session.user?.id) {
      return NextResponse.json({ error: 'User ID not found in session' }, { status: 401 });
    }

    const body = await request.json();
    const { text, goal, progress, groupId } = body;

    if (!text && !goal) {
      return NextResponse.json({ error: 'Text or goal is required' }, { status: 400 });
    }

    // Normalize groupId
    const normalizedGroupId = groupId && groupId.trim() !== '' ? groupId : null;

    // Verify user has access to group if groupId is provided
    if (normalizedGroupId) {
      const supabase = getSupabaseServerClient();
      const { data: groupMember } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', normalizedGroupId)
        .eq('user_id', session.user.id)
        .single();

      if (!groupMember) {
        return NextResponse.json({ error: 'Forbidden: Not a member of this group' }, { status: 403 });
      }
    }

    const supabase = getSupabaseServerClient();
    const now = new Date().toISOString();
    
    // For TaskPlanner: use text field, but also set title for backwards compatibility
    const goalText = text || goal || '';
    
    // Provide required fields for Goals module compatibility (NOT NULL constraints)
    // These are defaults that allow TaskPlanner goals to be stored in the shared goals table
    const newGoal = {
      id: crypto.randomUUID(),
      text: goalText,
      title: goalText, // Required: NOT NULL
      description: '', // Required: NOT NULL (empty for TaskPlanner goals)
      owner_id: session.user.id.toString(), // Required: NOT NULL (use user_id as string for compatibility)
      type: normalizedGroupId ? 'Family' : 'Personal', // Required: NOT NULL ('Family' for group goals, 'Personal' for self)
      timeframe: '1 Year', // Required: NOT NULL (default timeframe, must be one of: '6 Months', '1 Year', '3 Years', '5 Years')
      progress: progress || 0,
      user_id: session.user.id, // For TaskPlanner self/group pattern
      group_id: normalizedGroupId, // For TaskPlanner self/group pattern
      created_at: now,
      updated_at: now,
    };

    const { data: createdGoal, error: createError } = await supabase
      .from('goals')
      .insert(newGoal)
      .select()
      .single();

    if (createError) {
      return NextResponse.json(
        { 
          error: 'Failed to create goal',
          details: createError.message,
          code: createError.code 
        },
        { status: 500 }
      );
    }

    // Transform to match Goal interface
    // Map database fields: title -> text/goal, text -> text/goal
    const transformedGoal = {
      id: createdGoal.id,
      text: createdGoal.text || createdGoal.title || '',
      goal: createdGoal.goal || createdGoal.text || createdGoal.title || '',
      progress: createdGoal.progress || 0,
      created_at: createdGoal.created_at,
    };

    return NextResponse.json(transformedGoal, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create goal' },
      { status: 500 }
    );
  }
}

