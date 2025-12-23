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
  FileText,
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
  FileText,
};

export function getIconComponent(iconName: string): LucideIcon {
  const icon = iconMap[iconName];
  if (!icon) {
    return Settings; // Default fallback icon
  }
  return icon;
}