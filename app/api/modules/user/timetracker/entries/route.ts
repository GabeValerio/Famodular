import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabaseClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!session.user?.id) {
      return NextResponse.json({ error: 'User ID not found in session' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const groupIdParam = searchParams.get('groupId');
    const projectId = searchParams.get('projectId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Normalize groupId: treat empty string, null, or undefined as null
    const groupId = groupIdParam && groupIdParam.trim() !== '' ? groupIdParam : null;

    // Use server client (bypasses RLS)
    const supabase = getSupabaseServerClient();

    // CRITICAL: For group view, verify user is a member of the group
    if (groupId) {
      const { data: groupMember } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', groupId)
        .eq('user_id', session.user.id)
        .eq('is_active', true)
        .single();

      if (!groupMember) {
        return NextResponse.json({ error: 'Forbidden: Not a member of this group' }, { status: 403 });
      }
    }

    // Build query with project information
    let query = supabase
      .from('timetracker_entries')
      .select(`
        *,
        timetracker_projects (
          id,
          name,
          description,
          color
        )
      `)
      .eq('is_active', true);

    // CRITICAL: Filter by groupId FIRST to ensure proper data isolation
    if (groupId) {
      // Group view: Show ALL entries for this specific group (NO user_id filter)
      query = query.eq('group_id', groupId);
    } else {
      // Self view: Filter by user_id AND group_id IS NULL
      query = query.eq('user_id', session.user.id).is('group_id', null);
    }

    // Filter by project if provided
    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    // Filter by date range if provided
    if (startDate) {
      query = query.gte('start_time', startDate);
    }
    if (endDate) {
      query = query.lte('start_time', endDate);
    }

    // Order by start time (newest first)
    query = query.order('start_time', { ascending: false });

    const { data: entries, error } = await query;

    // If table doesn't exist yet, return empty array (graceful degradation)
    if (error) {
      if (
        error.code === '42P01' ||
        error.code === 'PGRST116' ||
        error.message?.includes('does not exist') ||
        error.message?.includes('relation')
      ) {
        return NextResponse.json([]);
      }
      throw error;
    }

    // Convert date strings to Date objects and map snake_case to camelCase
    const entriesWithDates = entries?.map(entry => ({
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
    })) || [];

    return NextResponse.json(entriesWithDates);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    const errorDetails = error instanceof Error ? {
      message: errorMessage,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    } : { message: errorMessage };

    return NextResponse.json(
      { error: errorMessage, ...errorDetails },
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
    const { projectId, startTime, endTime, description, groupId } = body;

    if (!startTime) {
      return NextResponse.json({ error: 'Start time is required' }, { status: 400 });
    }

    // Use server client (bypasses RLS)
    const supabase = getSupabaseServerClient();

    // CRITICAL: Normalize groupId for proper data isolation
    const normalizedGroupId = groupId && groupId.trim() !== '' ? groupId : null;

    // If groupId is provided, verify user has access to group
    if (normalizedGroupId) {
      const { data: groupMember } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', normalizedGroupId)
        .eq('user_id', session.user.id)
        .single();

      if (!groupMember) {
        return NextResponse.json({ error: 'Forbidden: Not a member of this group' }, { status: 403 });
      }
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
        (project.group_id === normalizedGroupId);

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

    const now = new Date().toISOString();
    const newEntry = {
      project_id: projectId || null,
      user_id: session.user.id,
      group_id: normalizedGroupId,
      start_time: startDateTime.toISOString(),
      end_time: endDateTime ? endDateTime.toISOString() : null,
      duration_minutes: durationMinutes,
      description: description?.trim() || null,
      is_active: true,
      created_at: now,
      updated_at: now,
    };

    const { data: entry, error } = await supabase
      .from('timetracker_entries')
      .insert(newEntry)
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
      if (error.code === '42P01' || error.message?.includes('does not exist') || error.message?.includes('relation') || error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Time tracker tables do not exist. Please run the database migration.' },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { error: error.message || 'Failed to create entry', code: error.code },
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

    return NextResponse.json(entryWithDates, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
