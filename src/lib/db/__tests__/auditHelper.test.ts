import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the auditLog query module before importing auditHelper
vi.mock('@/lib/db/queries/auditLog', () => ({
  insertAuditLog: vi.fn().mockResolvedValue(undefined),
}));

import { logAudit } from '../auditHelper';
import { insertAuditLog } from '@/lib/db/queries/auditLog';

describe('auditHelper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls insertAuditLog with correct params', async () => {
    await logAudit('activity', 'ent-1', 'create', 'user-1', 'Dylan', null, { subject: 'Test' });
    expect(insertAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: 'activity',
        entityId: 'ent-1',
        action: 'create',
        changedById: 'user-1',
        changedByName: 'Dylan',
        oldValues: null,
        newValues: { subject: 'Test' },
      })
    );
  });

  it('does not throw when insertAuditLog fails', async () => {
    vi.mocked(insertAuditLog).mockRejectedValueOnce(new Error('DB error'));
    await expect(logAudit('activity', 'ent-1', 'create', 'user-1', 'Dylan', null, null)).resolves.toBeUndefined();
  });

  it('includes changedAt as ISO string', async () => {
    await logAudit('contact', 'c-1', 'update', 'user-1', 'Dylan', { old: true }, { new: true });
    const call = vi.mocked(insertAuditLog).mock.calls[0][0];
    expect(call.changedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
