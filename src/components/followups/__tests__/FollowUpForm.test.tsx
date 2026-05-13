import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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

vi.mock('@/components/ui/DatePicker', () => ({
  DatePicker: ({ id, value, onChange, placeholder }: { id?: string; value: string; onChange: (v: string) => void; placeholder?: string }) => (
    <input
      id={id}
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  ),
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

  it('shows error styling and blocks submit when title is empty', () => {
    render(<FollowUpForm {...defaultProps} />);
    const submitButton = screen.getByRole('button', { name: /create follow-up/i });
    expect(submitButton).toBeEnabled();
    const form = submitButton.closest('form')!;
    fireEvent.submit(form);
    expect(mockCreateFollowUp).not.toHaveBeenCalled();
    expect(screen.getByText(/title \*/i)).toHaveClass('text-rose-600');
  });

  it('shows error styling and blocks submit when due date is empty', async () => {
    const user = userEvent.setup();
    render(<FollowUpForm {...defaultProps} />);
    await user.type(screen.getByLabelText(/title/i), 'Check in');
    // Clear the default due date so it's empty
    const dateInput = screen.getByLabelText(/due date/i);
    fireEvent.change(dateInput, { target: { value: '' } });
    const submitButton = screen.getByRole('button', { name: /create follow-up/i });
    expect(submitButton).toBeEnabled();
    const form = submitButton.closest('form')!;
    fireEvent.submit(form);
    expect(mockCreateFollowUp).not.toHaveBeenCalled();
    expect(screen.getByText(/due date \*/i)).toHaveClass('text-rose-600');
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
