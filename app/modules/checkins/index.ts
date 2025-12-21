// Public API - only export what other modules/pages should use
export { CheckInsPage } from './pages/CheckInsPage';
export { CheckInsComponent } from './components/CheckInsComponent';
export { useCheckIns } from './hooks/useCheckIns';
export type { CheckIn, Question, FamilyMember, CheckInReaction } from './types';
export { checkInsService } from './services/checkInsService';
export { MOODS, getMoodConfig, formatCheckInTime } from './utils';

// Register dashboard widgets
import './widgets';
