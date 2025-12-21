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

    const { id } = params;
    const body = await request.json();

    // Use server client (bypasses RLS)
    const supabase = getSupabaseServerClient();
    
    // Verify user owns this todo
    const { data: existingTodo, error: fetchError } = await supabase
      .from('todos')
      .select('*')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single();

    if (fetchError || !existingTodo) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    // Build update object
    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (body.title !== undefined) updates.title = body.title;
    if (body.description !== undefined) updates.description = body.description || null;
    if (body.category !== undefined) updates.category = body.category;
    if (body.priority !== undefined) updates.priority = body.priority;
    if (body.completed !== undefined) updates.completed = body.completed;
    if (body.dueDate !== undefined) {
      updates.due_date = body.dueDate ? new Date(body.dueDate).toISOString() : null;
    }
    if (body.projectId !== undefined) {
      // Verify project belongs to user if projectId is provided
      if (body.projectId) {
        // Use server client (bypasses RLS)
        const supabase = getSupabaseServerClient();
        const { data: project } = await supabase
          .from('projects')
          .select('*')
          .eq('id', body.projectId)
          .eq('user_id', session.user.id)
          .single();

        if (!project) {
          return NextResponse.json({ error: 'Forbidden: Project not found or access denied' }, { status: 403 });
        }
      }
      updates.project_id = body.projectId || null;
    }

    // If category is being changed to 'group', verify groupId is provided
    if (body.category === 'group' && !existingTodo.group_id && !body.groupId) {
      return NextResponse.json({ error: 'groupId is required for group todos' }, { status: 400 });
    }

    if (body.groupId !== undefined) {
      // Verify user has access to the new group
      if (body.groupId) {
        // Use server client (bypasses RLS)
        const supabase = getSupabaseServerClient();
        const { data: groupMember } = await supabase
          .from('group_members')
          .select('*')
          .eq('group_id', body.groupId)
          .eq('user_id', session.user.id)
          .single();

        if (!groupMember) {
          return NextResponse.json({ error: 'Forbidden: Not a member of this group' }, { status: 403 });
        }
      }
      updates.group_id = body.groupId || null;
    }

    const { data: todo, error } = await supabase
      .from('todos')
      .update(updates)
      .eq('id', id)
      .eq('user_id', session.user.id)
      .select()
      .single();

    if (error) throw error;

    // Convert date strings to Date objects and map snake_case to camelCase
    const todoWithDates = {
      id: todo.id,
      title: todo.title,
      description: todo.description,
      completed: todo.completed,
      category: todo.category,
      priority: todo.priority,
      userId: todo.user_id,
      groupId: todo.group_id,
      projectId: todo.project_id,
      dueDate: todo.due_date ? new Date(todo.due_date) : undefined,
      createdAt: new Date(todo.created_at),
      updatedAt: new Date(todo.updated_at),
    };

    return NextResponse.json(todoWithDates);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
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

    const { id } = params;

    // Use server client (bypasses RLS)
    const supabase = getSupabaseServerClient();
    
    // Verify user owns this todo
    const { data: existingTodo, error: fetchError } = await supabase
      .from('todos')
      .select('*')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single();

    if (fetchError || !existingTodo) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
