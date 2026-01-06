import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabaseClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';

// GET - Get all members of a group
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

    // First verify the user is a member of the group
    const { data: userMembership, error: membershipError } = await supabase
      .from('group_members')
      .select('role, is_active')
      .eq('group_id', groupId)
      .eq('user_id', session.user.id)
      .eq('is_active', true)
      .single();

    if (membershipError || !userMembership) {
      return NextResponse.json(
        { error: 'Not a member of this group' },
        { status: 403 }
      );
    }

    // Get all active members of the group with user details and currently reading books
    const { data: members, error: membersError } = await supabase
      .from('group_members')
      .select(`
        role,
        is_active,
        joined_at,
        user:users!inner (
          id,
          name,
          email,
          avatar,
          currently_reading:user_currently_reading (
            id,
            book_id,
            started_date,
            book:books (
              id,
              title,
              authors,
              image_links
            )
          )
        )
      `)
      .eq('group_id', groupId)
      .eq('is_active', true)
      .order('joined_at', { ascending: true });

    if (membersError) {
      console.error('Error fetching group members:', membersError);
      return NextResponse.json(
        { error: 'Failed to fetch group members' },
        { status: 500 }
      );
    }

    // Transform the data to match the expected format
    const transformedMembers = members.map((member: any) => {
      // Transform currently reading books
      const currentlyReading = member.user.currently_reading?.map((reading: any) => ({
        id: reading.id,
        bookId: reading.book_id,
        startedDate: reading.started_date,
        book: reading.book ? {
          id: reading.book.id,
          title: reading.book.title,
          authors: reading.book.authors || [],
          coverUrl: reading.book.image_links?.thumbnail ||
                   reading.book.image_links?.smallThumbnail ||
                   reading.book.image_links?.medium
        } : null
      })) || [];

      return {
        id: member.user.id,
        name: member.user.name,
        email: member.user.email,
        avatar: member.user.avatar,
        role: member.role,
        status: member.is_active ? 'active' : 'inactive',
        joinDate: member.joined_at,
        currentlyReading
      };
    });

    return NextResponse.json(transformedMembers);
  } catch (error) {
    console.error('Error in group members API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
