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
    const completed = searchParams.get('completed');
    const type = searchParams.get('type');
    const goalId = searchParams.get('goalId');
    const parentId = searchParams.get('parentId');
    
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
    
    // Build query
    // For group view: show ALL tasks for the group (any user in the group can see them)
    // For self view: show ONLY the current user's personal tasks
    let query = supabase
      .from('tasks')
      .select('*');

    // Filter by user_id only in self view (personal tasks)
    if (!groupId) {
      query = query.eq('user_id', session.user.id);
    }

    // Filter by completion status if provided
    if (completed !== null) {
      query = query.eq('completed', completed === 'true');
    }

    // Filter by type if provided
    if (type && type !== 'all') {
      query = query.eq('type', type);
    }

    // Filter by goal_id if provided
    if (goalId) {
      query = query.eq('goal_id', goalId);
    }

    // Filter by parent_id if provided
    if (parentId) {
      query = query.eq('parent_id', parentId);
    }

    // CRITICAL: Filter by groupId to ensure data isolation
    if (groupId) {
      // Group view: Show ALL tasks for this specific group (regardless of creator)
      query = query.eq('group_id', groupId);
    } else {
      // Self view: ONLY show personal tasks (group_id IS NULL) for current user
      query = query.is('group_id', null);
    }

    // Order by priority ascending (1 first), then by due_date, then by created_at
    query = query.order('priority', { ascending: true, nullsLast: true })
                 .order('due_date', { ascending: true, nullsLast: true })
                 .order('created_at', { ascending: false });

    const { data: tasks, error } = await query;

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
    const tasksWithDates = tasks?.map(task => ({
      id: task.id,
      text: task.text || task.title,
      title: task.title || task.text,
      description: task.description,
      type: task.type,
      completed: task.completed,
      completedAt: task.completed_at ? new Date(task.completed_at) : null,
      priority: task.priority || 0,
      dueDate: task.due_date ? new Date(task.due_date) : null,
      endDate: task.end_date ? new Date(task.end_date) : null,
      timezone: task.timezone || 'America/New_York',
      scheduledTime: task.scheduled_time,
      endTime: task.end_time,
      estimatedTime: task.estimated_time,
      completedTime: task.completed_time,
      goalId: task.goal_id,
      parentId: task.parent_id,
      projectId: task.project_id,
      isRecurring: task.is_recurring || false,
      recurrencePattern: task.recurrence_pattern,
      recurrenceInterval: task.recurrence_interval || 1,
      recurrenceDayOfWeek: task.recurrence_day_of_week || [],
      recurrenceDayOfMonth: task.recurrence_day_of_month || [],
      recurrenceMonth: task.recurrence_month || [],
      recurrenceEndDate: task.recurrence_end_date,
      recurrenceCount: task.recurrence_count,
      originalTaskId: task.original_task_id,
      exception: task.exception || false,
      imageUrl: task.image_url,
      userId: task.user_id,
      groupId: task.group_id,
      createdAt: new Date(task.created_at),
      updatedAt: new Date(task.updated_at),
    })) || [];

    return NextResponse.json(tasksWithDates);
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
    const { 
      title, 
      text, 
      description, 
      type, 
      completed, 
      groupId, 
      goalId,
      parentId,
      projectId,
      dueDate,
      endDate,
      timezone,
      scheduledTime,
      endTime,
      priority,
      estimatedTime,
      completedTime,
      isRecurring,
      recurrencePattern,
      recurrenceInterval,
      recurrenceDayOfWeek,
      recurrenceDayOfMonth,
      recurrenceMonth,
      recurrenceEndDate,
      recurrenceCount,
      imageUrl
    } = body;

    if (!title && !text) {
      return NextResponse.json({ error: 'Title or text is required' }, { status: 400 });
    }

    // Use server client (bypasses RLS)
    const supabase = getSupabaseServerClient();
    
    // CRITICAL: Normalize groupId for proper data isolation
    const normalizedGroupId = groupId && groupId.trim() !== '' ? groupId : null;

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

    // Verify parent task belongs to user if parentId is provided
    if (parentId) {
      const { data: parentTask } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', parentId)
        .eq('user_id', session.user.id)
        .single();

      if (!parentTask) {
        return NextResponse.json({ error: 'Forbidden: Parent task not found or access denied' }, { status: 403 });
      }
    }

    // Verify goal belongs to user/group if goalId is provided
    if (goalId) {
      const { data: goal } = await supabase
        .from('goals')
        .select('*')
        .eq('id', goalId)
        .single();

      if (!goal) {
        return NextResponse.json({ error: 'Forbidden: Goal not found' }, { status: 403 });
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
    const newTask = {
      title: title || text,
      text: text || title,
      description: description || null,
      type: type || 'personal',
      completed: completed || false,
      completed_at: completed ? now : null,
      priority: priority !== undefined ? priority : 0,
      user_id: session.user.id,
      group_id: normalizedGroupId,
      goal_id: goalId || null,
      parent_id: parentId || null,
      project_id: projectId || null,
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
      end_date: endDate ? new Date(endDate).toISOString() : null,
      timezone: timezone || 'America/New_York',
      scheduled_time: scheduledTime || null,
      end_time: endTime || null,
      estimated_time: estimatedTime || null,
      completed_time: completedTime || null,
      is_recurring: isRecurring || false,
      recurrence_pattern: recurrencePattern || null,
      recurrence_interval: recurrenceInterval || 1,
      recurrence_day_of_week: recurrenceDayOfWeek || null,
      recurrence_day_of_month: recurrenceDayOfMonth || null,
      recurrence_month: recurrenceMonth || null,
      recurrence_end_date: recurrenceEndDate || null,
      recurrence_count: recurrenceCount || null,
      image_url: imageUrl || null,
      created_at: now,
      updated_at: now,
    };

    const { data: task, error } = await supabase
      .from('tasks')
      .insert(newTask)
      .select()
      .single();

    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist') || error.message?.includes('relation') || error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Tasks table does not exist. Please create the tasks table in your database.' },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { error: error.message || 'Failed to create task', code: error.code },
        { status: 400 }
      );
    }

    // Convert to camelCase
    const taskWithDates = {
      id: task.id,
      text: task.text || task.title,
      title: task.title || task.text,
      description: task.description,
      type: task.type,
      completed: task.completed,
      completedAt: task.completed_at ? new Date(task.completed_at) : null,
      priority: task.priority || 0,
      dueDate: task.due_date ? new Date(task.due_date) : undefined,
      endDate: task.end_date ? new Date(task.end_date) : undefined,
      timezone: task.timezone || 'America/New_York',
      scheduledTime: task.scheduled_time,
      endTime: task.end_time,
      estimatedTime: task.estimated_time,
      completedTime: task.completed_time,
      goalId: task.goal_id,
      parentId: task.parent_id,
      projectId: task.project_id,
      isRecurring: task.is_recurring || false,
      recurrencePattern: task.recurrence_pattern,
      recurrenceInterval: task.recurrence_interval || 1,
      recurrenceDayOfWeek: task.recurrence_day_of_week || [],
      recurrenceDayOfMonth: task.recurrence_day_of_month || [],
      recurrenceMonth: task.recurrence_month || [],
      recurrenceEndDate: task.recurrence_end_date,
      recurrenceCount: task.recurrence_count,
      originalTaskId: task.original_task_id,
      exception: task.exception || false,
      imageUrl: task.image_url,
      userId: task.user_id,
      groupId: task.group_id,
      createdAt: new Date(task.created_at),
      updatedAt: new Date(task.updated_at),
    };

    return NextResponse.json(taskWithDates, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

