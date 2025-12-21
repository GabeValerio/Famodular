// Re-export the dynamic module system
export { useModules } from './hooks/useModules';
export type { ModuleDefinition } from './hooks/useModules';

// Legacy compatibility - these will be removed once all components are updated
import { Group, ModuleConfig, User } from '@/types/family';
export type ModuleId = keyof ModuleConfig;

// Legacy functions for backward compatibility - these should be replaced with useModules hook
export function isModuleEnabled(
  group: Group | null,
  moduleId: ModuleId,
  user?: User | null
): boolean {
  // This is a temporary fallback - components should use useModules hook instead
  // Default logic for backward compatibility
  const defaultModules = {
    calendar: true,
    todos: true,
    chat: group !== null, // Only for groups
  };

  if (group === null) {
    return user?.enabledModules?.[moduleId] ?? (defaultModules[moduleId as keyof typeof defaultModules] || false);
  }
  return group.enabledModules?.[moduleId] ?? (defaultModules[moduleId as keyof typeof defaultModules] || false);
}

export function getEnabledModules(group: Group | null, user?: User | null): ModuleId[] {
  if (group === null) {
    if (!user?.enabledModules) return ['calendar', 'todos'] as ModuleId[];
    return Object.entries(user.enabledModules)
      .filter(([_, enabled]) => enabled)
      .map(([id]) => id as ModuleId);
  }

  if (!group.enabledModules) return ['calendar', 'chat'] as ModuleId[];
  return Object.entries(group.enabledModules)
    .filter(([_, enabled]) => enabled)
    .map(([id]) => id as ModuleId);
}
