import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';
import { supabase } from '@/lib/supabaseClient';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { goalId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // First get the goal to verify ownership/access
    const { data: existingGoal, error: fetchError } = await supabase
      .from('goals')
      .select('group_id')
      .eq('id', params.goalId)
      .single();

    if (fetchError || !existingGoal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    // Verify user has access to this group
    const { data: membership, error: membershipError } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', existingGoal.group_id)
      .eq('user_id', session.user.id)
      .eq('is_active', true)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update goal in database
    const { data: updatedGoal, error: updateError } = await supabase
      .from('goals')
      .update(body)
      .eq('id', params.goalId)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json(updatedGoal);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { goalId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // First get the goal to verify ownership/access
    const { data: existingGoal, error: fetchError } = await supabase
      .from('goals')
      .select('group_id')
      .eq('id', params.goalId)
      .single();

    if (fetchError || !existingGoal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    // Verify user has access to this group
    const { data: membership, error: membershipError } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', existingGoal.group_id)
      .eq('user_id', session.user.id)
      .eq('is_active', true)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete goal from database
    const { error: deleteError } = await supabase
      .from('goals')
      .delete()
      .eq('id', params.goalId);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

