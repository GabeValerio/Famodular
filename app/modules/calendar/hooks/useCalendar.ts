import { useState, useEffect } from 'react';
import { calendarService } from '../services/calendarService';
import { CalendarEvent, FamilyMember } from '../types';

export function useCalendar(groupId: string) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (groupId) {
      loadData();
    } else {
      setLoading(false);
      setEvents([]);
    }
  }, [groupId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const eventsData = await calendarService.getEvents(groupId);
      setEvents(eventsData);
      // TODO: Load members from a shared service
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const addEvent = async (event: Omit<CalendarEvent, 'id'>) => {
    try {
      const newEvent = await calendarService.createEvent(event);
      setEvents(prev => [...prev, newEvent]);
      return newEvent;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add event');
      throw err;
    }
  };

  const updateEvent = async (event: CalendarEvent) => {
    try {
      const updatedEvent = await calendarService.updateEvent(event);
      setEvents(prev => prev.map(e => e.id === event.id ? updatedEvent : e));
      return updatedEvent;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update event');
      throw err;
    }
  };

  const deleteEvent = async (eventId: string) => {
    try {
      await calendarService.deleteEvent(eventId);
      setEvents(prev => prev.filter(e => e.id !== eventId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete event');
      throw err;
    }
  };

  return {
    events,
    members,
    loading,
    error,
    addEvent,
    updateEvent,
    deleteEvent,
    refresh: loadData,
  };
}
