"use client";

import { useCalendar } from '../hooks/useCalendar';
import { CalendarComponent } from '../components/CalendarComponent';
import { CalendarEvent } from '../types';

export function CalendarPage({ groupId }: { groupId: string }) {
  const {
    events,
    members,
    loading,
    error,
    addEvent: addEventRaw,
    updateEvent: updateEventRaw,
    deleteEvent,
  } = useCalendar(groupId);

  // Wrap to match component prop types (Promise<void>)
  const addEvent = async (event: Omit<CalendarEvent, 'id'>) => {
    await addEventRaw(event);
  };
  
  const updateEvent = async (event: CalendarEvent) => {
    await updateEventRaw(event);
  };

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
