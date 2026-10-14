import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { FollowUpList } from '@/components/followups/FollowUpList';
import { createFollowUp } from '@/__tests__/mocks/factories';

vi.mock('@/hooks/useFollowUps', () => ({
  useFollowUps: () => ({ editFollowUp: vi.fn(), deleteFollowUp: vi.fn() }),
}));

vi.mock('@/components/followups/FollowUpPreviewDialog', () => ({
  FollowUpPreviewDialog: ({ followUp }: { followUp: { title: string } | null }) =>
    followUp ? <div data-testid="preview">{followUp.title}</div> : null,
}));

const props = { customerId: 'c1', onComplete: vi.fn() };

describe('FollowUpList', () => {
  it('renders the Add Follow-Up button and calls onAdd', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(<FollowUpList {...props} followUps={[]} onAdd={onAdd} />);
    await user.click(screen.getByRole('button', { name: /add follow-up/i }));
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it('shows an empty state when there are no follow-ups', () => {
    render(<FollowUpList {...props} followUps={[]} />);
    expect(screen.getByText('No follow-ups yet')).toBeInTheDocument();
  });

  it('splits scheduled and completed sections with counts', () => {
    const followUps = [
      createFollowUp({ title: 'Open A', dueDate: '2099-01-01' }),
      createFollowUp({ title: 'Open B', dueDate: '2099-02-01' }),
      createFollowUp({ title: 'Done C', completed: true, dueDate: '2020-01-01' }),
    ];
    render(<FollowUpList {...props} followUps={followUps} />);
    const scheduled = screen.getByRole('region', { name: 'Scheduled (2)' });
    const completed = screen.getByRole('region', { name: 'Completed (1)' });
    expect(within(scheduled).getByText('Open A')).toBeInTheDocument();
    expect(within(scheduled).getByText('Open B')).toBeInTheDocument();
    expect(within(completed).getByText('Done C')).toBeInTheDocument();
    expect(within(scheduled).getAllByRole('checkbox')).toHaveLength(2);
  });

  it('shows "No completed follow-ups yet." when nothing is completed', () => {
    render(<FollowUpList {...props} followUps={[createFollowUp({ title: 'Open A', dueDate: '2099-01-01' })]} />);
    const completed = screen.getByRole('region', { name: 'Completed (0)' });
    expect(within(completed).getByText('No completed follow-ups yet.')).toBeInTheDocument();
  });

  it('puts the stagger-in animation on each rows container', () => {
    const followUps = [
      createFollowUp({ title: 'Open A', dueDate: '2099-01-01' }),
      createFollowUp({ title: 'Done C', completed: true, dueDate: '2020-01-01' }),
    ];
    const { container } = render(<FollowUpList {...props} followUps={followUps} />);
    expect(container.querySelectorAll('.stagger-in')).toHaveLength(2);
  });

  it('opens the preview when a row is clicked', async () => {
    const user = userEvent.setup();
    render(<FollowUpList {...props} followUps={[createFollowUp({ title: 'Open A', dueDate: '2099-01-01' })]} />);
    await user.click(screen.getByText('Open A'));
    expect(screen.getByTestId('preview')).toHaveTextContent('Open A');
  });
});
