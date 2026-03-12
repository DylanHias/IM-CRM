import type { Activity } from '@/types/entities';

const ago = (days: number, hours = 10) =>
  new Date(Date.now() - days * 86400000 - hours * 3600000).toISOString();

const SYSTEM_USER_ID = 'mock-user-001';
const SYSTEM_USER_NAME = 'Jan De Vries';

export const mockActivities: Activity[] = [
  // cust-001 Technocom
  { id: 'act-001', customerId: 'cust-001', contactId: 'con-001', type: 'meeting', subject: 'Q1 Business Review', description: 'Annual review of IT roadmap and upcoming projects. Discussed server refresh timeline.', occurredAt: ago(3), createdById: SYSTEM_USER_ID, createdByName: SYSTEM_USER_NAME, syncStatus: 'synced', remoteId: 'D365-ACT-001', createdAt: ago(3), updatedAt: ago(3) },
  { id: 'act-002', customerId: 'cust-001', contactId: 'con-002', type: 'call', subject: 'Follow-up on pricing proposal', description: 'Called to discuss the updated pricing for the server infrastructure.', occurredAt: ago(10), createdById: SYSTEM_USER_ID, createdByName: SYSTEM_USER_NAME, syncStatus: 'synced', remoteId: 'D365-ACT-002', createdAt: ago(10), updatedAt: ago(10) },
  { id: 'act-003', customerId: 'cust-001', contactId: 'con-001', type: 'visit', subject: 'On-site demo: storage solutions', description: 'Visited client site for NetApp demo. Positive reception. Kevin was present.', occurredAt: ago(25), createdById: SYSTEM_USER_ID, createdByName: SYSTEM_USER_NAME, syncStatus: 'synced', remoteId: 'D365-ACT-003', createdAt: ago(25), updatedAt: ago(25) },
  { id: 'act-004', customerId: 'cust-001', contactId: null, type: 'note', subject: 'Internal note: budget cycle info', description: 'Confirmed budget cycle ends March 31. Push to close storage deal before end of month.', occurredAt: ago(5), createdById: SYSTEM_USER_ID, createdByName: SYSTEM_USER_NAME, syncStatus: 'pending', remoteId: null, createdAt: ago(5), updatedAt: ago(5) },

  // cust-002 Nexgen Retail
  { id: 'act-005', customerId: 'cust-002', contactId: 'con-004', type: 'meeting', subject: 'Cloud migration strategy session', description: 'Workshop on Azure migration roadmap. Thomas very engaged with hybrid cloud approach.', occurredAt: ago(7), createdById: SYSTEM_USER_ID, createdByName: SYSTEM_USER_NAME, syncStatus: 'synced', remoteId: 'D365-ACT-005', createdAt: ago(7), updatedAt: ago(7) },
  { id: 'act-006', customerId: 'cust-002', contactId: 'con-005', type: 'call', subject: 'Scheduling next steps', description: 'Quick call to align on timeline for infrastructure assessment.', occurredAt: ago(15), createdById: SYSTEM_USER_ID, createdByName: SYSTEM_USER_NAME, syncStatus: 'synced', remoteId: 'D365-ACT-006', createdAt: ago(15), updatedAt: ago(15) },

  // cust-003 FinBank
  { id: 'act-007', customerId: 'cust-003', contactId: 'con-006', type: 'meeting', subject: 'Executive briefing: cybersecurity portfolio', description: 'Presented Palo Alto and CrowdStrike solutions to VP Technology. Strong interest in XDR.', occurredAt: ago(14), createdById: SYSTEM_USER_ID, createdByName: SYSTEM_USER_NAME, syncStatus: 'synced', remoteId: 'D365-ACT-007', createdAt: ago(14), updatedAt: ago(14) },
  { id: 'act-008', customerId: 'cust-003', contactId: 'con-008', type: 'call', subject: 'Technical deep-dive: SIEM requirements', description: 'One hour call with Jeroen on SIEM integration requirements. Need to send technical specs.', occurredAt: ago(20), createdById: SYSTEM_USER_ID, createdByName: SYSTEM_USER_NAME, syncStatus: 'synced', remoteId: 'D365-ACT-008', createdAt: ago(20), updatedAt: ago(20) },
  { id: 'act-009', customerId: 'cust-003', contactId: 'con-007', type: 'visit', subject: 'Proof of Concept kick-off', description: 'On-site PoC setup for network monitoring solution. Good progress.', occurredAt: ago(45), createdById: SYSTEM_USER_ID, createdByName: SYSTEM_USER_NAME, syncStatus: 'synced', remoteId: 'D365-ACT-009', createdAt: ago(45), updatedAt: ago(45) },

  // cust-004 MediCare
  { id: 'act-010', customerId: 'cust-004', contactId: 'con-009', type: 'call', subject: 'GDPR compliance check-in', description: 'Discussed healthcare data compliance requirements and how our solutions address them.', occurredAt: ago(2), createdById: SYSTEM_USER_ID, createdByName: SYSTEM_USER_NAME, syncStatus: 'pending', remoteId: null, createdAt: ago(2), updatedAt: ago(2) },
  { id: 'act-011', customerId: 'cust-004', contactId: 'con-010', type: 'meeting', subject: 'Budget approval for EHR infrastructure', description: 'Met with CFO to present ROI analysis for new server infrastructure.', occurredAt: ago(30), createdById: SYSTEM_USER_ID, createdByName: SYSTEM_USER_NAME, syncStatus: 'synced', remoteId: 'D365-ACT-011', createdAt: ago(30), updatedAt: ago(30) },

  // cust-006 AutoDrive
  { id: 'act-012', customerId: 'cust-006', contactId: 'con-013', type: 'visit', subject: 'Fleet management software demo', description: 'Demonstrated fleet tracking solution. Heidi very interested. Competitor is Microsoft.', occurredAt: ago(21), createdById: SYSTEM_USER_ID, createdByName: SYSTEM_USER_NAME, syncStatus: 'synced', remoteId: 'D365-ACT-012', createdAt: ago(21), updatedAt: ago(21) },
  { id: 'act-013', customerId: 'cust-006', contactId: 'con-012', type: 'call', subject: 'License renewal discussion', description: 'Annual license renewal coming up in 2 months. Opportunity to upsell support tier.', occurredAt: ago(35), createdById: SYSTEM_USER_ID, createdByName: SYSTEM_USER_NAME, syncStatus: 'synced', remoteId: 'D365-ACT-013', createdAt: ago(35), updatedAt: ago(35) },

  // cust-007 GreenEnergy
  { id: 'act-014', customerId: 'cust-007', contactId: 'con-014', type: 'meeting', subject: 'Q4 technology roadmap review', description: 'CIO shared 3-year IT investment plan. Cloud-first strategy, security top priority.', occurredAt: ago(5), createdById: SYSTEM_USER_ID, createdByName: SYSTEM_USER_NAME, syncStatus: 'synced', remoteId: 'D365-ACT-014', createdAt: ago(5), updatedAt: ago(5) },

  // cust-008 LogiFlow
  { id: 'act-015', customerId: 'cust-008', contactId: 'con-015', type: 'call', subject: 'WMS integration inquiry', description: 'Wendy called to ask about ERP/WMS integration options. Sending product overview.', occurredAt: ago(10), createdById: SYSTEM_USER_ID, createdByName: SYSTEM_USER_NAME, syncStatus: 'synced', remoteId: 'D365-ACT-015', createdAt: ago(10), updatedAt: ago(10) },
  { id: 'act-016', customerId: 'cust-008', contactId: 'con-016', type: 'visit', subject: 'Warehouse automation assessment', description: 'Visited Antwerp warehouse with pre-sales engineer. Identified 3 automation opportunities.', occurredAt: ago(25), createdById: SYSTEM_USER_ID, createdByName: SYSTEM_USER_NAME, syncStatus: 'synced', remoteId: 'D365-ACT-016', createdAt: ago(25), updatedAt: ago(25) },

  // cust-012 InsureTech
  { id: 'act-017', customerId: 'cust-012', contactId: 'con-020', type: 'meeting', subject: 'Annual account review', description: 'Strong partnership. Discussed expansion into data analytics products.', occurredAt: ago(1), createdById: SYSTEM_USER_ID, createdByName: SYSTEM_USER_NAME, syncStatus: 'pending', remoteId: null, createdAt: ago(1), updatedAt: ago(1) },

  // cust-013 CloudBase
  { id: 'act-018', customerId: 'cust-013', contactId: 'con-021', type: 'call', subject: 'Partnership opportunity discussion', description: 'CloudBase interested in reseller agreement. Escalated to channel team.', occurredAt: ago(8), createdById: SYSTEM_USER_ID, createdByName: SYSTEM_USER_NAME, syncStatus: 'synced', remoteId: 'D365-ACT-018', createdAt: ago(8), updatedAt: ago(8) },
  { id: 'act-019', customerId: 'cust-013', contactId: 'con-022', type: 'meeting', subject: 'Technical architecture review', description: 'Amelie presented their cloud architecture. Good fit for managed services offering.', occurredAt: ago(20), createdById: SYSTEM_USER_ID, createdByName: SYSTEM_USER_NAME, syncStatus: 'synced', remoteId: 'D365-ACT-019', createdAt: ago(20), updatedAt: ago(20) },

  // cust-014 PharmaCare
  { id: 'act-020', customerId: 'cust-014', contactId: 'con-023', type: 'call', subject: 'GxP compliance solutions', description: 'Raf asked about validated infrastructure for pharmaceutical production. Sent compliance guide.', occurredAt: ago(30), createdById: SYSTEM_USER_ID, createdByName: SYSTEM_USER_NAME, syncStatus: 'synced', remoteId: 'D365-ACT-020', createdAt: ago(30), updatedAt: ago(30) },

  // cust-018 DataVault
  { id: 'act-021', customerId: 'cust-018', contactId: 'con-024', type: 'visit', subject: 'Data platform demo', description: 'Demonstrated Databricks and Snowflake integrations. Lars very impressed with performance.', occurredAt: ago(6), createdById: SYSTEM_USER_ID, createdByName: SYSTEM_USER_NAME, syncStatus: 'synced', remoteId: 'D365-ACT-021', createdAt: ago(6), updatedAt: ago(6) },
  { id: 'act-022', customerId: 'cust-018', contactId: 'con-025', type: 'call', subject: 'Procurement process walkthrough', description: 'Femke walked through internal approval process. Expect PO in 4-6 weeks.', occurredAt: ago(12), createdById: SYSTEM_USER_ID, createdByName: SYSTEM_USER_NAME, syncStatus: 'synced', remoteId: 'D365-ACT-022', createdAt: ago(12), updatedAt: ago(12) },

  // cust-022 BioPharma
  { id: 'act-023', customerId: 'cust-022', contactId: 'con-026', type: 'meeting', subject: 'Lab IT infrastructure planning', description: 'Planning session for new R&D lab IT setup. HPC requirements discussed.', occurredAt: ago(4), createdById: SYSTEM_USER_ID, createdByName: SYSTEM_USER_NAME, syncStatus: 'pending', remoteId: null, createdAt: ago(4), updatedAt: ago(4) },

  // cust-025 ProHR
  { id: 'act-024', customerId: 'cust-025', contactId: 'con-028', type: 'call', subject: 'HRIS evaluation support', description: 'Discussed how Ingram Micro products integrate with SAP SuccessFactors.', occurredAt: ago(9), createdById: SYSTEM_USER_ID, createdByName: SYSTEM_USER_NAME, syncStatus: 'synced', remoteId: 'D365-ACT-024', createdAt: ago(9), updatedAt: ago(9) },
  { id: 'act-025', customerId: 'cust-025', contactId: 'con-027', type: 'meeting', subject: 'Executive relationship meeting', description: 'Quarterly catch-up with MD. Very positive relationship. Referred 2 new prospects.', occurredAt: ago(20), createdById: SYSTEM_USER_ID, createdByName: SYSTEM_USER_NAME, syncStatus: 'synced', remoteId: 'D365-ACT-025', createdAt: ago(20), updatedAt: ago(20) },
];
