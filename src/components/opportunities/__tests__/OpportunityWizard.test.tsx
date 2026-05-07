import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OpportunityWizard } from '@/components/opportunities/OpportunityWizard';
import { createCustomer, createContact, createOpportunity } from '@/__tests__/mocks/factories';

describe('OpportunityWizard', () => {
  it('renders core fields for new opportunity', () => {
    const customer = createCustomer();
    render(
      <OpportunityWizard
        customer={customer}
        contacts={[]}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByText('New opportunity')).toBeInTheDocument();
    expect(screen.getByText(/Subject \*/)).toBeInTheDocument();
    expect(screen.getByText(/Single or Cross Sell \*/)).toBeInTheDocument();
    expect(screen.getByText(/Customer Need \*/)).toBeInTheDocument();
  });

  it('renders 8 stages in stepper', () => {
    const customer = createCustomer();
    render(
      <OpportunityWizard
        customer={customer}
        contacts={[]}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    const stages = ['Prospecting', 'Validated', 'Qualified', 'Verbal Received',
                    'Contract Received', 'Billing Rejection', 'Pending Vendor Confirmation', 'Purchased'];
    stages.forEach((s) => {
      expect(screen.getAllByText(s).length).toBeGreaterThan(0);
    });
  });

  it('shows close-as-won/lost buttons only on open existing records', () => {
    const customer = createCustomer();
    const opp = createOpportunity({ customerId: customer.id, status: 'Open' });

    const { rerender } = render(
      <OpportunityWizard
        opportunity={opp}
        customer={customer}
        contacts={[]}
        onSave={vi.fn()}
        onCloseWon={vi.fn()}
        onCloseLost={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(screen.getByText('Close as Won')).toBeInTheDocument();
    expect(screen.getByText('Close as Lost')).toBeInTheDocument();

    rerender(
      <OpportunityWizard
        opportunity={{ ...opp, status: 'Won' }}
        customer={customer}
        contacts={[]}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(screen.queryByText('Close as Won')).not.toBeInTheDocument();
    expect(screen.queryByText('Close as Lost')).not.toBeInTheDocument();
  });

  it('hides close buttons for new opportunities', () => {
    render(
      <OpportunityWizard
        customer={createCustomer()}
        contacts={[]}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(screen.queryByText('Close as Won')).not.toBeInTheDocument();
    expect(screen.queryByText('Close as Lost')).not.toBeInTheDocument();
  });

  it('blocks save and shows error list when required fields missing', async () => {
    const onSave = vi.fn();
    render(
      <OpportunityWizard
        customer={createCustomer()}
        contacts={[]}
        onSave={onSave}
        onCancel={vi.fn()}
      />
    );
    const saveBtn = screen.getByRole('button', { name: /save/i });
    saveBtn.click();
    expect(onSave).not.toHaveBeenCalled();
    expect(await screen.findByText(/Missing:/i)).toBeInTheDocument();
  });

  it('renders pre-filled subject from existing opportunity', () => {
    const customer = createCustomer();
    const opp = createOpportunity({ customerId: customer.id, subject: 'Existing deal' });
    render(
      <OpportunityWizard
        opportunity={opp}
        customer={customer}
        contacts={[]}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect((screen.getByDisplayValue('Existing deal'))).toBeInTheDocument();
  });

  it('clicking a stage in the stepper updates current stage display', () => {
    const customer = createCustomer();
    render(
      <OpportunityWizard
        customer={customer}
        contacts={createContacts(0)}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    // Initial stage displayed in footer
    expect(screen.getByText(/Stage:/).textContent).toContain('Prospecting');

    // Click Validated stage
    const validated = screen.getAllByText('Validated')[0];
    fireEvent.click(validated);
    expect(screen.getByText(/Stage:/).textContent).toContain('Validated');
  });
});

function createContacts(_n: number) {
  void _n;
  return [createContact()];
}
