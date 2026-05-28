import { toast } from 'sonner';
import { useSettingsStore } from '@/store/settingsStore';

type Severity = 'info' | 'success' | 'warning' | 'error';

interface NotifyOptions {
  description?: string;
  severity?: Severity;
  critical?: boolean;
}

function parseTime(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

function isInQuietHours(start: string, end: string, now: Date = new Date()): boolean {
  const s = parseTime(start);
  const e = parseTime(end);
  if (s === null || e === null) return false;
  const cur = now.getHours() * 60 + now.getMinutes();
  if (s === e) return false;
  if (s < e) return cur >= s && cur < e;
  return cur >= s || cur < e;
}

let audioCtx: AudioContext | null = null;

function beep(): void {
  if (typeof window === 'undefined') return;
  try {
    if (!audioCtx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      audioCtx = new AC();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = 880;
    gain.gain.value = 0.05;
    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
  } catch (err) {
    console.error('[notify] beep failed:', err);
  }
}

async function fireNativeNotification(title: string, description?: string): Promise<void> {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  try {
    if (Notification.permission === 'default') {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') return;
    }
    if (Notification.permission !== 'granted') return;
    new Notification(title, { body: description });
  } catch (err) {
    console.error('[notify] native notification failed:', err);
  }
}

export function notify(title: string, opts: NotifyOptions = {}): void {
  const s = useSettingsStore.getState();
  const severity: Severity = opts.severity ?? 'info';
  const critical = opts.critical ?? severity === 'error';

  if (!critical && s.muteAllNonCriticalToasts) return;
  if (!critical && s.quietHoursEnabled && isInQuietHours(s.quietHoursStart, s.quietHoursEnd)) return;

  const duration = Math.max(1, s.toastDurationSeconds) * 1000;
  const toastOpts = opts.description ? { description: opts.description, duration } : { duration };

  switch (severity) {
    case 'success':
      toast.success(title, toastOpts);
      break;
    case 'warning':
      toast.warning(title, toastOpts);
      break;
    case 'error':
      toast.error(title, toastOpts);
      break;
    default:
      toast.info(title, toastOpts);
  }

  if (s.soundOnAlertEnabled && (severity === 'warning' || severity === 'error')) {
    beep();
  }
  if (s.nativeOsNotifications) {
    void fireNativeNotification(title, opts.description);
  }
}

export const __notifyInternals = { isInQuietHours, parseTime };
