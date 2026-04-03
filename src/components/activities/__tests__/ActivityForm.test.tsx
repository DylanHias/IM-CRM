import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ActivityForm } from '@/components/activities/ActivityForm';
import { useSettingsStore } from '@/store/settingsStore';
import { mockRouter } from '@/__tests__/setup';
import type { Contact } from '@/types/entities';

const mockCreateActivity = vi.fn();

vi.mock('@/hooks/useActivities', () => ({
  useActivities: () => ({
    createActivity: mockCreateActivity,
  }),
}));

const mockNowDatetimeLocal = vi.fn(() => '2026-03-25T10:00');

vi.mock('@/lib/utils/dateUtils', () => ({
  todayISO: () => '2026-03-25',
  nowDatetimeLocal: (...args: unknown[]) => mockNowDatetimeLocal(...args),
  addHoursLocal: (dt: string, hours: number) => {
    const d = new Date(dt);
    d.setHours(d.getHours() + hours);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  },
  isoToDatetimeLocal: (iso: string) => iso ? iso.slice(0, 16) : '2026-03-25T10:00',
}));

const contacts: Contact[] = [
  {
    id: 'c1',
    customerId: 'cust-1',
    firstName: 'John',
    lastName: 'Doe',
    jobTitle: 'CTO',
    email: 'john@example.com',
    phone: null,
    isPrimary: true,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
];

const defaultProps = {
  customerId: 'cust-1',
  customerName: 'Acme Corp',
  contacts,
};

describe('ActivityForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateActivity.mockResolvedValue(undefined);
  });

  it('renders customer name', () => {
    render(<ActivityForm {...defaultProps} />);
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
  });

  it('renders subject input', () => {
    render(<ActivityForm {...defaultProps} />);
    expect(screen.getByLabelText(/subject/i)).toBeInTheDocument();
  });

  it('renders description textarea', () => {
    render(<ActivityForm {...defaultProps} />);
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
  });

  it('submit button is disabled when subject is empty', () => {
    render(<ActivityForm {...defaultProps} />);
    const submitButton = screen.getByRole('button', { name: /log activity/i });
    expect(submitButton).toBeDisabled();
  });

  it('submit button is enabled when subject has value', async () => {
    const user = userEvent.setup();
    render(<ActivityForm {...defaultProps} />);
    await user.type(screen.getByLabelText(/subject/i), 'Quarterly review');
    const submitButton = screen.getByRole('button', { name: /log activity/i });
    expect(submitButton).toBeEnabled();
  });

  it('cancel button calls router.back()', async () => {
    const user = userEvent.setup();
    render(<ActivityForm {...defaultProps} />);
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
  });

  it('calls createActivity on valid submit', async () => {
    const user = userEvent.setup();
    render(<ActivityForm {...defaultProps} />);
    await user.type(screen.getByLabelText(/subject/i), 'Demo call');
    await user.click(screen.getByRole('button', { name: /log activity/i }));

    await waitFor(() => {
      expect(mockCreateActivity).toHaveBeenCalledTimes(1);
    });

    expect(mockCreateActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        customerId: 'cust-1',
        subject: 'Demo call',
        type: 'meeting',
        contactId: null,
      }),
    );
  });

  it('shows success message after successful submit', async () => {
    const user = userEvent.setup();
    render(<ActivityForm {...defaultProps} />);
    await user.type(screen.getByLabelText(/subject/i), 'Demo call');
    await user.click(screen.getByRole('button', { name: /log activity/i }));

    await waitFor(() => {
      expect(screen.getByText(/activity logged successfully/i)).toBeInTheDocument();
    });
  });

  it('shows error message on failure', async () => {
    mockCreateActivity.mockRejectedValueOnce(new Error('Network error'));
    const user = userEvent.setup();
    render(<ActivityForm {...defaultProps} />);
    await user.type(screen.getByLabelText(/subject/i), 'Demo call');
    await user.click(screen.getByRole('button', { name: /log activity/i }));

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('activity type defaults to meeting', () => {
    useSettingsStore.getState().resetAll();
    render(<ActivityForm {...defaultProps} />);
    const triggers = screen.getAllByRole('combobox');
    expect(triggers[0]).toHaveTextContent('Meeting');
  });

  it('activity type respects defaultActivityType setting', () => {
    useSettingsStore.getState().updateSetting('defaultActivityType', 'call');
    render(<ActivityForm {...defaultProps} />);
    const triggers = screen.getAllByRole('combobox');
    expect(triggers[0]).toHaveTextContent('Call');
  });

  it('submit uses the configured default activity type', async () => {
    useSettingsStore.getState().updateSetting('defaultActivityType', 'note');
    const user = userEvent.setup();
    render(<ActivityForm {...defaultProps} />);
    await user.type(screen.getByLabelText(/subject/i), 'Quick note');
    await user.click(screen.getByRole('button', { name: /log activity/i }));

    await waitFor(() => {
      expect(mockCreateActivity).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'note' }),
      );
    });
  });

  it('date input defaults to today', () => {
    render(<ActivityForm {...defaultProps} />);
    const dateButton = screen.getByLabelText(/date/i);
    expect(dateButton).toHaveTextContent('25 Mar 2026');
  });

  it('meeting end time defaults to one hour after start', () => {
    useSettingsStore.getState().updateSetting('defaultActivityType', 'meeting');
    render(<ActivityForm {...defaultProps} />);
    // Start defaults to 10:00, end should default to 11:00
    const buttons = screen.getAllByRole('button');
    const timeButtons = buttons.filter((b) => /^\d{2}:\d{2}$/.test(b.textContent ?? ''));
    // First time button = start time, second = end time
    expect(timeButtons[0]).toHaveTextContent('10:00');
    expect(timeButtons[1]).toHaveTextContent('11:00');
  });
});
