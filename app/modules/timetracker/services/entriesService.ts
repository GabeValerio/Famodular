import { TimeTrackerEntry, CreateEntryInput, UpdateEntryInput } from '../types';

const API_BASE = '/api/modules/user/timetracker';

export class EntriesService {
  static async getEntries(
    groupId?: string,
    projectId?: string,
    startDate?: string,
    endDate?: string
  ): Promise<TimeTrackerEntry[]> {
    const params = new URLSearchParams();
    if (groupId) params.set('groupId', groupId);
    if (projectId) params.set('projectId', projectId);
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);

    const response = await fetch(`${API_BASE}/entries?${params}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch entries');
    }
    return response.json();
  }

  static async createEntry(entry: CreateEntryInput): Promise<TimeTrackerEntry> {
    const response = await fetch(`${API_BASE}/entries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(entry),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create entry');
    }
    return response.json();
  }

  static async updateEntry(id: string, entry: UpdateEntryInput): Promise<TimeTrackerEntry> {
    const response = await fetch(`${API_BASE}/entries/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(entry),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update entry');
    }
    return response.json();
  }

  static async deleteEntry(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/entries/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete entry');
    }
  }
}

