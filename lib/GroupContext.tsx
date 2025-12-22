"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Group, User } from '@/types/family';
import { useSession } from 'next-auth/react';

// Special identifier for "self" view
export const SELF_VIEW_ID = 'self';

interface GroupContextType {
  currentGroup: Group | null;
  groups: Group[];
  currentUser: User | null;
  isSelfView: boolean;
  loading: boolean;
  setCurrentGroup: (group: Group | null) => void;
  setSelfView: () => void;
  refreshGroups: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const GroupContext = createContext<GroupContextType | undefined>(undefined);

export const useGroup = () => {
  const context = useContext(GroupContext);
  if (!context) {
    throw new Error('useGroup must be used within a GroupProvider');
  }
  return context;
};

export function GroupProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [currentGroup, setCurrentGroupState] = useState<Group | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSelfView, setIsSelfView] = useState<boolean>(true); // Default to true
  const [loading, setLoading] = useState<boolean>(true);

  const fetchGroups = async () => {
    if (!session) {
      setGroups([]);
      return [];
    }

    try {
      const response = await fetch('/api/groups');
      if (!response.ok) {
        throw new Error('Failed to fetch groups');
      }
      const fetchedGroups: Group[] = await response.json();
      setGroups(fetchedGroups);
      return fetchedGroups;
    } catch (error) {
      setGroups([]);
      return [];
    }
  };

  const fetchUser = async () => {
    if (!session?.user?.id) {
      setCurrentUser(null);
      return null;
    }

    try {
      const [modulesResponse, profileResponse] = await Promise.all([
        fetch('/api/users/me/modules').catch(() => null),
        fetch('/api/users/me').catch(() => null)
      ]);

      let userDefaultView = 'self';
      let userAvatar: string | undefined = undefined;
      let userName = session.user.name || '';
      let userPhone: string | undefined = undefined;
      
      if (profileResponse?.ok) {
        const profile = await profileResponse.json();

        if (profile.default_view) {
          userDefaultView = profile.default_view;
        }
        if (profile.avatar) {
          userAvatar = profile.avatar;
        }
        if (profile.name) {
          userName = profile.name;
        }
        if (profile.phone) {
          userPhone = profile.phone;
        }
      } else {
        // Failed to fetch user profile
      }

      const userData: User = {
        id: session.user.id,
        name: userName,
        email: session.user.email || '',
        avatar: userAvatar,
        phone: userPhone,
        groups: [],
        defaultView: userDefaultView,
      };

      if (modulesResponse?.ok) {
        const { enabledModules } = await modulesResponse.json();
        userData.enabledModules = enabledModules;
      } else {
        // Default modules if fetch fails - only Calendar and To Do enabled
        userData.enabledModules = {
          checkins: false,
          finance: false,
          goals: false,
          chat: false,
          wishlist: false,
          location: false,
          plants: false,
          calendar: true,
          todos: true,
        };
      }

      setCurrentUser(userData);
      return userData;
    } catch (error) {
      // Set basic user data from session if fetch fails
      const fallbackUser = {
        id: session.user.id,
        name: session.user.name || '',
        email: session.user.email || '',
        avatar: undefined,
        groups: [],
        enabledModules: {
          checkins: true,
          finance: true,
          goals: true,
          chat: true,
          wishlist: true,
          location: true,
          plants: true,
          calendar: true,
          todos: true,
        },
      } as User;
      setCurrentUser(fallbackUser);
      return fallbackUser;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (!session) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        await Promise.all([fetchGroups(), fetchUser()]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [session]);

  const setCurrentGroup = (group: Group | null) => {
    setCurrentGroupState(group);
    setIsSelfView(group === null);
  };

  const setSelfView = () => {
    setCurrentGroupState(null);
    setIsSelfView(true);
  };

  useEffect(() => {
    // When user data loads, apply default view preference if no group is selected
    if (currentUser?.defaultView && !currentGroup) {
      if (currentUser.defaultView === 'self') {
        setIsSelfView(true);
      } else {
        const group = groups.find(g => g.id === currentUser.defaultView);
        if (group) {
          setCurrentGroup(group);
        } else {
          // Fallback to self if group not found
          setIsSelfView(true);
        }
      }
    }
  }, [currentUser, groups, currentGroup]);

  return (
    <GroupContext.Provider value={{ 
      currentGroup, 
      groups,
      currentUser,
      isSelfView,
      loading,
      setCurrentGroup, 
      setSelfView,
      refreshGroups: async () => { await fetchGroups(); },
      refreshUser: async () => { await fetchUser(); },
    }}>
      {children}
    </GroupContext.Provider>
  );
}
