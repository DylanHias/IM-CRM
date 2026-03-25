import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OpportunityForm } from '@/components/opportunities/OpportunityForm';
import { createContact, createCustomer, createOpportunity } from '@/__tests__/mocks/factories';

vi.mock('@/hooks/useOpportunities', () => ({
  stageToProbability: (stage: string) => {
    const map: Record<string, number> = {
      Prospecting: 5, Validated: 25, Qualified: 50,
      'Verbal Received': 75, 'Contract Received': 100,
      'Billing Rejection': 100, 'Pending Vendor Confirmation': 100, Purchased: 100,
    };
    return map[stage] ?? 5;
  },
}));

const contacts = [createContact({ id: 'c1', customerId: 'cust-1', firstName: 'Jane', lastName: 'Smith', jobTitle: 'VP Sales' })];
const customer = createCustomer({ id: 'cust-1', name: 'Acme Corp', bcn: 'BCN-123' });
const mockOnSubmit = vi.fn().mockResolvedValue(undefined);
const mockOnCancel = vi.fn();

const defaultProps = {
  contacts,
  customer,
  onSubmit: mockOnSubmit,
  onCancel: mockOnCancel,
};

describe('OpportunityForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnSubmit.mockResolvedValue(undefined);
  });

  it('renders subject input', () => {
    render(<OpportunityForm {...defaultProps} />);
    // The Subject label creates a textbox. Use getAllByRole since there are multiple textboxes
    const inputs = screen.getAllByRole('textbox');
    expect(inputs.length).toBeGreaterThan(0);
  });

  it('submit button is disabled when subject is empty', () => {
    render(<OpportunityForm {...defaultProps} />);
    const submitButton = screen.getByRole('button', { name: /create opportunity/i });
    expect(submitButton).toBeDisabled();
  });

  it('cancel button calls onCancel', async () => {
    const user = userEvent.setup();
    render(<OpportunityForm {...defaultProps} />);
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('submit button enabled after typing subject', async () => {
    const user = userEvent.setup();
    render(<OpportunityForm {...defaultProps} />);
    // Subject is the first required textbox input
    const subjectInput = screen.getAllByRole('textbox')[0];
    await user.type(subjectInput, 'Cloud migration');
    const submitButton = screen.getByRole('button', { name: /create opportunity/i });
    expect(submitButton).toBeEnabled();
  });

  it('calls onSubmit with correct data', async () => {
    const user = userEvent.setup();
    render(<OpportunityForm {...defaultProps} />);
    const subjectInput = screen.getAllByRole('textbox')[0];
    await user.type(subjectInput, 'Cloud migration');
    await user.click(screen.getByRole('button', { name: /create opportunity/i }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });

    const data = mockOnSubmit.mock.calls[0][0];
    expect(data.subject).toBe('Cloud migration');
    expect(data.status).toBe('Open');
    expect(data.stage).toBe('Prospecting');
    expect(data.sellType).toBe('New');
    expect(data.multiVendorOpportunity).toBe(false);
    expect(data.contactId).toBeNull();
    expect(data.primaryVendor).toBeNull();
    expect(data.opportunityType).toBeNull();
  });

  it('pre-fills from existing opportunity', () => {
    const existing = createOpportunity({ subject: 'Existing deal', status: 'Won' });
    render(<OpportunityForm {...defaultProps} opportunity={existing} />);
    const subjectInput = screen.getAllByRole('textbox')[0];
    expect(subjectInput).toHaveValue('Existing deal');
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
  });

  it('multi-vendor checkbox toggles', async () => {
    const user = userEvent.setup();
    render(<OpportunityForm {...defaultProps} />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
    await user.click(checkbox);
    expect(checkbox).toBeChecked();
  });
});
