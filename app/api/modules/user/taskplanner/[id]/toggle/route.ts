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

    const supabase = getSupabaseServerClient();

    // Fetch current task
    const { data: task, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', session.user.id)
      .single();

    if (fetchError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Toggle completion status
    const newCompletedStatus = !task.completed;
    const now = new Date().toISOString();

    const { data: updatedTask, error: updateError } = await supabase
      .from('tasks')
      .update({
        completed: newCompletedStatus,
        completed_at: newCompletedStatus ? now : null,
        updated_at: now,
      })
      .eq('id', params.id)
      .eq('user_id', session.user.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message || 'Failed to toggle task', code: updateError.code },
        { status: 400 }
      );
    }

    // Convert to camelCase
    const taskWithDates = {
      id: updatedTask.id,
      text: updatedTask.text || updatedTask.title,
      title: updatedTask.title || updatedTask.text,
      description: updatedTask.description,
      type: updatedTask.type,
      completed: updatedTask.completed,
      completedAt: updatedTask.completed_at ? new Date(updatedTask.completed_at) : null,
      priority: updatedTask.priority || 0,
      dueDate: updatedTask.due_date ? new Date(updatedTask.due_date) : undefined,
      endDate: updatedTask.end_date ? new Date(updatedTask.end_date) : undefined,
      timezone: updatedTask.timezone || 'America/New_York',
      scheduledTime: updatedTask.scheduled_time,
      endTime: updatedTask.end_time,
      estimatedTime: updatedTask.estimated_time,
      completedTime: updatedTask.completed_time,
      goalId: updatedTask.goal_id,
      parentId: updatedTask.parent_id,
      projectId: updatedTask.project_id,
      isRecurring: updatedTask.is_recurring || false,
      recurrencePattern: updatedTask.recurrence_pattern,
      recurrenceInterval: updatedTask.recurrence_interval || 1,
      recurrenceDayOfWeek: updatedTask.recurrence_day_of_week || [],
      recurrenceDayOfMonth: updatedTask.recurrence_day_of_month || [],
      recurrenceMonth: updatedTask.recurrence_month || [],
      recurrenceEndDate: updatedTask.recurrence_end_date,
      recurrenceCount: updatedTask.recurrence_count,
      originalTaskId: updatedTask.original_task_id,
      exception: updatedTask.exception || false,
      imageUrl: updatedTask.image_url,
      userId: updatedTask.user_id,
      groupId: updatedTask.group_id,
      createdAt: new Date(updatedTask.created_at),
      updatedAt: new Date(updatedTask.updated_at),
    };

    return NextResponse.json(taskWithDates);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

