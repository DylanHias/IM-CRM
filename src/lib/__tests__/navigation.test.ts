import { describe, expect, it } from 'vitest';
import { visibleSidebarTabs, isNavActive, NAV_LABELS } from '../navigation';
import { DEFAULT_SIDEBAR_ORDER } from '@/store/settingsStore';

describe('navigation', () => {
  it('leaves out pages that live elsewhere (Sync, Follow-Ups)', () => {
    const tabs = visibleSidebarTabs(DEFAULT_SIDEBAR_ORDER);
    expect(tabs).not.toContain('/sync');
    expect(tabs).not.toContain('/followups');
    expect(tabs).toContain('/timeline');
  });

  it('also respects tabs the user hid', () => {
    expect(visibleSidebarTabs(['/dashboard', '/customers', '/timeline'], ['/customers'])).toEqual(['/dashboard', '/timeline']);
  });

  it('lights up Activity on both the timeline and follow-ups pages', () => {
    expect(isNavActive('/timeline', '/timeline')).toBe(true);
    expect(isNavActive('/timeline', '/followups')).toBe(true);
    expect(isNavActive('/customers', '/followups')).toBe(false);
    expect(isNavActive('/customers', '/customers')).toBe(true);
  });

  it('names the merged page Activity', () => {
    expect(NAV_LABELS['/timeline']).toBe('Activity');
  });
});
