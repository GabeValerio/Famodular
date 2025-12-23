"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useGroup } from "@/lib/GroupContext";
import { InviteMemberDialog } from "./InviteMemberDialog";
import { User, Settings, Globe, LogOut, UserPlus } from "lucide-react";

interface GroupDropdownProps {
  className?: string;
}

export function GroupDropdown({ className }: GroupDropdownProps) {
  const { currentGroup, groups, isSelfView, setCurrentGroup, setSelfView, currentUser } = useGroup();
  const { data: session } = useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [inviteDialogGroup, setInviteDialogGroup] = useState<{ id: string; name: string } | null>(null);
  const [groupAdminStatus, setGroupAdminStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleGroupSelect = (groupId: string | "self" | "world") => {
    if (groupId === "self") {
      setSelfView();
      setIsDropdownOpen(false);
    } else if (groupId === "world") {
      // Handle "World View" option - shows all groups or global view
      setIsDropdownOpen(false);
    } else {
      const group = groups.find(g => g.id === groupId);
      if (group) {
        setCurrentGroup(group);
        setIsDropdownOpen(false);
      }
    }
  };

  const handleSignOut = async () => {
    setIsDropdownOpen(false);
    await signOut({ callbackUrl: "/login" });
  };

  // Check admin status for all groups
  useEffect(() => {
    const checkAdminStatus = async () => {
      const statusMap: Record<string, boolean> = {};
      for (const group of groups) {
        try {
          const response = await fetch(`/api/groups/${group.id}/members/me`);
          if (response.ok) {
            const data = await response.json();
            statusMap[group.id] = data.isAdmin || false;
          }
        } catch (error) {
          statusMap[group.id] = false;
        }
      }
      setGroupAdminStatus(statusMap);
    };

    if (groups.length > 0) {
      checkAdminStatus();
    }
  }, [groups]);

  const handleInviteClick = (e: React.MouseEvent, groupId: string, groupName: string) => {
    e.stopPropagation();
    setIsDropdownOpen(false);
    setInviteDialogGroup({ id: groupId, name: groupName });
  };

  const handleDoubleClick = () => {
    if (isSelfView) {
      // Switch to first group if available
      if (groups.length > 0) {
        setCurrentGroup(groups[0]);
      }
    } else if (currentGroup) {
      // Find current group index
      const currentIndex = groups.findIndex(g => g.id === currentGroup.id);
      
      // If we found the current group and there's a next group, go to it
      if (currentIndex !== -1 && currentIndex < groups.length - 1) {
        setCurrentGroup(groups[currentIndex + 1]);
      } else {
        // If we're at the last group, cycle back to self view
        setSelfView();
      }
    }
  };

  // Get display info for current view
  const displayName = isSelfView 
    ? (currentUser?.name || session?.user?.name || "Self") 
    : (currentGroup?.name || "Select Group");
  const displayAvatar = isSelfView 
    ? currentUser?.avatar // Use user's avatar in self view
    : currentGroup?.avatar;

  return (
    <div className={cn("relative flex-shrink-0 flex flex-col items-center", className)} ref={dropdownRef}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        onDoubleClick={handleDoubleClick}
        className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-full"
      >
        {displayAvatar ? (
          <img
            src={displayAvatar}
            alt={displayName}
            className="w-8 h-8 rounded-full object-cover cursor-pointer"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center cursor-pointer">
            <User className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
      </button>
      <span className="text-[10px] text-center mt-1 leading-tight whitespace-nowrap">{displayName}</span>
      {isDropdownOpen && (
        <div className="absolute top-full right-0 mt-2 w-56 rounded-md border bg-popover text-popover-foreground shadow-md z-50">
          <div className="p-1">
            <div
              className={cn(
                "flex items-center justify-between rounded-sm py-1.5 pl-2 pr-2 text-sm hover:bg-accent",
                isSelfView && "bg-accent"
              )}
            >
              <button
                onClick={() => handleGroupSelect("self")}
                className="flex items-center space-x-2 flex-1 outline-none hover:text-accent-foreground cursor-pointer"
              >
                {currentUser?.avatar ? (
                  <img 
                    src={currentUser.avatar} 
                    alt={currentUser.name || "Self"} 
                    className="w-4 h-4 rounded-full object-cover" 
                  />
                ) : (
                  <User className="h-4 w-4" />
                )}
                <span>Self</span>
              </button>
              <Link
                href="/dashboard/settings?tab=personal"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDropdownOpen(false);
                }}
                className="p-1 rounded-sm hover:bg-background/50 outline-none focus:ring-2 focus:ring-ring"
                title="Settings"
              >
                <Settings className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </Link>
            </div>
            <button
              onClick={() => handleGroupSelect("world")}
              className="w-full flex items-center space-x-2 rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none hover:bg-accent hover:text-accent-foreground cursor-pointer"
            >
              <Globe className="h-4 w-4" />
              <span>World View</span>
            </button>
            {groups.map(group => (
              <div
                key={group.id}
                className={cn(
                  "flex items-center justify-between rounded-sm py-1.5 pl-2 pr-2 text-sm hover:bg-accent",
                  currentGroup?.id === group.id && "bg-accent"
                )}
              >
                <button
                  onClick={() => handleGroupSelect(group.id)}
                  className="flex items-center space-x-2 flex-1 outline-none hover:text-accent-foreground cursor-pointer"
                >
                  <img src={group.avatar} alt={group.name} className="w-5 h-5 rounded-full object-cover" />
                  <span>{group.name}</span>
                </button>
                <div className="flex items-center gap-1">
                  {groupAdminStatus[group.id] && (
                    <button
                      onClick={(e) => handleInviteClick(e, group.id, group.name)}
                      className="p-1 rounded-sm hover:bg-background/50 outline-none focus:ring-2 focus:ring-ring"
                      title="Invite member"
                    >
                      <UserPlus className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                    </button>
                  )}
                  <Link
                    href={`/dashboard/settings?group=${group.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsDropdownOpen(false);
                    }}
                    className="p-1 rounded-sm hover:bg-background/50 outline-none focus:ring-2 focus:ring-ring"
                    title="Settings"
                  >
                    <Settings className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </Link>
                </div>
              </div>
            ))}
            <div className="border-t my-1" />
            <button
              onClick={handleSignOut}
              className="w-full flex items-center space-x-2 rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none hover:bg-accent hover:text-accent-foreground cursor-pointer text-destructive"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {inviteDialogGroup && (
        <InviteMemberDialog
          open={!!inviteDialogGroup}
          onOpenChange={(open) => {
            if (!open) {
              setInviteDialogGroup(null);
            }
          }}
          groupId={inviteDialogGroup.id}
          groupName={inviteDialogGroup.name}
        />
      )}
    </div>
  );
}
