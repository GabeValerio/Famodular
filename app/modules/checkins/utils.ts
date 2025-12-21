// Module-specific utilities for CheckIns
import { CheckIn } from './types';

export const MOODS: { type: CheckIn['mood']; emoji: string; color: string }[] = [
  { type: 'Happy', emoji: '😊', color: 'bg-green-100 text-green-600' },
  { type: 'Excited', emoji: '🤩', color: 'bg-yellow-100 text-yellow-600' },
  { type: 'Neutral', emoji: '😐', color: 'bg-slate-100 text-slate-600' },
  { type: 'Tired', emoji: '😴', color: 'bg-blue-100 text-blue-600' },
  { type: 'Stressed', emoji: '😓', color: 'bg-red-100 text-red-600' },
  { type: 'Sad', emoji: '😢', color: 'bg-blue-100 text-blue-700' },
  { type: 'Anxious', emoji: '😰', color: 'bg-orange-100 text-orange-600' },
  { type: 'Grateful', emoji: '🙏', color: 'bg-purple-100 text-purple-600' },
  { type: 'Calm', emoji: '😌', color: 'bg-teal-100 text-teal-600' },
  { type: 'Proud', emoji: '😎', color: 'bg-indigo-100 text-indigo-600' },
  { type: 'Frustrated', emoji: '😤', color: 'bg-red-100 text-red-700' },
  { type: 'Hopeful', emoji: '✨', color: 'bg-yellow-100 text-yellow-700' },
  { type: 'Lonely', emoji: '😔', color: 'bg-gray-100 text-gray-600' },
  { type: 'Content', emoji: '😌', color: 'bg-green-100 text-green-700' },
  { type: 'Worried', emoji: '😟', color: 'bg-orange-100 text-orange-700' },
  { type: 'Exhausted', emoji: '😫', color: 'bg-gray-100 text-gray-700' },
  { type: 'Hungry', emoji: '🍽️', color: 'bg-orange-100 text-orange-600' },
];

export function getMoodConfig(mood: CheckIn['mood']) {
  return MOODS.find(m => m.type === mood) || MOODS[2]; // Default to Neutral
}

export function formatCheckInTime(timestamp: Date): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
