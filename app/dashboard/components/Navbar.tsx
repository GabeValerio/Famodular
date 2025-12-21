"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/app/components/ui/button";
import { LayoutDashboard, Settings } from "lucide-react";
import { GroupDropdown } from "./GroupDropdown";
import { useGroup } from "@/lib/GroupContext";
import { useModules } from "@/app/modules/hooks/useModules";
import { getIconComponent } from "@/app/modules/utils/iconUtils";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  moduleId?: string;
  alwaysVisible?: boolean;
}

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const { currentGroup, currentUser, isSelfView } = useGroup();
  const { modules, loading, isModuleEnabled } = useModules();

  // Create dynamic navigation items from modules
  const dynamicItems: NavItem[] = modules.map(module => ({
    title: module.name,
    href: module.route,
    icon: getIconComponent(module.icon),
    moduleId: module.id,
  }));

  // Combine all navigation items
  const allItems: NavItem[] = [
    {
      title: "Overview",
      href: "/dashboard",
      icon: LayoutDashboard,
      alwaysVisible: true, // Always show overview
    },
    ...dynamicItems,
    {
      title: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
      alwaysVisible: true, // Always show settings
    }
  ];

  // Filter items based on enabled modules
  const visibleItems = allItems.filter(item => {
    // Always show items marked as alwaysVisible (Overview, Settings)
    if (item.alwaysVisible) {
      return true;
    }

    // If item has a moduleId, check if it's enabled
    if (item.moduleId) {
      return isModuleEnabled(currentGroup, item.moduleId, currentUser);
    }

    // Items without moduleId are always visible
    return true;
  });

  // Show loading state
  if (loading) {
    return (
      <div className={cn("border-b bg-background", className)}>
        <div className="px-4 py-4">
          <div className="flex items-center space-x-6">
            <GroupDropdown />
            <div className="flex items-center space-x-2">
              <div className="text-sm text-muted-foreground">Loading modules...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("border-b bg-background", className)}>
      <div className="px-4 py-4">
        <div className="flex items-center space-x-6">
          {/* Group Dropdown */}
          <GroupDropdown />

          {/* Navigation Items - only show enabled modules */}
          <div className="flex items-center space-x-2 overflow-x-auto flex-1">
            {visibleItems.map((item) => (
              <Button
                key={item.href}
                variant={pathname === item.href ? "secondary" : "ghost"}
                className="flex flex-col items-center h-auto p-2 min-w-[80px] border-0 hover:bg-accent"
                asChild
              >
                <Link href={item.href}>
                  <item.icon className="h-4 w-4 mb-1" />
                  <span className="text-xs text-center leading-tight">{item.title}</span>
                </Link>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

