import { Settings2, Palette, Database, Bell, RefreshCw, Keyboard, type LucideIcon } from 'lucide-react';

export type SettingsSection = 'general' | 'appearance' | 'data-defaults' | 'notifications' | 'sync' | 'keybindings';

export const SETTINGS_SECTIONS: { id: SettingsSection; label: string; description: string; icon: LucideIcon; reset?: 'appearance' | 'dataDefaults' | 'notifications' | 'sync' | 'keybindings' }[] = [
  { id: 'general', label: 'General', description: 'Updates, startup and data reset', icon: Settings2 },
  { id: 'appearance', label: 'Appearance', description: 'Theme, colour, layout and sidebar', icon: Palette, reset: 'appearance' },
  { id: 'data-defaults', label: 'Data & Defaults', description: 'Pre-filled values for new records', icon: Database, reset: 'dataDefaults' },
  { id: 'notifications', label: 'Notifications', description: 'Reminders, toasts and quiet hours', icon: Bell, reset: 'notifications' },
  { id: 'sync', label: 'Sync', description: 'Intervals, scope and history', icon: RefreshCw, reset: 'sync' },
  { id: 'keybindings', label: 'Keybindings', description: 'Change keyboard shortcuts', icon: Keyboard, reset: 'keybindings' },
];
