'use client';

import { useMemo, useState } from 'react';
import { ArrowLeft, ChevronRight, RotateCcw, Search, SearchX, X } from 'lucide-react';
import { ViewBar, ViewBarSpacer } from '@/components/ui/view-bar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { ConfirmPopover } from '@/components/ui/ConfirmPopover';
import { ProfileSettings } from '@/components/settings/ProfileSettings';
import { GeneralSettings } from '@/components/settings/GeneralSettings';
import { AppearanceSettings } from '@/components/settings/AppearanceSettings';
import { DataDefaultsSettings } from '@/components/settings/DataDefaultsSettings';
import { NotificationSettings } from '@/components/settings/NotificationSettings';
import { SyncSettings } from '@/components/settings/SyncSettings';
import { KeybindingsSettings } from '@/components/settings/KeybindingsSettings';
import { SETTINGS_SECTIONS, type SettingsSection } from '@/components/settings/sections';
import { SETTINGS_INDEX } from '@/lib/settings/settingsIndex';
import { useSettingsStore } from '@/store/settingsStore';

const SECTION_CONTENT: Record<SettingsSection, () => React.ReactNode> = {
  general: () => <GeneralSettings />,
  appearance: () => <AppearanceSettings />,
  'data-defaults': () => <DataDefaultsSettings />,
  notifications: () => <NotificationSettings />,
  sync: () => <SyncSettings />,
  keybindings: () => <KeybindingsSettings />,
};

export default function SettingsPage() {
  const [section, setSection] = useState<SettingsSection | 'home'>('home');
  const [query, setQuery] = useState('');
  const resetSection = useSettingsStore((s) => s.resetSection);
  const theme = useSettingsStore((s) => s.theme);
  const density = useSettingsStore((s) => s.density);

  const current = SETTINGS_SECTIONS.find((s) => s.id === section);
  const q = query.trim().toLowerCase();
  const hits = useMemo(
    () => (q ? SETTINGS_INDEX.filter((r) => `${r.label} ${r.description}`.toLowerCase().includes(q)) : []),
    [q],
  );

  const open = (id: SettingsSection | 'home') => {
    setSection(id);
    setQuery('');
  };

  return (
    <div className="mx-auto grid max-w-[860px] content-start gap-3">
      <ViewBar
        title={
          current && !q ? (
            <>
              <span className="font-medium text-muted-foreground">Settings ›</span> {current.label}
            </>
          ) : (
            'Settings'
          )
        }
      >
        {current && !q && (
          <button
            type="button"
            aria-label="Back to settings"
            onClick={() => open('home')}
            className="order-first grid size-[30px] place-items-center rounded-md text-muted-foreground hover:bg-sunken hover:text-foreground"
          >
            <ArrowLeft size={15} />
          </button>
        )}
        <ViewBarSpacer />
        {current?.reset && !q && (
          <ConfirmPopover
            message={`Reset ${current.label.toLowerCase()} settings to defaults?`}
            confirmLabel="Reset"
            onConfirm={() => current.reset && resetSection(current.reset)}
          >
            <Button variant="outline">
              <RotateCcw size={13} />
              Reset to defaults
            </Button>
          </ConfirmPopover>
        )}
      </ViewBar>

      <div className="relative max-w-[420px]">
        <Search size={14} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-faint" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a setting" aria-label="Find a setting" className="pl-7 pr-7" />
        {query && (
          <button type="button" aria-label="Clear search" onClick={() => setQuery('')} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X size={13} />
          </button>
        )}
      </div>

      {q ? (
        hits.length === 0 ? (
          <EmptyState icon={SearchX} title="No settings found" description='Try another word, like "theme" or "sync"' />
        ) : (
          <>
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
              {hits.length} {hits.length === 1 ? 'result' : 'results'} for &ldquo;{query.trim()}&rdquo;
            </p>
            <div>
              {hits.map((h) => (
                <button
                  key={h.label}
                  type="button"
                  onClick={() => open(h.section)}
                  className="setting-row flex w-full items-center gap-3 text-left transition-colors hover:bg-surface-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium">{h.label}</p>
                    <p className="text-xs text-muted-foreground">{h.description}</p>
                  </div>
                  <span className="shrink-0 text-xs text-accent-foreground">
                    {h.section === 'home' ? 'Profile' : SETTINGS_SECTIONS.find((s) => s.id === h.section)?.label}
                  </span>
                  <ChevronRight size={14} className="shrink-0 text-faint" />
                </button>
              ))}
            </div>
          </>
        )
      ) : section === 'home' ? (
        <>
          <ProfileSettings />
          <div className="grid gap-2 sm:grid-cols-2">
            {SETTINGS_SECTIONS.map(({ id, label, description, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => open(id)}
                className="flex items-center gap-3 rounded-[calc(var(--radius)*1.5)] border border-border bg-card px-3.5 py-3 text-left transition-colors hover:border-border-strong hover:bg-surface-2"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
                  <Icon size={18} />
                </span>
                <span className="min-w-0 flex-1">
                  <b className="block text-[13px] font-semibold">{label}</b>
                  <span className="block truncate text-xs text-muted-foreground">
                    {id === 'appearance' ? `${theme[0].toUpperCase()}${theme.slice(1)} · ${density}` : description}
                  </span>
                </span>
                <ChevronRight size={14} className="shrink-0 text-faint" />
              </button>
            ))}
          </div>
        </>
      ) : (
        SECTION_CONTENT[section]()
      )}
    </div>
  );
}
