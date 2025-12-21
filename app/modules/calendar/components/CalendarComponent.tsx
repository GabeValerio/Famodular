import React, { useState } from 'react';
import { CalendarEvent, FamilyMember, EventCategory } from '@/types/family';
import { ChevronLeft, ChevronRight, Plus, Sparkles, X, Clock, Calendar as CalendarIcon } from 'lucide-react';
import { suggestActivity } from '@/lib/services/geminiService';

interface CalendarComponentProps {
  events: CalendarEvent[];
  members: FamilyMember[];
  onAddEvent: (event: Omit<CalendarEvent, 'id'>) => Promise<void>;
  onUpdateEvent?: (event: CalendarEvent) => Promise<void>;
  onDeleteEvent: (id: string) => Promise<void>;
}

const CATEGORY_COLORS: Record<EventCategory, string> = {
  [EventCategory.FAMILY]: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  [EventCategory.SCHOOL]: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  [EventCategory.WORK]: 'bg-slate-100 text-slate-700 border-slate-200',
  [EventCategory.HEALTH]: 'bg-rose-100 text-rose-700 border-rose-200',
  [EventCategory.SOCIAL]: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

export const CalendarComponent: React.FC<CalendarComponentProps> = ({ events, members, onAddEvent, onDeleteEvent }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTime, setNewTime] = useState(new Date().toTimeString().slice(0, 5)); // HH:mm format
  const [newCategory, setNewCategory] = useState<EventCategory>(EventCategory.FAMILY);
  const [newDescription, setNewDescription] = useState('');

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const days = [];
  const totalDays = daysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const startDay = firstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());

  // Padding for start of month
  for (let i = 0; i < startDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= totalDays; i++) {
    days.push(i);
  }

  const handleAddEvent = async () => {
    if (!newTitle || !newDate) return;
    
    // Combine date and time into a single Date object
    const [hours, minutes] = newTime.split(':').map(Number);
    const eventDate = new Date(newDate);
    eventDate.setHours(hours, minutes, 0, 0);
    
    await onAddEvent({
      title: newTitle,
      date: eventDate,
      category: newCategory,
      addedBy: members[0]?.id || '', // TODO: Get from session
      groupId: '1', // TODO: Get from current group context
      description: newDescription
    });
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setNewTitle('');
    setNewDate(new Date().toISOString().split('T')[0]);
    setNewTime(new Date().toTimeString().slice(0, 5));
    setNewCategory(EventCategory.FAMILY);
    setNewDescription('');
  };

  const handleAiSuggest = async () => {
    setIsAiLoading(true);
    const suggestion = await suggestActivity("Fun family weekend");
    setNewTitle(suggestion.title);
    setNewDescription(suggestion.description);
    setIsAiLoading(false);
  };

  const getEventsForDay = (day: number) => {
    return events.filter(e => {
      const d = new Date(e.date);
      return d.getDate() === day &&
             d.getMonth() === currentDate.getMonth() &&
             d.getFullYear() === currentDate.getFullYear();
    });
  };

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() &&
           currentDate.getMonth() === today.getMonth() &&
           currentDate.getFullYear() === today.getFullYear();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Calendar Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-800">
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h3>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { resetForm(); setIsModalOpen(true); }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm transition-all"
            >
              <Plus size={18} /> Add Event
            </button>
            <div className="flex items-center gap-2">
              <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600">
                <ChevronLeft size={20} />
              </button>
              <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                Today
              </button>
              <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 border-b border-slate-300">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider border-r border-slate-300 last:border-r-0">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 auto-rows-[120px]">
          {days.map((day, idx) => {
            const dayEvents = day ? getEventsForDay(day) : [];
            return (
              <div
                key={idx}
                className={`p-2 border-r border-b border-slate-300 relative group transition-colors ${day ? 'hover:bg-slate-50/50' : 'bg-slate-50/30'}`}
              >
                {day && (
                  <>
                    <span className={`inline-flex items-center justify-center w-7 h-7 text-sm font-bold rounded-full mb-1 ${isToday(day) ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600'}`}>
                      {day}
                    </span>
                    <div className="space-y-1 overflow-y-auto max-h-[80px] no-scrollbar">
                      {dayEvents.map(event => {
                        const eventDate = new Date(event.date);
                        const timeStr = eventDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                        return (
                          <div
                            key={event.id}
                            title={`${event.title} - ${timeStr}`}
                            className={`text-[10px] px-1.5 py-0.5 rounded border truncate cursor-default shadow-sm ${CATEGORY_COLORS[event.category]}`}
                          >
                            <span className="font-bold text-[9px] opacity-80">{timeStr}</span> <span>{event.title}</span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming List (Mobile Optimized) */}
      <div className="lg:hidden bg-white rounded-2xl border border-slate-100 p-6">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Clock size={18} className="text-indigo-500" /> Upcoming</h3>
          <div className="space-y-3">
             {events
               .filter(e => new Date(e.date) >= new Date())
               .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
               .slice(0, 5)
               .map(event => {
                 const eventDate = new Date(event.date);
                 const dateStr = eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                 const timeStr = eventDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                 return (
                  <div key={event.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                     <div className={`w-2 h-2 rounded-full ${CATEGORY_COLORS[event.category].split(' ')[0]}`}></div>
                     <div className="flex-1">
                        <div className="text-sm font-bold text-slate-800">{event.title}</div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1">
                          <CalendarIcon size={10} />
                          {dateStr} • <Clock size={10} /> {timeStr}
                        </div>
                     </div>
                  </div>
                 );
               })
             }
          </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-fade-in">
             <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="text-xl font-bold text-slate-800">Add Family Event</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
             </div>

             <div className="p-6 space-y-4">
                <button
                  onClick={handleAiSuggest}
                  disabled={isAiLoading}
                  className="w-full bg-indigo-50 border border-indigo-100 text-indigo-700 py-3 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm hover:bg-indigo-100 transition-colors"
                >
                  {isAiLoading ? (
                    <div className="animate-spin h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
                  ) : (
                    <><Sparkles size={18} /> Spark an Activity Idea</>
                  )}
                </button>

                <div className="relative">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Event Title</label>
                  <input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 font-medium"
                    placeholder="e.g., Movie Night"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Date</label>
                    <input
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Time</label>
                    <input
                      type="time"
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as EventCategory)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  >
                    {Object.values(EventCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                <div>
                   <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Description (Optional)</label>
                   <textarea
                     value={newDescription}
                     onChange={(e) => setNewDescription(e.target.value)}
                     className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none h-24"
                     placeholder="Add more details..."
                   />
                </div>
             </div>

             <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddEvent}
                  disabled={!newTitle || !newDate}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100 disabled:opacity-50"
                >
                  Schedule It
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
