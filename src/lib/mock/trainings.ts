import type { Training } from '@/types/entities';

const ago = (days: number) => new Date(Date.now() - days * 86400000).toISOString().split('T')[0];
const future = (days: number) => new Date(Date.now() + days * 86400000).toISOString().split('T')[0];
const now = new Date().toISOString();

export const mockTrainings: Training[] = [
  { id: 'trn-001', customerId: 'cust-001', title: 'Microsoft Azure Fundamentals (AZ-900)', trainingDate: ago(45), participant: 'Marc Dubois', provider: 'Microsoft Learning', status: 'completed', syncedAt: now, createdAt: now },
  { id: 'trn-002', customerId: 'cust-001', title: 'Cisco Networking Essentials', trainingDate: ago(90), participant: 'Kevin Adams', provider: 'Cisco Academy', status: 'completed', syncedAt: now, createdAt: now },
  { id: 'trn-003', customerId: 'cust-001', title: 'VMware vSphere: Install, Configure, Manage', trainingDate: future(30), participant: 'Kevin Adams', provider: 'VMware Learning', status: 'registered', syncedAt: now, createdAt: now },

  { id: 'trn-004', customerId: 'cust-002', title: 'AWS Cloud Practitioner', trainingDate: ago(20), participant: 'Thomas Willems', provider: 'AWS Training', status: 'completed', syncedAt: now, createdAt: now },
  { id: 'trn-005', customerId: 'cust-002', title: 'ITIL 4 Foundation', trainingDate: ago(60), participant: 'Nathalie Peeters', provider: 'Axelos', status: 'completed', syncedAt: now, createdAt: now },

  { id: 'trn-006', customerId: 'cust-003', title: 'Certified Information Security Manager (CISM)', trainingDate: ago(15), participant: 'Jeroen Smits', provider: 'ISACA', status: 'completed', syncedAt: now, createdAt: now },
  { id: 'trn-007', customerId: 'cust-003', title: 'CrowdStrike Falcon Administrator', trainingDate: future(14), participant: 'Jeroen Smits', provider: 'CrowdStrike', status: 'registered', syncedAt: now, createdAt: now },
  { id: 'trn-008', customerId: 'cust-003', title: 'Microsoft Security Operations Analyst (SC-200)', trainingDate: ago(120), participant: null, provider: 'Microsoft Learning', status: 'completed', syncedAt: now, createdAt: now },

  { id: 'trn-009', customerId: 'cust-004', title: 'HIPAA Compliance for IT Professionals', trainingDate: ago(30), participant: 'Lien Vandenberghe', provider: 'HealthIT Learning', status: 'completed', syncedAt: now, createdAt: now },
  { id: 'trn-010', customerId: 'cust-004', title: 'Azure for Healthcare', trainingDate: future(60), participant: 'Lien Vandenberghe', provider: 'Microsoft Learning', status: 'registered', syncedAt: now, createdAt: now },

  { id: 'trn-011', customerId: 'cust-006', title: 'IoT Device Management', trainingDate: ago(50), participant: 'Frederik Goossens', provider: 'Tech Academy', status: 'completed', syncedAt: now, createdAt: now },

  { id: 'trn-012', customerId: 'cust-007', title: 'Google Cloud Professional Data Engineer', trainingDate: ago(10), participant: 'Daan Visser', provider: 'Google Cloud', status: 'completed', syncedAt: now, createdAt: now },
  { id: 'trn-013', customerId: 'cust-007', title: 'Renewable Energy Systems & IoT', trainingDate: future(45), participant: null, provider: 'Energy Institute', status: 'registered', syncedAt: now, createdAt: now },

  { id: 'trn-014', customerId: 'cust-008', title: 'SAP EWM Warehouse Management', trainingDate: ago(40), participant: 'Johan Hermans', provider: 'SAP Learning', status: 'completed', syncedAt: now, createdAt: now },
  { id: 'trn-015', customerId: 'cust-008', title: 'Blue Yonder Supply Chain Fundamentals', trainingDate: future(20), participant: 'Wendy Claessens', provider: 'Blue Yonder', status: 'registered', syncedAt: now, createdAt: now },

  { id: 'trn-016', customerId: 'cust-012', title: 'Salesforce Administrator Certification', trainingDate: ago(25), participant: 'Marieke de Jong', provider: 'Salesforce', status: 'completed', syncedAt: now, createdAt: now },

  { id: 'trn-017', customerId: 'cust-013', title: 'Kubernetes Administrator (CKA)', trainingDate: ago(35), participant: 'Amelie Dupont', provider: 'CNCF', status: 'completed', syncedAt: now, createdAt: now },
  { id: 'trn-018', customerId: 'cust-013', title: 'HashiCorp Terraform Associate', trainingDate: future(10), participant: 'Amelie Dupont', provider: 'HashiCorp', status: 'registered', syncedAt: now, createdAt: now },

  { id: 'trn-019', customerId: 'cust-014', title: 'GxP Computerised Systems Validation', trainingDate: ago(55), participant: 'Raf Janssens', provider: 'PharmaTraining EU', status: 'completed', syncedAt: now, createdAt: now },
  { id: 'trn-020', customerId: 'cust-014', title: 'ISO 27001 Lead Implementer', trainingDate: ago(100), participant: null, provider: 'BSI Group', status: 'completed', syncedAt: now, createdAt: now },

  { id: 'trn-021', customerId: 'cust-018', title: 'Databricks Lakehouse Fundamentals', trainingDate: ago(8), participant: 'Lars Hendriksen', provider: 'Databricks Academy', status: 'completed', syncedAt: now, createdAt: now },
  { id: 'trn-022', customerId: 'cust-018', title: 'Snowflake SnowPro Core Certification', trainingDate: future(25), participant: 'Lars Hendriksen', provider: 'Snowflake University', status: 'registered', syncedAt: now, createdAt: now },

  { id: 'trn-023', customerId: 'cust-022', title: 'HPC Cluster Administration', trainingDate: ago(18), participant: 'Koen Wouters', provider: 'Intel Training', status: 'completed', syncedAt: now, createdAt: now },
  { id: 'trn-024', customerId: 'cust-022', title: 'AI/ML Infrastructure on Azure', trainingDate: future(35), participant: 'Koen Wouters', provider: 'Microsoft Learning', status: 'registered', syncedAt: now, createdAt: now },

  { id: 'trn-025', customerId: 'cust-025', title: 'SAP SuccessFactors Integration', trainingDate: ago(22), participant: 'Nicolas Simon', provider: 'SAP Learning', status: 'completed', syncedAt: now, createdAt: now },

  { id: 'trn-026', customerId: 'cust-019', title: 'Cold Chain Monitoring & IoT', trainingDate: ago(70), participant: null, provider: 'FoodTech Institute', status: 'completed', syncedAt: now, createdAt: now },
  { id: 'trn-027', customerId: 'cust-020', title: 'Government Cloud Security (ISO 27001)', trainingDate: ago(85), participant: null, provider: 'BSI Group', status: 'completed', syncedAt: now, createdAt: now },
  { id: 'trn-028', customerId: 'cust-021', title: 'Cisco CCNA Routing & Switching', trainingDate: ago(42), participant: null, provider: 'Cisco Academy', status: 'cancelled', syncedAt: now, createdAt: now },
  { id: 'trn-029', customerId: 'cust-015', title: 'Adobe Creative Cloud for Business', trainingDate: ago(33), participant: null, provider: 'Adobe Learning', status: 'completed', syncedAt: now, createdAt: now },
  { id: 'trn-030', customerId: 'cust-016', title: 'AutoCAD & BIM Fundamentals', trainingDate: ago(65), participant: null, provider: 'Autodesk Learning', status: 'completed', syncedAt: now, createdAt: now },
];
