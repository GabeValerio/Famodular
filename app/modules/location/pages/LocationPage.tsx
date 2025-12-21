"use client";

import { useLocation } from '../hooks/useLocation';
import { LocationComponent } from '../components/LocationComponent';

export function LocationPage({ groupId }: { groupId: string }) {
  const {
    members,
    loading,
    error,
    updateLocation,
  } = useLocation(groupId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading locations...</div>
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

  // Get current user from members (in real app, get from session)
  const currentUser = members[0] || { id: '', name: '', avatar: '', role: 'Parent' as const };

  return (
    <LocationComponent
      members={members}
      currentUser={currentUser}
      onUpdateLocation={updateLocation}
    />
  );
}
