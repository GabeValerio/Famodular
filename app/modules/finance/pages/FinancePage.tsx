"use client";

import { useFinance } from '../hooks/useFinance';
import { FinanceComponent } from '../components/FinanceComponent';

export function FinancePage({ groupId }: { groupId: string }) {
  const {
    funds,
    loading,
    error,
    updateFund,
  } = useFinance(groupId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading finance data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-destructive">Error: {error}</div>
      </div>
    );
  }

  return (
    <FinanceComponent
      funds={funds}
      onUpdateFund={updateFund}
    />
  );
}
