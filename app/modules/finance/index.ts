// Public API
export { FinancePage } from './pages/FinancePage';
export { FinanceComponent } from './components/FinanceComponent';
export { useFinance } from './hooks/useFinance';
export type { Fund, Subscription, FinanceSummary } from './types';
export { financeService } from './services/financeService';
export { calculateFundProgress, calculateMonthlyRecurring, calculateYearlyRecurring, formatCurrency } from './utils';

// Register dashboard widgets
import './widgets';
