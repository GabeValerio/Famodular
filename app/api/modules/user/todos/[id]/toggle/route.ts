import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabaseClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';

// Helper functions to map between todos (category) and tasks (type)
const typeToCategory = (type: string | undefined): string => {
  if (type === 'personal' || type === 'work' || type === 'group') {
    return type;
  }
  return 'personal';
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

    // Toggle completed status
    const newCompletedStatus = !existingTodo.completed;
    const { data: todo, error } = await supabase
      .from('tasks')
      .update({
        completed: newCompletedStatus,
        completed_at: newCompletedStatus ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
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
