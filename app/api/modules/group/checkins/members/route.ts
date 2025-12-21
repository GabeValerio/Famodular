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

    // Fetch members from database
    const { data: members, error: membersError } = await supabase
      .from('group_members')
      .select(`
        user_id,
        role,
        joined_at,
        users (
          id,
          name,
          email,
          avatar
        )
      `)
      .eq('group_id', groupId)
      .eq('is_active', true);

    if (membersError) throw membersError;

    // Transform to match FamilyMember interface
    const transformedMembers = members?.map((member: any) => ({
      id: member.users.id,
      name: member.users.name || member.users.email,
      avatar: member.users.avatar || '',
      role: member.role === 'Admin' ? 'Parent' : 'Child', // Map Admin->Parent, Member->Child
    })) || [];

    return NextResponse.json(transformedMembers);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
