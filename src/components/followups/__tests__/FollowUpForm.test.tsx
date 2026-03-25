import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FollowUpForm } from '@/components/followups/FollowUpForm';
import { mockRouter } from '@/__tests__/setup';

const mockCreateFollowUp = vi.fn();

vi.mock('@/hooks/useFollowUps', () => ({
  useFollowUps: () => ({
    createFollowUp: mockCreateFollowUp,
  }),
}));

vi.mock('@/lib/utils/dateUtils', () => ({
  todayISO: () => '2026-03-25',
}));

const defaultProps = {
  customerId: 'cust-1',
  customerName: 'Acme Corp',
};

describe('FollowUpForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateFollowUp.mockResolvedValue(undefined);
  });

  it('renders customer name', () => {
    render(<FollowUpForm {...defaultProps} />);
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
  });

  it('renders title and due date inputs', () => {
    render(<FollowUpForm {...defaultProps} />);
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/due date/i)).toBeInTheDocument();
  });

  it('submit button is disabled when title is empty', () => {
    render(<FollowUpForm {...defaultProps} />);
    const submitButton = screen.getByRole('button', { name: /create follow-up/i });
    expect(submitButton).toBeDisabled();
  });

  it('submit button is disabled when due date is empty', async () => {
    const user = userEvent.setup();
    render(<FollowUpForm {...defaultProps} />);
    await user.type(screen.getByLabelText(/title/i), 'Check in');
    // Due date is still empty
    const submitButton = screen.getByRole('button', { name: /create follow-up/i });
    expect(submitButton).toBeDisabled();
  });

  it('submit button is enabled when title and due date have values', async () => {
    const user = userEvent.setup();
    render(<FollowUpForm {...defaultProps} />);
    await user.type(screen.getByLabelText(/title/i), 'Check in');
    // For date inputs, we use fireEvent or type the value directly
    const dateInput = screen.getByLabelText(/due date/i);
    await user.clear(dateInput);
    await user.type(dateInput, '2026-04-01');
    const submitButton = screen.getByRole('button', { name: /create follow-up/i });
    expect(submitButton).toBeEnabled();
  });

  it('calls createFollowUp on valid submit', async () => {
    const user = userEvent.setup();
    render(<FollowUpForm {...defaultProps} />);
    await user.type(screen.getByLabelText(/title/i), 'Check in');
    const dateInput = screen.getByLabelText(/due date/i);
    await user.clear(dateInput);
    await user.type(dateInput, '2026-04-01');
    await user.click(screen.getByRole('button', { name: /create follow-up/i }));

    await waitFor(() => {
      expect(mockCreateFollowUp).toHaveBeenCalledTimes(1);
    });

    expect(mockCreateFollowUp).toHaveBeenCalledWith(
      expect.objectContaining({
        customerId: 'cust-1',
        title: 'Check in',
        dueDate: '2026-04-01',
        activityId: null,
      }),
    );
  });

  it('shows success message after submit', async () => {
    const user = userEvent.setup();
    render(<FollowUpForm {...defaultProps} />);
    await user.type(screen.getByLabelText(/title/i), 'Check in');
    const dateInput = screen.getByLabelText(/due date/i);
    await user.clear(dateInput);
    await user.type(dateInput, '2026-04-01');
    await user.click(screen.getByRole('button', { name: /create follow-up/i }));

    await waitFor(() => {
      expect(screen.getByText(/follow-up created/i)).toBeInTheDocument();
    });
  });

  it('cancel button calls router.back()', async () => {
    const user = userEvent.setup();
    render(<FollowUpForm {...defaultProps} />);
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
  });
});
