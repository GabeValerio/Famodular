import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';

// PATCH - Update a group
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
    const body = await request.json();

    // Verify user is admin of the group
    const { data: membership, error: membershipError } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', id)
      .eq('user_id', session.user.id)
      .eq('is_active', true)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Group not found or access denied' }, { status: 404 });
    }

    if (membership.role !== 'Admin') {
      return NextResponse.json({ error: 'Only admins can update group settings' }, { status: 403 });
    }

    // Build update object
    const updates: any = {};

    if (body.name !== undefined) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description || null;
    if (body.avatar !== undefined) {
      // Validate avatar URL if provided
      if (body.avatar && typeof body.avatar === 'string' && body.avatar.trim()) {
        updates.avatar = body.avatar.trim();
      } else {
        updates.avatar = null;
      }
    }
    if (body.privacy !== undefined) updates.privacy = body.privacy;
    if (body.enabledModules !== undefined) updates.enabled_modules = body.enabledModules;

    // Update the group
    const { data: group, error: updateError } = await supabase
      .from('groups')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('PATCH /api/groups/[id] - Database update error:', updateError);
      throw updateError;
    }

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

    return NextResponse.json(responseGroup);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

