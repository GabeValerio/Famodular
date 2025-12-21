import React, { useState } from 'react';
import { CheckIn, FamilyMember, Question } from '../types';
import { Sparkles, MessageCircle } from 'lucide-react';
import { analyzeCheckIns } from '@/lib/services/geminiService';
import { MOODS } from '../utils';
import { useGroup } from '@/lib/GroupContext';
import { ShareFeelingForm } from './ShareFeelingForm';

interface CheckInsComponentProps {
  checkIns: CheckIn[];
  members: FamilyMember[];
  currentUser: FamilyMember;
  onAddCheckIn: (checkIn: Omit<CheckIn, 'id' | 'timestamp'>) => Promise<CheckIn>;
  questions: Question[];
}

export const CheckInsComponent: React.FC<CheckInsComponentProps> = ({ checkIns, members, currentUser, onAddCheckIn, questions }) => {
  const { currentGroup } = useGroup();
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // Question State
  const activeQuestion = questions.find(q => q.isActive) || questions[0];
  const [isAnsweringQuestion, setIsAnsweringQuestion] = useState(false);
  const [timeframeFilter, setTimeframeFilter] = useState<'day' | 'week'>('week');

  const handleGetAISummary = async () => {
    setLoadingAi(true);
    const summary = await analyzeCheckIns(checkIns, members);
    setAiSummary(summary);
    setLoadingAi(false);
  };


  const recentCheckIns = checkIns
    .filter(checkIn => {
      const checkInDate = new Date(checkIn.timestamp);
      const now = new Date();
      const diffTime = now.getTime() - checkInDate.getTime();
      const diffDays = diffTime / (1000 * 3600 * 24);

      if (timeframeFilter === 'day') {
        // Show check-ins from today (past 24 hours)
        return diffDays <= 1;
      } else {
        // Show check-ins from the past week
        return diffDays <= 7;
      }
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Check In</h2>

      {/* AI Summary */}
      {aiSummary && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="text-indigo-600" size={18} />
            <span className="font-semibold text-indigo-900">AI Family Insight</span>
          </div>
          <p className="text-indigo-800">{aiSummary}</p>
        </div>
      )}

      {/* Active Question */}
      {activeQuestion && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <MessageCircle className="text-yellow-600" size={18} />
            <span className="font-semibold text-yellow-900">Today's Question</span>
          </div>
          <p className="text-yellow-800 mb-3">{activeQuestion.text}</p>
          <button
            onClick={() => setIsAnsweringQuestion(true)}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Answer This Question
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Check-in Form */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <ShareFeelingForm
            currentUser={currentUser}
            groupId={currentGroup?.id || ''}
            onAddCheckIn={onAddCheckIn}
            activeQuestion={activeQuestion}
            isAnsweringQuestion={isAnsweringQuestion}
            variant="full"
            onSuccess={() => setIsAnsweringQuestion(false)}
          />
        </div>

        {/* Recent Check-ins */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-slate-800">Recent Check-ins</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setTimeframeFilter('day')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  timeframeFilter === 'day'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Day
              </button>
              <button
                onClick={() => setTimeframeFilter('week')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  timeframeFilter === 'week'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Week
              </button>
            </div>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {recentCheckIns.map(checkIn => {
              const member = members.find(m => m.id === checkIn.memberId);
              if (!member) return null;

              return (
                <div key={checkIn.id} className="border border-slate-100 rounded-lg p-3 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3 mb-2">
                    <img src={member.avatar} alt={member.name} className="w-8 h-8 rounded-full" />
                    <div className="flex-1">
                      <div className="font-medium text-slate-800">{member.name}</div>
                      <div className="text-xs text-slate-500">
                        {new Date(checkIn.timestamp).toLocaleDateString()} at {new Date(checkIn.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${MOODS.find(m => m.type === checkIn.mood)?.color}`}>
                      {MOODS.find(m => m.type === checkIn.mood)?.emoji} {checkIn.mood}
                    </div>
                  </div>

                  <p className="text-slate-700 text-sm mb-2">{checkIn.note}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Get AI Summary Button */}
      <div className="flex justify-center">
        <button
          onClick={handleGetAISummary}
          disabled={loadingAi}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          {loadingAi ? (
            <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
          ) : (
            <Sparkles size={20} />
          )}
          Get AI Summary
        </button>
      </div>
    </div>
  );
};
