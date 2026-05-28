import confetti from 'canvas-confetti';
import { useSettingsStore } from '@/store/settingsStore';

const EE_ENABLED_KEY = 'crm-easter-eggs-enabled';

export function isEasterEggsEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  // Honor reduce-motion accessibility setting from the existing store
  try {
    if (useSettingsStore.getState().reduceMotion) return false;
  } catch {
    // store may not be hydrated yet — fall through
  }
  const v = window.localStorage.getItem(EE_ENABLED_KEY);
  // Default: on
  return v === null ? true : v === '1';
}

export function setEasterEggsEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(EE_ENABLED_KEY, enabled ? '1' : '0');
}

const BRAND_COLORS = ['#1f6feb', '#7c3aed', '#16a34a', '#f97316', '#ef4444', '#ec4899', '#fbbf24'];

export function realisticConfetti(): void {
  if (!isEasterEggsEnabled()) return;
  const count = 200;
  const defaults: confetti.Options = { origin: { y: 0.7 }, colors: BRAND_COLORS, disableForReducedMotion: true };
  const fire = (particleRatio: number, opts: confetti.Options) => {
    confetti({ ...defaults, ...opts, particleCount: Math.floor(count * particleRatio) });
  };
  fire(0.25, { spread: 26, startVelocity: 55 });
  fire(0.2, { spread: 60 });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
  fire(0.1, { spread: 120, startVelocity: 45 });
}

// Sustained left+right cannons — used by the birthday modal.
export function sideCannons(durationMs = 4000): void {
  if (!isEasterEggsEnabled()) return;
  const end = Date.now() + durationMs;
  const colors = ['#ec4899', '#fbbf24', '#7c3aed', '#16a34a', '#1f6feb'];
  (function frame() {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.65 },
      colors,
      zIndex: 9999,
      disableForReducedMotion: true,
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.65 },
      colors,
      zIndex: 9999,
      disableForReducedMotion: true,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

export function salesModeBurst(): void {
  if (!isEasterEggsEnabled()) return;
  realisticConfetti();
  setTimeout(realisticConfetti, 250);
  setTimeout(realisticConfetti, 500);
}

function fireworksLoop(durationMs: number): void {
  const animationEnd = Date.now() + durationMs;
  const defaults: confetti.Options = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100, disableForReducedMotion: true };
  const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;
  const interval = window.setInterval(() => {
    const timeLeft = animationEnd - Date.now();
    if (timeLeft <= 0) {
      window.clearInterval(interval);
      return;
    }
    const particleCount = 50 * (timeLeft / durationMs);
    confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
    confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
  }, 250);
}

function starsLoop(durationMs: number): void {
  const animationEnd = Date.now() + durationMs;
  const defaults: confetti.Options = {
    spread: 360,
    ticks: 50,
    gravity: 0,
    decay: 0.94,
    startVelocity: 30,
    colors: ['#FFE400', '#FFBD00', '#E89400', '#FFCA6C', '#FDFFB8'],
    zIndex: 100,
    disableForReducedMotion: true,
  };
  const shoot = () => {
    confetti({ ...defaults, particleCount: 40, scalar: 1.2, shapes: ['star'], origin: { x: 0.5, y: 0.5 } });
    confetti({ ...defaults, particleCount: 10, scalar: 0.75, shapes: ['circle'], origin: { x: 0.5, y: 0.5 } });
  };
  const interval = window.setInterval(() => {
    if (Date.now() > animationEnd) {
      window.clearInterval(interval);
      return;
    }
    shoot();
  }, 200);
  shoot();
}

export function whaleCelebration(durationMs = 6000): void {
  if (!isEasterEggsEnabled()) return;
  fireworksLoop(durationMs);
  starsLoop(durationMs);
}

const FIRST_WIN_KEY = 'crm-easter-egg-first-win-day';

export function isFirstWinOfDay(): boolean {
  if (typeof window === 'undefined') return false;
  const today = new Date().toISOString().slice(0, 10);
  const stored = window.localStorage.getItem(FIRST_WIN_KEY);
  if (stored === today) return false;
  window.localStorage.setItem(FIRST_WIN_KEY, today);
  return true;
}

const SALES_MODE_KEY = 'crm-easter-egg-sales-mode-armed';

export function armSalesMode(): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(SALES_MODE_KEY, '1');
}

export function isSalesModeArmed(): boolean {
  if (typeof window === 'undefined') return false;
  return window.sessionStorage.getItem(SALES_MODE_KEY) === '1';
}

const BIRTHDAY_SHOWN_KEY = 'crm-easter-egg-birthday-shown';

export function markBirthdayShown(): void {
  if (typeof window === 'undefined') return;
  const today = new Date();
  const yearKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  window.localStorage.setItem(BIRTHDAY_SHOWN_KEY, yearKey);
}

export function shouldShowBirthdayToday(birthdayIso: string | null): boolean {
  if (!birthdayIso || typeof window === 'undefined') return false;
  const bday = new Date(birthdayIso);
  if (Number.isNaN(bday.getTime())) return false;
  const today = new Date();
  if (bday.getMonth() !== today.getMonth() || bday.getDate() !== today.getDate()) return false;
  const yearKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  return window.localStorage.getItem(BIRTHDAY_SHOWN_KEY) !== yearKey;
}

const ONE_MILLION = 1_000_000;

export function isWhaleDeal(actualRevenue: number, _currency: string): boolean {
  void _currency;
  return actualRevenue >= ONE_MILLION;
}
