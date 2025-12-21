"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Target, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useGoals } from '../hooks/useGoals';
import { DashboardWidgetProps } from '@/app/modules/shared/types/dashboard';

export function GoalsWidget({ groupId }: DashboardWidgetProps) {
  const { goals, loading } = useGoals(groupId);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Target className="h-4 w-4" />
            Goals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  const activeGoals = goals.filter(g => g.progress < 100);
  const avgProgress = goals.length > 0
    ? Math.round(goals.reduce((acc, g) => acc + g.progress, 0) / goals.length)
    : 0;

  return (
    <Link href="/dashboard/goals" className="block">
      <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Target className="h-4 w-4" />
            Goals
          </CardTitle>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeGoals.length}</div>
          <p className="text-xs text-muted-foreground">
            Active goals • {avgProgress}% avg progress
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
