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
      console.error('Session user ID is missing');
      return NextResponse.json({ error: 'User ID not found in session' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const groupIdParam = searchParams.get('groupId');
    
    // Normalize groupId: treat empty string, null, or undefined as null
    const groupId = groupIdParam && groupIdParam.trim() !== '' ? groupIdParam : null;

    // Use server client (bypasses RLS)
    const supabase = getSupabaseServerClient();
    
    // Build query
    let query = supabase
      .from('todos')
      .select('*')
      .eq('user_id', session.user.id);

    // Filter by category if provided
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    // CRITICAL: Filter by groupId to ensure data isolation
    // If groupId is provided (group view), ONLY show that group's todos
    // If groupId is null (self view), ONLY show personal todos (group_id IS NULL)
    if (groupId) {
      // Group view: ONLY show todos for this specific group
      query = query.eq('group_id', groupId);
    } else {
      // Self view: ONLY show personal/work todos (group_id IS NULL)
      // This ensures group todos are NEVER shown in self view
      query = query.is('group_id', null);
    }

    // Order by created date (newest first)
    query = query.order('created_at', { ascending: false });

    const { data: todos, error } = await query;

    // If table doesn't exist yet, return empty array (graceful degradation)
    if (error) {
      console.error('Supabase query error:', error);
      // Check if it's a "relation does not exist" error (PostgreSQL error code 42P01)
      // Also check for PGRST116 which is PostgREST's "relation does not exist" error
      if (
        error.code === '42P01' || 
        error.code === 'PGRST116' ||
        error.message?.includes('does not exist') ||
        error.message?.includes('relation') ||
        error.message?.includes('Could not find a relationship')
      ) {
        console.warn('Todos table does not exist, returning empty array');
        return NextResponse.json([]);
      }
      throw error;
    }

    // Convert date strings to Date objects and map snake_case to camelCase
    const todosWithDates = todos?.map(todo => ({
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
    })) || [];

    return NextResponse.json(todosWithDates);
  } catch (error) {
    console.error('Todos API Error:', error);
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
    const newTodo = {
      title,
      description: description || null,
      category,
      priority: priority || 'medium',
      completed: completed || false,
      user_id: session.user.id,
      // CRITICAL: Set group_id based on provided groupId (null for self view, groupId for group view)
      // This ensures proper data isolation
      group_id: normalizedGroupId,
      project_id: projectId || null,
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
      created_at: now,
      updated_at: now,
    };

    const { data: todo, error } = await supabase
      .from('todos')
      .insert(newTodo)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      // If table doesn't exist, return a helpful error
      if (error.code === '42P01' || error.message?.includes('does not exist') || error.message?.includes('relation') || error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Todos table does not exist. Please create the todos table in your database. See docs/TODOS_MODULE_SCHEMA.md for the SQL schema.' },
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

    return NextResponse.json(todoWithDates, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
