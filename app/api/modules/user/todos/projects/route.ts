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
    
    // Normalize groupId: treat empty string, null, or undefined as null
    const groupId = groupIdParam && groupIdParam.trim() !== '' ? groupIdParam : null;

    // Build query using server client (bypasses RLS)
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
    
    // CRITICAL: Filter projects by group_id for data isolation
    // Self view (groupId = null): Only projects with group_id IS NULL for current user
    // Group view (groupId = UUID): Show ALL projects for this specific group (regardless of creator)
    let query = supabase
      .from('projects')
      .select('*');
    
    if (groupId) {
      // Group view: Show ALL projects for this specific group (NO user_id filter)
      query = query.eq('group_id', groupId);
    } else {
      // Self view: Only personal projects (group_id IS NULL) for current user
      query = query.eq('user_id', session.user.id).is('group_id', null);
    }
    
    const { data: projects, error } = await query.order('created_at', { ascending: false });

    // If table doesn't exist yet, return empty array (graceful degradation)
    if (error) {
      if (
        error.code === '42P01' ||
        error.code === 'PGRST116' ||
        error.message?.includes('does not exist') ||
        error.message?.includes('relation') ||
        error.message?.includes('Could not find a relationship')
      ) {
        return NextResponse.json([]);
      }
      throw error;
    }

    // Convert date strings to Date objects and map snake_case to camelCase
    const projectsWithDates = (projects || []).map(project => ({
      id: project.id,
      name: project.name,
      description: project.description,
      color: project.color,
      userId: project.user_id,
      groupId: project.group_id || undefined,
      createdAt: new Date(project.created_at),
      updatedAt: new Date(project.updated_at),
    }));

    return NextResponse.json(projectsWithDates);
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
    const { name, description, color, groupId } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // CRITICAL: Normalize groupId for data isolation
    // Treat empty string, null, or undefined as null (self view)
    const normalizedGroupId = groupId && groupId.trim() !== '' ? groupId : null;

    // Verify user has access to group if groupId is provided
    if (normalizedGroupId) {
      const supabase = getSupabaseServerClient();
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

    const now = new Date().toISOString();
    const newProject = {
      name,
      description: description || null,
      color: color || '#6366f1',
      user_id: session.user.id,
      // CRITICAL: Set group_id based on context for data isolation
      // NULL for self view, groupId for group view
      group_id: normalizedGroupId,
      created_at: now,
      updated_at: now,
    };

    // Use server client (bypasses RLS)
    const supabase = getSupabaseServerClient();
    const { data: project, error } = await supabase
      .from('projects')
      .insert(newProject)
      .select()
      .single();

    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist') || error.message?.includes('relation') || error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Projects table does not exist. Please create the projects table in your database. See docs/TODOS_MODULE_SCHEMA.md for the SQL schema.' },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { error: error.message || 'Failed to create project', code: error.code },
        { status: 400 }
      );
    }

    // Convert date strings to Date objects and map snake_case to camelCase
    const projectWithDates = {
      id: project.id,
      name: project.name,
      description: project.description,
      color: project.color,
      userId: project.user_id,
      groupId: project.group_id || undefined,
      createdAt: new Date(project.created_at),
      updatedAt: new Date(project.updated_at),
    };

    return NextResponse.json(projectWithDates, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
