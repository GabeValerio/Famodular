import React, { useState } from 'react';
import { CheckIn, FamilyMember, Question } from '../types';
import { Sparkles, MessageCircle } from 'lucide-react';
import { analyzeCheckIns, generateFamilyQuestion } from '@/lib/services/geminiService';
import { MOODS } from '../utils';
import { useGroup } from '@/lib/GroupContext';
import { ShareFeelingForm } from './ShareFeelingForm';

interface CheckInsComponentProps {
  checkIns: CheckIn[];
  members: FamilyMember[];
  currentUser: FamilyMember;
  onAddCheckIn: (checkIn: Omit<CheckIn, 'id' | 'timestamp'>) => Promise<CheckIn>;
  questions: Question[];
  onAddQuestion: (question: Omit<Question, 'id' | 'timestamp'>) => Promise<Question>;
}

export const CheckInsComponent: React.FC<CheckInsComponentProps> = ({ checkIns, members, currentUser, onAddCheckIn, questions, onAddQuestion }) => {
  const { currentGroup } = useGroup();
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // Question State
  const activeQuestion = questions.find(q => q.isActive) || questions[0];
  const [questionTopic, setQuestionTopic] = useState('');
  const [generatedQuestion, setGeneratedQuestion] = useState('');
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false);
  const [isAnsweringQuestion, setIsAnsweringQuestion] = useState(false);

  const handleGetAISummary = async () => {
    setLoadingAi(true);
    const summary = await analyzeCheckIns(checkIns, members);
    setAiSummary(summary);
    setLoadingAi(false);
  };

  const handleGenerateQuestion = async () => {
    if (!questionTopic) return;
    setIsGeneratingQuestion(true);
    const question = await generateFamilyQuestion(questionTopic);
    setGeneratedQuestion(question);
    setIsGeneratingQuestion(false);
  };

  const handleAddQuestion = async () => {
    if (!generatedQuestion || !questionTopic) return;
    await onAddQuestion({
      text: generatedQuestion,
      topic: questionTopic,
      createdBy: currentUser.id,
      groupId: currentGroup?.id || '',
      isActive: true
    });
    setQuestionTopic('');
    setGeneratedQuestion('');
  };

  const recentCheckIns = checkIns
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Family Check-ins</h2>
          <p className="text-slate-500">How is everyone feeling today?</p>
        </div>
        <button
          onClick={handleGetAISummary}
          disabled={loadingAi}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          {loadingAi ? (
            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
          ) : (
            <Sparkles size={18} />
          )}
          Get AI Summary
        </button>
      </div>

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
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Share How You're Feeling</h3>

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
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Recent Check-ins</h3>

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

      {/* Question Generator */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Generate Family Questions</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Topic</label>
            <input
              type="text"
              value={questionTopic}
              onChange={(e) => setQuestionTopic(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="e.g., gratitude, family traditions, dreams..."
            />
          </div>

          <button
            onClick={handleGenerateQuestion}
            disabled={!questionTopic || isGeneratingQuestion}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {isGeneratingQuestion ? (
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
            ) : (
              <Sparkles size={18} />
            )}
            Generate Question
          </button>

          {generatedQuestion && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <p className="text-indigo-800 mb-3"><strong>Generated Question:</strong> {generatedQuestion}</p>
              <button
                onClick={handleAddQuestion}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Set as Active Question
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
