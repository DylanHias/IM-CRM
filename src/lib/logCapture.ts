import { useSyncExternalStore } from 'react';

export type LogLevel = 'log' | 'info' | 'warn' | 'error';

export interface LogEntry {
  id: number;
  timestamp: number;
  level: LogLevel;
  message: string;
  tag: string | null;
}

const MAX_ENTRIES = 500;
let nextId = 1;
let entries: LogEntry[] = [];
const subscribers = new Set<() => void>();

function notify() {
  subscribers.forEach((cb) => cb());
}

function serializeArg(arg: unknown): string {
  if (typeof arg === 'string') return arg;
  if (arg instanceof Error) return arg.stack ?? arg.message;
  if (arg === null) return 'null';
  if (arg === undefined) return 'undefined';
  try {
    return JSON.stringify(arg);
  } catch {
    return String(arg);
  }
}

function extractTag(firstArg: unknown): string | null {
  if (typeof firstArg !== 'string') return null;
  const match = firstArg.match(/^\[[\w-]+\]/);
  return match ? match[0] : null;
}

function pushEntry(level: LogLevel, args: unknown[]) {
  const tag = extractTag(args[0]);
  const message = args.map(serializeArg).join(' ');
  entries = [...entries, { id: nextId++, timestamp: Date.now(), level, message, tag }].slice(-MAX_ENTRIES);
  notify();
}

// Save originals and patch
const originals = {
  log: console.log.bind(console),
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
};

console.log = (...args: unknown[]) => { originals.log(...args); pushEntry('log', args); };
console.info = (...args: unknown[]) => { originals.info(...args); pushEntry('info', args); };
console.warn = (...args: unknown[]) => { originals.warn(...args); pushEntry('warn', args); };
console.error = (...args: unknown[]) => { originals.error(...args); pushEntry('error', args); };

// Capture unhandled errors
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    pushEntry('error', [`[unhandled] ${event.message} at ${event.filename}:${event.lineno}`]);
  });
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason instanceof Error ? event.reason.stack ?? event.reason.message : String(event.reason);
    pushEntry('error', [`[unhandled] Unhandled promise rejection: ${reason}`]);
  });
}

export function clearLogs() {
  entries = [];
  notify();
}

function getSnapshot(): LogEntry[] {
  return entries;
}

function subscribe(callback: () => void): () => void {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
}

export function useLogEntries(): LogEntry[] {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
