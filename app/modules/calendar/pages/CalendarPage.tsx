"use client";

import { useCalendar } from '../hooks/useCalendar';
import { CalendarComponent } from '../components/CalendarComponent';

export function CalendarPage({ groupId }: { groupId: string }) {
  const {
    events,
    members,
    loading,
    error,
    addEvent,
    updateEvent,
    deleteEvent,
  } = useCalendar(groupId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading calendar...</div>
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
    <CalendarComponent
      events={events}
      members={members}
      onAddEvent={addEvent}
      onUpdateEvent={updateEvent}
      onDeleteEvent={deleteEvent}
    />
  );
}
