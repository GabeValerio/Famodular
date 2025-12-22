import React, { useState } from 'react';
import { FamilyMember, Goal, GoalType, Timeframe } from '@/types/family';
import { Target, Plus, Trash2, CheckCircle2, Filter } from 'lucide-react';

interface GoalsComponentProps {
  goals: Goal[];
  members: FamilyMember[];
  currentUser: FamilyMember;
  group?: any;
  onAddGoal: (goal: Omit<Goal, 'id'>) => Promise<Goal>;
  onUpdateGoal: (goal: Goal) => Promise<void>;
  onDeleteGoal: (id: string) => Promise<void>;
}

export const GoalsComponent: React.FC<GoalsComponentProps> = ({ goals, members, currentUser, group, onAddGoal, onUpdateGoal, onDeleteGoal }) => {
  // Get the groupId from the group prop
  const groupId = group?.id;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [timeframeFilter, setTimeframeFilter] = useState<'all' | 'one-year'>('all');
  const [memberFilter, setMemberFilter] = useState<string>('all');

  // New Goal State
  const [newTitle, setNewTitle] = useState('');
  const [newTimeframe, setNewTimeframe] = useState<Timeframe>(Timeframe.SIX_MONTH);
  const [newOwnerId, setNewOwnerId] = useState<string>('family');

  const handleAdd = async () => {
    if (!groupId) {
      return;
    }

    const newGoal: Omit<Goal, 'id'> = {
      title: newTitle,
      description: '',
      ownerId: newOwnerId,
      groupId: groupId,
      type: newOwnerId === 'family' ? GoalType.FAMILY : GoalType.PERSONAL,
      timeframe: newTimeframe,
      progress: 0,
    };
    await onAddGoal(newGoal);
    setIsModalOpen(false);
    setNewTitle('');
    setNewTimeframe(Timeframe.SIX_MONTH);
    setNewOwnerId('family');
  };


  const filteredGoals = goals.filter(goal => {
    // Timeframe filter
    if (timeframeFilter === 'one-year' && goal.timeframe !== Timeframe.ONE_YEAR) {
      return false;
    }

    // Member filter
    if (memberFilter === 'all') {
      return true;
    }
    if (memberFilter === 'family') {
      return goal.ownerId === 'family';
    }
    return goal.ownerId === memberFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Goals</h2>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setTimeframeFilter(timeframeFilter === 'all' ? 'one-year' : 'all')}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            title={`Show ${timeframeFilter === 'all' ? '1 Year goals only' : 'all goals'}`}
          >
            <Filter size={18} />
            {timeframeFilter === 'all' ? '1 Year' : 'All Timeframes'}
          </button>

          {/* Member filter buttons */}
          <div className="flex gap-1 bg-white border border-slate-200 rounded-lg p-1">
            <button
              onClick={() => setMemberFilter('all')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                memberFilter === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setMemberFilter('family')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                memberFilter === 'family'
                  ? 'bg-indigo-600 text-white'
                  : 'text-indigo-600 hover:bg-indigo-50'
              }`}
            >
              Family
            </button>
            {members.map((member) => (
              <button
                key={member.id}
                onClick={() => setMemberFilter(member.id)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1 ${
                  memberFilter === member.id
                    ? 'bg-emerald-600 text-white'
                    : 'text-emerald-600 hover:bg-emerald-50'
                }`}
              >
                <img src={member.avatar} alt={member.name} className="w-4 h-4 rounded-full" />
                {member.name}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus size={18} /> New Goal
          </button>
        </div>
      </div>


      <div className="space-y-3">
        {filteredGoals.map((goal) => {
          const owner = members.find(m => m.id === goal.ownerId);
          return (
            <div key={goal.id} className="bg-white p-4 rounded-lg border border-slate-200 hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex items-center gap-2">
                    {goal.ownerId === 'family' ? (
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                        <span className="text-xs font-bold text-indigo-700">👨‍👩‍👧‍👦</span>
                      </div>
                    ) : owner ? (
                      <img src={owner.avatar} alt={owner.name} className="w-8 h-8 rounded-full border border-slate-200" />
                    ) : null}
                    <div>
                      <h3 className="font-semibold text-slate-800">{goal.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${goal.type === GoalType.FAMILY ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {goal.timeframe}
                        </span>
                        <span>
                          {goal.ownerId === 'family' ? `${group?.name || 'Family'} Goal` : owner?.name || 'Unknown'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-semibold text-slate-800">{goal.progress}%</div>
                    <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${goal.progress}%` }}></div>
                    </div>
                  </div>

                  <button
                    onClick={() => onDeleteGoal(goal.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                    title="Delete goal"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
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
                <label className="block text-sm font-medium text-slate-700 mb-1">Whose goal is this?</label>
                <select
                  value={newOwnerId}
                  onChange={(e) => setNewOwnerId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="family">{group?.name || 'Family'} Goal</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}'s Goal
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Timeframe</label>
                <select
                  value={newTimeframe}
                  onChange={(e) => setNewTimeframe(e.target.value as Timeframe)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value={Timeframe.SIX_MONTH}>6 Months</option>
                  <option value={Timeframe.ONE_YEAR}>1 Year</option>
                  <option value={Timeframe.THREE_YEAR}>3 Years</option>
                  <option value={Timeframe.FIVE_YEAR}>5 Years</option>
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
