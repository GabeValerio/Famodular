'use client';

import { useGroup } from '@/lib/GroupContext';
import { TimeTracker } from '../components/TimeTracker';

export function TimeTrackerPage() {
  const { currentGroup } = useGroup();

  return (
    <div className="w-full py-4">
      <div className="w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Time Tracking</h1>
          <p className="text-muted-foreground">
            Track your time spent on {currentGroup?.name || 'your'} projects
          </p>
        </div>

        <TimeTracker groupId={currentGroup?.id} />
      </div>
    </div>
  );
}


