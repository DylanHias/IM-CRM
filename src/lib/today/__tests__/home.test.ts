import { describe, expect, it } from 'vitest';
import { createFollowUp } from '@/__tests__/mocks/factories';
import { selectDueToday, workWeek, isoWeekNumber, overdueLabel, winRatePct } from '../home';

const TODAY = new Date(2026, 9, 14); // Wednesday 14 October 2026

describe('selectDueToday', () => {
  it('keeps open follow-ups that are overdue or due today, overdue first', () => {
    const list = [
      createFollowUp({ id: 'later', dueDate: '2026-10-20', completed: false }),
      createFollowUp({ id: 'today', dueDate: '2026-10-14', completed: false }),
      createFollowUp({ id: 'old', dueDate: '2026-10-11', completed: false }),
      createFollowUp({ id: 'done', dueDate: '2026-10-13', completed: true }),
      createFollowUp({ id: 'yday', dueDate: '2026-10-13', completed: false }),
    ];
    expect(selectDueToday(list, TODAY).map((f) => f.id)).toEqual(['old', 'yday', 'today']);
  });

  it('accepts full ISO timestamps as due dates', () => {
    const list = [createFollowUp({ id: 'ts', dueDate: '2026-10-14T09:00:00.000Z', completed: false })];
    expect(selectDueToday(list, TODAY).map((f) => f.id)).toEqual(['ts']);
  });
});

describe('workWeek', () => {
  it('returns Monday to Friday of the current week with open follow-up counts', () => {
    const list = [
      createFollowUp({ dueDate: '2026-10-12', completed: false }),
      createFollowUp({ dueDate: '2026-10-14', completed: false }),
      createFollowUp({ dueDate: '2026-10-14', completed: false }),
      createFollowUp({ dueDate: '2026-10-14', completed: true }),
      createFollowUp({ dueDate: '2026-10-19', completed: false }),
    ];
    const days = workWeek(list, TODAY);
    expect(days.map((d) => [d.label, d.day, d.count, d.isToday])).toEqual([
      ['Mon', 12, 1, false],
      ['Tue', 13, 0, false],
      ['Wed', 14, 2, true],
      ['Thu', 15, 0, false],
      ['Fri', 16, 0, false],
    ]);
  });

  it('uses the coming week on a weekend', () => {
    expect(workWeek([], new Date(2026, 9, 18))[0].day).toBe(19);
    expect(workWeek([], new Date(2026, 9, 17))[0].day).toBe(19);
  });
});

describe('isoWeekNumber', () => {
  it('matches the ISO calendar', () => {
    expect(isoWeekNumber(TODAY)).toBe(42);
    expect(isoWeekNumber(new Date(2027, 0, 1))).toBe(53);
  });
});

describe('overdueLabel', () => {
  it('describes how late a follow-up is', () => {
    expect(overdueLabel('2026-10-14', TODAY)).toBe('Today');
    expect(overdueLabel('2026-10-13', TODAY)).toBe('1 day overdue');
    expect(overdueLabel('2026-10-11', TODAY)).toBe('3 days overdue');
  });
});

describe('winRatePct', () => {
  it('returns a rounded percentage or null when nothing closed', () => {
    expect(winRatePct({ won: 3, lost: 5 })).toBe(38);
    expect(winRatePct({ won: 0, lost: 0 })).toBeNull();
  });
});
