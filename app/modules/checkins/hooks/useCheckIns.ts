import { useState, useEffect } from 'react';
import { checkInsService } from '../services/checkInsService';
import { CheckIn, Question, FamilyMember } from '../types';

export function useCheckIns(groupId: string) {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial data
  useEffect(() => {
    if (groupId) {
      loadData();
    }
  }, [groupId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [checkInsData, membersData, questionsData] = await Promise.all([
        checkInsService.getCheckIns(groupId),
        checkInsService.getMembers(groupId),
        checkInsService.getQuestions(groupId),
      ]);
      setCheckIns(checkInsData);
      setMembers(membersData);
      setQuestions(questionsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load check-ins');
    } finally {
      setLoading(false);
    }
  };

  const addCheckIn = async (checkIn: Omit<CheckIn, 'id' | 'timestamp'>) => {
    try {
      const newCheckIn = await checkInsService.createCheckIn(checkIn);
      setCheckIns(prev => [newCheckIn, ...prev]);
      return newCheckIn;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add check-in');
      throw err;
    }
  };


  return {
    checkIns,
    members,
    questions,
    loading,
    error,
    addCheckIn,
    refreshCheckIns: loadData,
  };
}
