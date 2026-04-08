import type {
  CrmUser,
} from '@/types/admin';
import type { SyncRecord } from '@/types/sync';

const ago = (days: number, hours = 10) =>
  new Date(Date.now() - days * 86400000 - hours * 3600000).toISOString();

// ── Users ──────────────────────────────────────────────────────────────

export const mockUsers: CrmUser[] = [
  { id: 'owner-1', email: 'jan.devries@ingrammicro.com', name: 'Jan De Vries', role: 'admin', businessUnit: 'Cloud & Datacenter', title: 'Technical Account Manager', lastActiveAt: ago(0, 2), profilePhoto: null, createdAt: ago(90), updatedAt: ago(0, 2) },
  { id: 'owner-2', email: 'sophie.martens@ingrammicro.com', name: 'Sophie Martens', role: 'user', businessUnit: 'Cloud & Datacenter', title: 'Cloud Solutions Specialist', lastActiveAt: ago(0, 5), profilePhoto: null, createdAt: ago(85), updatedAt: ago(0, 5) },
  { id: 'owner-3', email: 'pieter.claes@ingrammicro.com', name: 'Pieter Claes', role: 'user', businessUnit: 'Networking & Security', title: 'Security Consultant', lastActiveAt: ago(1), profilePhoto: null, createdAt: ago(80), updatedAt: ago(1) },
  { id: 'owner-4', email: 'lotte.vandenberghe@ingrammicro.com', name: 'Lotte Van den Berghe', role: 'user', businessUnit: 'Lifecycle Management', title: 'Account Manager', lastActiveAt: ago(3), profilePhoto: null, createdAt: ago(60), updatedAt: ago(3) },
  { id: 'owner-5', email: 'thomas.willems@ingrammicro.com', name: 'Thomas Willems', role: 'user', businessUnit: 'Cloud & Datacenter', title: 'Technical Account Manager', lastActiveAt: ago(7), profilePhoto: null, createdAt: ago(45), updatedAt: ago(7) },
  { id: 'owner-6', email: 'noor.bakker@ingrammicro.com', name: 'Noor Bakker', role: 'user', businessUnit: 'Software & Services', title: 'Software Licensing Specialist', lastActiveAt: ago(0, 8), profilePhoto: null, createdAt: ago(75), updatedAt: ago(0, 8) },
  { id: 'owner-7', email: 'wouter.janssens@ingrammicro.com', name: 'Wouter Janssens', role: 'admin', businessUnit: 'Advanced Solutions', title: 'Team Lead Cloud', lastActiveAt: ago(1, 3), profilePhoto: null, createdAt: ago(88), updatedAt: ago(1, 3) },
  { id: 'owner-8', email: 'eline.declercq@ingrammicro.com', name: 'Eline De Clercq', role: 'user', businessUnit: 'Networking & Security', title: 'Network Engineer', lastActiveAt: ago(2), profilePhoto: null, createdAt: ago(70), updatedAt: ago(2) },
  { id: 'owner-9', email: 'bram.peeters@ingrammicro.com', name: 'Bram Peeters', role: 'user', businessUnit: 'Lifecycle Management', title: 'Account Manager', lastActiveAt: ago(0, 12), profilePhoto: null, createdAt: ago(55), updatedAt: ago(0, 12) },
  { id: 'owner-10', email: 'lies.vanhoeck@ingrammicro.com', name: 'Lies Van Hoeck', role: 'user', businessUnit: 'Cloud & Datacenter', title: 'Cloud Solutions Specialist', lastActiveAt: ago(4), profilePhoto: null, createdAt: ago(50), updatedAt: ago(4) },
  { id: 'owner-11', email: 'stijn.hermans@ingrammicro.com', name: 'Stijn Hermans', role: 'user', businessUnit: 'Software & Services', title: 'Software Licensing Specialist', lastActiveAt: ago(1, 7), profilePhoto: null, createdAt: ago(65), updatedAt: ago(1, 7) },
  { id: 'owner-12', email: 'anke.mertens@ingrammicro.com', name: 'Anke Mertens', role: 'admin', businessUnit: 'Advanced Solutions', title: 'Solutions Architect', lastActiveAt: ago(0, 4), profilePhoto: null, createdAt: ago(82), updatedAt: ago(0, 4) },
  { id: 'owner-13', email: 'robbe.devos@ingrammicro.com', name: 'Robbe De Vos', role: 'user', businessUnit: 'Networking & Security', title: 'Security Consultant', lastActiveAt: ago(5), profilePhoto: null, createdAt: ago(40), updatedAt: ago(5) },
  { id: 'owner-14', email: 'fien.goossens@ingrammicro.com', name: 'Fien Goossens', role: 'user', businessUnit: 'Lifecycle Management', title: 'Account Manager', lastActiveAt: ago(2, 6), profilePhoto: null, createdAt: ago(35), updatedAt: ago(2, 6) },
  { id: 'owner-15', email: 'dries.vandam@ingrammicro.com', name: 'Dries Van Dam', role: 'user', businessUnit: 'Cloud & Datacenter', title: 'Technical Account Manager', lastActiveAt: ago(6), profilePhoto: null, createdAt: ago(30), updatedAt: ago(6) },
];

export const mockSyncRecords: SyncRecord[] = [
  { id: 1, syncType: 'd365', status: 'error', startedAt: ago(1, 4), finishedAt: ago(1, 4), recordsPulled: 12, recordsPushed: 0, errorMessage: 'D365 API timeout after 30s — retry scheduled', createdAt: ago(1, 4) },
  { id: 2, syncType: 'd365', status: 'error', startedAt: ago(12, 2), finishedAt: ago(12, 2), recordsPulled: 45, recordsPushed: 0, errorMessage: 'Authentication token expired mid-sync', createdAt: ago(12, 2) },
  { id: 3, syncType: 'd365', status: 'error', startedAt: ago(23, 3), finishedAt: ago(23, 3), recordsPulled: 8, recordsPushed: 0, errorMessage: 'D365 rate limit exceeded (429) — backing off', createdAt: ago(23, 3) },
  { id: 4, syncType: 'd365', status: 'success', startedAt: ago(0, 6), finishedAt: ago(0, 6), recordsPulled: 134, recordsPushed: 0, errorMessage: null, createdAt: ago(0, 6) },
  { id: 5, syncType: 'push_activities', status: 'success', startedAt: ago(0, 8), finishedAt: ago(0, 8), recordsPulled: 0, recordsPushed: 47, errorMessage: null, createdAt: ago(0, 8) },
  { id: 6, syncType: 'push_followups', status: 'success', startedAt: ago(2, 3), finishedAt: ago(2, 3), recordsPulled: 0, recordsPushed: 15, errorMessage: null, createdAt: ago(2, 3) },
  { id: 7, syncType: 'd365', status: 'success', startedAt: ago(3, 5), finishedAt: ago(3, 5), recordsPulled: 189, recordsPushed: 0, errorMessage: null, createdAt: ago(3, 5) },
  { id: 8, syncType: 'push_activities', status: 'partial', startedAt: ago(4, 1), finishedAt: ago(4, 1), recordsPulled: 0, recordsPushed: 32, errorMessage: '3 of 35 activities failed: missing required field "subject"', createdAt: ago(4, 1) },
  { id: 9, syncType: 'd365', status: 'success', startedAt: ago(6, 4), finishedAt: ago(6, 4), recordsPulled: 97, recordsPushed: 0, errorMessage: null, createdAt: ago(6, 4) },
  { id: 10, syncType: 'push_followups', status: 'partial', startedAt: ago(8, 2), finishedAt: ago(8, 2), recordsPulled: 0, recordsPushed: 18, errorMessage: '2 of 20 follow-ups skipped: duplicate dueDate conflict', createdAt: ago(8, 2) },
];

