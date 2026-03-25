import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatDate, formatDateTime, formatRelative, formatDueDate, toISOString, todayISO } from '../dateUtils';

describe('dateUtils', () => {
  describe('formatDate', () => {
    it('formats a standard date', () => {
      expect(formatDate('2026-03-25T12:00:00.000Z')).toBe('25 Mar 2026');
    });

    it('formats a date at start of year', () => {
      expect(formatDate('2026-01-01T00:00:00.000Z')).toBe('01 Jan 2026');
    });

    it('formats a date at end of year', () => {
      expect(formatDate('2026-12-31T12:00:00.000Z')).toBe('31 Dec 2026');
    });

    it('handles different years', () => {
      expect(formatDate('2020-06-15T00:00:00.000Z')).toBe('15 Jun 2020');
    });
  });

  describe('formatDateTime', () => {
    it('includes time in output', () => {
      expect(formatDateTime('2026-03-25T14:30:00.000Z')).toMatch(/25 Mar 2026/);
      expect(formatDateTime('2026-03-25T14:30:00.000Z')).toMatch(/\d{2}:\d{2}/);
    });
  });

  describe('formatRelative', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-03-25T12:00:00.000Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns "Today" for today', () => {
      expect(formatRelative('2026-03-25T08:00:00.000Z')).toBe('Today');
    });

    it('returns "Yesterday" for yesterday', () => {
      expect(formatRelative('2026-03-24T15:00:00.000Z')).toBe('Yesterday');
    });

    it('returns relative text for older dates', () => {
      const result = formatRelative('2026-03-15T12:00:00.000Z');
      expect(result).toContain('ago');
    });

    it('handles dates from weeks ago', () => {
      const result = formatRelative('2026-03-01T12:00:00.000Z');
      expect(result).toContain('ago');
    });
  });

  describe('formatDueDate', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-03-25T12:00:00.000Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns "Today" and not overdue for today', () => {
      const result = formatDueDate('2026-03-25T12:00:00.000Z');
      expect(result.label).toBe('Today');
      expect(result.isOverdue).toBe(false);
    });

    it('returns "Yesterday" and overdue for yesterday', () => {
      const result = formatDueDate('2026-03-24T12:00:00.000Z');
      expect(result.label).toBe('Yesterday');
      expect(result.isOverdue).toBe(true);
    });

    it('returns formatted date and overdue for past dates', () => {
      const result = formatDueDate('2026-03-10T12:00:00.000Z');
      expect(result.label).toBe('10 Mar 2026');
      expect(result.isOverdue).toBe(true);
    });

    it('returns formatted date and not overdue for future dates', () => {
      const result = formatDueDate('2026-04-01T12:00:00.000Z');
      expect(result.label).toBe('01 Apr 2026');
      expect(result.isOverdue).toBe(false);
    });
  });

  describe('toISOString', () => {
    it('converts a Date to ISO string', () => {
      const date = new Date('2026-03-25T12:00:00.000Z');
      expect(toISOString(date)).toBe('2026-03-25T12:00:00.000Z');
    });

    it('uses current time when no argument', () => {
      const result = toISOString();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  describe('todayISO', () => {
    it('returns YYYY-MM-DD format', () => {
      const result = todayISO();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('returns exactly 10 characters', () => {
      expect(todayISO()).toHaveLength(10);
    });

    it('matches current date', () => {
      const today = new Date().toISOString().split('T')[0];
      expect(todayISO()).toBe(today);
    });
  });
});
