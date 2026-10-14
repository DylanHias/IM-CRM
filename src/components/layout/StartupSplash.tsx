import Image from 'next/image';
import { Loader2 } from 'lucide-react';

/** Full-window loading state shown while the app starts (database, sign-in check, first route). */
export function StartupSplash() {
  return (
    <div role="status" className="grid h-screen place-content-center justify-items-center gap-3 bg-background text-center">
      <Image src="/images/icon.png" alt="" width={48} height={48} priority className="rounded-lg animate-in fade-in zoom-in-95 duration-500" />
      <Loader2 size={20} className="animate-spin text-primary" />
      <span className="text-[13px] text-muted-foreground animate-in fade-in duration-700">Loading…</span>
    </div>
  );
}
