import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabaseClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';

// GET - Get current user's membership info for a group
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const groupId = params.id;
    const supabase = getSupabaseServerClient();

    // Get user's membership in the group
    const { data: membership, error: membershipError } = await supabase
      .from('group_members')
      .select('role, is_active')
      .eq('group_id', groupId)
      .eq('user_id', session.user.id)
      .eq('is_active', true)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'Not a member of this group' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      role: membership.role,
      isAdmin: membership.role === 'Admin',
      isActive: membership.is_active,
    });
  } catch (error) {
    console.error('Error fetching group membership:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

