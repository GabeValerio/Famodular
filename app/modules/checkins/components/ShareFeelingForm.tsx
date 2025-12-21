"use client";

import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Send, Check } from 'lucide-react';
import { MOODS, getMoodConfig } from '../utils';
import { CheckIn, FamilyMember, Question } from '../types';
import { formatRelativeTime } from '@/app/modules/shared/utils';

interface ShareFeelingFormProps {
  currentUser: FamilyMember;
  groupId: string;
  onAddCheckIn: (checkIn: Omit<CheckIn, 'id' | 'timestamp'>) => Promise<CheckIn>;
  activeQuestion?: Question;
  isAnsweringQuestion?: boolean;
  variant?: 'compact' | 'full';
  showRecentCheckIn?: boolean;
  recentCheckIn?: CheckIn | null;
  onSuccess?: () => void;
}

export function ShareFeelingForm({
  currentUser,
  groupId,
  onAddCheckIn,
  activeQuestion,
  isAnsweringQuestion = false,
  variant = 'full',
  showRecentCheckIn = false,
  recentCheckIn,
  onSuccess,
}: ShareFeelingFormProps) {
  const [selectedMood, setSelectedMood] = useState<CheckIn['mood'] | null>(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const isCompact = variant === 'compact';
  const moodCount = isCompact ? 10 : MOODS.length;
  const visibleMoods = MOODS.slice(0, moodCount).sort((a, b) => a.type.localeCompare(b.type));

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!selectedMood || !currentUser.id) return;

    try {
      setSubmitting(true);
      await onAddCheckIn({
        memberId: currentUser.id,
        groupId,
        mood: selectedMood,
        note: note.trim(),
        questionId: isAnsweringQuestion && activeQuestion ? activeQuestion.id : undefined,
      });
      
      setSubmitted(true);
      setNote('');
      setSelectedMood(null);
      
      if (onSuccess) {
        onSuccess();
      }
      
      // Reset success state after 3 seconds
      setTimeout(() => setSubmitted(false), 3000);
    } catch (error) {
      console.error('Failed to submit check-in:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex items-center gap-2 text-green-600 py-2">
        <Check className="h-4 w-4" />
        <span className={isCompact ? "text-sm" : "text-base"}>Check-in submitted!</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Mood Selection */}
      <div>
        {/* Mobile Dropdown */}
        <div className="block md:hidden">
          <div className="flex items-center gap-3">
            <label className={`text-sm font-medium text-slate-700 whitespace-nowrap`}>
              How are you feeling?
            </label>
            <Select value={selectedMood || ''} onValueChange={(value) => setSelectedMood(value as CheckIn['mood'])}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select mood..." />
              </SelectTrigger>
              <SelectContent>
                {visibleMoods.map((mood) => (
                  <SelectItem key={mood.type} value={mood.type}>
                    <div className="flex items-center gap-2">
                      <span>{mood.emoji}</span>
                      <span>{mood.type}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Desktop Grid */}
        <div className="hidden md:block">
          <label className={`block text-sm font-medium text-slate-700 mb-2`}>
            How are you feeling?
          </label>
          <div className={`grid gap-2 ${isCompact ? 'grid-cols-5' : 'grid-cols-5'}`}>
          {visibleMoods.map((mood) => (
            <button
              key={mood.type}
              type="button"
              onClick={() => setSelectedMood(mood.type)}
              className={`
                ${isCompact ? 'p-2' : 'p-3'} rounded-lg border-2 transition-all
                ${selectedMood === mood.type
                  ? isCompact
                    ? `${mood.color} ring-2 ring-offset-2 ring-primary`
                    : 'border-indigo-500 bg-indigo-50'
                  : isCompact
                    ? 'bg-muted hover:bg-muted/80 border-transparent'
                    : 'border-slate-200 hover:border-slate-300'
                }
              `}
              title={mood.type}
            >
              <div className={`${isCompact ? 'text-lg' : 'text-2xl mb-1'}`}>{mood.emoji}</div>
              {!isCompact && (
                <div className="text-xs font-medium text-slate-600">{mood.type}</div>
              )}
            </button>
          ))}
        </div>
        {selectedMood && isCompact && (
          <p className="text-xs text-muted-foreground mt-2">
            {getMoodConfig(selectedMood).type}
          </p>
        )}
      </div>
      </div>

      {/* Note */}
      <div>
        <label className={`block ${isCompact ? 'text-xs' : 'text-sm'} font-medium ${isCompact ? 'text-muted-foreground' : 'text-slate-700'} mb-2`}>
          {isCompact ? "Add a note (optional)" : `What's on your mind? ${isAnsweringQuestion && activeQuestion ? `(Answering: ${activeQuestion.text})` : ''}`}
        </label>
        {isCompact ? (
          <Textarea
            placeholder="What's on your mind?"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="min-h-[60px] text-sm"
            maxLength={200}
          />
        ) : (
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            rows={3}
            placeholder="Share your thoughts..."
          />
        )}
        {isCompact && (
          <p className="text-xs text-muted-foreground mt-1">
            {note.length}/200
          </p>
        )}
      </div>

      {/* Submit button */}
      {isCompact ? (
        <Button
          onClick={handleSubmit}
          disabled={!selectedMood || submitting || !currentUser.id}
          className="w-full"
          size="sm"
        >
          {submitting ? 'Submitting...' : 'Share'}
        </Button>
      ) : (
        <button
          type="submit"
          disabled={(!note && !isCompact) || submitting}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
        >
          <Send size={18} />
          Share Check-in
        </button>
      )}

      {/* Most recent check-in (compact variant only) */}
      {isCompact && showRecentCheckIn && recentCheckIn && (
        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground mb-2">Your last check-in:</p>
          <div className="flex items-center gap-2">
            <span className="text-lg">
              {getMoodConfig(recentCheckIn.mood).emoji}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {getMoodConfig(recentCheckIn.mood).type}
              </p>
              {recentCheckIn.note && (
                <p className="text-xs text-muted-foreground truncate">
                  {recentCheckIn.note}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {formatRelativeTime(recentCheckIn.timestamp)}
              </p>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
