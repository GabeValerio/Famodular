import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabaseClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';

// Helper functions to map between todos (category) and tasks (type)
const categoryToType = (category: string): string => {
  if (category === 'personal' || category === 'work' || category === 'group') {
    return category;
  }
  return 'personal';
};

const typeToCategory = (type: string | undefined): string => {
  if (type === 'personal' || type === 'work' || type === 'group') {
    return type;
  }
  return 'personal';
};

const textPriorityToInt = (priority: string | number | undefined): number => {
  if (typeof priority === 'number') return priority;
  if (typeof priority === 'string') {
    if (priority === 'high') return 1;
    if (priority === 'medium') return 2;
    if (priority === 'low') return 3;
  }
  return 0;
};

const intPriorityToText = (priority: number | undefined): string => {
  if (priority === 1) return 'high';
  if (priority === 2) return 'medium';
  if (priority === 3) return 'low';
  return 'medium';
};

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
    
    // Verify user owns this todo (now in tasks table)
    const { data: existingTodo, error: fetchError } = await supabase
      .from('tasks')
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

    if (body.title !== undefined) {
      updates.title = body.title;
      updates.text = body.title; // Also update text for compatibility
    }
    if (body.description !== undefined) updates.description = body.description || null;
    if (body.category !== undefined) updates.type = categoryToType(body.category); // Map category to type
    if (body.priority !== undefined) updates.priority = textPriorityToInt(body.priority); // Convert text priority to integer
    if (body.completed !== undefined) {
      updates.completed = body.completed;
      updates.completed_at = body.completed ? new Date().toISOString() : null;
    }
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
    const newCategory = body.category || typeToCategory(existingTodo.type);
    if (newCategory === 'group' && !existingTodo.group_id && !body.groupId) {
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
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .eq('user_id', session.user.id)
      .select()
      .single();

    if (error) throw error;

    // Convert date strings to Date objects and map snake_case to camelCase
    // Map type back to category and integer priority to text for backward compatibility
    const todoWithDates = {
      id: todo.id,
      title: todo.title || todo.text,
      description: todo.description,
      completed: todo.completed,
      category: typeToCategory(todo.type), // Map type to category
      priority: intPriorityToText(todo.priority), // Convert integer priority to text
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
    
    // Verify user owns this todo (now in tasks table)
    const { data: existingTodo, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single();

    if (fetchError || !existingTodo) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    const { error } = await supabase
      .from('tasks')
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
