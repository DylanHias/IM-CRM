import { describe, expect, it } from 'vitest';
import { WIZARD_SECTIONS, sectionOf, countBySection } from '../wizardSections';

describe('wizard sections', () => {
  it('runs customer, deal, vendor, financials, review in order', () => {
    expect(WIZARD_SECTIONS.map((s) => s.id)).toEqual(['customer', 'deal', 'vendor', 'money', 'review']);
  });

  it('puts each field in the section where it is edited', () => {
    expect(sectionOf('accountId')).toBe('customer');
    expect(sectionOf('subject')).toBe('deal');
    expect(sectionOf('payerAccount')).toBe('vendor');
    expect(sectionOf('annualRevenue')).toBe('money');
    // Filled automatically, never shown
    expect(sectionOf('recordType')).toBeNull();
  });

  it('counts fields per section and skips the hidden ones', () => {
    expect(countBySection(['subject', 'customerNeed', 'contactId', 'recordType', 'mpnId'])).toEqual({
      customer: 1,
      deal: 2,
      vendor: 1,
      money: 0,
    });
  });
});
