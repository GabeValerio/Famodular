import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';
import { getSupabaseServerClient } from '@/lib/supabaseClient';
import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export interface ExtractedTask {
  title: string;
  description?: string;
  date?: string; // YYYY-MM-DD format
  end_date?: string; // YYYY-MM-DD format
  time?: string; // HH:MM format
  end_time?: string; // HH:MM format
  type?: string; // personal, group, finance, etc.
  goal_id?: string | null;
  parent_id?: string | null;
  priority?: 'low' | 'medium' | 'high';
  is_recurring?: boolean;
  recurrence_pattern?: string; // daily, weekly, monthly, yearly
  recurrence_interval?: number;
  recurrence_day_of_week?: number[];
  recurrence_day_of_month?: number[];
  recurrence_month?: number[];
  recurrence_end_type?: 'never' | 'on_date' | 'after_occurrences';
  recurrence_end_date?: string;
  recurrence_count?: number;
  image_url?: string | null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!session.user?.id) {
      return NextResponse.json({ error: 'User ID not found in session' }, { status: 401 });
    }

    // Use server client (bypasses RLS)
    const supabase = getSupabaseServerClient();

    // Verify the note exists and user has access
    const { data: note, error: fetchError } = await supabase
      .from('notepad_notes')
      .select('*')
      .eq('id', params.id)
      .single();

    if (fetchError || !note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Verify user has access (owner or group member)
    if (note.user_id !== session.user.id) {
      if (note.group_id) {
        const { data: groupMember } = await supabase
          .from('group_members')
          .select('*')
          .eq('group_id', note.group_id)
          .eq('user_id', session.user.id)
          .eq('is_active', true)
          .single();

        if (!groupMember) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      } else {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // If no API key, return mock data for development
    if (!apiKey || !ai) {
      // Mock extracted tasks for development
      const mockTasks: ExtractedTask[] = [
        {
          title: 'Follow up on project proposal',
          description: 'Review and respond to the proposal',
          priority: 'high',
          type: 'work',
          date: new Date().toISOString().split('T')[0],
        },
        {
          title: 'Schedule team meeting',
          priority: 'medium',
          type: 'group',
        },
      ];
      return NextResponse.json({ tasks: mockTasks });
    }

    // Extract tasks using Gemini AI
    const prompt = `Analyze the following note and extract actionable tasks. Return a JSON array of tasks with this exact structure:
[
  {
    "title": "Task title (required, concise)",
    "description": "Optional detailed description",
    "date": "YYYY-MM-DD" (optional, start date if mentioned),
    "end_date": "YYYY-MM-DD" (optional, end date for multi-day tasks),
    "time": "HH:MM" (optional, start time if mentioned, 24-hour format),
    "end_time": "HH:MM" (optional, end time if mentioned, 24-hour format),
    "type": "personal" | "group" | "finance" | "health" | "work" | "quick" | "shopping" | "other" (optional, default to "personal"),
    "priority": "low" | "medium" | "high" (optional, default to "medium"),
    "is_recurring": boolean (optional, true if task repeats),
    "recurrence_pattern": "daily" | "weekly" | "monthly" | "yearly" (optional, only if is_recurring is true),
    "recurrence_interval": number (optional, e.g., 1 for every day, 2 for every 2 days),
    "recurrence_day_of_week": [0-6] (optional array, 0=Sunday, only for weekly pattern),
    "recurrence_day_of_month": [1-31] (optional array, only for monthly/yearly patterns),
    "recurrence_month": [0-11] (optional array, 0=January, only for yearly pattern),
    "recurrence_end_type": "never" | "on_date" | "after_occurrences" (optional),
    "recurrence_end_date": "YYYY-MM-DD" (optional, only if recurrence_end_type is "on_date"),
    "recurrence_count": number (optional, only if recurrence_end_type is "after_occurrences")
  }
]

Guidelines:
- Only extract clear, actionable tasks (things that need to be done)
- Ignore general notes, ideas, or completed items
- If no tasks are found, return an empty array
- Keep task titles concise (under 100 characters)
- Only include date/time fields if specifically mentioned in the note
- Infer recurrence patterns from phrases like "every day", "weekly", "every Monday", "monthly on the 15th", etc.
- Use "personal" as default type unless context suggests otherwise (e.g., "team meeting" = "group", "pay bills" = "finance")

Note content:
${note.title}
${note.content}`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });

      const responseText = response.text || '[]';
      let tasks: ExtractedTask[] = [];

      try {
        tasks = JSON.parse(responseText);
        // Validate structure
        if (!Array.isArray(tasks)) {
          tasks = [];
        }
        // Filter out invalid tasks
        tasks = tasks.filter(
          (task) =>
            task &&
            typeof task === 'object' &&
            typeof task.title === 'string' &&
            task.title.trim().length > 0
        );
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        return NextResponse.json(
          { error: 'Failed to parse AI response' },
          { status: 500 }
        );
      }

      return NextResponse.json({ tasks });
    } catch (aiError) {
      console.error('AI service error:', aiError);
      return NextResponse.json(
        { error: 'Failed to extract tasks. Please try again.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error extracting tasks:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

