export enum Timeframe {
  SIX_MONTH = '6 Months',
  ONE_YEAR = '1 Year',
  THREE_YEAR = '3 Years',
  FIVE_YEAR = '5 Years',
}

export enum GoalType {
  PERSONAL = 'Personal',
  FAMILY = 'Family',
}

export enum WishlistType {
  NEED = 'Need',
  WANT = 'Want',
}

export enum EventCategory {
  FAMILY = 'Family',
  SCHOOL = 'School',
  WORK = 'Work',
  HEALTH = 'Health',
  SOCIAL = 'Social',
}

export enum GroupRole {
  ADMIN = 'Admin',
  MEMBER = 'Member',
}

// All modules that can be enabled - same structure for both user and group
export interface ModuleConfig {
  checkins: boolean;
  finance: boolean;
  goals: boolean;
  chat: boolean;
  wishlist: boolean;
  location: boolean;
  calendar: boolean;
  todos: boolean;
  plants: boolean;
  taskplanner: boolean;
}

// Alias for backward compatibility
export type GroupModules = ModuleConfig;
export type UserModules = ModuleConfig;

export interface Group {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  createdBy: string;
  createdAt: Date;
  privacy: 'public' | 'private' | 'invite-only';
  members: GroupMember[];
  enabledModules?: GroupModules; // Module configuration
}

export interface GroupMember {
  userId: string;
  groupId: string;
  role: GroupRole;
  joinedAt: Date;
  isActive: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  category: EventCategory;
  addedBy: string;
  groupId: string;
  description?: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  ownerId: string; // 'family' or member ID
  groupId: string;
  type: GoalType;
  timeframe: Timeframe;
  progress: number; // 0-100
  aiTips?: string[];
}

export interface Subscription {
  id: string;
  name: string;
  cost: number;
  frequency: 'Monthly' | 'Yearly';
  category: string;
  groupId: string;
}

export interface Fund {
  id: string;
  name: string;
  currentAmount: number;
  targetAmount: number;
  color: string;
  groupId: string;
}

export interface WishlistItem {
  id: string;
  title: string;
  cost: number;
  type: WishlistType;
  addedBy: string; // memberId
  groupId: string;
  link?: string;
}

export interface Question {
  id: string;
  text: string;
  topic: string;
  createdBy: string;
  groupId: string;
  timestamp: Date;
  isActive: boolean;
}

export interface CheckIn {
  id: string;
  memberId: string;
  groupId: string;
  timestamp: Date;
  mood: 'Happy' | 'Neutral' | 'Stressed' | 'Excited' | 'Tired' | 'Sad' | 'Anxious' | 'Grateful' | 'Calm' | 'Proud' | 'Frustrated' | 'Hopeful' | 'Lonely' | 'Content' | 'Worried' | 'Exhausted' | 'Hungry';
  note: string;
  location?: string;
  questionId?: string; // Optional link to a Question
}

export interface Location {
  label: string; // e.g., "Home", "School", "Starbucks"
  x: number; // 0-100 percentage for map placement
  y: number; // 0-100 percentage for map placement
  timestamp: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  phone?: string;
  groups: GroupMember[]; // Groups this user belongs to
  enabledModules?: UserModules; // Module configuration for self view
  defaultView?: 'self' | string; // 'self' or groupId
}

export interface FamilyMember {
  id: string;
  name: string;
  avatar: string;
  role: 'Parent' | 'Child';
  location?: Location;
}

export interface Message {
  id: string;
  senderId: string; // 'ai' or memberId
  groupId: string;
  text: string;
  timestamp: Date;
}
