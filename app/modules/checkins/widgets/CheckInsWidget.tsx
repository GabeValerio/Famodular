"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { HeartHandshake, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useCheckIns } from '../hooks/useCheckIns';
import { DashboardWidgetProps } from '@/app/modules/shared/types/dashboard';
import { formatRelativeTime } from '@/app/modules/shared/utils';

export function CheckInsWidget({ groupId }: DashboardWidgetProps) {
  const { checkIns, loading } = useCheckIns(groupId);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <HeartHandshake className="h-4 w-4" />
            Check-ins
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  const recentCheckIns = checkIns.slice(0, 3);
  const totalCheckIns = checkIns.length;

  return (
    <Link href="/dashboard/checkins" className="block">
      <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <HeartHandshake className="h-4 w-4" />
            Check-ins
          </CardTitle>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalCheckIns}</div>
          <p className="text-xs text-muted-foreground mb-3">
            Total check-ins
          </p>
          {recentCheckIns.length > 0 && (
            <div className="space-y-2">
              {recentCheckIns.map((checkIn) => (
                <div key={checkIn.id} className="text-xs text-muted-foreground">
                  {formatRelativeTime(checkIn.timestamp)}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
