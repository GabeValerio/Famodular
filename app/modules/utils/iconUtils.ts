import {
  Calendar,
  Map,
  Target,
  Wallet,
  HeartHandshake,
  MessagesSquare,
  ShoppingBag,
  CheckSquare,
  LayoutDashboard,
  Settings,
  Sprout,
  LucideIcon
} from 'lucide-react';

// Map of icon names to Lucide components
const iconMap: Record<string, LucideIcon> = {
  Calendar,
  Map,
  Target,
  Wallet,
  HeartHandshake,
  MessagesSquare,
  ShoppingBag,
  CheckSquare,
  LayoutDashboard,
  Settings,
  Sprout,
};

export function getIconComponent(iconName: string): LucideIcon {
  const icon = iconMap[iconName];
  if (!icon) {
    console.warn(`Icon "${iconName}" not found, using default`);
    return Settings; // Default fallback icon
  }
  return icon;
}