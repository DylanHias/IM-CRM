import { render, screen, fireEvent, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SyncPanel } from '../SyncPanel';
import { createSyncRecord } from '@/__tests__/mocks/factories';

const triggerSync = vi.fn();
const triggerPushPending = vi.fn();
const syncState = {
  isSyncing: false,
  isOnline: true,
  lastD365SyncAt: null as string | null,
  pendingActivityCount: 1,
  pendingFollowUpCount: 1,
  pendingOpportunityCount: 0,
  triggerSync,
  triggerPushPending,
};
vi.mock('@/hooks/useSync', () => ({ useSync: () => syncState }));

const activity = { id: 'a1', customerId: 'c1', customerName: 'Brabant Logistics NV', type: 'meeting', subject: 'Quarterly review', occurredAt: '2026-10-13T09:00:00.000Z', createdAt: '2026-10-13T09:00:00.000Z' };
const followUp = { id: 'f1', customerId: 'c2', customerName: 'Antwerp Freight BV', title: 'Send renewal quote', dueDate: '2026-10-20', createdAt: '2026-10-13T09:00:00.000Z' };

beforeEach(() => {
  Object.assign(syncState, { isSyncing: false, isOnline: true, pendingActivityCount: 1, pendingFollowUpCount: 1, pendingOpportunityCount: 0 });
  triggerSync.mockClear();
  triggerPushPending.mockClear();
});

describe('SyncPanel', () => {
  it('shows the toolbar actions and runs them', () => {
    render(<SyncPanel records={[]} pendingActivities={[activity]} pendingFollowUps={[followUp]} pendingOpportunities={[]} />);
    fireEvent.click(screen.getByRole('button', { name: /Run full sync/ }));
    fireEvent.click(screen.getByRole('button', { name: /Push pending/ }));
    expect(triggerSync).toHaveBeenCalled();
    expect(triggerPushPending).toHaveBeenCalled();
  });

  it('groups waiting changes and links them to their customer', () => {
    render(<SyncPanel records={[]} pendingActivities={[activity]} pendingFollowUps={[followUp]} pendingOpportunities={[]} />);
    const waiting = screen.getByRole('region', { name: /Waiting to sync/ });
    expect(within(waiting).getByText('Activities')).toBeInTheDocument();
    expect(within(waiting).getByRole('link', { name: /Quarterly review/ })).toHaveAttribute('href', '/customers?id=c1');
    expect(within(waiting).getByRole('link', { name: /Send renewal quote/ })).toHaveAttribute('href', '/customers?id=c2');
    expect(screen.getByText('1 activity · 1 follow-up')).toBeInTheDocument();
  });

  it('says nothing is waiting when the queue is empty', () => {
    Object.assign(syncState, { pendingActivityCount: 0, pendingFollowUpCount: 0 });
    render(<SyncPanel records={[]} pendingActivities={[]} pendingFollowUps={[]} pendingOpportunities={[]} />);
    expect(screen.getByText('Nothing waiting')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Push pending/ })).toBeDisabled();
  });

  it('lists history with status, type and errors', () => {
    const records = [
      createSyncRecord({ id: 1, syncType: 'd365', status: 'error', errorMessage: 'Token expired', recordsPulled: 1200 }),
      createSyncRecord({ id: 2, syncType: 'push_activities', status: 'success', recordsPushed: 3 }),
    ];
    render(<SyncPanel records={records} pendingActivities={[]} pendingFollowUps={[]} pendingOpportunities={[]} />);
    const history = screen.getByRole('table');
    expect(within(history).getByText('Dynamics 365')).toBeInTheDocument();
    expect(within(history).getByText('Token expired')).toBeInTheDocument();
    expect(within(history).getByText('1,200')).toBeInTheDocument();
  });

  it('warns and disables syncing when offline', () => {
    syncState.isOnline = false;
    render(<SyncPanel records={[]} pendingActivities={[]} pendingFollowUps={[]} pendingOpportunities={[]} />);
    expect(screen.getByText('You are offline. Connect to sync.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Run full sync/ })).toBeDisabled();
  });
});
