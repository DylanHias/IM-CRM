import { describe, it, expect } from 'vitest';
import {
  getRequiredFields,
  isFieldVisible,
  getStageProbability,
  getNextStage,
  getPreviousStage,
  isAwsVendor,
  isMicrosoftVendor,
  isConsolidatedAwsServiceType,
  STAGES,
} from '@/lib/opportunityRules';

describe('opportunityRules', () => {
  describe('vendor classifiers', () => {
    it('detects AWS vendors', () => {
      expect(isAwsVendor('AWS - CONSOLIDATED')).toBe(true);
      expect(isAwsVendor('AWS - STANDALONE')).toBe(true);
      expect(isAwsVendor('MICROSOFT - AZURE')).toBe(false);
      expect(isAwsVendor(null)).toBe(false);
      expect(isAwsVendor('')).toBe(false);
    });

    it('detects Microsoft vendors', () => {
      expect(isMicrosoftVendor('MICROSOFT - AZURE')).toBe(true);
      expect(isMicrosoftVendor('MICROSOFT - CLOUD')).toBe(true);
      expect(isMicrosoftVendor('AWS - CONSOLIDATED')).toBe(false);
      expect(isMicrosoftVendor(null)).toBe(false);
    });

    it('detects consolidated AWS service types', () => {
      expect(isConsolidatedAwsServiceType('Direct Consolidation')).toBe(true);
      expect(isConsolidatedAwsServiceType('Direct Consolidation – Cloud Marketplace (CMP)')).toBe(true);
      expect(isConsolidatedAwsServiceType('New Reseller Account – No Root Access')).toBe(false);
      expect(isConsolidatedAwsServiceType(null)).toBe(false);
    });
  });

  describe('getRequiredFields', () => {
    it('returns base fields when no vendor selected', () => {
      const fields = getRequiredFields({});
      expect(fields).toContain('subject');
      expect(fields).toContain('accountId');
      expect(fields).toContain('customerNeed');
      expect(fields).toContain('estimatedMRR');
      expect(fields).toContain('annualRevenue');
      expect(fields).not.toContain('apnId');
      expect(fields).not.toContain('msCspTenant');
    });

    it('adds AWS fields when AWS vendor selected', () => {
      const fields = getRequiredFields({ primaryVendor: 'AWS - CONSOLIDATED' });
      expect(fields).toContain('apnId');
      expect(fields).toContain('awsPartnerType');
      expect(fields).toContain('awsServiceType');
      expect(fields).toContain('apnTagging');
      expect(fields).toContain('endUserType');
      expect(fields).toContain('supportType');
      expect(fields).toContain('payerAccount');
      expect(fields).not.toContain('msCspTenant');
    });

    it('adds Existing Payee Account + Consolidation Acceptance Date when AWS Service Type is consolidated', () => {
      const fields = getRequiredFields({
        primaryVendor: 'AWS - CONSOLIDATED',
        awsServiceType: 'Direct Consolidation',
      });
      expect(fields).toContain('existingPayeeAccount');
      expect(fields).toContain('consolidationAcceptanceDate');
    });

    it('adds those same fields for CMP consolidation', () => {
      const fields = getRequiredFields({
        primaryVendor: 'AWS - STANDALONE',
        awsServiceType: 'Direct Consolidation – Cloud Marketplace (CMP)',
      });
      expect(fields).toContain('existingPayeeAccount');
      expect(fields).toContain('consolidationAcceptanceDate');
    });

    it('does NOT add consolidation fields for non-consolidated AWS service types', () => {
      const fields = getRequiredFields({
        primaryVendor: 'AWS - CONSOLIDATED',
        awsServiceType: 'New Reseller Account – No Root Access',
      });
      expect(fields).not.toContain('existingPayeeAccount');
      expect(fields).not.toContain('consolidationAcceptanceDate');
    });

    it('adds Microsoft fields when Microsoft vendor selected', () => {
      const fields = getRequiredFields({ primaryVendor: 'MICROSOFT - AZURE' });
      expect(fields).toContain('msCspTenant');
      expect(fields).toContain('mpnId');
      expect(fields).toContain('migrationType');
      expect(fields).toContain('endUserType');
      expect(fields).toContain('serviceName');
      expect(fields).toContain('competitiveWinback');
      expect(fields).not.toContain('apnId');
    });

    it('treats MICROSOFT - CLOUD identically to MICROSOFT - AZURE', () => {
      const azure = getRequiredFields({ primaryVendor: 'MICROSOFT - AZURE' });
      const cloud = getRequiredFields({ primaryVendor: 'MICROSOFT - CLOUD' });
      expect(azure.sort()).toEqual(cloud.sort());
    });

    it('adds Public Sector Segment when End User Type = Public Sector', () => {
      const fields = getRequiredFields({
        primaryVendor: 'AWS - CONSOLIDATED',
        endUserType: 'Public Sector',
      });
      expect(fields).toContain('publicSectorSegment');
    });

    it('does NOT add Public Sector Segment when End User Type = Commercial', () => {
      const fields = getRequiredFields({
        primaryVendor: 'AWS - CONSOLIDATED',
        endUserType: 'Commercial',
      });
      expect(fields).not.toContain('publicSectorSegment');
    });
  });

  describe('isFieldVisible', () => {
    it('always shows base fields', () => {
      expect(isFieldVisible('subject', {})).toBe(true);
      expect(isFieldVisible('customerNeed', {})).toBe(true);
    });

    it('hides AWS fields without AWS vendor', () => {
      expect(isFieldVisible('apnId', {})).toBe(false);
      expect(isFieldVisible('apnId', { primaryVendor: 'MICROSOFT - AZURE' })).toBe(false);
      expect(isFieldVisible('apnId', { primaryVendor: 'AWS - CONSOLIDATED' })).toBe(true);
    });

    it('hides Microsoft fields without Microsoft vendor', () => {
      expect(isFieldVisible('msCspTenant', {})).toBe(false);
      expect(isFieldVisible('msCspTenant', { primaryVendor: 'AWS - CONSOLIDATED' })).toBe(false);
      expect(isFieldVisible('msCspTenant', { primaryVendor: 'MICROSOFT - CLOUD' })).toBe(true);
    });

    it('hides consolidation fields unless AWS + consolidated service type', () => {
      expect(isFieldVisible('existingPayeeAccount', { primaryVendor: 'AWS - CONSOLIDATED' })).toBe(false);
      expect(isFieldVisible('existingPayeeAccount', {
        primaryVendor: 'AWS - CONSOLIDATED',
        awsServiceType: 'Direct Consolidation',
      })).toBe(true);
    });

    it('hides public sector segment unless End User Type = Public Sector', () => {
      expect(isFieldVisible('publicSectorSegment', { endUserType: 'Commercial' })).toBe(false);
      expect(isFieldVisible('publicSectorSegment', { endUserType: 'Public Sector' })).toBe(true);
    });
  });

  describe('stage helpers', () => {
    it('maps stages to probabilities', () => {
      expect(getStageProbability('Prospecting')).toBe(5);
      expect(getStageProbability('Qualified')).toBe(50);
      expect(getStageProbability('Verbal Received')).toBe(75);
      expect(getStageProbability('Purchased')).toBe(100);
    });

    it('navigates next/previous stages', () => {
      expect(getNextStage('Prospecting')).toBe('Validated');
      expect(getPreviousStage('Validated')).toBe('Prospecting');
      expect(getNextStage('Purchased')).toBe(null);
      expect(getPreviousStage('Prospecting')).toBe(null);
    });

    it('has 8 stages in expected order', () => {
      expect(STAGES).toEqual([
        'Prospecting', 'Validated', 'Qualified', 'Verbal Received',
        'Contract Received', 'Billing Rejection', 'Pending Vendor Confirmation', 'Purchased',
      ]);
    });
  });
});
