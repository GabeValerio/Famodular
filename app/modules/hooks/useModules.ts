import { useState, useEffect } from 'react';
import { ModuleConfig, Group, User } from '@/types/family';

export interface ModuleDefinition {
  id: string;
  name: string;
  description: string;
  icon: string; // Lucide icon name
  category: 'group' | 'user';
  defaultEnabled: boolean;
  route: string;
  isActive: boolean;
}

// Hook to fetch available modules from database
export function useModules() {
  const [modules, setModules] = useState<ModuleDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/modules');
      if (!response.ok) throw new Error('Failed to fetch modules');
      const data = await response.json();
      setModules(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch modules');
    } finally {
      setLoading(false);
    }
  };

  const getModuleRegistry = () => {
    const registry: Record<string, ModuleDefinition> = {};
    modules.forEach(module => {
      registry[module.id] = module;
    });
    return registry;
  };

  const isModuleEnabled = (
    group: Group | null,
    moduleId: string,
    user?: User | null
  ): boolean => {
    const module = modules.find(m => m.id === moduleId);
    if (!module) return false;

    // In self view (group is null), check user module configuration
    if (group === null) {
      if (user?.enabledModules) {
        // If user has enabledModules configured, check if module is explicitly set
        // If module key exists, use its value; if not, it's not enabled (strict check)
        const enabledModules = user.enabledModules as unknown as Record<string, boolean>;
        const moduleValue = enabledModules[moduleId];
        return moduleValue === true;
      }
      return module.defaultEnabled;
    }

    // Group view: check group module configuration
    // Note: category is informational only - modules can be enabled in any context
    if (group.enabledModules) {
      // If group has enabledModules configured, check if module is explicitly set
      // If module key exists, use its value; if not, it's not enabled (strict check)
      const enabledModules = group.enabledModules as unknown as Record<string, boolean>;
      const moduleValue = enabledModules[moduleId];
      return moduleValue === true;
    }
    
    return module.defaultEnabled;
  };

  const getEnabledModules = (group: Group | null, user?: User | null): string[] => {
    if (group === null) {
      // Self view: return user-enabled modules
      if (!user) return modules.filter(m => m.defaultEnabled).map(m => m.id);
      const userModules = user.enabledModules || {};
      return Object.entries(userModules)
        .filter(([_, enabled]) => enabled)
        .map(([id]) => id);
    }

    // Group view: return group-enabled modules
    const groupModules = group.enabledModules || {};
    return Object.entries(groupModules)
      .filter(([_, enabled]) => enabled)
      .map(([id]) => id);
  };

  const getGroupModules = (): ModuleDefinition[] => {
    return modules.filter(m => m.category === 'group');
  };

  const getUserModules = (): ModuleDefinition[] => {
    return modules.filter(m => m.category === 'user');
  };

  return {
    modules,
    loading,
    error,
    getModuleRegistry,
    isModuleEnabled,
    getEnabledModules,
    getGroupModules,
    getUserModules,
    refetch: fetchModules,
  };
}