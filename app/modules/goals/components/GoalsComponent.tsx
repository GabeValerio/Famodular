import React, { useState } from 'react';
import { FamilyMember, Goal, GoalType, Timeframe } from '@/types/family';
import { Target, Plus, Wand2, Trash2, CheckCircle2 } from 'lucide-react';
import { getGoalAdvice } from '@/lib/services/geminiService';

interface GoalsComponentProps {
  goals: Goal[];
  members: FamilyMember[];
  currentUser: FamilyMember;
  onAddGoal: (goal: Omit<Goal, 'id'>) => Promise<Goal>;
  onUpdateGoal: (goal: Goal) => Promise<void>;
  onDeleteGoal: (id: string) => Promise<void>;
}

export const GoalsComponent: React.FC<GoalsComponentProps> = ({ goals, members, currentUser, onAddGoal, onUpdateGoal, onDeleteGoal }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<'All' | GoalType>('All');
  const [loadingAdvice, setLoadingAdvice] = useState<string | null>(null);

  // New Goal State
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<GoalType>(GoalType.PERSONAL);
  const [newTimeframe, setNewTimeframe] = useState<Timeframe>(Timeframe.ONE_YEAR);

  const handleAdd = async () => {
    const newGoal: Omit<Goal, 'id'> = {
      title: newTitle,
      description: '',
      ownerId: newType === GoalType.FAMILY ? 'family' : currentUser.id,
      groupId: '1', // TODO: Get from current group context
      type: newType,
      timeframe: newTimeframe,
      progress: 0,
    };
    await onAddGoal(newGoal);
    setIsModalOpen(false);
    setNewTitle('');
  };

  const handleGetAdvice = async (goal: Goal) => {
    setLoadingAdvice(goal.id);
    const tips = await getGoalAdvice(goal);
    await onUpdateGoal({ ...goal, aiTips: tips });
    setLoadingAdvice(null);
  };

  const filteredGoals = goals.filter(g => {
    if (filterType === 'All') return true;
    return g.type === filterType;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Family Ambitions</h2>
          <p className="text-slate-500">Tracking our shared and personal dreams.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={18} /> New Goal
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 border-b border-slate-200 pb-4">
        <button
          onClick={() => setFilterType('All')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filterType === 'All' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          All
        </button>
        <button
          onClick={() => setFilterType(GoalType.FAMILY)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filterType === GoalType.FAMILY ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
        >
          Family
        </button>
        <button
          onClick={() => setFilterType(GoalType.PERSONAL)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filterType === GoalType.PERSONAL ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
        >
          Personal
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGoals.map((goal) => {
          const owner = members.find(m => m.id === goal.ownerId);
          return (
            <div key={goal.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col h-full group hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <span className={`text-xs font-semibold px-2 py-1 rounded uppercase tracking-wider ${goal.type === GoalType.FAMILY ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {goal.timeframe}
                </span>
                {goal.type === GoalType.PERSONAL && owner && (
                  <img src={owner.avatar} alt={owner.name} className="w-8 h-8 rounded-full border-2 border-white shadow-sm" title={owner.name} />
                )}
              </div>

              <div className="flex-1">
                <h3 className="font-bold text-lg text-slate-800 mb-2 leading-tight">{goal.title}</h3>

                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600">Progress</span>
                    <span className="font-semibold text-slate-800">{goal.progress}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${goal.progress}%` }}></div>
                  </div>
                </div>

                {goal.aiTips && goal.aiTips.length > 0 && (
                  <div className="bg-indigo-50 p-3 rounded-lg mb-4">
                    <div className="flex items-center gap-1 mb-2">
                      <Wand2 size={14} className="text-indigo-600" />
                      <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">AI Tips</span>
                    </div>
                    <ul className="text-sm text-indigo-800 space-y-1">
                      {goal.aiTips.map((tip, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-indigo-500 mt-0.5">•</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleGetAdvice(goal)}
                  disabled={loadingAdvice === goal.id}
                  className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-1 transition-colors disabled:opacity-50"
                >
                  {loadingAdvice === goal.id ? (
                    <div className="animate-spin h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
                  ) : (
                    <><Wand2 size={14} /> Get Tips</>
                  )}
                </button>
                <button
                  onClick={() => onDeleteGoal(goal.id)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete goal"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Goal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Add New Goal</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Goal Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="e.g., Save for vacation"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as GoalType)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value={GoalType.PERSONAL}>Personal</option>
                  <option value={GoalType.FAMILY}>Family</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Timeframe</label>
                <select
                  value={newTimeframe}
                  onChange={(e) => setNewTimeframe(e.target.value as Timeframe)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value={Timeframe.ONE_YEAR}>1 Year</option>
                  <option value={Timeframe.THREE_YEAR}>3 Years</option>
                  <option value={Timeframe.FIVE_YEAR}>5 Years</option>
                  <option value={Timeframe.TEN_YEAR}>10 Years</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-2 px-4 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={!newTitle}
                className="flex-1 py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                Add Goal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
