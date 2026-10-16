import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from '../uiStore';

describe('uiStore', () => {
  beforeEach(() => {
    useUIStore.setState({
      sidebarOpen: false,
      activeCustomerTab: 'timeline',
      commandPaletteOpen: false,
      shortcutsGuideOpen: false,
    });
  });

  const store = () => useUIStore.getState();

  it('default sidebarOpen is false', () => {
    expect(store().sidebarOpen).toBe(false);
  });

  it('default activeCustomerTab is timeline', () => {
    expect(store().activeCustomerTab).toBe('timeline');
  });

  it('setSidebarOpen', () => {
    store().setSidebarOpen(true);
    expect(store().sidebarOpen).toBe(true);
  });

  it('toggleSidebar flips true to false', () => {
    store().setSidebarOpen(true);
    store().toggleSidebar();
    expect(store().sidebarOpen).toBe(false);
  });

  it('toggleSidebar flips false to true', () => {
    store().toggleSidebar();
    expect(store().sidebarOpen).toBe(true);
  });

  it('setActiveCustomerTab', () => {
    store().setActiveCustomerTab('activities');
    expect(store().activeCustomerTab).toBe('activities');
  });

  it('default commandPaletteOpen is false', () => {
    expect(store().commandPaletteOpen).toBe(false);
  });

  it('setCommandPaletteOpen', () => {
    store().setCommandPaletteOpen(true);
    expect(store().commandPaletteOpen).toBe(true);
  });

  it('default shortcutsGuideOpen is false', () => {
    expect(store().shortcutsGuideOpen).toBe(false);
  });

  it('setShortcutsGuideOpen', () => {
    store().setShortcutsGuideOpen(true);
    expect(store().shortcutsGuideOpen).toBe(true);
  });

  it('requestNewOpportunity is consumed exactly once', () => {
    store().requestNewOpportunity();
    expect(store().consumeNewOpportunityRequest()).toBe(true);
    expect(store().consumeNewOpportunityRequest()).toBe(false);
  });

  it('does not persist a pending new-opportunity request', () => {
    store().requestNewOpportunity();
    const persisted = JSON.parse(localStorage.getItem('crm-ui-store') ?? '{}').state ?? {};
    expect(persisted.newOpportunityRequested).toBeUndefined();
    store().consumeNewOpportunityRequest();
  });
});
