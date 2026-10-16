import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { FollowUpItem } from '@/components/followups/FollowUpItem';
import { createFollowUp } from '@/__tests__/mocks/factories';

const PAST = '2020-01-15';
const FUTURE = '2099-06-01';

describe('FollowUpItem', () => {
  it('renders title and plain-text description', () => {
    render(<FollowUpItem followUp={createFollowUp({ title: 'Call Bob', description: '<p>Discuss <b>renewal</b></p>', dueDate: FUTURE })} />);
    expect(screen.getByText('Call Bob')).toBeInTheDocument();
    expect(screen.getByText('Discuss renewal')).toBeInTheDocument();
  });

  it('renders an unchecked checkbox for open follow-ups', () => {
    render(<FollowUpItem followUp={createFollowUp({ dueDate: FUTURE })} onComplete={vi.fn()} />);
    const box = screen.getByRole('checkbox', { name: /mark as complete/i });
    expect(box).toHaveAttribute('aria-checked', 'false');
    expect(box).toBeEnabled();
  });

  it('renders a checked checkbox and struck-through title for completed follow-ups', () => {
    render(<FollowUpItem followUp={createFollowUp({ title: 'Done task', completed: true, dueDate: PAST })} />);
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByText('Done task')).toHaveClass('line-through');
  });

  it('asks for confirmation before completing', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    const onPreview = vi.fn();
    const f = createFollowUp({ title: 'Ship it', dueDate: FUTURE });
    render(<FollowUpItem followUp={f} onComplete={onComplete} onPreview={onPreview} />);
    await user.click(screen.getByRole('checkbox'));
    expect(onComplete).not.toHaveBeenCalled();
    expect(onPreview).not.toHaveBeenCalled();
    expect(screen.getByText('Mark "Ship it" as complete?')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Complete' }));
    expect(onComplete).toHaveBeenCalledWith(f.id);
    expect(onPreview).not.toHaveBeenCalled();
  });

  it('shows overdue due date in destructive colour with an alert icon', () => {
    render(<FollowUpItem followUp={createFollowUp({ dueDate: PAST })} />);
    const due = screen.getByTestId('followup-due');
    expect(due).toHaveClass('text-destructive');
    expect(within(due).getByTestId('followup-overdue-icon')).toBeInTheDocument();
  });

  it('does not show overdue styling for completed follow-ups', () => {
    render(<FollowUpItem followUp={createFollowUp({ dueDate: PAST, completed: true })} />);
    const due = screen.getByTestId('followup-due');
    expect(due).not.toHaveClass('text-destructive');
    expect(screen.queryByTestId('followup-overdue-icon')).not.toBeInTheDocument();
  });

  it('does not show overdue styling for future follow-ups', () => {
    render(<FollowUpItem followUp={createFollowUp({ dueDate: FUTURE })} />);
    expect(screen.getByTestId('followup-due')).not.toHaveClass('text-destructive');
    expect(screen.queryByTestId('followup-overdue-icon')).not.toBeInTheDocument();
  });

  it('shows Pending sync badge only for open pending follow-ups', () => {
    const { rerender } = render(<FollowUpItem followUp={createFollowUp({ syncStatus: 'pending', dueDate: FUTURE })} />);
    expect(screen.getByText('Pending sync')).toBeInTheDocument();
    rerender(<FollowUpItem followUp={createFollowUp({ syncStatus: 'synced', dueDate: FUTURE })} />);
    expect(screen.queryByText('Pending sync')).not.toBeInTheDocument();
    rerender(<FollowUpItem followUp={createFollowUp({ syncStatus: 'pending', completed: true, dueDate: FUTURE })} />);
    expect(screen.queryByText('Pending sync')).not.toBeInTheDocument();
  });

  it('opens preview on row click and edit without triggering preview', async () => {
    const user = userEvent.setup();
    const onPreview = vi.fn();
    const onEdit = vi.fn();
    render(<FollowUpItem followUp={createFollowUp({ title: 'Row', dueDate: FUTURE })} onPreview={onPreview} onEdit={onEdit} onDelete={vi.fn()} />);
    await user.click(screen.getByText('Row'));
    expect(onPreview).toHaveBeenCalledTimes(1);
    await user.click(screen.getByTitle('Edit'));
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onPreview).toHaveBeenCalledTimes(1);
  });

  it('confirms before deleting', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<FollowUpItem followUp={createFollowUp({ title: 'Gone', dueDate: FUTURE })} onDelete={onDelete} />);
    await user.click(screen.getByTitle('Delete'));
    expect(onDelete).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('hides edit and delete for completed follow-ups', () => {
    render(<FollowUpItem followUp={createFollowUp({ completed: true, dueDate: FUTURE })} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.queryByTitle('Edit')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Delete')).not.toBeInTheDocument();
  });
});
