"use client";

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Textarea } from '@/app/components/ui/textarea';
import { Plus, User, Save, Bell, Shield, Check, Phone, Users, Settings as SettingsIcon, Upload, UserPlus } from 'lucide-react';
import { useGroup } from '@/lib/GroupContext';
import { useModules } from '@/app/modules/hooks/useModules';
import { getIconComponent } from '@/app/modules/utils/iconUtils';
import { Switch } from '@/app/components/ui/switch';
import { ModuleConfig } from '@/types/family';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { InviteMemberDialog } from '@/app/dashboard/components/InviteMemberDialog';

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { groups, currentGroup, setCurrentGroup, refreshGroups, currentUser, refreshUser } = useGroup();
  const { modules, loading: modulesLoading, getGroupModules, getUserModules } = useModules();
  const [members] = useState([]);
  
  // Read URL parameters
  const urlGroupId = searchParams.get('group');
  const urlTab = searchParams.get('tab') || 'personal';
  
  const [activeTab, setActiveTab] = useState(urlTab);
  const [selectedGroupId, setSelectedGroupId] = useState<string>(
    urlGroupId || currentGroup?.id || groups[0]?.id || ''
  );
  const [isCreateGroupDialogOpen, setIsCreateGroupDialogOpen] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    privacy: 'private' as 'public' | 'private' | 'invite-only',
    avatar: ''
  });

  // Update URL when tab or group changes
  const updateUrl = (tab: string, groupId?: string | null) => {
    const params = new URLSearchParams();
    if (tab) {
      params.set('tab', tab);
    }
    if (groupId) {
      params.set('group', groupId);
    }
    const queryString = params.toString();
    router.push(`/dashboard/settings${queryString ? `?${queryString}` : ''}`, { scroll: false });
  };

  // Sync URL parameters on mount and when they change
  useEffect(() => {
    const urlGroupId = searchParams.get('group');
    const urlTab = searchParams.get('tab') || 'personal';
    
    // Update tab from URL
    if (urlTab !== activeTab) {
      setActiveTab(urlTab);
    }
    
    // If URL has a group ID, select that group
    if (urlGroupId) {
      const group = groups.find(g => g.id === urlGroupId);
      if (group && urlGroupId !== selectedGroupId) {
        setSelectedGroupId(urlGroupId);
        // Optionally set as current group if different
        if (currentGroup?.id !== urlGroupId) {
          setCurrentGroup(group);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]); // Only depend on searchParams to avoid infinite loops

  // Get the selected group
  const selectedGroup = groups.find(g => g.id === selectedGroupId) || currentGroup;

  // Personal settings state
  const [personalSettings, setPersonalSettings] = useState({
    name: 'Dad',
    email: 'dad@valerio.com',
    phone: '',
    notifications: true,
    locationSharing: true,
    theme: 'light',
    profilePicture: '',
    defaultView: 'self',
    instagram: '',
    x_twitter: '',
    facebook: '',
    linkedin: '',
    tiktok: '',
    youtube: '',
    github: '',
    website: ''
  });
  const [userModules, setUserModules] = useState<ModuleConfig>({
    checkins: true,
    finance: true,
    goals: true,
    chat: true,
    wishlist: true,
    location: true,
    calendar: true,
    todos: true,
    plants: false,
    taskplanner: true,
    notepad: true,
    timetracker: false,
  });
  const [personalUploading, setPersonalUploading] = useState(false);
  const [savingUserModules, setSavingUserModules] = useState(false);

  // Load user data on mount
  useEffect(() => {
    if (currentUser) {
      setPersonalSettings(prev => ({
        ...prev,
        name: currentUser.name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        profilePicture: currentUser.avatar || '',
        defaultView: currentUser.defaultView || 'self',
        instagram: currentUser.instagram || '',
        x_twitter: currentUser.x_twitter || '',
        facebook: currentUser.facebook || '',
        linkedin: currentUser.linkedin || '',
        tiktok: currentUser.tiktok || '',
        youtube: currentUser.youtube || '',
        github: currentUser.github || '',
        website: currentUser.website || ''
      }));
      
      if (currentUser.enabledModules) {
        setUserModules(currentUser.enabledModules);
      }
    }
  }, [currentUser]);

  // Group settings state - initialize with selected group
  const [groupSettings, setGroupSettings] = useState({
    groupName: selectedGroup?.name || '',
    description: selectedGroup?.description || '',
    privacy: selectedGroup?.privacy || 'private' as const,
    avatar: selectedGroup?.avatar || '',
    enabledModules: selectedGroup?.enabledModules || {
      checkins: true,
      finance: true,
      goals: true,
      chat: true,
      wishlist: true,
      location: true,
      calendar: true,
      todos: true,
      plants: false,
    }
  });
  const [groupUploading, setGroupUploading] = useState(false);
  const [savingGroupSettings, setSavingGroupSettings] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isGroupAdmin, setIsGroupAdmin] = useState(false);

  // Check if user is admin of selected group
  useEffect(() => {
    const checkGroupAdmin = async () => {
      if (!selectedGroup?.id) {
        setIsGroupAdmin(false);
        return;
      }

      try {
        const response = await fetch(`/api/groups/${selectedGroup.id}/members/me`);
        if (response.ok) {
          const data = await response.json();
          setIsGroupAdmin(data.isAdmin || false);
        } else {
          setIsGroupAdmin(false);
        }
      } catch (error) {
        setIsGroupAdmin(false);
      }
    };

    checkGroupAdmin();
  }, [selectedGroup]);

  // Update group settings when selected group changes
  useEffect(() => {
    const group = groups.find(g => g.id === selectedGroupId) || currentGroup;
    if (group) {
      setGroupSettings({
        groupName: group.name,
        description: group.description || '',
        privacy: group.privacy,
        avatar: group.avatar || '',
        enabledModules: group.enabledModules || {
          checkins: true,
          finance: true,
          goals: true,
          chat: true,
          wishlist: true,
          location: true,
          calendar: true,
          todos: true,
          plants: false,
        }
      });
    }
  }, [selectedGroupId, groups, currentGroup]);


  const handlePersonalImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert('File size exceeds 10MB limit');
      return;
    }

    setPersonalUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'profile-images');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Upload failed with status ${response.status}`);
      }

      if (data.success && data.data?.url) {
        const imageUrl = data.data.url;
        setPersonalSettings(prev => ({ ...prev, profilePicture: imageUrl }));
        
        // Automatically save the avatar to the database
        try {
          const saveResponse = await fetch('/api/users/me', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              avatar: imageUrl,
            }),
          });

          if (!saveResponse.ok) {
            const errorData = await saveResponse.json();
            throw new Error(errorData.error || 'Failed to save avatar');
          }

          // Refresh user data to get the updated avatar
          await refreshUser();
          // Success is silent - the image preview updates automatically
        } catch (saveError) {
          // Don't throw - the upload succeeded, just the save failed
          alert('Image uploaded but failed to save. Please try saving manually.');
        }
      } else {
        throw new Error(data.error || 'Upload failed - no URL returned');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload image. Please try again.';
      alert(`Upload failed: ${errorMessage}`);
    } finally {
      setPersonalUploading(false);
      // Reset the file input so the same file can be uploaded again if needed
      e.target.value = '';
    }
  };

  const handleGroupImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert('File size exceeds 10MB limit');
      return;
    }

    setGroupUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'groups');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Upload failed with status ${response.status}`);
      }

      if (data.success && data.data?.url) {
        const imageUrl = data.data.url;
        setGroupSettings(prev => ({ ...prev, avatar: imageUrl }));
        
        // Automatically save the avatar to the database if a group is selected
        if (selectedGroup) {
          try {
            const saveResponse = await fetch(`/api/groups/${selectedGroup.id}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                avatar: imageUrl,
              }),
            });

            if (!saveResponse.ok) {
              const errorData = await saveResponse.json();
              throw new Error(errorData.error || 'Failed to save avatar');
            }

            const updatedGroup = await saveResponse.json();
            
            // Refresh groups list to get updated data
            await refreshGroups();
            
            // Update current group if it's the one we just updated
            if (currentGroup?.id === selectedGroup.id) {
              setCurrentGroup(updatedGroup);
            }

            // Success is silent - the image preview updates automatically
          } catch (saveError) {
            // Don't throw - the upload succeeded, just the save failed
            alert('Image uploaded but failed to save. Please try saving manually.');
          }
        } else {
        }
      } else {
        throw new Error(data.error || 'Upload failed - no URL returned');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload image. Please try again.';
      alert(`Upload failed: ${errorMessage}`);
    } finally {
      setGroupUploading(false);
      // Reset the file input so the same file can be uploaded again if needed
      e.target.value = '';
    }
  };

  const handlePersonalSettingsSave = async () => {
    try {
      const payload = {
        name: personalSettings.name,
        defaultView: personalSettings.defaultView,
        avatar: personalSettings.profilePicture || null,
        phone: personalSettings.phone || null,
        instagram: personalSettings.instagram || null,
        x_twitter: personalSettings.x_twitter || null,
        facebook: personalSettings.facebook || null,
        linkedin: personalSettings.linkedin || null,
        tiktok: personalSettings.tiktok || null,
        youtube: personalSettings.youtube || null,
        github: personalSettings.github || null,
        website: personalSettings.website || null,
      };

      const response = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save personal settings');
      }

      const updatedUser = await response.json();

      await refreshUser();
      alert('Personal settings saved successfully!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save personal settings';
      alert(`Save failed: ${errorMessage}`);
    }
  };

  const handleUserModulesSave = async () => {
    setSavingUserModules(true);
    try {
      const response = await fetch('/api/users/me/modules', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabledModules: userModules }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save user modules');
      }

      // Refresh user data
      if (refreshUser) {
        await refreshUser();
      }
      
      alert('User modules saved successfully!');
    } catch (error) {
      alert(`Failed to save user modules: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSavingUserModules(false);
    }
  };

  const handleGroupSettingsSave = async () => {
    if (!selectedGroup) {
      alert('Please select a group');
      return;
    }

    setSavingGroupSettings(true);
    try {
      const payload = {
        name: groupSettings.groupName,
        description: groupSettings.description || null,
        avatar: groupSettings.avatar || null,
        privacy: groupSettings.privacy,
        enabledModules: groupSettings.enabledModules,
      };

      const response = await fetch(`/api/groups/${selectedGroup.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save group settings');
      }

      const updatedGroup = await response.json();

      // Refresh groups list to get updated data
      await refreshGroups();
      
      // Update current group if it's the one we just updated
      if (currentGroup?.id === selectedGroup.id) {
        setCurrentGroup(updatedGroup);
      }
      
      // Update selected group ID to ensure UI reflects changes
      setSelectedGroupId(updatedGroup.id);
      
      alert('Group settings saved successfully!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save group settings. Please try again.';
      alert(`Save failed: ${errorMessage}`);
    } finally {
      setSavingGroupSettings(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroup.name.trim()) {
      alert('Please enter a group name');
      return;
    }

    setIsCreatingGroup(true);
    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newGroup.name,
          description: newGroup.description || null,
          privacy: newGroup.privacy,
          avatar: newGroup.avatar || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create group');
      }

      const createdGroup = await response.json();
      
      // Refresh groups list
      await refreshGroups();
      
      // Set the new group as current
      setCurrentGroup(createdGroup);
      setSelectedGroupId(createdGroup.id);
      
      // Update URL to show the new group
      updateUrl('groups', createdGroup.id);
      setActiveTab('groups');
      
      // Reset form and close dialog
      setNewGroup({
        name: '',
        description: '',
        privacy: 'private',
        avatar: ''
      });
      setIsCreateGroupDialogOpen(false);
      
      // Stay on groups tab
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create group. Please try again.';
      alert(errorMessage);
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const handleNewGroupImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert('File size exceeds 10MB limit');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'groups');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Upload failed with status ${response.status}`);
      }

      if (data.success && data.data?.url) {
        const imageUrl = data.data.url;
        setNewGroup(prev => ({ ...prev, avatar: imageUrl }));
      } else {
        throw new Error(data.error || 'Upload failed - no URL returned');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload image. Please try again.';
      alert(`Upload failed: ${errorMessage}`);
    } finally {
      // Reset the file input so the same file can be uploaded again if needed
      e.target.value = '';
    }
  };

  // Handle tab change with URL update
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'groups' && selectedGroupId) {
      updateUrl(value, selectedGroupId);
    } else if (value === 'personal') {
      updateUrl(value);
    }
  };

  // Handle group selection with URL update
  const handleGroupSelect = (groupId: string) => {
    setSelectedGroupId(groupId);
    const group = groups.find(g => g.id === groupId);
    if (group) {
      setCurrentGroup(group);
      updateUrl('groups', groupId);
      setActiveTab('groups');
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <div className="flex items-center gap-4">
            {activeTab === 'groups' && (
              <Button 
                onClick={() => setIsCreateGroupDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add New Group
              </Button>
            )}
            <TabsList>
              <TabsTrigger value="personal">Personal Settings</TabsTrigger>
              <TabsTrigger value="groups">Groups</TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="personal" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
              <CardDescription>
                Update your personal details and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Profile Picture Upload */}
              <div className="space-y-2">
                <Label>Profile Picture</Label>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {personalSettings.profilePicture ? (
                      <img
                        src={personalSettings.profilePicture}
                        alt="Profile"
                        className="h-24 w-24 rounded-full object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center border-2 border-gray-200">
                        <User className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      id="personalImageUpload"
                      accept="image/*"
                      onChange={handlePersonalImageUpload}
                      className="hidden"
                      disabled={personalUploading}
                    />
                    <Label
                      htmlFor="personalImageUpload"
                      className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none"
                    >
                      {personalUploading ? (
                        <>
                          <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          {personalSettings.profilePicture ? 'Change Picture' : 'Upload Picture'}
                        </>
                      )}
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Upload a profile picture (JPG, PNG, GIF)
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Display Name</Label>
                  <Input
                    id="name"
                    value={personalSettings.name}
                    onChange={(e) => setPersonalSettings(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={personalSettings.email}
                    onChange={(e) => setPersonalSettings(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={personalSettings.phone}
                    onChange={(e) => setPersonalSettings(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultView">Default View</Label>
                  <Select
                    value={personalSettings.defaultView}
                    onValueChange={(value) => setPersonalSettings(prev => ({ ...prev, defaultView: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select default view" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="self">Self (Personal)</SelectItem>
                      {groups.map(group => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Choose which view to show when you log in
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <h3 className="text-lg font-semibold mb-4">Social Media & Links</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="instagram">Instagram</Label>
                    <Input
                      id="instagram"
                      type="text"
                      placeholder="@username or URL"
                      value={personalSettings.instagram}
                      onChange={(e) => setPersonalSettings(prev => ({ ...prev, instagram: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="x_twitter">X (Twitter)</Label>
                    <Input
                      id="x_twitter"
                      type="text"
                      placeholder="@username or URL"
                      value={personalSettings.x_twitter}
                      onChange={(e) => setPersonalSettings(prev => ({ ...prev, x_twitter: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="facebook">Facebook</Label>
                    <Input
                      id="facebook"
                      type="text"
                      placeholder="Username or URL"
                      value={personalSettings.facebook}
                      onChange={(e) => setPersonalSettings(prev => ({ ...prev, facebook: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="linkedin">LinkedIn</Label>
                    <Input
                      id="linkedin"
                      type="text"
                      placeholder="Username or URL"
                      value={personalSettings.linkedin}
                      onChange={(e) => setPersonalSettings(prev => ({ ...prev, linkedin: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tiktok">TikTok</Label>
                    <Input
                      id="tiktok"
                      type="text"
                      placeholder="@username"
                      value={personalSettings.tiktok}
                      onChange={(e) => setPersonalSettings(prev => ({ ...prev, tiktok: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="youtube">YouTube</Label>
                    <Input
                      id="youtube"
                      type="text"
                      placeholder="Channel name or URL"
                      value={personalSettings.youtube}
                      onChange={(e) => setPersonalSettings(prev => ({ ...prev, youtube: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="github">GitHub</Label>
                    <Input
                      id="github"
                      type="text"
                      placeholder="Username"
                      value={personalSettings.github}
                      onChange={(e) => setPersonalSettings(prev => ({ ...prev, github: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      placeholder="https://example.com"
                      value={personalSettings.website}
                      onChange={(e) => setPersonalSettings(prev => ({ ...prev, website: e.target.value }))}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  Add your social media profiles and links. You can enter usernames or full URLs.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications & Privacy
              </CardTitle>
              <CardDescription>
                Control your notification preferences and privacy settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="notifications"
                  checked={personalSettings.notifications}
                  onChange={(e) => setPersonalSettings(prev => ({ ...prev, notifications: e.target.checked }))}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <div className="space-y-0.5">
                  <Label htmlFor="notifications" className="text-base">Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications about family activities
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="locationSharing"
                  checked={personalSettings.locationSharing}
                  onChange={(e) => setPersonalSettings(prev => ({ ...prev, locationSharing: e.target.checked }))}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <div className="space-y-0.5">
                  <Label htmlFor="locationSharing" className="text-base">Location Sharing</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow family members to see your location
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5" />
                Enabled Modules
              </CardTitle>
              <CardDescription>
                Choose which personal features are available for you
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {getUserModules().map((module) => {
                  const IconComponent = getIconComponent(module.icon);
                  return (
                    <div
                      key={module.id}
                      className="flex flex-col items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex flex-col items-center space-y-3 mb-4">
                        <IconComponent className="h-5 w-5 text-muted-foreground" />
                        <div className="text-center">
                          <h3 className="font-medium">{module.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {module.description}
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={userModules[module.id as keyof ModuleConfig] ?? module.defaultEnabled}
                        onCheckedChange={(checked: boolean) => {
                          setUserModules(prev => ({
                            ...prev,
                            [module.id]: checked
                          } as ModuleConfig));
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button 
              onClick={handleUserModulesSave} 
              className="flex items-center gap-2"
              disabled={savingUserModules}
            >
              <Save className="h-4 w-4" />
              {savingUserModules ? 'Saving...' : 'Save Module Settings'}
            </Button>
            <Button onClick={handlePersonalSettingsSave} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Save Personal Settings
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="groups" className="space-y-6">
          <Card className="border-0 shadow-none">
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {groups.map((group) => {
                  const isSelected = group.id === selectedGroupId;
                  const isCurrent = group.id === currentGroup?.id;
                  
                  return (
                    <div
                      key={group.id}
                      className={`flex flex-col items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                        isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleGroupSelect(group.id)}
                    >
                      <img
                        src={group.avatar}
                        alt={group.name}
                        className="h-16 w-16 rounded-full object-cover border-2 border-gray-200 mb-3"
                      />
                      <div className="flex flex-col items-center space-y-1 w-full">
                        <div className="flex flex-col items-center space-y-1">
                          <h3 className="text-lg font-semibold text-center">{group.name}</h3>
                          <div className="flex items-center space-x-2">
                            {isCurrent && (
                              <Badge variant="default" className="bg-indigo-600">
                                Current
                              </Badge>
                            )}
                            <Badge variant="outline">
                              {group.privacy}
                            </Badge>
                          </div>
                        </div>
                        {group.description && (
                          <p className="text-sm text-muted-foreground text-center line-clamp-2">{group.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Created {new Date(group.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {selectedGroup && (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Group Settings - {selectedGroup.name}
                      </CardTitle>
                      <CardDescription>
                        Manage {selectedGroup.name}'s information and privacy settings
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <img
                        src={selectedGroup.avatar}
                        alt={selectedGroup.name}
                        className="h-10 w-10 rounded-full object-cover border-2 border-gray-200"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Group Avatar Upload */}
                  <div className="space-y-2">
                    <Label>Group Avatar</Label>
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        {groupSettings.avatar ? (
                          <img
                            src={groupSettings.avatar}
                            alt={groupSettings.groupName}
                            className="h-24 w-24 rounded-full object-cover border-2 border-gray-200"
                          />
                        ) : (
                          <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center border-2 border-gray-200">
                            <Users className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <input
                          type="file"
                          id="groupImageUpload"
                          accept="image/*"
                          onChange={handleGroupImageUpload}
                          className="hidden"
                          disabled={groupUploading}
                        />
                        <Label
                          htmlFor="groupImageUpload"
                          className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none"
                        >
                          {groupUploading ? (
                            <>
                              <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4" />
                              {groupSettings.avatar ? 'Change Avatar' : 'Upload Avatar'}
                            </>
                          )}
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Upload a group avatar (JPG, PNG, GIF)
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="groupName">Group Name</Label>
                      <Input
                        id="groupName"
                        value={groupSettings.groupName}
                        onChange={(e) => setGroupSettings(prev => ({ ...prev, groupName: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="privacy">Privacy Level</Label>
                      <Select
                        value={groupSettings.privacy}
                        onValueChange={(value) => setGroupSettings(prev => ({ ...prev, privacy: value as 'public' | 'private' | 'invite-only' }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">Public</SelectItem>
                          <SelectItem value="private">Private</SelectItem>
                          <SelectItem value="invite-only">Invite Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Group Description</Label>
                    <Textarea
                      id="description"
                      value={groupSettings.description}
                      onChange={(e) => setGroupSettings(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe your family group..."
                      rows={3}
                    />
                  </div>

                  {isGroupAdmin && (
                    <div className="pt-4 border-t">
                      <Button
                        onClick={() => setIsInviteDialogOpen(true)}
                        className="w-full sm:w-auto"
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        Invite Member
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <SettingsIcon className="h-5 w-5" />
                    Enabled Modules
                  </CardTitle>
                  <CardDescription>
                    Choose which features are available for {selectedGroup.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4">
                    {modules.map((module) => {
                      const IconComponent = getIconComponent(module.icon);
                      return (
                        <div
                          key={module.id}
                          className="flex flex-col items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex flex-col items-center space-y-3 mb-4">
                            <IconComponent className="h-5 w-5 text-muted-foreground" />
                            <div className="text-center">
                              <h3 className="font-medium">{module.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {module.description}
                              </p>
                            </div>
                          </div>
                          <Switch
                            checked={groupSettings.enabledModules[module.id as keyof typeof groupSettings.enabledModules] ?? module.defaultEnabled}
                            onCheckedChange={(checked: boolean) => {
                              setGroupSettings(prev => ({
                                ...prev,
                                enabledModules: {
                                  ...prev.enabledModules,
                                  [module.id]: checked
                                } as typeof prev.enabledModules
                              }));
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>


              <div className="flex justify-end">
                <Button 
                  onClick={handleGroupSettingsSave} 
                  className="flex items-center gap-2"
                  disabled={savingGroupSettings}
                >
                  {savingGroupSettings ? (
                    <>
                      <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Group Settings
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Create New Group Dialog */}
      <Dialog open={isCreateGroupDialogOpen} onOpenChange={setIsCreateGroupDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Group</DialogTitle>
            <DialogDescription>
              Create a new family group to organize activities and share with members.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Group Avatar Upload */}
            <div className="space-y-2">
              <Label>Group Avatar (Optional)</Label>
              <div className="flex items-center gap-4">
                <div className="relative">
                  {newGroup.avatar ? (
                    <img
                      src={newGroup.avatar}
                      alt="Group avatar"
                      className="h-20 w-20 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center border-2 border-gray-200">
                      <Users className="h-10 w-10 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    id="newGroupImageUpload"
                    accept="image/*"
                    onChange={handleNewGroupImageUpload}
                    className="hidden"
                  />
                  <Label
                    htmlFor="newGroupImageUpload"
                    className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md text-sm font-medium transition-colors"
                  >
                    <Upload className="h-4 w-4" />
                    {newGroup.avatar ? 'Change Avatar' : 'Upload Avatar'}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload a group avatar (JPG, PNG, GIF)
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newGroupName">Group Name *</Label>
              <Input
                id="newGroupName"
                value={newGroup.name}
                onChange={(e) => setNewGroup(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., The Valerio Family"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newGroupPrivacy">Privacy Level</Label>
              <Select
                value={newGroup.privacy}
                onValueChange={(value) => setNewGroup(prev => ({ ...prev, privacy: value as 'public' | 'private' | 'invite-only' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="invite-only">Invite Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newGroupDescription">Description (Optional)</Label>
              <Textarea
                id="newGroupDescription"
                value={newGroup.description}
                onChange={(e) => setNewGroup(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your family group..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateGroupDialogOpen(false);
                setNewGroup({
                  name: '',
                  description: '',
                  privacy: 'private',
                  avatar: ''
                });
              }}
              disabled={isCreatingGroup}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateGroup}
              disabled={isCreatingGroup || !newGroup.name.trim()}
            >
              {isCreatingGroup ? (
                <>
                  <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Group
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedGroup && (
        <InviteMemberDialog
          open={isInviteDialogOpen}
          onOpenChange={setIsInviteDialogOpen}
          groupId={selectedGroup.id}
          groupName={selectedGroup.name}
        />
      )}
    </div>
  );
}
