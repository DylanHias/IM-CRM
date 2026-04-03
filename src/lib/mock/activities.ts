import type { Activity } from '@/types/entities';

const ago = (days: number, hours = 10) =>
  new Date(Date.now() - days * 86400000 - hours * 3600000).toISOString();

const SYSTEM_USER_ID = 'mock-user-001';
const SYSTEM_USER_NAME = 'Jan De Vries';

export const mockActivities: Activity[] = [
  // cust-001 Technocom
  { id: 'act-001', customerId: 'cust-001', contactId: 'con-001', type: 'meeting', subject: 'Q1 Business Review', description: 'Annual review of IT roadmap and upcoming projects. Discussed server refresh timeline.', occurredAt: ago(3), startTime: null, activityStatus: 'completed', createdById: SYSTEM_USER_ID, createdByName: SYSTEM_USER_NAME, syncStatus: 'synced', remoteId: 'D365-ACT-001', source: 'local', createdAt: ago(3), updatedAt: ago(3) },
  { id: 'act-002', customerId: 'cust-001', contactId: 'con-002', type: 'call', subject: 'Follow-up on pricing proposal', description: 'Called to discuss the updated pricing for the server infrastructure.', occurredAt: ago(10), startTime: null, activityStatus: 'completed', createdById: SYSTEM_USER_ID, createdByName: SYSTEM_USER_NAME, syncStatus: 'synced', remoteId: 'D365-ACT-002', source: 'local', createdAt: ago(10), updatedAt: ago(10) },
  { id: 'act-003', customerId: 'cust-001', contactId: 'con-001', type: 'visit', subject: 'On-site demo: storage solutions', description: 'Visited client site for NetApp demo. Positive reception. Kevin was present.', occurredAt: ago(25), startTime: null, activityStatus: 'completed', createdById: SYSTEM_USER_ID, createdByName: SYSTEM_USER_NAME, syncStatus: 'synced', remoteId: 'D365-ACT-003', source: 'local', createdAt: ago(25), updatedAt: ago(25) },
  { id: 'act-004', customerId: 'cust-001', contactId: null, type: 'note', subject: 'Internal note: budget cycle info', description: 'Confirmed budget cycle ends March 31. Push to close storage deal before end of month.', occurredAt: ago(5), startTime: null, activityStatus: 'completed', createdById: SYSTEM_USER_ID, createdByName: SYSTEM_USER_NAME, syncStatus: 'pending', remoteId: null, source: 'local', createdAt: ago(5), updatedAt: ago(5) },

  // cust-002 Nexgen Retail
  { id: 'act-005', customerId: 'cust-002', contactId: 'con-004', type: 'meeting', subject: 'Cloud migration strategy session', description: 'Workshop on Azure migration roadmap. Thomas very engaged with hybrid cloud approach.', occurredAt: ago(7), startTime: null, activityStatus: 'completed', createdById: SYSTEM_USER_ID, createdByName: SYSTEM_USER_NAME, syncStatus: 'synced', remoteId: 'D365-ACT-005', source: 'local', createdAt: ago(7), updatedAt: ago(7) },
  { id: 'act-006', customerId: 'cust-002', contactId: 'con-005', type: 'call', subject: 'Scheduling next steps', description: 'Quick call to align on timeline for infrastructure assessment.', occurredAt: ago(15), startTime: null, activityStatus: 'completed', createdById: SYSTEM_USER_ID, createdByName: SYSTEM_USER_NAME, syncStatus: 'synced', remoteId: 'D365-ACT-006', source: 'local', createdAt: ago(15), updatedAt: ago(15) },

  // cust-003 FinBank
  { id: 'act-007', customerId: 'cust-003', contactId: 'con-006', type: 'meeting', subject: 'Executive briefing: cybersecurity portfolio', description: 'Presented Palo Alto and CrowdStrike solutions to VP Technology. Strong interest in XDR.', occurredAt: ago(14), startTime: null, activityStatus: 'completed', createdById: SYSTEM_USER_ID, createdByName: SYSTEM_USER_NAME, syncStatus: 'synced', remoteId: 'D365-ACT-007', source: 'local', createdAt: ago(14), updatedAt: ago(14) },
  { id: 'act-008', customerId: 'cust-003', contactId: 'con-008', type: 'call', subject: 'Technical deep-dive: SIEM requirements', description: 'One hour call with Jeroen on SIEM integration requirements. Need to send technical specs.', occurredAt: ago(20), startTime: null, activityStatus: 'completed', createdById: SYSTEM_USER_ID, createdByName: SYSTEM_USER_NAME, syncStatus: 'synced', remoteId: 'D365-ACT-008', source: 'local', createdAt: ago(20), updatedAt: ago(20) },
  { id: 'act-009', customerId: 'cust-003', contactId: 'con-007', type: 'visit', subject: 'Proof of Concept kick-off', description: 'On-site PoC setup for network monitoring solution. Good progress.', occurredAt: ago(45), startTime: null, activityStatus: 'completed', createdById: SYSTEM_USER_ID, createdByName: SYSTEM_USER_NAME, syncStatus: 'synced', remoteId: 'D365-ACT-009', source: 'local', createdAt: ago(45), updatedAt: ago(45) },

  // cust-004 MediCare
  { id: 'act-010', customerId: 'cust-004', contactId: 'con-009', type: 'call', subject: 'GDPR compliance check-in', description: 'Discussed healthcare data compliance requirements and how our solutions address them.', occurredAt: ago(2), startTime: null, activityStatus: 'completed', createdById: SYSTEM_USER_ID, createdByName: SYSTEM_USER_NAME, syncStatus: 'pending', remoteId: null, source: 'local', createdAt: ago(2), updatedAt: ago(2) },
  { id: 'act-011', customerId: 'cust-004', contactId: 'con-010', type: 'meeting', subject: 'Budget approval for EHR infrastructure', description: 'Met with CFO to present ROI analysis for new server infrastructure.', occurredAt: ago(30), startTime: null, activityStatus: 'completed', createdById: SYSTEM_USER_ID, createdByName: SYSTEM_USER_NAME, syncStatus: 'synced', remoteId: 'D365-ACT-011', source: 'local', createdAt: ago(30), updatedAt: ago(30) },

  // cust-006 AutoDrive
  { id: 'act-012', customerId: 'cust-006', contactId: 'con-013', type: 'visit', subject: 'Fleet management software demo', description: 'Demonstrated fleet tracking solution. Heidi very interested. Competitor is Microsoft.', occurredAt: ago(21), startTime: null, activityStatus: 'completed', createdById: SYSTEM_USER_ID, createdByName: SYSTEM_USER_NAME, syncStatus: 'synced', remoteId: 'D365-ACT-012', source: 'local', createdAt: ago(21), updatedAt: ago(21) },
  { id: 'act-013', customerId: 'cust-006', contactId: 'con-012', type: 'call', subject: 'License renewal discussion', description: 'Annual license renewal coming up in 2 months. Opportunity to upsell support tier.', occurredAt: ago(35), startTime: null, activityStatus: 'completed', createdById: SYSTEM_USER_ID, createdByName: SYSTEM_USER_NAME, syncStatus: 'synced', remoteId: 'D365-ACT-013', source: 'local', createdAt: ago(35), updatedAt: ago(35) },

  // cust-007 GreenEnergy
  { id: 'act-014', customerId: 'cust-007', contactId: 'con-014', type: 'meeting', subject: 'Q4 technology roadmap review', description: 'CIO shared 3-year IT investment plan. Cloud-first strategy, security top priority.', occurredAt: ago(5), startTime: null, activityStatus: 'completed', createdById: SYSTEM_USER_ID, createdByName: SYSTEM_USER_NAME, syncStatus: 'synced', remoteId: 'D365-ACT-014', source: 'local', createdAt: ago(5), updatedAt: ago(5) },

  // cust-008 LogiFlow
  { id: 'act-015', customerId: 'cust-008', contactId: 'con-015', type: 'call', subject: 'WMS integration inquiry', description: 'Wendy called to ask about ERP/WMS integration options. Sending product overview.', occurredAt: ago(10), startTime: null, activityStatus: 'completed', createdById: SYSTEM_USER_ID, createdByName: SYSTEM_USER_NAME, syncStatus: 'synced', remoteId: 'D365-ACT-015', source: 'local', createdAt: ago(10), updatedAt: ago(10) },
  { id: 'act-016', customerId: 'cust-008', contactId: 'con-016', type: 'visit', subject: 'Warehouse automation assessment', description: 'Visited Antwerp warehouse with pre-sales engineer. Identified 3 automation opportunities.', occurredAt: ago(25), startTime: null, activityStatus: 'completed', createdById: SYSTEM_USER_ID, createdByName: SYSTEM_USER_NAME, syncStatus: 'synced', remoteId: 'D365-ACT-016', source: 'local', createdAt: ago(25), updatedAt: ago(25) },

  // cust-012 InsureTech
  { id: 'act-017', customerId: 'cust-012', contactId: 'con-020', type: 'meeting', subject: 'Annual account review', description: 'Strong partnership. Discussed expansion into data analytics products.', occurredAt: ago(1), startTime: null, activityStatus: 'completed', createdById: SYSTEM_USER_ID, createdByName: SYSTEM_USER_NAME, syncStatus: 'pending', remoteId: null, source: 'local', createdAt: ago(1), updatedAt: ago(1) },

  // cust-013 CloudBase
  { id: 'act-018', customerId: 'cust-013', contactId: 'con-021', type: 'call', subject: 'Partnership opportunity discussion', description: 'CloudBase interested in reseller agreement. Escalated to channel team.', occurredAt: ago(8), startTime: null, activityStatus: 'completed', createdById: SYSTEM_USER_ID, createdByName: SYSTEM_USER_NAME, syncStatus: 'synced', remoteId: 'D365-ACT-018', source: 'local', createdAt: ago(8), updatedAt: ago(8) },
  { id: 'act-019', customerId: 'cust-013', contactId: 'con-022', type: 'meeting', subject: 'Technical architecture review', description: 'Amelie presented their cloud architecture. Good fit for managed services offering.', occurredAt: ago(20), startTime: null, activityStatus: 'completed', createdById: SYSTEM_USER_ID, createdByName: SYSTEM_USER_NAME, syncStatus: 'synced', remoteId: 'D365-ACT-019', source: 'local', createdAt: ago(20), updatedAt: ago(20) },

  // cust-014 PharmaCare
  { id: 'act-020', customerId: 'cust-014', contactId: 'con-023', type: 'call', subject: 'GxP compliance solutions', description: 'Raf asked about validated infrastructure for pharmaceutical production. Sent compliance guide.', occurredAt: ago(30), startTime: null, activityStatus: 'completed', createdById: SYSTEM_USER_ID, createdByName: SYSTEM_USER_NAME, syncStatus: 'synced', remoteId: 'D365-ACT-020', source: 'local', createdAt: ago(30), updatedAt: ago(30) },

  // cust-018 DataVault
  { id: 'act-021', customerId: 'cust-018', contactId: 'con-024', type: 'visit', subject: 'Data platform demo', description: 'Demonstrated Databricks and Snowflake integrations. Lars very impressed with performance.', occurredAt: ago(6), startTime: null, activityStatus: 'completed', createdById: SYSTEM_USER_ID, createdByName: SYSTEM_USER_NAME, syncStatus: 'synced', remoteId: 'D365-ACT-021', source: 'local', createdAt: ago(6), updatedAt: ago(6) },
  { id: 'act-022', customerId: 'cust-018', contactId: 'con-025', type: 'call', subject: 'Procurement process walkthrough', description: 'Femke walked through internal approval process. Expect PO in 4-6 weeks.', occurredAt: ago(12), startTime: null, activityStatus: 'completed', createdById: SYSTEM_USER_ID, createdByName: SYSTEM_USER_NAME, syncStatus: 'synced', remoteId: 'D365-ACT-022', source: 'local', createdAt: ago(12), updatedAt: ago(12) },

  // cust-022 BioPharma
  { id: 'act-023', customerId: 'cust-022', contactId: 'con-026', type: 'meeting', subject: 'Lab IT infrastructure planning', description: 'Planning session for new R&D lab IT setup. HPC requirements discussed.', occurredAt: ago(4), startTime: null, activityStatus: 'completed', createdById: SYSTEM_USER_ID, createdByName: SYSTEM_USER_NAME, syncStatus: 'pending', remoteId: null, source: 'local', createdAt: ago(4), updatedAt: ago(4) },

  // cust-025 ProHR
  { id: 'act-024', customerId: 'cust-025', contactId: 'con-028', type: 'call', subject: 'HRIS evaluation support', description: 'Discussed how Ingram Micro products integrate with SAP SuccessFactors.', occurredAt: ago(9), startTime: null, activityStatus: 'completed', createdById: SYSTEM_USER_ID, createdByName: SYSTEM_USER_NAME, syncStatus: 'synced', remoteId: 'D365-ACT-024', source: 'local', createdAt: ago(9), updatedAt: ago(9) },
  { id: 'act-025', customerId: 'cust-025', contactId: 'con-027', type: 'meeting', subject: 'Executive relationship meeting', description: 'Quarterly catch-up with MD. Very positive relationship. Referred 2 new prospects.', occurredAt: ago(20), startTime: null, activityStatus: 'completed', createdById: SYSTEM_USER_ID, createdByName: SYSTEM_USER_NAME, syncStatus: 'synced', remoteId: 'D365-ACT-025', source: 'local', createdAt: ago(20), updatedAt: ago(20) },

  // cust-009 CyberShield
  { id: 'act-026', customerId: 'cust-009', contactId: 'con-017', type: 'meeting', subject: 'Security audit findings review', description: 'Reviewed penetration test results. Three critical findings to address. Follow-up in two weeks.', occurredAt: ago(8), startTime: null, activityStatus: 'completed', createdById: 'owner-1', createdByName: 'Jan De Vries', syncStatus: 'synced', remoteId: 'D365-ACT-026', source: 'local', createdAt: ago(8), updatedAt: ago(8) },

  // cust-010 RetailPro
  { id: 'act-027', customerId: 'cust-010', contactId: 'con-018', type: 'visit', subject: 'POS system on-site assessment', description: 'Visited Luxembourg store locations to assess current POS infrastructure. Identified upgrade path.', occurredAt: ago(15), startTime: null, activityStatus: 'completed', createdById: 'owner-3', createdByName: 'Pieter Claes', syncStatus: 'synced', remoteId: 'D365-ACT-027', source: 'local', createdAt: ago(15), updatedAt: ago(15) },

  // cust-015 MediaHub
  { id: 'act-028', customerId: 'cust-015', contactId: 'con-019', type: 'call', subject: 'Content delivery network pricing', description: 'Discussed CDN options for video streaming platform. Sent comparison sheet for Cloudflare and Akamai.', occurredAt: ago(12), startTime: null, activityStatus: 'completed', createdById: 'owner-1', createdByName: 'Jan De Vries', syncStatus: 'synced', remoteId: 'D365-ACT-028', source: 'local', createdAt: ago(12), updatedAt: ago(12) },

  // cust-020 PublicSector
  { id: 'act-029', customerId: 'cust-020', contactId: null, type: 'note', subject: 'Tender submission deadline noted', description: 'Public tender for network refresh closes April 15. Must submit through Mercurius portal.', occurredAt: ago(3), startTime: null, activityStatus: 'completed', createdById: 'owner-2', createdByName: 'Sophie Martens', syncStatus: 'pending', remoteId: null, source: 'local', createdAt: ago(3), updatedAt: ago(3) },

  // cust-021 SecureNet
  { id: 'act-030', customerId: 'cust-021', contactId: 'con-024', type: 'meeting', subject: 'Firewall replacement planning', description: 'Mapped current Fortinet estate. Planning migration to next-gen firewalls over Q2.', occurredAt: ago(6), startTime: null, activityStatus: 'completed', createdById: 'owner-1', createdByName: 'Jan De Vries', syncStatus: 'synced', remoteId: 'D365-ACT-030', source: 'local', createdAt: ago(6), updatedAt: ago(6) },

  // cust-026 Flux Manufacturing
  { id: 'act-031', customerId: 'cust-026', contactId: 'con-003', type: 'visit', subject: 'Factory floor IT walkthrough', description: 'Toured production facility in Mechelen. Discussed OT/IT convergence and edge computing needs.', occurredAt: ago(4), startTime: null, activityStatus: 'completed', createdById: 'owner-4', createdByName: 'Lotte Van den Berghe', syncStatus: 'synced', remoteId: 'D365-ACT-031', source: 'local', createdAt: ago(4), updatedAt: ago(4) },

  // cust-028 Ardenne Énergie
  { id: 'act-032', customerId: 'cust-028', contactId: 'con-006', type: 'call', subject: 'Smart grid data platform inquiry', description: 'CTO interested in real-time data analytics for grid management. Scheduling deep-dive with vendor.', occurredAt: ago(6), startTime: null, activityStatus: 'completed', createdById: 'owner-1', createdByName: 'Jan De Vries', syncStatus: 'synced', remoteId: 'D365-ACT-032', source: 'local', createdAt: ago(6), updatedAt: ago(6) },

  // cust-030 Luxembourg Health Institute
  { id: 'act-033', customerId: 'cust-030', contactId: 'con-009', type: 'meeting', subject: 'Medical imaging storage requirements', description: 'Discussed PACS storage expansion. Need 500TB within 6 months. Pure Storage shortlisted.', occurredAt: ago(8), startTime: null, activityStatus: 'completed', createdById: 'owner-3', createdByName: 'Pieter Claes', syncStatus: 'synced', remoteId: 'D365-ACT-033', source: 'local', createdAt: ago(8), updatedAt: ago(8) },

  // cust-032 Gemeente Brugge
  { id: 'act-034', customerId: 'cust-032', contactId: null, type: 'note', subject: 'Budget approval expected Q2', description: 'IT manager confirmed city council will vote on digital transformation budget in April session.', occurredAt: ago(15), startTime: null, activityStatus: 'completed', createdById: 'owner-5', createdByName: 'Thomas Willems', syncStatus: 'pending', remoteId: null, source: 'local', createdAt: ago(15), updatedAt: ago(15) },

  // cust-033 FinTrust
  { id: 'act-035', customerId: 'cust-033', contactId: 'con-020', type: 'call', subject: 'Compliance reporting tools demo', description: 'Walked through regulatory reporting dashboard capabilities. Strong interest in automated compliance.', occurredAt: ago(3), startTime: null, activityStatus: 'completed', createdById: 'owner-1', createdByName: 'Jan De Vries', syncStatus: 'synced', remoteId: 'D365-ACT-035', source: 'local', createdAt: ago(3), updatedAt: ago(3) },

  // cust-035 NovaTech
  { id: 'act-036', customerId: 'cust-035', contactId: 'con-021', type: 'meeting', subject: 'Managed services proposal review', description: 'Presented managed infrastructure proposal. Competitive with current Proximus contract.', occurredAt: ago(7), startTime: null, activityStatus: 'completed', createdById: 'owner-3', createdByName: 'Pieter Claes', syncStatus: 'synced', remoteId: 'D365-ACT-036', source: 'local', createdAt: ago(7), updatedAt: ago(7) },

  // cust-036 CargoLink
  { id: 'act-037', customerId: 'cust-036', contactId: 'con-025', type: 'visit', subject: 'Logistics hub network assessment', description: 'Assessed Amsterdam distribution centre. WiFi 6E and SD-WAN deployment recommended.', occurredAt: ago(2), startTime: null, activityStatus: 'completed', createdById: 'owner-4', createdByName: 'Lotte Van den Berghe', syncStatus: 'synced', remoteId: 'D365-ACT-037', source: 'local', createdAt: ago(2), updatedAt: ago(2) },

  // cust-038 SteelForge
  { id: 'act-038', customerId: 'cust-038', contactId: 'con-014', type: 'call', subject: 'ERP modernisation discussion', description: 'Discussed SAP S/4HANA migration path. Current on-prem system reaching end of support.', occurredAt: ago(12), startTime: null, activityStatus: 'completed', createdById: 'owner-1', createdByName: 'Jan De Vries', syncStatus: 'synced', remoteId: 'D365-ACT-038', source: 'local', createdAt: ago(12), updatedAt: ago(12) },

  // cust-040 MedVision
  { id: 'act-039', customerId: 'cust-040', contactId: 'con-015', type: 'meeting', subject: 'Diagnostic imaging AI platform', description: 'Demoed AI-assisted diagnostic tools. IT director wants pilot program for radiology department.', occurredAt: ago(5), startTime: null, activityStatus: 'completed', createdById: 'owner-5', createdByName: 'Thomas Willems', syncStatus: 'pending', remoteId: null, source: 'local', createdAt: ago(5), updatedAt: ago(5) },

  // cust-027 Benelux Freight
  { id: 'act-040', customerId: 'cust-027', contactId: 'con-016', type: 'call', subject: 'Fleet tracking software renewal', description: 'Annual renewal discussion. Opportunity to add real-time temperature monitoring module.', occurredAt: ago(11), startTime: null, activityStatus: 'completed', createdById: 'owner-5', createdByName: 'Thomas Willems', syncStatus: 'synced', remoteId: 'D365-ACT-040', source: 'local', createdAt: ago(11), updatedAt: ago(11) },
];
