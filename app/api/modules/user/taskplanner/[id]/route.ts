import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabaseClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseServerClient();

    // Fetch task
    const { data: task, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', session.user.id)
      .single();

    if (error || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
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

    return NextResponse.json(taskWithDates);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const supabase = getSupabaseServerClient();

    // Verify task belongs to user
    const { data: existingTask } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', session.user.id)
      .single();

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Build update object from body, converting camelCase to snake_case
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (body.title !== undefined) updateData.title = body.title;
    if (body.text !== undefined) updateData.text = body.text;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.completed !== undefined) {
      updateData.completed = body.completed;
      updateData.completed_at = body.completed ? new Date().toISOString() : null;
    }
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.dueDate !== undefined) updateData.due_date = body.dueDate ? new Date(body.dueDate).toISOString() : null;
    if (body.endDate !== undefined) updateData.end_date = body.endDate ? new Date(body.endDate).toISOString() : null;
    if (body.timezone !== undefined) updateData.timezone = body.timezone;
    if (body.scheduledTime !== undefined) updateData.scheduled_time = body.scheduledTime;
    if (body.endTime !== undefined) updateData.end_time = body.endTime;
    if (body.estimatedTime !== undefined) updateData.estimated_time = body.estimatedTime;
    if (body.completedTime !== undefined) updateData.completed_time = body.completedTime;
    if (body.goalId !== undefined) updateData.goal_id = body.goalId;
    if (body.parentId !== undefined) updateData.parent_id = body.parentId;
    if (body.projectId !== undefined) updateData.project_id = body.projectId;
    if (body.isRecurring !== undefined) updateData.is_recurring = body.isRecurring;
    if (body.recurrencePattern !== undefined) updateData.recurrence_pattern = body.recurrencePattern;
    if (body.recurrenceInterval !== undefined) updateData.recurrence_interval = body.recurrenceInterval;
    if (body.recurrenceDayOfWeek !== undefined) updateData.recurrence_day_of_week = body.recurrenceDayOfWeek;
    if (body.recurrenceDayOfMonth !== undefined) updateData.recurrence_day_of_month = body.recurrenceDayOfMonth;
    if (body.recurrenceMonth !== undefined) updateData.recurrence_month = body.recurrenceMonth;
    if (body.recurrenceEndDate !== undefined) updateData.recurrence_end_date = body.recurrenceEndDate;
    if (body.recurrenceCount !== undefined) updateData.recurrence_count = body.recurrenceCount;
    if (body.imageUrl !== undefined) updateData.image_url = body.imageUrl;

    const { data: task, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', params.id)
      .eq('user_id', session.user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Failed to update task', code: error.code },
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

    return NextResponse.json(taskWithDates);
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

    const supabase = getSupabaseServerClient();

    // Verify task belongs to user
    const { data: existingTask } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', session.user.id)
      .single();

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', params.id)
      .eq('user_id', session.user.id);

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Failed to delete task', code: error.code },
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

