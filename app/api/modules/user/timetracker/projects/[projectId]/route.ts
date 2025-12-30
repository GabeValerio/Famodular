import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabaseClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';

interface RouteParams {
  params: {
    projectId: string;
  };
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = params;
    const body = await request.json();
    const { name, description, color, isActive } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }

    // Use server client (bypasses RLS)
    const supabase = getSupabaseServerClient();

    // First verify the user owns this project or it's in a group they belong to
    const { data: existingProject, error: fetchError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }
      throw fetchError;
    }

    // Check access permissions
    const hasAccess = existingProject.user_id === session.user.id ||
      (existingProject.group_id && await checkGroupAccess(supabase, existingProject.group_id, session.user.id));

    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden: No access to this project' }, { status: 403 });
    }

    const updateData = {
      name: name.trim(),
      description: description?.trim() || null,
      color: color || null,
      updated_at: new Date().toISOString(),
    };

    const { data: project, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', projectId)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Failed to update project', code: error.code },
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
      groupId: project.group_id,
      createdAt: new Date(project.created_at),
      updatedAt: new Date(project.updated_at),
    };

    return NextResponse.json(projectWithDates);
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

    const { projectId } = params;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Use server client (bypasses RLS)
    const supabase = getSupabaseServerClient();

    // First verify the user owns this project or it's in a group they belong to
    const { data: existingProject, error: fetchError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }
      throw fetchError;
    }

    // Check access permissions
    const hasAccess = existingProject.user_id === session.user.id ||
      (existingProject.group_id && await checkGroupAccess(supabase, existingProject.group_id, session.user.id));

    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden: No access to this project' }, { status: 403 });
    }

    // Delete the project
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Failed to delete project', code: error.code },
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
