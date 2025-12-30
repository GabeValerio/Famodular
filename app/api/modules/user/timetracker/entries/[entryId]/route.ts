import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabaseClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';

interface RouteParams {
  params: {
    entryId: string;
  };
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { entryId } = params;
    const body = await request.json();
    const { projectId, startTime, endTime, description, isActive } = body;

    if (!entryId) {
      return NextResponse.json({ error: 'Entry ID is required' }, { status: 400 });
    }

    if (!startTime) {
      return NextResponse.json({ error: 'Start time is required' }, { status: 400 });
    }

    // Use server client (bypasses RLS)
    const supabase = getSupabaseServerClient();

    // First verify the user owns this entry or it's in a group they belong to
    const { data: existingEntry, error: fetchError } = await supabase
      .from('timetracker_entries')
      .select('*')
      .eq('id', entryId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
      }
      throw fetchError;
    }

    // Check access permissions
    const hasAccess = existingEntry.user_id === session.user.id ||
      (existingEntry.group_id && await checkGroupAccess(supabase, existingEntry.group_id, session.user.id));

    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden: No access to this entry' }, { status: 403 });
    }

    // Verify project belongs to user if projectId is provided
    if (projectId) {
      const { data: project } = await supabase
        .from('timetracker_projects')
        .select('*')
        .eq('id', projectId)
        .eq('is_active', true)
        .single();

      if (!project) {
        return NextResponse.json({ error: 'Project not found or inactive' }, { status: 404 });
      }

      // Check if user has access to this project
      const hasProjectAccess = project.user_id === session.user.id ||
        (project.group_id === existingEntry.group_id);

      if (!hasProjectAccess) {
        return NextResponse.json({ error: 'Forbidden: No access to this project' }, { status: 403 });
      }
    }

    const startDateTime = new Date(startTime);
    let endDateTime: Date | null = null;
    let durationMinutes: number | null = null;

    if (endTime) {
      endDateTime = new Date(endTime);
      if (endDateTime <= startDateTime) {
        return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 });
      }
      durationMinutes = Math.floor((endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60));
    }

    const updateData = {
      project_id: projectId || null,
      start_time: startDateTime.toISOString(),
      end_time: endDateTime ? endDateTime.toISOString() : null,
      duration_minutes: durationMinutes,
      description: description?.trim() || null,
      is_active: isActive !== undefined ? isActive : existingEntry.is_active,
      updated_at: new Date().toISOString(),
    };

    const { data: entry, error } = await supabase
      .from('timetracker_entries')
      .update(updateData)
      .eq('id', entryId)
      .select(`
        *,
        timetracker_projects (
          id,
          name,
          description,
          color
        )
      `)
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Failed to update entry', code: error.code },
        { status: 400 }
      );
    }

    // Convert date strings to Date objects and map snake_case to camelCase
    const entryWithDates = {
      id: entry.id,
      projectId: entry.project_id,
      project: entry.timetracker_projects ? {
        id: entry.timetracker_projects.id,
        name: entry.timetracker_projects.name,
        description: entry.timetracker_projects.description,
        color: entry.timetracker_projects.color,
      } : undefined,
      userId: entry.user_id,
      groupId: entry.group_id,
      startTime: new Date(entry.start_time),
      endTime: entry.end_time ? new Date(entry.end_time) : null,
      durationMinutes: entry.duration_minutes,
      description: entry.description,
      isActive: entry.is_active,
      createdAt: new Date(entry.created_at),
      updatedAt: new Date(entry.updated_at),
    };

    return NextResponse.json(entryWithDates);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { entryId } = params;

    if (!entryId) {
      return NextResponse.json({ error: 'Entry ID is required' }, { status: 400 });
    }

    // Use server client (bypasses RLS)
    const supabase = getSupabaseServerClient();

    // First verify the user owns this entry or it's in a group they belong to
    const { data: existingEntry, error: fetchError } = await supabase
      .from('timetracker_entries')
      .select('*')
      .eq('id', entryId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
      }
      throw fetchError;
    }

    // Check access permissions
    const hasAccess = existingEntry.user_id === session.user.id ||
      (existingEntry.group_id && await checkGroupAccess(supabase, existingEntry.group_id, session.user.id));

    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden: No access to this entry' }, { status: 403 });
    }

    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('timetracker_entries')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', entryId);

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Failed to delete entry', code: error.code },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to check group access
async function checkGroupAccess(supabase: any, groupId: string, userId: string): Promise<boolean> {
  const { data: groupMember } = await supabase
    .from('group_members')
    .select('*')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();

  return !!groupMember;
}
