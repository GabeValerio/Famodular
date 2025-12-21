"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { HeartHandshake } from 'lucide-react';
import { useCheckIns } from '../hooks/useCheckIns';
import { DashboardWidgetProps } from '@/app/modules/shared/types/dashboard';
import { ShareFeelingForm } from '../components/ShareFeelingForm';

export function ShareFeelingWidget({ groupId }: DashboardWidgetProps) {
  const { checkIns, members, loading, addCheckIn, refreshCheckIns } = useCheckIns(groupId);

  // Get current user (first member as fallback)
  const currentUser = members[0] || { id: '', name: '', avatar: '', role: 'Parent' as const };
  
  // Get most recent check-in
  const mostRecent = checkIns.length > 0 ? checkIns[0] : null;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <HeartHandshake className="h-4 w-4" />
            Share how you're feeling
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <HeartHandshake className="h-4 w-4" />
          Share how you're feeling
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ShareFeelingForm
          currentUser={currentUser}
          groupId={groupId}
          onAddCheckIn={addCheckIn}
          variant="compact"
          showRecentCheckIn={true}
          recentCheckIn={mostRecent}
          onSuccess={refreshCheckIns}
        />
      </CardContent>
    </Card>
  );
}
