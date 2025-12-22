export interface Task {
  id: string;
  text?: string;
  title?: string;
  completed?: boolean;
  completedAt?: string | Date | null;
  completed_at?: string | Date | null; // Support both formats for compatibility
  type?: string;
  goalId?: string;
  goal_id?: string; // Support both formats
  parentId?: string | null;
  parent_id?: string | null; // Support both formats
  createdAt?: string | Date;
  created_at?: string | Date; // Support both formats
  priority?: number;
  dueDate?: string | Date | null;
  due_date?: string | Date | null; // Support both formats
  endDate?: string | Date | null;
  end_date?: string | Date | null; // Support both formats
  datetime?: Date;
  children?: Task[];
  exception?: boolean;
  estimatedTime?: number | null;
  estimated_time?: number | null; // Support both formats
  completedTime?: number | null;
  completed_time?: number | null; // Support both formats
  description?: string;
  timezone?: string;
  isRecurring?: boolean;
  is_recurring?: boolean; // Support both formats
  recurrencePattern?: string;
  recurrence_pattern?: string; // Support both formats
  recurrenceInterval?: number;
  recurrence_interval?: number; // Support both formats
  recurrenceDayOfWeek?: number[];
  recurrence_day_of_week?: number[]; // Support both formats
  recurrenceDayOfMonth?: number[];
  recurrence_day_of_month?: number[]; // Support both formats
  recurrenceMonth?: number[];
  recurrence_month?: number[]; // Support both formats
  recurrenceEndDate?: string | null;
  recurrence_end_date?: string | null; // Support both formats
  recurrenceCount?: number | null;
  recurrence_count?: number | null; // Support both formats
  originalTaskId?: string | null;
  original_task_id?: string | null; // Support both formats
  endTime?: string;
  end_time?: string; // Support both formats
  imageUrl?: string | null;
  image_url?: string | null; // Support both formats
  scheduledTime?: string;
  scheduled_time?: string; // Support both formats
  userId?: string;
  groupId?: string | null;
  projectId?: string | null;
  updatedAt?: string | Date;
  recurring?: boolean;
  recurring_pattern?: string;
  recurring_end_date?: string;
  recurring_timezone?: string;
  recurring_days?: string[];
  recurring_hours?: number[];
  recurring_duration?: number;
  recurring_interval?: number;
  recurring_count?: number;
  recurring_until?: string;
  recurring_exceptions?: string[];
  recurring_inclusions?: string[];
  recurring_timezone_offset?: number;
  recurring_timezone_name?: string;
  recurring_timezone_abbr?: string;
  recurring_timezone_utc_offset?: string;
  recurring_timezone_dst_offset?: string;
  recurring_timezone_dst_abbr?: string;
  recurring_timezone_dst_name?: string;
  recurring_timezone_dst_start?: string;
  recurring_timezone_dst_end?: string;
  recurring_timezone_dst_next?: string;
  recurring_timezone_dst_prev?: string;
  recurring_timezone_dst_active?: boolean;
  recurring_timezone_dst_transition?: boolean;
  recurring_timezone_dst_transition_time?: string;
  recurring_timezone_dst_transition_type?: string;
  recurring_timezone_dst_transition_offset?: string;
  recurring_timezone_dst_transition_abbr?: string;
  recurring_timezone_dst_transition_name?: string;
  recurring_timezone_dst_transition_start?: string;
  recurring_timezone_dst_transition_end?: string;
  recurring_timezone_dst_transition_next?: string;
  recurring_timezone_dst_transition_prev?: string;
  recurring_timezone_dst_transition_transition?: boolean;
  recurring_timezone_dst_transition_transition_time?: string;
  recurring_timezone_dst_transition_transition_type?: string;
  recurring_timezone_dst_transition_transition_offset?: string;
  recurring_timezone_dst_transition_transition_abbr?: string;
  recurring_timezone_dst_transition_transition_name?: string;
  recurring_timezone_dst_transition_transition_start?: string;
  recurring_timezone_dst_transition_transition_end?: string;
  recurring_timezone_dst_transition_transition_next?: string;
  recurring_timezone_dst_transition_transition_prev?: string;
  recurring_timezone_dst_transition_transition_active?: boolean;
}

export interface Goal {
  id: string;
  text: string;
  goal?: string;
  progress?: number;
  created_at?: string;
}

export interface TaskCompletion {
  id: string;
  task_id: string;
  user_id: string;
  completion_date: string;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewTaskForm {
  title: string;
  description: string;
  date: string;
  end_date: string;
  time: string;
  end_time: string;
  timezone: string;
  type: string;
  goal_id: string | null;
  parent_id: string | null;
  // Recurring task properties
  is_recurring: boolean;
  recurrence_pattern: string;
  recurrence_interval: number;
  recurrence_day_of_week: number[];
  recurrence_day_of_month: number[];
  recurrence_month: number[];
  recurrence_end_type: 'never' | 'on_date' | 'after_occurrences';
  recurrence_end_date: string;
  recurrence_count: number;
  image_url?: string | null;
}
