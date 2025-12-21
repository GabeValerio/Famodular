// Module-specific types for Finance
import { Fund, Subscription } from '@/types/family';

export type { Fund, Subscription };

export interface FinanceSummary {
  totalFunds: number;
  totalSubscriptions: number;
  monthlyRecurring: number;
  yearlyRecurring: number;
}
