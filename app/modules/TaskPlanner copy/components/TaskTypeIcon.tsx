'use client'
import { User, DollarSign, Zap, Music, Calendar, Home, StickyNote, Bug, Book, Car, Tv } from 'lucide-react'
import { LucideIcon } from 'lucide-react'

// Define TaskType interface directly in this file
export interface TaskType {
  id: string;
  label: string;
  icon: LucideIcon;
  className: string;
  bgClassName: string;
  bgColor: string;
}

// Define TASK_TYPES here since it's used across components
export const TASK_TYPES: Record<string, TaskType> = {
  DAILY: {
    id: 'daily',
    label: 'Daily Task',
    icon: Calendar,
    className: 'text-blue-500',
    bgClassName: 'bg-blue-50',
    bgColor: '#EFF6FF'
  },
  PERSONAL: {
    id: 'personal',
    label: 'Personal',
    icon: User,
    className: 'text-purple-500',
    bgClassName: 'bg-purple-50',
    bgColor: '#F9F5FF'
  },
  FINANCE: {
    id: 'finance',
    label: 'Finance',
    icon: DollarSign,
    className: 'text-green-500',
    bgClassName: 'bg-green-50',
    bgColor: '#F0FDF4'
  },
  QUICK: {
    id: 'quick',
    label: 'Quick Task',
    icon: Zap,
    className: 'text-amber-500',
    bgClassName: 'bg-amber-50',
    bgColor: '#FFFBEB'
  },
  MUSIC: {
    id: 'music',
    label: 'Music',
    icon: Music,
    className: 'text-indigo-500',
    bgClassName: 'bg-indigo-50',
    bgColor: '#EEF2FF'
  },
  CALENDAR: {
    id: 'calendar',
    label: 'Calendar',
    icon: Calendar,
    className: 'text-rose-500',
    bgClassName: 'bg-rose-50',
    bgColor: '#FFF1F2'
  },
  HOME: {
    id: 'home',
    label: 'Home',
    icon: Home,
    className: 'text-cyan-500',
    bgClassName: 'bg-cyan-50',
    bgColor: '#ECFEFF'
  },
  NOTE: {
    id: 'note',
    label: 'Note',
    icon: StickyNote,
    className: 'text-purple-500',
    bgClassName: 'bg-purple-50',
    bgColor: '#F3E8FF'
  },
  CODE: {
    id: 'code',
    label: 'Code Fix',
    icon: Bug,
    className: 'text-blue-500',
    bgClassName: 'bg-blue-50',
    bgColor: '#EFF6FF'
  },
  BOOK: {
    id: 'book',
    label: 'Book',
    icon: Book,
    className: 'text-orange-500',
    bgClassName: 'bg-orange-50',
    bgColor: '#FFF7ED'
  },
  ROADTRIP: {
    id: 'roadtrip',
    label: 'Road Trip',
    icon: Car,
    className: 'text-teal-500',
    bgClassName: 'bg-teal-50',
    bgColor: '#F0FDFA'
  },
  TV: {
    id: 'tv',
    label: 'TV Show',
    icon: Tv,
    className: 'text-pink-500',
    bgClassName: 'bg-pink-50',
    bgColor: '#FFF1F7'
  }
};

interface TaskTypeIconProps {
  type: string;
  className?: string;
}

export function TaskTypeIcon({ type, className = '' }: TaskTypeIconProps) {
  const upperType = (type || 'personal').toUpperCase();
  const typeConfig = TASK_TYPES[upperType];
  const Icon = typeConfig?.icon || User;

  return (
    <Icon
      className={`w-4 h-4 ${typeConfig?.className} ${className}`}
      stroke="currentColor"
    />
  );
}
