// Public API
export { GoalsPage } from './pages/GoalsPage';
export { GoalsComponent } from './components/GoalsComponent';
export { useGoals } from './hooks/useGoals';
export type { Goal, FamilyMember, GoalProgress, Milestone } from './types';
export { goalsService } from './services/goalsService';

// Register dashboard widgets
import './widgets';
