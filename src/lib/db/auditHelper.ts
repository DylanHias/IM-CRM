import { insertAuditLog } from '@/lib/db/queries/auditLog';
import type { AuditAction, AuditEntityType } from '@/types/admin';

export async function logAudit(
  entityType: AuditEntityType,
  entityId: string,
  action: AuditAction,
  userId: string,
  userName: string,
  oldValues: Record<string, unknown> | null,
  newValues: Record<string, unknown> | null
): Promise<void> {
  try {
    await insertAuditLog({
      entityType,
      entityId,
      action,
      changedById: userId,
      changedByName: userName,
      oldValues,
      newValues,
      changedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[audit] logAudit failed:', err);
  }
}
