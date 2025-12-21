// Module-specific types for Goals
import { Goal, FamilyMember } from '@/types/family';

export type { Goal, FamilyMember };

export interface GoalProgress {
  goalId: string;
  progress: number;
  milestones: Milestone[];
}

export interface Milestone {
  id: string;
  goalId: string;
  title: string;
  completed: boolean;
  completedAt?: Date;
}
