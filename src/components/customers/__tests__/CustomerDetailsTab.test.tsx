import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'sonner';
import { CustomerDetailsTab } from '../CustomerDetailsTab';
import { createCustomer } from '@/__tests__/mocks/factories';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const writeText = vi.fn().mockResolvedValue(undefined);

beforeEach(() => {
  writeText.mockClear();
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
});

const customer = createCustomer({
  name: 'Brabant Logistics NV',
  accountNumber: 'ACC-778',
  bcn: '20044861',
  mpnId: '6112874',
  apnId: null,
  customerSuccessManagerName: 'Thomas Peeters',
  awsOwnerName: null,
  azureOwnerName: null,
  insideSalesOwnerName: null,
  accountManagerName: 'Lien Verhoeven',
  ownerName: 'Dylan Hias',
});

describe('CustomerDetailsTab', () => {
  it('groups the fields into Company, Identifiers, Contact and Account team', () => {
    render(<CustomerDetailsTab customer={customer} />);
    for (const title of ['Company', 'Identifiers', 'Contact', 'Account team']) {
      expect(screen.getByRole('heading', { level: 2, name: title })).toBeInTheDocument();
    }
    expect(screen.getByText('20044861')).toBeInTheDocument();
    expect(screen.getByText('Lien Verhoeven')).toBeInTheDocument();
  });

  it('copies a field when it is clicked', async () => {
    render(<CustomerDetailsTab customer={customer} />);
    fireEvent.click(screen.getByRole('button', { name: /Account number/ }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('ACC-778'));
    expect(toast.success).toHaveBeenCalledWith('Copied Account number');
  });

  it('shows a dash for empty fields and does not copy them', () => {
    render(<CustomerDetailsTab customer={customer} />);
    const apn = screen.getByRole('button', { name: /APN ID/ });
    expect(apn).toHaveTextContent('—');
    expect(apn).toBeDisabled();
  });

  it('offers edit buttons for vendor IDs and the account team', () => {
    render(<CustomerDetailsTab customer={customer} />);
    expect(screen.getByRole('button', { name: 'Edit vendor IDs' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit account team' })).toBeInTheDocument();
  });
});
