'use client';

import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SettingRow } from './SettingRow';
import {
  isEasterEggsEnabled,
  setEasterEggsEnabled,
  realisticConfetti,
  whaleCelebration,
  sideCannons,
} from '@/lib/easterEggs';

export function EasterEggsSettings() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    setEnabled(isEasterEggsEnabled());
  }, []);

  const toggle = (v: boolean) => {
    setEnabled(v);
    setEasterEggsEnabled(v);
  };

  return (
    <>
      <Separator />
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-muted-foreground" />
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Easter eggs</p>
        </div>

        <SettingRow
          label="Celebrate wins"
          description="Confetti on your first won opp of the day, fireworks for >€1M ARR, and a birthday surprise."
        >
          <Switch checked={enabled} onCheckedChange={toggle} />
        </SettingRow>

        {enabled && (
          <SettingRow label="Preview" description="See what each animation looks like">
            <div className="flex gap-1.5">
              <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => realisticConfetti()}>
                Confetti
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => whaleCelebration(4000)}>
                Whale
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => sideCannons(3000)}>
                Birthday
              </Button>
            </div>
          </SettingRow>
        )}

        {enabled && (
          <p className="text-[11px] text-muted-foreground italic">
            Tip: try the Konami code (↑↑↓↓←→←→ B A) anywhere in the app.
          </p>
        )}
      </div>
    </>
  );
}
