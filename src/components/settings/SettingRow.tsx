import type { ReactNode } from 'react';

interface SettingRowProps {
  label: string;
  description: ReactNode;
  children: ReactNode;
}

/** One setting: label and short explanation on the left, its control on the right. Consecutive rows join into one card. */
export function SettingRow({ label, description, children }: SettingRowProps) {
  return (
    <div className="setting-row flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-[13px] font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}
