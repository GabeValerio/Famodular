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

    // Fetch check-ins from database
    const { data: checkIns, error: checkInsError } = await supabase
      .from('check_ins')
      .select('*')
      .eq('group_id', groupId)
      .order('timestamp', { ascending: false });

    if (checkInsError) throw checkInsError;

    // Transform to match CheckIn interface
    const transformedCheckIns = checkIns?.map(checkIn => ({
      id: checkIn.id,
      memberId: checkIn.member_id,
      groupId: checkIn.group_id,
      timestamp: new Date(checkIn.timestamp),
      mood: checkIn.mood,
      note: checkIn.note,
      location: checkIn.location,
      questionId: checkIn.question_id,
    })) || [];

    return NextResponse.json(transformedCheckIns);
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { groupId, memberId, mood, note, location, questionId } = body;

    if (!groupId || !mood || !note) {
      return NextResponse.json({ error: 'groupId, mood, and note are required' }, { status: 400 });
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

    // Create check-in in database
    const { data: checkIn, error: checkInError } = await supabase
      .from('check_ins')
      .insert({
        group_id: groupId,
        member_id: memberId || session.user.id,
        mood,
        note,
        location: location || null,
        question_id: questionId || null,
      })
      .select()
      .single();

    if (checkInError) throw checkInError;

    // Transform to match CheckIn interface
    const transformedCheckIn = {
      id: checkIn.id,
      memberId: checkIn.member_id,
      groupId: checkIn.group_id,
      timestamp: new Date(checkIn.timestamp),
      mood: checkIn.mood,
      note: checkIn.note,
      location: checkIn.location,
      questionId: checkIn.question_id,
    };

    return NextResponse.json(transformedCheckIn, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
