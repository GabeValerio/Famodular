export interface Task {
  id: string;
  text?: string;
  title?: string;
  completed?: boolean;
  completed_at?: string | null;
  type?: string;
  goal_id?: string;
  parent_id?: string | null;
  created_at?: string;
  priority?: number;
  due_date?: string | null;
  end_date?: string | null;
  datetime?: Date;
  children?: Task[];
  exception?: boolean;
  estimated_time?: number | null;
  completed_time?: number | null;
  description?: string;
  timezone?: string;
  is_recurring?: boolean;
  recurrence_pattern?: string;
  recurrence_interval?: number;
  recurrence_day_of_week?: number[];
  recurrence_day_of_month?: number[];
  recurrence_month?: number[];
  recurrence_end_date?: string | null;
  recurrence_count?: number | null;
  original_task_id?: string | null;
  end_time?: string;
  image_url?: string | null;
  scheduled_time?: string;
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
