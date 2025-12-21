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

    // Toggle completed status
    const { data: todo, error } = await supabase
      .from('todos')
      .update({
        completed: !existingTodo.completed,
        updated_at: new Date().toISOString(),
      })
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
