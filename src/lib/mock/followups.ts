import type { FollowUp } from '@/types/entities';

const ago = (days: number) => new Date(Date.now() - days * 86400000).toISOString();
const future = (days: number) => new Date(Date.now() + days * 86400000).toISOString().split('T')[0];
const past = (days: number) => new Date(Date.now() - days * 86400000).toISOString().split('T')[0];
const now = new Date().toISOString();

const USER_ID = 'mock-user-001';
const USER_NAME = 'Jan De Vries';

const OWNERS: Record<string, string> = {
  'owner-1': 'Jan De Vries',
  'owner-2': 'Sophie Janssens',
  'owner-3': 'Pieter Wouters',
  'owner-4': 'Katrien Peeters',
  'owner-5': 'Bram Claes',
};

export const mockFollowUps: FollowUp[] = [
  // cust-001 Open
  { id: 'fu-001', customerId: 'cust-001', activityId: 'act-001', title: 'Send updated pricing proposal', description: 'Send revised Q2 pricing for storage infrastructure.', dueDate: future(3), completed: false, completedAt: null, createdById: USER_ID, createdByName: USER_NAME, syncStatus: 'pending', remoteId: null, source: 'local', createdAt: ago(3), updatedAt: ago(3) },
  { id: 'fu-002', customerId: 'cust-001', activityId: 'act-002', title: 'Arrange NetApp demo', description: 'Schedule full-day NetApp demo at Technocom site.', dueDate: future(7), completed: false, completedAt: null, createdById: USER_ID, createdByName: USER_NAME, syncStatus: 'synced', remoteId: 'D365-FU-002', source: 'local', createdAt: ago(10), updatedAt: ago(10) },
  // cust-001 Completed
  { id: 'fu-003', customerId: 'cust-001', activityId: 'act-003', title: 'Send NetApp datasheet', description: null, dueDate: past(20), completed: true, completedAt: ago(22), createdById: USER_ID, createdByName: USER_NAME, syncStatus: 'synced', remoteId: 'D365-FU-003', source: 'local', createdAt: ago(25), updatedAt: ago(22) },

  // cust-002 Open
  { id: 'fu-004', customerId: 'cust-002', activityId: 'act-005', title: 'Send Azure migration cost estimate', description: 'Detailed TCO analysis for 3-year migration plan.', dueDate: future(5), completed: false, completedAt: null, createdById: USER_ID, createdByName: USER_NAME, syncStatus: 'pending', remoteId: null, source: 'local', createdAt: ago(7), updatedAt: ago(7) },

  // cust-003 Open
  { id: 'fu-005', customerId: 'cust-003', activityId: 'act-007', title: 'Share XDR solution brief', description: 'Send CrowdStrike Falcon Insight XDR documentation.', dueDate: future(2), completed: false, completedAt: null, createdById: USER_ID, createdByName: USER_NAME, syncStatus: 'pending', remoteId: null, source: 'local', createdAt: ago(14), updatedAt: ago(14) },
  { id: 'fu-006', customerId: 'cust-003', activityId: 'act-008', title: 'Send SIEM technical specs', description: 'Splunk SIEM technical architecture document requested by Jeroen.', dueDate: past(5), completed: false, completedAt: null, createdById: USER_ID, createdByName: USER_NAME, syncStatus: 'pending', remoteId: null, source: 'local', createdAt: ago(20), updatedAt: ago(20) },
  // cust-003 Completed
  { id: 'fu-007', customerId: 'cust-003', activityId: 'act-009', title: 'PoC report delivery', description: null, dueDate: past(30), completed: true, completedAt: ago(32), createdById: USER_ID, createdByName: USER_NAME, syncStatus: 'synced', remoteId: 'D365-FU-007', source: 'local', createdAt: ago(45), updatedAt: ago(32) },

  // cust-004 Open
  { id: 'fu-008', customerId: 'cust-004', activityId: 'act-010', title: 'Prepare GDPR compliance summary', description: 'One-pager on how our healthcare storage solutions meet GDPR requirements.', dueDate: future(4), completed: false, completedAt: null, createdById: USER_ID, createdByName: USER_NAME, syncStatus: 'pending', remoteId: null, source: 'local', createdAt: ago(2), updatedAt: ago(2) },

  // cust-006 Open
  { id: 'fu-009', customerId: 'cust-006', activityId: 'act-012', title: 'Send fleet software proposal', description: 'Formal proposal for fleet management solution with 3-year license pricing.', dueDate: future(10), completed: false, completedAt: null, createdById: USER_ID, createdByName: USER_NAME, syncStatus: 'synced', remoteId: 'D365-FU-009', source: 'local', createdAt: ago(21), updatedAt: ago(21) },
  // Overdue
  { id: 'fu-010', customerId: 'cust-006', activityId: 'act-013', title: 'Check renewal contract status', description: 'Confirm renewal terms with legal team.', dueDate: past(10), completed: false, completedAt: null, createdById: USER_ID, createdByName: USER_NAME, syncStatus: 'pending', remoteId: null, source: 'local', createdAt: ago(35), updatedAt: ago(35) },

  // cust-007 Open
  { id: 'fu-011', customerId: 'cust-007', activityId: 'act-014', title: 'Prepare security solutions overview', description: 'Tailored overview of Palo Alto + CrowdStrike for energy sector.', dueDate: future(6), completed: false, completedAt: null, createdById: USER_ID, createdByName: USER_NAME, syncStatus: 'pending', remoteId: null, source: 'local', createdAt: ago(5), updatedAt: ago(5) },

  // cust-008 Open
  { id: 'fu-012', customerId: 'cust-008', activityId: 'act-015', title: 'Send ERP integration overview', description: null, dueDate: future(2), completed: false, completedAt: null, createdById: USER_ID, createdByName: USER_NAME, syncStatus: 'pending', remoteId: null, source: 'local', createdAt: ago(10), updatedAt: ago(10) },
  { id: 'fu-013', customerId: 'cust-008', activityId: 'act-016', title: 'Follow up on automation assessment', description: 'Share assessment results and three proposed scenarios.', dueDate: past(3), completed: false, completedAt: null, createdById: USER_ID, createdByName: USER_NAME, syncStatus: 'pending', remoteId: null, source: 'local', createdAt: ago(25), updatedAt: ago(25) },

  // cust-012 Open
  { id: 'fu-014', customerId: 'cust-012', activityId: 'act-017', title: 'Prepare data analytics proposal', description: 'Proposal for Databricks + Power BI add-on.', dueDate: future(8), completed: false, completedAt: null, createdById: USER_ID, createdByName: USER_NAME, syncStatus: 'pending', remoteId: null, source: 'local', createdAt: ago(1), updatedAt: ago(1) },

  // cust-013 Completed
  { id: 'fu-015', customerId: 'cust-013', activityId: 'act-018', title: 'Escalate to channel team', description: null, dueDate: past(5), completed: true, completedAt: ago(7), createdById: USER_ID, createdByName: USER_NAME, syncStatus: 'synced', remoteId: 'D365-FU-015', source: 'local', createdAt: ago(8), updatedAt: ago(7) },

  // cust-018 Open
  { id: 'fu-016', customerId: 'cust-018', activityId: 'act-021', title: 'Send Databricks licensing quote', description: 'Team license for 10 data engineers.', dueDate: future(4), completed: false, completedAt: null, createdById: USER_ID, createdByName: USER_NAME, syncStatus: 'pending', remoteId: null, source: 'local', createdAt: ago(6), updatedAt: ago(6) },

  // cust-022 Open
  { id: 'fu-017', customerId: 'cust-022', activityId: 'act-023', title: 'HPC quote for lab infrastructure', description: '4x compute nodes + shared storage for research lab.', dueDate: future(12), completed: false, completedAt: null, createdById: USER_ID, createdByName: USER_NAME, syncStatus: 'pending', remoteId: null, source: 'local', createdAt: ago(4), updatedAt: ago(4) },

  // cust-025 Completed
  { id: 'fu-018', customerId: 'cust-025', activityId: 'act-024', title: 'Send SAP integration compatibility matrix', description: null, dueDate: past(5), completed: true, completedAt: ago(6), createdById: USER_ID, createdByName: USER_NAME, syncStatus: 'synced', remoteId: 'D365-FU-018', source: 'local', createdAt: ago(9), updatedAt: ago(6) },
  // cust-025 Overdue
  { id: 'fu-019', customerId: 'cust-025', activityId: 'act-025', title: 'Reach out to referred prospects', description: 'Valerie referred Logistics Plus and HR Innovations — follow up.', dueDate: past(8), completed: false, completedAt: null, createdById: USER_ID, createdByName: USER_NAME, syncStatus: 'pending', remoteId: null, source: 'local', createdAt: ago(20), updatedAt: ago(20) },

  // cust-005 Open
  { id: 'fu-020', customerId: 'cust-005', activityId: 'act-004', title: 'Schedule Veeam backup demo', description: 'Set up a 2-hour hands-on demo of Veeam Backup & Replication for their IT team.', dueDate: future(5), completed: false, completedAt: null, createdById: 'owner-1', createdByName: OWNERS['owner-1'], syncStatus: 'synced', remoteId: 'D365-FU-020', source: 'local', createdAt: ago(8), updatedAt: ago(8) },
  // cust-009 Open
  { id: 'fu-021', customerId: 'cust-009', activityId: 'act-006', title: 'Send cloud migration proposal', description: 'Azure landing zone proposal with cost breakdown for 50 VMs.', dueDate: future(9), completed: false, completedAt: null, createdById: 'owner-2', createdByName: OWNERS['owner-2'], syncStatus: 'pending', remoteId: null, source: 'local', createdAt: ago(4), updatedAt: ago(4) },
  // cust-010 Overdue
  { id: 'fu-022', customerId: 'cust-010', activityId: 'act-011', title: 'Follow up on Cisco Meraki quote', description: 'Quote sent 3 weeks ago, no response from procurement.', dueDate: past(7), completed: false, completedAt: null, createdById: 'owner-3', createdByName: OWNERS['owner-3'], syncStatus: 'pending', remoteId: null, source: 'local', createdAt: ago(28), updatedAt: ago(28) },
  // cust-011 Open
  { id: 'fu-023', customerId: 'cust-011', activityId: null, title: 'Prepare Microsoft EA renewal overview', description: 'Enterprise Agreement renewal due in Q3 — compile current license usage.', dueDate: future(14), completed: false, completedAt: null, createdById: 'owner-1', createdByName: OWNERS['owner-1'], syncStatus: 'synced', remoteId: 'D365-FU-023', source: 'local', createdAt: ago(2), updatedAt: ago(2) },
  // cust-014 Open
  { id: 'fu-024', customerId: 'cust-014', activityId: 'act-019', title: 'Send UPS sizing recommendation', description: 'APC Smart-UPS sizing for their new server room expansion.', dueDate: future(3), completed: false, completedAt: null, createdById: 'owner-4', createdByName: OWNERS['owner-4'], syncStatus: 'pending', remoteId: null, source: 'local', createdAt: ago(6), updatedAt: ago(6) },
  // cust-015 Completed
  { id: 'fu-025', customerId: 'cust-015', activityId: 'act-020', title: 'Deliver endpoint security assessment', description: null, dueDate: past(12), completed: true, completedAt: ago(14), createdById: 'owner-2', createdByName: OWNERS['owner-2'], syncStatus: 'synced', remoteId: 'D365-FU-025', source: 'local', createdAt: ago(30), updatedAt: ago(14) },
  // cust-016 Open
  { id: 'fu-026', customerId: 'cust-016', activityId: null, title: 'Share Dell APEX flex-on-demand brochure', description: 'Customer interested in consumption-based server model.', dueDate: future(6), completed: false, completedAt: null, createdById: 'owner-5', createdByName: OWNERS['owner-5'], syncStatus: 'pending', remoteId: null, source: 'local', createdAt: ago(3), updatedAt: ago(3) },
  // cust-017 Overdue
  { id: 'fu-027', customerId: 'cust-017', activityId: 'act-022', title: 'Confirm VMware license renewal pricing', description: 'Broadcom pricing changes — need to confirm new tier for 200 sockets.', dueDate: past(4), completed: false, completedAt: null, createdById: 'owner-3', createdByName: OWNERS['owner-3'], syncStatus: 'pending', remoteId: null, source: 'local', createdAt: ago(18), updatedAt: ago(18) },
  // cust-019 Open
  { id: 'fu-028', customerId: 'cust-019', activityId: null, title: 'Book on-site visit for storage refresh', description: 'NetApp FAS replacement discussion — book visit for early April.', dueDate: future(11), completed: false, completedAt: null, createdById: 'owner-1', createdByName: OWNERS['owner-1'], syncStatus: 'synced', remoteId: 'D365-FU-028', source: 'local', createdAt: ago(5), updatedAt: ago(5) },
  // cust-020 Open
  { id: 'fu-029', customerId: 'cust-020', activityId: 'act-002', title: 'Send HPE GreenLake proposal', description: 'Hybrid cloud proposal with 3-year commitment.', dueDate: future(8), completed: false, completedAt: null, createdById: 'owner-4', createdByName: OWNERS['owner-4'], syncStatus: 'pending', remoteId: null, source: 'local', createdAt: ago(7), updatedAt: ago(7) },
  // cust-021 Overdue
  { id: 'fu-030', customerId: 'cust-021', activityId: 'act-010', title: 'Escalate delayed Lenovo shipment', description: 'Order placed 6 weeks ago — ThinkStation delivery still pending.', dueDate: past(12), completed: false, completedAt: null, createdById: 'owner-5', createdByName: OWNERS['owner-5'], syncStatus: 'pending', remoteId: null, source: 'local', createdAt: ago(40), updatedAt: ago(40) },
  // cust-023 Completed
  { id: 'fu-031', customerId: 'cust-023', activityId: 'act-015', title: 'Send signed NDA to legal', description: null, dueDate: past(18), completed: true, completedAt: ago(20), createdById: 'owner-2', createdByName: OWNERS['owner-2'], syncStatus: 'synced', remoteId: 'D365-FU-031', source: 'local', createdAt: ago(25), updatedAt: ago(20) },
  // cust-024 Open
  { id: 'fu-032', customerId: 'cust-024', activityId: null, title: 'Prepare Palo Alto firewall comparison', description: 'PA-450 vs PA-460 comparison sheet for their branch offices.', dueDate: future(4), completed: false, completedAt: null, createdById: 'owner-3', createdByName: OWNERS['owner-3'], syncStatus: 'pending', remoteId: null, source: 'local', createdAt: ago(1), updatedAt: ago(1) },
  // cust-002 Overdue
  { id: 'fu-033', customerId: 'cust-002', activityId: 'act-006', title: 'Chase PO for approved Azure deal', description: 'Deal approved in meeting 2 weeks ago but PO still not received.', dueDate: past(3), completed: false, completedAt: null, createdById: 'owner-1', createdByName: OWNERS['owner-1'], syncStatus: 'pending', remoteId: null, source: 'local', createdAt: ago(16), updatedAt: ago(16) },
  // cust-009 Open
  { id: 'fu-034', customerId: 'cust-009', activityId: null, title: 'Send Sophos MDR quote', description: 'Managed detection & response for 300 endpoints.', dueDate: future(7), completed: false, completedAt: null, createdById: 'owner-4', createdByName: OWNERS['owner-4'], syncStatus: 'synced', remoteId: 'D365-FU-034', source: 'local', createdAt: ago(9), updatedAt: ago(9) },
  // cust-015 Open
  { id: 'fu-035', customerId: 'cust-015', activityId: 'act-020', title: 'Follow up on Aruba wireless site survey', description: 'Site survey completed last week — send results and proposal.', dueDate: future(2), completed: false, completedAt: null, createdById: 'owner-5', createdByName: OWNERS['owner-5'], syncStatus: 'pending', remoteId: null, source: 'local', createdAt: ago(11), updatedAt: ago(11) },
];
