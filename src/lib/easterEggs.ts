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
const BIRTHDAY_LAST_MESSAGE_KEY = 'crm-easter-egg-birthday-last-message';

export const BIRTHDAY_MESSAGES: readonly string[] = [
  "Another trip around the sun, another excuse for cake. We hope today is loud, sweet, and exactly your kind of fun. 🎂",
  "Wishing you a day so good it makes the rest of the year a little jealous. Soak up every second. 🥂",
  "May your coffee be strong, your cake be unreasonably large, and your day be full of the people who make you laugh hardest. ☕",
  "Today is officially yours. Dessert first, naps encouraged, no apologies required. 🎉",
  "Cheers to you — the cake, the candles, and everyone lucky enough to know you. Have a beautiful one. 🥂",
  "Sending good vibes, warm hugs, and at least one slice of cake we wish we could share. 🎂",
  "Hope your day is packed with little joys, big smiles, and zero responsibilities you don't feel like having.",
  "Another year of being unmistakably you — which, honestly, is reason enough to celebrate. 🎈",
  "May today be soft, sweet, and just chaotic enough to be fun. You deserve all of it. 🎂",
  "Wishing you a birthday filled with laughter loud enough for the neighbors to complain. 🎉",
  "Here's to another year of being the kind of person other people are glad to know. Enjoy every minute. 🥳",
  "Cake is calling, friends are gathering, and the universe is conspiring to make today wonderful. Go enjoy it. 🎂",
  "Hope your birthday comes with extra frosting, fewer alarms, and at least one moment that takes your breath away. 🎁",
  "Take the day slow. Eat what you want. Laugh too loud. You've earned all of it. 🥂",
  "Wishing you a year full of small wins, good people, and the kind of stories worth retelling. 🌟",
  "Another lap around the sun, completed beautifully. Hope today is everything you'd wish for yourself. 🎈",
  "May this year bring more of what makes you smile and less of whatever was annoying you last week. 🎂",
  "Hope someone you love makes you breakfast, someone funny makes you snort-laugh, and someone reminds you how much you mean to them today. 💛",
  "Cake is a love language. We hope yours is fluent today. 🎂",
  "Wishing you a day where everything goes a little your way — even the tiny things, like green lights and finding a good parking spot. 🚦",
  "May today feel like that one perfect song on repeat — warm, familiar, and impossible not to smile at. 🎶",
  "Hope your birthday is the kind you'll still grin about next Wednesday for absolutely no reason. 🎉",
  "Another year, another excuse to do whatever you want and call it a tradition. Use it well. 🥳",
  "Sending wishes for a day stuffed with cake, full of hugs, and gloriously short on to-do lists. 🎂",
  "Hope today brings you peace, mischief, dessert, and the people who make all three better. 🎈",
];

export function pickBirthdayMessage(): string {
  if (typeof window === 'undefined') return BIRTHDAY_MESSAGES[0];
  const lastRaw = window.localStorage.getItem(BIRTHDAY_LAST_MESSAGE_KEY);
  const lastIndex = lastRaw === null ? -1 : Number.parseInt(lastRaw, 10);
  let index = Math.floor(Math.random() * BIRTHDAY_MESSAGES.length);
  if (BIRTHDAY_MESSAGES.length > 1 && index === lastIndex) {
    index = (index + 1) % BIRTHDAY_MESSAGES.length;
  }
  window.localStorage.setItem(BIRTHDAY_LAST_MESSAGE_KEY, String(index));
  return BIRTHDAY_MESSAGES[index];
}

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
