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

    // Fetch questions from database
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .eq('group_id', groupId)
      .order('timestamp', { ascending: false });

    if (questionsError) throw questionsError;

    // Transform to match Question interface
    const transformedQuestions = questions?.map(question => ({
      id: question.id,
      text: question.text,
      topic: question.topic,
      createdBy: question.created_by,
      groupId: question.group_id,
      timestamp: new Date(question.timestamp),
      isActive: question.is_active,
    })) || [];

    return NextResponse.json(transformedQuestions);
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
    const { groupId, text, topic, createdBy, isActive = true } = body;

    if (!groupId || !text || !topic) {
      return NextResponse.json({ error: 'groupId, text, and topic are required' }, { status: 400 });
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

    // Create question in database
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .insert({
        group_id: groupId,
        text,
        topic,
        created_by: createdBy || session.user.id,
        is_active: isActive,
      })
      .select()
      .single();

    if (questionError) throw questionError;

    // Transform to match Question interface
    const transformedQuestion = {
      id: question.id,
      text: question.text,
      topic: question.topic,
      createdBy: question.created_by,
      groupId: question.group_id,
      timestamp: new Date(question.timestamp),
      isActive: question.is_active,
    };

    return NextResponse.json(transformedQuestion, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
