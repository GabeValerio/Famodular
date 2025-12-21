"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Wallet, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useFinance } from '../hooks/useFinance';
import { DashboardWidgetProps } from '@/app/modules/shared/types/dashboard';
import { formatCurrency, calculateMonthlyRecurring } from '../utils';

export function FinanceWidget({ groupId }: DashboardWidgetProps) {
  const { funds, subscriptions, loading } = useFinance(groupId);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Finance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  const totalSavings = funds.reduce((acc, fund) => acc + fund.currentAmount, 0);
  const monthlySubs = calculateMonthlyRecurring(subscriptions);

  return (
    <Link href="/dashboard/finance" className="block">
      <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Finance
          </CardTitle>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div>
              <div className="text-2xl font-bold">{formatCurrency(totalSavings)}</div>
              <p className="text-xs text-muted-foreground">Total Savings</p>
            </div>
            <div>
              <div className="text-lg font-semibold">{formatCurrency(monthlySubs)}</div>
              <p className="text-xs text-muted-foreground">Monthly Subscriptions</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
