import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabaseClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';

// Helper functions to map between todos (category) and tasks (type)
// Todos API uses 'category' field, but we store in tasks.type
const categoryToType = (category: string): string => {
  // Map category values to type values
  if (category === 'personal' || category === 'work' || category === 'group') {
    return category;
  }
  return 'personal'; // default
};

const typeToCategory = (type: string | undefined): string => {
  // Map type back to category for API compatibility
  if (type === 'personal' || type === 'work' || type === 'group') {
    return type;
  }
  return 'personal'; // default
};

// Helper to convert priority: text ('low','medium','high') <-> integer (3,2,1)
const textPriorityToInt = (priority: string | number | undefined): number => {
  if (typeof priority === 'number') return priority;
  if (typeof priority === 'string') {
    if (priority === 'high') return 1;
    if (priority === 'medium') return 2;
    if (priority === 'low') return 3;
  }
  return 0; // default
};

const intPriorityToText = (priority: number | undefined): string => {
  if (priority === 1) return 'high';
  if (priority === 2) return 'medium';
  if (priority === 3) return 'low';
  return 'medium'; // default
};

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
    const category = searchParams.get('category');
    const groupIdParam = searchParams.get('groupId');
    
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
    
    // Build query - use tasks table instead of todos
    // For group view: show ALL tasks for the group (any user in the group can see them)
    // For self view: show ONLY the current user's personal tasks
    let query = supabase
      .from('tasks')
      .select('*');

    // CRITICAL: Filter by groupId FIRST to ensure proper data isolation
    // If groupId is provided (group view), show ALL that group's todos (regardless of creator)
    // If groupId is null (self view), ONLY show personal todos (group_id IS NULL) for current user
    if (groupId) {
      // Group view: Show ALL todos for this specific group (NO user_id filter)
      query = query.eq('group_id', groupId);
    } else {
      // Self view: Filter by user_id AND group_id IS NULL
      query = query.eq('user_id', session.user.id).is('group_id', null);
    }

    // Filter by category if provided (map category to type)
    if (category && category !== 'all') {
      query = query.eq('type', categoryToType(category));
    }

    // Order by created date (newest first)
    query = query.order('created_at', { ascending: false });

    const { data: todos, error } = await query;

    // If table doesn't exist yet, return empty array (graceful degradation)
    if (error) {
      // Check if it's a "relation does not exist" error (PostgreSQL error code 42P01)
      // Also check for PGRST116 which is PostgREST's "relation does not exist" error
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
    // Map type back to category for backward compatibility
    const todosWithDates = todos?.map(task => ({
      id: task.id,
      title: task.title || task.text,
      description: task.description,
      completed: task.completed,
      category: typeToCategory(task.type), // Map type to category for API compatibility
      priority: intPriorityToText(task.priority), // Convert integer priority to text
      userId: task.user_id,
      groupId: task.group_id,
      projectId: task.project_id,
      dueDate: task.due_date ? new Date(task.due_date) : undefined,
      createdAt: new Date(task.created_at),
      updatedAt: new Date(task.updated_at),
    })) || [];

    return NextResponse.json(todosWithDates);
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
    const { title, description, category, priority, completed, groupId, projectId, dueDate } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Use server client (bypasses RLS)
    const supabase = getSupabaseServerClient();
    
    // CRITICAL: Normalize groupId for proper data isolation
    // Treat empty string, null, or undefined as null (self view)
    const normalizedGroupId = groupId && groupId.trim() !== '' ? groupId : null;
    
    // If category is 'group', groupId must be provided
    if (category === 'group' && !normalizedGroupId) {
      return NextResponse.json({ error: 'groupId is required for group todos' }, { status: 400 });
    }

    // Verify user has access to group if groupId is provided
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
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .eq('user_id', session.user.id)
        .single();

      if (!project) {
        return NextResponse.json({ error: 'Forbidden: Project not found or access denied' }, { status: 403 });
      }
    }

    const now = new Date().toISOString();
    // Convert category to type and priority text to integer
    const newTask = {
      title,
      text: title, // Also set text for compatibility
      description: description || null,
      type: categoryToType(category || 'personal'), // Map category to type
      priority: textPriorityToInt(priority || 'medium'), // Convert text priority to integer
      completed: completed || false,
      completed_at: completed ? now : null,
      user_id: session.user.id,
      // CRITICAL: Set group_id based on provided groupId (null for self view, groupId for group view)
      // This ensures proper data isolation
      group_id: normalizedGroupId,
      project_id: projectId || null,
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
      timezone: 'America/New_York', // Default timezone
      created_at: now,
      updated_at: now,
    };

    const { data: todo, error } = await supabase
      .from('tasks')
      .insert(newTask)
      .select()
      .single();

    if (error) {
      // If table doesn't exist, return a helpful error
      if (error.code === '42P01' || error.message?.includes('does not exist') || error.message?.includes('relation') || error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Tasks table does not exist. Please create the tasks table in your database.' },
          { status: 503 }
        );
      }
      // Return more detailed error information
      return NextResponse.json(
        { error: error.message || 'Failed to create todo', code: error.code },
        { status: 400 }
      );
    }

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

    return NextResponse.json(todoWithDates, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
