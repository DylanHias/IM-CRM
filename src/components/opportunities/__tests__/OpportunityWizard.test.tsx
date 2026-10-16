import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { OpportunityWizard } from '@/components/opportunities/OpportunityWizard';
import { createCustomer, createOpportunity } from '@/__tests__/mocks/factories';

const renderNew = (onSave = vi.fn()) =>
  render(<OpportunityWizard customer={createCustomer()} contacts={[]} onSave={onSave} onCancel={vi.fn()} />);

const rail = () => screen.getByRole('navigation', { name: 'Opportunity sections' });
const openSection = (name: string) => fireEvent.click(within(rail()).getByRole('button', { name: new RegExp(name) }));

describe('OpportunityWizard', () => {
  it('starts a new opportunity on the Customer section with five steps in the rail', () => {
    renderNew();
    expect(screen.getByText('New opportunity')).toBeInTheDocument();
    const steps = within(rail()).getAllByRole('button');
    expect(steps.map((b) => b.textContent)).toEqual([
      expect.stringContaining('Customer'),
      expect.stringContaining('Deal'),
      expect.stringContaining('Vendor'),
      expect.stringContaining('Financials'),
      expect.stringContaining('Review'),
    ]);
    expect(within(rail()).getByRole('button', { name: /Customer/ })).toHaveAttribute('aria-current', 'step');
    expect(screen.getByText('BCN')).toBeInTheDocument();
  });

  it('moves through the sections with Next and Back', () => {
    renderNew();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText(/Single or Cross Sell/)).toBeInTheDocument();
    expect(screen.getByText(/Customer Need/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByText('BCN')).toBeInTheDocument();
  });

  it('shows every stage on the Deal section and updates the stage chip', () => {
    renderNew();
    openSection('Deal');
    for (const s of ['Prospecting', 'Validated', 'Qualified', 'Verbal Received', 'Contract Received', 'Billing Rejection', 'Pending Vendor Confirmation', 'Purchased']) {
      expect(screen.getByRole('button', { name: new RegExp(`^${s}`) })).toBeInTheDocument();
    }
    expect(screen.getByTestId('stage-chip')).toHaveTextContent('Prospecting');
    fireEvent.click(screen.getByRole('button', { name: /^Validated/ }));
    expect(screen.getByTestId('stage-chip')).toHaveTextContent('Validated');
  });

  it('blocks save, lists what is missing and marks the sections', async () => {
    const onSave = vi.fn();
    renderNew(onSave);
    fireEvent.click(screen.getByRole('button', { name: /Create opportunity/ }));
    expect(onSave).not.toHaveBeenCalled();
    expect(await screen.findByText(/Still needed:/)).toBeInTheDocument();
    expect(within(rail()).getByRole('button', { name: /Deal/ })).toHaveTextContent(/missing/);
  });

  it('opens an existing opportunity on Review with its details', () => {
    const customer = createCustomer();
    const opp = createOpportunity({ customerId: customer.id, subject: 'Existing deal' });
    render(<OpportunityWizard opportunity={opp} customer={customer} contacts={[]} onSave={vi.fn()} onCancel={vi.fn()} />);
    expect(within(rail()).getByRole('button', { name: /Review/ })).toHaveAttribute('aria-current', 'step');
    expect(screen.getAllByText('Existing deal').length).toBeGreaterThan(0);
    openSection('Deal');
    expect(screen.getByDisplayValue('Existing deal')).toBeInTheDocument();
  });

  it('shows close-as-won/lost only on open existing records', () => {
    const customer = createCustomer();
    const props = { customer, contacts: [], onSave: vi.fn(), onCloseWon: vi.fn(), onCloseLost: vi.fn(), onCancel: vi.fn() };
    const { rerender } = render(<OpportunityWizard {...props} opportunity={createOpportunity({ customerId: customer.id, status: 'Open' })} />);
    expect(screen.getByText('Close as Won')).toBeInTheDocument();
    expect(screen.getByText('Close as Lost')).toBeInTheDocument();
    rerender(<OpportunityWizard {...props} opportunity={createOpportunity({ customerId: customer.id, status: 'Won' })} />);
    expect(screen.queryByText('Close as Won')).not.toBeInTheDocument();
  });

  it('hides close buttons for new opportunities', () => {
    renderNew();
    expect(screen.queryByText('Close as Won')).not.toBeInTheDocument();
  });

  it('shows Est. Margin on Financials and prefills it', () => {
    const customer = createCustomer();
    const opportunity = createOpportunity({ customerId: customer.id, estimatedMargin: 1234.5 });
    render(<OpportunityWizard customer={customer} contacts={[]} opportunity={opportunity} onSave={vi.fn()} onCancel={vi.fn()} />);
    openSection('Financials');
    expect(screen.getByText(/Est\. Margin/)).toBeInTheDocument();
    expect(screen.getByDisplayValue('1,234.50')).toBeInTheDocument();
  });
});
