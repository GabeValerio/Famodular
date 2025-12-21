import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';

// GET - Fetch all groups for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all group IDs where user is a member
    const { data: memberships, error: membershipError } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', session.user.id)
      .eq('is_active', true);

    if (membershipError) throw membershipError;

    if (!memberships || memberships.length === 0) {
      return NextResponse.json([]);
    }

    const groupIds = memberships.map(m => m.group_id);

    // Fetch the groups
    const { data: groupsData, error: groupsError } = await supabase
      .from('groups')
      .select('*')
      .in('id', groupIds);

    if (groupsError) throw groupsError;

    // Transform the data to match Group interface
    const groups = groupsData?.map((group: any) => ({
      id: group.id,
      name: group.name,
      description: group.description,
      avatar: group.avatar,
      createdBy: group.created_by,
      createdAt: new Date(group.created_at),
      privacy: group.privacy,
      enabledModules: group.enabled_modules,
      members: [] // Will be populated separately if needed
    })) || [];

    return NextResponse.json(groups);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create a new group
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, avatar, privacy = 'private' } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Create the group
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .insert({
        name,
        description,
        avatar,
        created_by: session.user.id,
        privacy,
      })
      .select()
      .single();

    if (groupError) throw groupError;

    // Add creator as admin member
    const { error: memberError } = await supabase
      .from('group_members')
      .insert({
        user_id: session.user.id,
        group_id: group.id,
        role: 'Admin',
        is_active: true,
      });

    if (memberError) throw memberError;

    // Transform to match Group interface
    const responseGroup = {
      id: group.id,
      name: group.name,
      description: group.description,
      avatar: group.avatar,
      createdBy: group.created_by,
      createdAt: new Date(group.created_at),
      privacy: group.privacy,
      enabledModules: group.enabled_modules,
      members: []
    };

    return NextResponse.json(responseGroup, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
