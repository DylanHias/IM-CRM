'use client';

import { useEffect } from 'react';
import { useSettingsStore } from '@/store/settingsStore';

function resolveTheme(theme: 'light' | 'dark' | 'system'): 'light' | 'dark' {
  if (theme !== 'system') return theme;
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  const m = /^#?([0-9a-f]{6}|[0-9a-f]{3})$/i.exec(hex.trim());
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let s = 0;
  let hh = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        hh = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        hh = (b - r) / d + 2;
        break;
      case b:
        hh = (r - g) / d + 4;
        break;
    }
    hh *= 60;
  }
  return { h: Math.round(hh), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function ThemeSync() {
  const theme = useSettingsStore((s) => s.theme);
  const accentColor = useSettingsStore((s) => s.accentColor);
  const customAccentHex = useSettingsStore((s) => s.customAccentHex);
  const density = useSettingsStore((s) => s.density);
  const fontScale = useSettingsStore((s) => s.fontScale);
  const fontFamily = useSettingsStore((s) => s.fontFamily);
  const tableRowDensity = useSettingsStore((s) => s.tableRowDensity);
  const highContrast = useSettingsStore((s) => s.highContrast);
  const reduceMotion = useSettingsStore((s) => s.reduceMotion);
  const autoThemeByTime = useSettingsStore((s) => s.autoThemeByTime);
  const autoThemeDarkStartHour = useSettingsStore((s) => s.autoThemeDarkStartHour);
  const autoThemeLightStartHour = useSettingsStore((s) => s.autoThemeLightStartHour);

  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = () => {
      let resolved: 'light' | 'dark';
      if (autoThemeByTime) {
        const hour = new Date().getHours();
        const darkStart = autoThemeDarkStartHour;
        const lightStart = autoThemeLightStartHour;
        if (darkStart > lightStart) {
          resolved = hour >= darkStart || hour < lightStart ? 'dark' : 'light';
        } else {
          resolved = hour >= darkStart && hour < lightStart ? 'dark' : 'light';
        }
      } else {
        resolved = resolveTheme(theme);
      }
      if (resolved === 'dark') {
        root.classList.add('dark');
        root.style.colorScheme = 'dark';
      } else {
        root.classList.remove('dark');
        root.style.colorScheme = 'light';
      }
    };

    applyTheme();

    if (autoThemeByTime) {
      const interval = window.setInterval(applyTheme, 60_000);
      return () => window.clearInterval(interval);
    }

    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      mq.addEventListener('change', applyTheme);
      return () => mq.removeEventListener('change', applyTheme);
    }
  }, [theme, autoThemeByTime, autoThemeDarkStartHour, autoThemeLightStartHour]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('accent-blue', 'accent-purple', 'accent-green', 'accent-orange', 'accent-red', 'accent-pink');
    if (customAccentHex) {
      const hsl = hexToHsl(customAccentHex);
      if (hsl) {
        root.style.setProperty('--primary', `${hsl.h} ${hsl.s}% ${hsl.l}%`);
        root.style.setProperty('--ring', `${hsl.h} ${hsl.s}% ${hsl.l}%`);
        return;
      }
    }
    root.style.removeProperty('--primary');
    root.style.removeProperty('--ring');
    if (accentColor !== 'blue') {
      root.classList.add(`accent-${accentColor}`);
    }
  }, [accentColor, customAccentHex]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('density-comfortable', 'density-cozy', 'density-compact');
    root.classList.add(`density-${density}`);
  }, [density]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('font-scale-sm', 'font-scale-md', 'font-scale-lg');
    root.classList.add(`font-scale-${fontScale}`);
  }, [fontScale]);

  useEffect(() => {
    const body = document.body;
    body.classList.remove('font-sans', 'font-system', 'font-serif', 'font-mono');
    if (fontFamily !== 'sans') {
      body.classList.add(`font-${fontFamily}`);
    }
  }, [fontFamily]);

  useEffect(() => {
    document.documentElement.setAttribute('data-table-density', tableRowDensity);
  }, [tableRowDensity]);

  useEffect(() => {
    document.documentElement.classList.toggle('high-contrast', highContrast);
  }, [highContrast]);

  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', reduceMotion);
  }, [reduceMotion]);

  return null;
}
