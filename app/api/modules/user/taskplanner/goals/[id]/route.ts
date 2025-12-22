import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabaseClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!session.user?.id) {
      return NextResponse.json({ error: 'User ID not found in session' }, { status: 401 });
    }

    const body = await request.json();
    const supabase = getSupabaseServerClient();

    // First verify the goal exists and user has access
    const { data: existingGoal, error: fetchError } = await supabase
      .from('goals')
      .select('*')
      .eq('id', params.id)
      .single();

    if (fetchError || !existingGoal) {
      return NextResponse.json({ 
        error: 'Goal not found',
        details: fetchError?.message 
      }, { status: 404 });
    }

    // Normalize group_id: treat empty string, null, or undefined as null
    const normalizedGroupId = existingGoal.group_id != null && String(existingGoal.group_id).trim() !== '' 
      ? existingGoal.group_id 
      : null;

    // Verify access: for personal goals (group_id is null), check user_id
    // For group goals, verify user is a member of the group
    if (normalizedGroupId === null) {
      // Personal goal - must belong to user
      if (existingGoal.user_id !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden: Goal does not belong to user' }, { status: 403 });
      }
    } else {
      // Group goal - verify user is a member of the group
      const { data: membership, error: membershipError } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', normalizedGroupId)
        .eq('user_id', session.user.id)
        .eq('is_active', true)
        .single();

      if (membershipError || !membership) {
        return NextResponse.json({ 
          error: 'Forbidden: User is not a member of this group',
          details: membershipError?.message 
        }, { status: 403 });
      }
    }

    // Build update object
    // Update both text and title for backwards compatibility
    // CRITICAL: title is NOT NULL, so we must never set it to empty/null
    const updateData: any = {};
    
    // Determine the text value to use
    let textValue: string | undefined;
    if (body.goal !== undefined) {
      textValue = body.goal;
    } else if (body.text !== undefined) {
      textValue = body.text;
    }
    
    // Only update text/title if we have a valid non-empty value
    // If empty string is provided, we must preserve the existing title (NOT NULL constraint)
    // NOTE: The 'goal' column doesn't exist in the database, only 'text' and 'title'
    if (textValue !== undefined) {
      const trimmedValue = textValue.trim();
      if (trimmedValue !== '') {
        // Valid value - update text and title (both exist in database)
        updateData.text = trimmedValue;
        updateData.title = trimmedValue; // Required: NOT NULL
        // Do NOT update 'goal' - this column doesn't exist in the database
      } else {
        // Empty string provided - preserve existing title to avoid NOT NULL violation
        // Don't update title/text if empty string is provided
        // The user probably wants to keep the existing value
      }
    }
    
    if (body.progress !== undefined) {
      updateData.progress = body.progress;
    }
    
    // Always update updated_at
    updateData.updated_at = new Date().toISOString();
    
    // Ensure we have at least one field to update
    if (Object.keys(updateData).length === 1 && updateData.updated_at) {
      // Only updated_at was set, which is fine - just update the timestamp
    }

    // Update goal
    const { data: updatedGoal, error: updateError } = await supabase
      .from('goals')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { 
          error: 'Failed to update goal',
          details: updateError.message,
          code: updateError.code
        },
        { status: 500 }
      );
    }

    // Transform to match Goal interface
    // Note: Database has 'text' and 'title' columns, but not 'goal'
    // The 'goal' field in the response is mapped from 'text' or 'title' for API compatibility
    const transformedGoal = {
      id: updatedGoal.id,
      text: updatedGoal.text || updatedGoal.title || '',
      goal: updatedGoal.text || updatedGoal.title || '', // Map from text/title since 'goal' column doesn't exist
      progress: updatedGoal.progress || 0,
      created_at: updatedGoal.created_at,
    };

    return NextResponse.json(transformedGoal);
  } catch (error) {
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to update goal',
        details: error instanceof Error ? error.stack : String(error)
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!session.user?.id) {
      return NextResponse.json({ error: 'User ID not found in session' }, { status: 401 });
    }

    const supabase = getSupabaseServerClient();

    // First verify the goal exists and user has access
    const { data: existingGoal, error: fetchError } = await supabase
      .from('goals')
      .select('*')
      .eq('id', params.id)
      .single();

    if (fetchError || !existingGoal) {
      return NextResponse.json({ 
        error: 'Goal not found',
        details: fetchError?.message 
      }, { status: 404 });
    }

    // Normalize group_id: treat empty string, null, or undefined as null
    const normalizedGroupId = existingGoal.group_id != null && String(existingGoal.group_id).trim() !== '' 
      ? existingGoal.group_id 
      : null;

    // Verify access: for personal goals (group_id is null), check user_id
    // For group goals, verify user is a member of the group
    if (normalizedGroupId === null) {
      // Personal goal - must belong to user
      if (existingGoal.user_id !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden: Goal does not belong to user' }, { status: 403 });
      }
    } else {
      // Group goal - verify user is a member of the group
      const { data: membership, error: membershipError } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', normalizedGroupId)
        .eq('user_id', session.user.id)
        .eq('is_active', true)
        .single();

      if (membershipError || !membership) {
        return NextResponse.json({ 
          error: 'Forbidden: User is not a member of this group',
          details: membershipError?.message 
        }, { status: 403 });
      }
    }

    // Delete goal
    const { error: deleteError } = await supabase
      .from('goals')
      .delete()
      .eq('id', params.id);

    if (deleteError) {
      return NextResponse.json(
        { 
          error: 'Failed to delete goal',
          details: deleteError.message,
          code: deleteError.code
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to delete goal',
        details: error instanceof Error ? error.stack : String(error)
      },
      { status: 500 }
    );
  }
}

