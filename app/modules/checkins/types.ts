// Module-specific types for CheckIns
import { CheckIn, Question, FamilyMember } from '@/types/family';

export type { CheckIn, Question, FamilyMember };

export interface CheckInReaction {
  id: string;
  checkInId: string;
  memberId: string;
  emoji: string;
  timestamp: Date;
}

export interface CheckInWithReactions extends CheckIn {
  reactions?: CheckInReaction[];
}
