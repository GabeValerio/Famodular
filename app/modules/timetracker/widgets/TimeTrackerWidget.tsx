'use client';

import { useTimeTracker } from '../hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Clock, Play, Square, Timer } from 'lucide-react';
import Link from 'next/link';

interface TimeTrackerWidgetProps {
  groupId?: string;
}

export function TimeTrackerWidget({ groupId }: TimeTrackerWidgetProps) {
  const {
    trackingState,
    calculateElapsedTime,
    formatDurationWithSeconds,
    formatDuration,
    calculateStats,
    startTracking,
    stopTracking,
  } = useTimeTracker({ groupId });

  const stats = calculateStats();

  const handleStartTracking = async () => {
    await startTracking('', undefined); // Start with no description or project for quick tracking
  };

  const handleStopTracking = async () => {
    await stopTracking();
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4" />
            Time Tracker
          </div>
          <Link href="/dashboard/timetracker">
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </Link>
        </CardTitle>
        <CardDescription>
          Track your time and productivity
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Session */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-mono font-bold">
              {trackingState.isTracking
                ? formatDurationWithSeconds(calculateElapsedTime())
                : '00:00:00'
              }
            </div>
            <div className="text-xs text-muted-foreground">
              {trackingState.isTracking ? 'Tracking active' : 'Not tracking'}
            </div>
          </div>
          <div>
            {!trackingState.isTracking ? (
              <Button onClick={handleStartTracking} size="sm" className="flex items-center gap-1">
                <Play className="h-3 w-3" />
                Start
              </Button>
            ) : (
              <Button onClick={handleStopTracking} size="sm" variant="destructive" className="flex items-center gap-1">
                <Square className="h-3 w-3" />
                Stop
              </Button>
            )}
          </div>
        </div>

        {/* Today's Stats */}
        <div className="grid grid-cols-2 gap-2 text-center">
          <div>
            <div className="text-sm font-medium">{formatDuration(stats.totalMinutesToday)}</div>
            <div className="text-xs text-muted-foreground">Today</div>
          </div>
          <div>
            <div className="text-sm font-medium">{formatDuration(stats.totalMinutesThisWeek)}</div>
            <div className="text-xs text-muted-foreground">This Week</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
