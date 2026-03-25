import type {
  CrmUser,
  AuditLogEntry,
  SyncHealthMetrics,
  DataQualityMetrics,
  ActivityTimelinePoint,
  PipelineStats,
  TableStats,
} from '@/types/admin';
import type { SyncRecord } from '@/types/sync';

const ago = (days: number, hours = 10) =>
  new Date(Date.now() - days * 86400000 - hours * 3600000).toISOString();

// ── Users ──────────────────────────────────────────────────────────────

export const mockUsers: CrmUser[] = [
  { id: 'owner-1', email: 'jan.devries@ingrammicro.com', name: 'Jan De Vries', role: 'admin', businessUnit: 'Cloud & Datacenter', lastActiveAt: ago(0, 2), createdAt: ago(90), updatedAt: ago(0, 2) },
  { id: 'owner-2', email: 'sophie.martens@ingrammicro.com', name: 'Sophie Martens', role: 'user', businessUnit: 'Cloud & Datacenter', lastActiveAt: ago(0, 5), createdAt: ago(85), updatedAt: ago(0, 5) },
  { id: 'owner-3', email: 'pieter.claes@ingrammicro.com', name: 'Pieter Claes', role: 'user', businessUnit: 'Networking & Security', lastActiveAt: ago(1), createdAt: ago(80), updatedAt: ago(1) },
  { id: 'owner-4', email: 'lotte.vandenberghe@ingrammicro.com', name: 'Lotte Van den Berghe', role: 'user', businessUnit: 'Lifecycle Management', lastActiveAt: ago(3), createdAt: ago(60), updatedAt: ago(3) },
  { id: 'owner-5', email: 'thomas.willems@ingrammicro.com', name: 'Thomas Willems', role: 'user', businessUnit: 'Cloud & Datacenter', lastActiveAt: ago(7), createdAt: ago(45), updatedAt: ago(7) },
];

// ── Audit Log ──────────────────────────────────────────────────────────

export const mockAuditEntries: AuditLogEntry[] = [
  { id: 1, entityType: 'customer', entityId: 'cust-001', action: 'update', changedById: 'owner-1', changedByName: 'Jan De Vries', oldValues: { phone: '+32 2 111 2233' }, newValues: { phone: '+32 2 111 4455' }, changedAt: ago(0, 3) },
  { id: 2, entityType: 'activity', entityId: 'act-042', action: 'create', changedById: 'owner-2', changedByName: 'Sophie Martens', oldValues: null, newValues: { type: 'meeting', subject: 'Q2 planning session' }, changedAt: ago(0, 6) },
  { id: 3, entityType: 'opportunity', entityId: 'opp-015', action: 'update', changedById: 'owner-1', changedByName: 'Jan De Vries', oldValues: { stage: 'Proposal' }, newValues: { stage: 'Negotiation' }, changedAt: ago(1, 2) },
  { id: 4, entityType: 'contact', entityId: 'con-008', action: 'update', changedById: 'owner-3', changedByName: 'Pieter Claes', oldValues: { jobTitle: 'IT Manager' }, newValues: { jobTitle: 'Head of IT' }, changedAt: ago(1, 8) },
  { id: 5, entityType: 'follow_up', entityId: 'fu-021', action: 'create', changedById: 'owner-2', changedByName: 'Sophie Martens', oldValues: null, newValues: { title: 'Send updated pricing', dueDate: ago(-3) }, changedAt: ago(2, 4) },
  { id: 6, entityType: 'activity', entityId: 'act-038', action: 'delete', changedById: 'owner-1', changedByName: 'Jan De Vries', oldValues: { type: 'note', subject: 'Duplicate entry' }, newValues: null, changedAt: ago(2, 9) },
  { id: 7, entityType: 'customer', entityId: 'cust-018', action: 'create', changedById: 'owner-4', changedByName: 'Lotte Van den Berghe', oldValues: null, newValues: { name: 'BioPharm NV', city: 'Ghent' }, changedAt: ago(3, 3) },
  { id: 8, entityType: 'opportunity', entityId: 'opp-012', action: 'update', changedById: 'owner-3', changedByName: 'Pieter Claes', oldValues: { estimatedRevenue: 45000 }, newValues: { estimatedRevenue: 52000 }, changedAt: ago(3, 7) },
  { id: 9, entityType: 'contact', entityId: 'con-025', action: 'create', changedById: 'owner-1', changedByName: 'Jan De Vries', oldValues: null, newValues: { firstName: 'Marc', lastName: 'Peeters', email: 'marc.p@technocom.be' }, changedAt: ago(4, 2) },
  { id: 10, entityType: 'activity', entityId: 'act-035', action: 'create', changedById: 'owner-5', changedByName: 'Thomas Willems', oldValues: null, newValues: { type: 'call', subject: 'License renewal discussion' }, changedAt: ago(4, 6) },
  { id: 11, entityType: 'opportunity', entityId: 'opp-009', action: 'update', changedById: 'owner-2', changedByName: 'Sophie Martens', oldValues: { stage: 'Qualification' }, newValues: { stage: 'Proposal' }, changedAt: ago(5, 1) },
  { id: 12, entityType: 'follow_up', entityId: 'fu-019', action: 'update', changedById: 'owner-1', changedByName: 'Jan De Vries', oldValues: { completed: false }, newValues: { completed: true }, changedAt: ago(5, 5) },
  { id: 13, entityType: 'customer', entityId: 'cust-005', action: 'update', changedById: 'owner-3', changedByName: 'Pieter Claes', oldValues: { category: 'B' }, newValues: { category: 'A' }, changedAt: ago(6, 3) },
  { id: 14, entityType: 'activity', entityId: 'act-031', action: 'create', changedById: 'owner-4', changedByName: 'Lotte Van den Berghe', oldValues: null, newValues: { type: 'visit', subject: 'Datacenter walkthrough' }, changedAt: ago(7, 2) },
  { id: 15, entityType: 'opportunity', entityId: 'opp-007', action: 'delete', changedById: 'owner-1', changedByName: 'Jan De Vries', oldValues: { title: 'Stale deal — no response', stage: 'Qualification' }, newValues: null, changedAt: ago(7, 8) },
  { id: 16, entityType: 'contact', entityId: 'con-012', action: 'update', changedById: 'owner-2', changedByName: 'Sophie Martens', oldValues: { phone: null }, newValues: { phone: '+32 3 555 1234' }, changedAt: ago(8, 4) },
  { id: 17, entityType: 'activity', entityId: 'act-028', action: 'create', changedById: 'owner-1', changedByName: 'Jan De Vries', oldValues: null, newValues: { type: 'meeting', subject: 'Vendor alignment with HPE' }, changedAt: ago(9, 1) },
  { id: 18, entityType: 'follow_up', entityId: 'fu-015', action: 'create', changedById: 'owner-3', changedByName: 'Pieter Claes', oldValues: null, newValues: { title: 'Schedule PoC demo', dueDate: ago(5) }, changedAt: ago(10, 6) },
  { id: 19, entityType: 'customer', entityId: 'cust-010', action: 'update', changedById: 'owner-5', changedByName: 'Thomas Willems', oldValues: { industry: 'Manufacturing' }, newValues: { industry: 'Advanced Manufacturing' }, changedAt: ago(11, 3) },
  { id: 20, entityType: 'opportunity', entityId: 'opp-005', action: 'update', changedById: 'owner-1', changedByName: 'Jan De Vries', oldValues: { stage: 'Negotiation' }, newValues: { stage: 'Closed Won' }, changedAt: ago(12, 2) },
  { id: 21, entityType: 'activity', entityId: 'act-024', action: 'create', changedById: 'owner-2', changedByName: 'Sophie Martens', oldValues: null, newValues: { type: 'call', subject: 'Quarterly check-in with FinBank' }, changedAt: ago(13, 5) },
  { id: 22, entityType: 'contact', entityId: 'con-003', action: 'delete', changedById: 'owner-4', changedByName: 'Lotte Van den Berghe', oldValues: { firstName: 'Eva', lastName: 'Defunct', email: 'eva@old.be' }, newValues: null, changedAt: ago(14, 7) },
  { id: 23, entityType: 'opportunity', entityId: 'opp-003', action: 'update', changedById: 'owner-3', changedByName: 'Pieter Claes', oldValues: { stage: 'Proposal' }, newValues: { stage: 'Closed Lost' }, changedAt: ago(15, 4) },
  { id: 24, entityType: 'activity', entityId: 'act-020', action: 'update', changedById: 'owner-1', changedByName: 'Jan De Vries', oldValues: { description: 'TBD' }, newValues: { description: 'Discussed renewal terms. Client wants 3-year commitment.' }, changedAt: ago(16, 2) },
  { id: 25, entityType: 'follow_up', entityId: 'fu-010', action: 'update', changedById: 'owner-2', changedByName: 'Sophie Martens', oldValues: { dueDate: ago(18) }, newValues: { dueDate: ago(14) }, changedAt: ago(17, 6) },
  { id: 26, entityType: 'customer', entityId: 'cust-015', action: 'update', changedById: 'owner-1', changedByName: 'Jan De Vries', oldValues: { address: 'Oude Baan 12' }, newValues: { address: 'Nieuwstraat 45, 2000 Antwerpen' }, changedAt: ago(18, 3) },
  { id: 27, entityType: 'activity', entityId: 'act-016', action: 'create', changedById: 'owner-5', changedByName: 'Thomas Willems', oldValues: null, newValues: { type: 'note', subject: 'Competitor intel: Bechtle pushing hard' }, changedAt: ago(19, 8) },
  { id: 28, entityType: 'opportunity', entityId: 'opp-001', action: 'create', changedById: 'owner-1', changedByName: 'Jan De Vries', oldValues: null, newValues: { title: 'Server refresh — Technocom', stage: 'Qualification', estimatedRevenue: 120000 }, changedAt: ago(20, 1) },
  { id: 29, entityType: 'contact', entityId: 'con-018', action: 'create', changedById: 'owner-3', changedByName: 'Pieter Claes', oldValues: null, newValues: { firstName: 'Leen', lastName: 'Bogaert', email: 'leen.b@greenlogistics.be' }, changedAt: ago(22, 5) },
  { id: 30, entityType: 'activity', entityId: 'act-012', action: 'create', changedById: 'owner-4', changedByName: 'Lotte Van den Berghe', oldValues: null, newValues: { type: 'visit', subject: 'Fleet management software demo' }, changedAt: ago(24, 3) },
  { id: 31, entityType: 'opportunity', entityId: 'opp-002', action: 'update', changedById: 'owner-2', changedByName: 'Sophie Martens', oldValues: { stage: 'Discovery' }, newValues: { stage: 'Qualification' }, changedAt: ago(25, 7) },
  { id: 32, entityType: 'follow_up', entityId: 'fu-005', action: 'create', changedById: 'owner-1', changedByName: 'Jan De Vries', oldValues: null, newValues: { title: 'Prepare ROI deck for FinBank', dueDate: ago(20) }, changedAt: ago(26, 2) },
  { id: 33, entityType: 'customer', entityId: 'cust-020', action: 'create', changedById: 'owner-5', changedByName: 'Thomas Willems', oldValues: null, newValues: { name: 'EduTech Solutions', city: 'Leuven' }, changedAt: ago(27, 4) },
  { id: 34, entityType: 'activity', entityId: 'act-008', action: 'create', changedById: 'owner-1', changedByName: 'Jan De Vries', oldValues: null, newValues: { type: 'call', subject: 'Technical deep-dive: SIEM requirements' }, changedAt: ago(28, 6) },
  { id: 35, entityType: 'opportunity', entityId: 'opp-004', action: 'create', changedById: 'owner-3', changedByName: 'Pieter Claes', oldValues: null, newValues: { title: 'Firewall upgrade — GreenLogistics', stage: 'Discovery', estimatedRevenue: 38000 }, changedAt: ago(29, 1) },
];

// ── Sync Health ────────────────────────────────────────────────────────

export const mockSyncHealth: SyncHealthMetrics = {
  totalSyncs: 124,
  successCount: 118,
  errorCount: 6,
  successRate: 95.2,
  avgDurationMs: 3420,
  totalRecordsProcessed: 2847,
};

export const mockSyncErrors: SyncRecord[] = [
  { id: 1, syncType: 'full', status: 'error', startedAt: ago(1, 4), finishedAt: ago(1, 4), recordsPulled: 12, recordsPushed: 0, errorMessage: 'D365 API timeout after 30s — retry scheduled', createdAt: ago(1, 4) },
  { id: 2, syncType: 'incremental', status: 'error', startedAt: ago(5, 8), finishedAt: ago(5, 8), recordsPulled: 0, recordsPushed: 3, errorMessage: 'Conflict on opportunity opp-012: remote version newer', createdAt: ago(5, 8) },
  { id: 3, syncType: 'full', status: 'error', startedAt: ago(12, 2), finishedAt: ago(12, 2), recordsPulled: 45, recordsPushed: 0, errorMessage: 'Authentication token expired mid-sync', createdAt: ago(12, 2) },
  { id: 4, syncType: 'incremental', status: 'error', startedAt: ago(18, 6), finishedAt: ago(18, 6), recordsPulled: 0, recordsPushed: 1, errorMessage: 'Network unreachable — offline mode activated', createdAt: ago(18, 6) },
  { id: 5, syncType: 'full', status: 'error', startedAt: ago(23, 3), finishedAt: ago(23, 3), recordsPulled: 8, recordsPushed: 0, errorMessage: 'D365 rate limit exceeded (429) — backing off', createdAt: ago(23, 3) },
  { id: 6, syncType: 'incremental', status: 'error', startedAt: ago(28, 1), finishedAt: ago(28, 1), recordsPulled: 0, recordsPushed: 2, errorMessage: 'Schema mismatch on contact entity — field removed upstream', createdAt: ago(28, 1) },
];

// ── Analytics ──────────────────────────────────────────────────────────

export const mockDataQuality: DataQualityMetrics = {
  customersWithoutContacts: 4,
  customersWithoutRecentActivity: 7,
  staleOpportunities: 3,
  totalCustomers: 25,
  totalContacts: 42,
  totalActivities: 68,
};

export const mockActivityTimeline: ActivityTimelinePoint[] = (() => {
  const points: ActivityTimelinePoint[] = [];
  const now = new Date();
  // Seed-based pseudo-random for deterministic data
  let seed = 42;
  function rand(max: number) {
    seed = (seed * 16807 + 0) % 2147483647;
    return seed % (max + 1);
  }
  for (let i = 89; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const day = d.getDay();
    const isWeekend = day === 0 || day === 6;
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    points.push({
      date: label,
      meeting: isWeekend ? 0 : rand(3),
      call: isWeekend ? rand(1) : rand(4),
      visit: isWeekend ? 0 : rand(2),
      note: rand(2),
    });
  }
  return points;
})();

export const mockActivityByUser: { userName: string; count: number }[] = [
  { userName: 'Jan De Vries', count: 24 },
  { userName: 'Sophie Martens', count: 18 },
  { userName: 'Pieter Claes', count: 14 },
  { userName: 'Lotte Van den Berghe', count: 8 },
  { userName: 'Thomas Willems', count: 4 },
];

export const mockPipelineByStage: PipelineStats[] = [
  { stage: 'Discovery', count: 3, totalRevenue: 95000 },
  { stage: 'Qualification', count: 5, totalRevenue: 210000 },
  { stage: 'Proposal', count: 4, totalRevenue: 185000 },
  { stage: 'Negotiation', count: 2, totalRevenue: 140000 },
  { stage: 'Closed Won', count: 6, totalRevenue: 420000 },
  { stage: 'Closed Lost', count: 3, totalRevenue: 115000 },
];

export const mockWinRate = { won: 6, lost: 3, open: 14 };

// ── Data Management ────────────────────────────────────────────────────

export const mockTableStats: TableStats[] = [
  { tableName: 'customers', rowCount: 25 },
  { tableName: 'contacts', rowCount: 42 },
  { tableName: 'activities', rowCount: 68 },
  { tableName: 'follow_ups', rowCount: 31 },
  { tableName: 'opportunities', rowCount: 23 },
  { tableName: 'trainings', rowCount: 12 },
  { tableName: 'users', rowCount: 5 },
  { tableName: 'audit_log', rowCount: 35 },
  { tableName: 'sync_records', rowCount: 124 },
];
