import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ConfirmPopover } from '../ConfirmPopover';

describe('ConfirmPopover', () => {
  it('shows popover with message when trigger is clicked', async () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmPopover message="Delete this item?" confirmLabel="Delete" onConfirm={onConfirm}>
        <button>Remove</button>
      </ConfirmPopover>
    );

    await userEvent.click(screen.getByText('Remove'));
    expect(screen.getByText('Delete this item?')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('calls onConfirm and closes when confirm button is clicked', async () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmPopover message="Delete this item?" confirmLabel="Delete" onConfirm={onConfirm}>
        <button>Remove</button>
      </ConfirmPopover>
    );

    await userEvent.click(screen.getByText('Remove'));
    await userEvent.click(screen.getByText('Delete'));

    expect(onConfirm).toHaveBeenCalledOnce();
    await waitFor(() => {
      expect(screen.queryByText('Delete this item?')).not.toBeInTheDocument();
    });
  });

  it('closes without calling onConfirm when cancel is clicked', async () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmPopover message="Delete this item?" confirmLabel="Delete" onConfirm={onConfirm}>
        <button>Remove</button>
      </ConfirmPopover>
    );

    await userEvent.click(screen.getByText('Remove'));
    await userEvent.click(screen.getByText('Cancel'));

    expect(onConfirm).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.queryByText('Delete this item?')).not.toBeInTheDocument();
    });
  });

  it('uses default confirmLabel when not provided', async () => {
    render(
      <ConfirmPopover message="Are you sure?" onConfirm={vi.fn()}>
        <button>Trigger</button>
      </ConfirmPopover>
    );

    await userEvent.click(screen.getByText('Trigger'));
    expect(screen.getByText('Confirm')).toBeInTheDocument();
  });
});
