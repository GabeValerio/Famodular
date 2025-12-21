import { useState, useEffect } from 'react';
import { locationService } from '../services/locationService';
import { FamilyMember, Location } from '../types';

export function useLocation(groupId: string) {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (groupId) {
      loadData();
    }
  }, [groupId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      // TODO: Load members with locations from API
      // const locations = await locationService.getLocations(groupId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load locations');
    } finally {
      setLoading(false);
    }
  };

  const updateLocation = async (memberId: string, location: Location) => {
    try {
      await locationService.updateLocation(memberId, groupId, location);
      setMembers(prev => prev.map(m => 
        m.id === memberId ? { ...m, location } : m
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update location');
      throw err;
    }
  };

  return {
    members,
    loading,
    error,
    updateLocation,
    refresh: loadData,
  };
}
