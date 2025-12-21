import { Location } from '../types';

const API_BASE = '/api/modules/group/location';

export const locationService = {
  async getLocations(groupId: string): Promise<Location[]> {
    const response = await fetch(`${API_BASE}?groupId=${groupId}`);
    if (!response.ok) throw new Error('Failed to fetch locations');
    return response.json();
  },

  async updateLocation(memberId: string, groupId: string, location: Location): Promise<Location> {
    const response = await fetch(`${API_BASE}/${memberId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupId, ...location }),
    });
    if (!response.ok) throw new Error('Failed to update location');
    return response.json();
  },
};
