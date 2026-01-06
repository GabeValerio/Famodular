// Shared module exports
// This file ensures widgets are registered when modules are imported

// Import all module widgets to register them
// This is a side-effect import that registers widgets
import '@/app/modules/checkins';
import '@/app/modules/finance';
import '@/app/modules/goals';
import '@/app/modules/chat';
import '@/app/modules/timetracker';
import './widgets'; // Import shared widgets

// Export shared utilities
export { useDashboardWidgets } from './hooks/useDashboardWidgets';
export { useModuleAccess } from './hooks/useModuleAccess';
export { BookModal } from './components/BookModal';
export * from './types/dashboard';
export * from './registry/widgetRegistry';
export * from './utils';
