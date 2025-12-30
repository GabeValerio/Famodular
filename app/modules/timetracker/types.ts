// Module-specific types for Time Tracker
export interface TimeTrackerProject {
  id: string;
  name: string;
  description?: string;
  color?: string; // Hex color for UI customization
  userId: string;
  groupId?: string; // NULL for personal projects, UUID for group projects
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeTrackerEntry {
  id: string;
  projectId?: string; // Optional - entries can be created without projects
  project?: TimeTrackerProject; // Populated when querying with project info
  userId: string;
  groupId?: string; // NULL for personal entries, UUID for group entries
  startTime: Date;
  endTime?: Date | null; // NULL if still tracking
  durationMinutes?: number | null; // Calculated duration in minutes (NULL if still tracking)
  description?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// API Input types
export type CreateProjectInput = Omit<TimeTrackerProject, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isActive'> & {
  userId?: string; // Optional, will be set by API
};

export type UpdateProjectInput = Partial<Omit<TimeTrackerProject, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isActive'>>;

export type CreateEntryInput = Omit<TimeTrackerEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isActive' | 'durationMinutes'> & {
  userId?: string; // Optional, will be set by API
};

export type UpdateEntryInput = Partial<Omit<TimeTrackerEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>;

// Statistics and chart data types
export interface TimeStats {
  totalMinutesToday: number;
  totalMinutesThisWeek: number;
  totalMinutesThisMonth: number;
  averageDailyMinutes: number;
}

export interface MonthlyChartData {
  month: string;
  hours: number;
  minutes: number;
}

// UI state types for the time tracker component
export interface TrackingState {
  isTracking: boolean;
  startTime: Date | null;
  currentTime: Date;
  description: string;
  selectedProjectId?: string;
}

// Form data for manual entry dialog
export interface ManualEntryFormData {
  projectId?: string;
  startDate: string;
  startTime: string;
  endDate?: string;
  endTime?: string;
  description?: string;
}

// Form data for project dialog
export interface ProjectFormData {
  name: string;
  description?: string;
  color?: string;
}
