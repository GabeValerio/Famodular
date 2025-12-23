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

export const aiService = {
  async extractTasksFromNote(noteId: string): Promise<ExtractedTask[]> {
    const response = await fetch(`/api/modules/user/notepad/notes/${noteId}/extract-tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to extract tasks' }));
      throw new Error(errorData.error || 'Failed to extract tasks');
    }
    
    const data = await response.json();
    return data.tasks || [];
  },
};

