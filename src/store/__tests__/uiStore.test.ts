import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from '../uiStore';

describe('uiStore', () => {
  beforeEach(() => {
    useUIStore.setState({
      sidebarOpen: false,
      activeCustomerTab: 'timeline',
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
});
