import { format, formatDistanceToNow, isToday, isYesterday, parseISO } from 'date-fns';

export function formatDate(dateStr: string): string {
  const date = parseISO(dateStr);
  return format(date, 'dd MMM yyyy');
}

export function formatDateTime(dateStr: string): string {
  const date = parseISO(dateStr);
  return format(date, 'dd MMM yyyy HH:mm');
}

export function formatRelative(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return formatDistanceToNow(date, { addSuffix: true });
}

export function formatDueDate(dateStr: string): { label: string; isOverdue: boolean } {
  const date = parseISO(dateStr);
  const now = new Date();
  const isOverdue = date < now;
  if (isToday(date)) return { label: 'Today', isOverdue: false };
  if (isYesterday(date)) return { label: 'Yesterday', isOverdue: true };
  return {
    label: format(date, 'dd MMM yyyy'),
    isOverdue,
  };
}

export function toISOString(date: Date = new Date()): string {
  return date.toISOString();
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

/** Returns current local datetime in "YYYY-MM-DDThh:mm" format for datetime-local inputs */
export function nowDatetimeLocal(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Returns a datetime-local string offset by the given number of hours from the input */
export function addHoursLocal(datetimeLocal: string, hours: number): string {
  const d = new Date(datetimeLocal);
  d.setHours(d.getHours() + hours);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Converts an ISO string to "YYYY-MM-DDThh:mm" format for datetime-local inputs */
export function isoToDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
