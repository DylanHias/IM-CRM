import type { Contact } from '@/types/entities';

const now = new Date().toISOString();

export const mockContacts: Contact[] = [
  // cust-001 Technocom Solutions
  { id: 'con-001', customerId: 'cust-001', firstName: 'Marc', lastName: 'Dubois', jobTitle: 'IT Director', email: 'marc.dubois@technocom.be', phone: '+32 2 123 45 68', mobile: '+32 478 123 456', notes: 'Key decision maker. Prefers email.', syncedAt: now, createdAt: now, updatedAt: now },
  { id: 'con-002', customerId: 'cust-001', firstName: 'Isabelle', lastName: 'Fontaine', jobTitle: 'Procurement Manager', email: 'i.fontaine@technocom.be', phone: '+32 2 123 45 69', mobile: null, notes: null, syncedAt: now, createdAt: now, updatedAt: now },
  { id: 'con-003', customerId: 'cust-001', firstName: 'Kevin', lastName: 'Adams', jobTitle: 'Systems Engineer', email: 'k.adams@technocom.be', phone: null, mobile: '+32 479 234 567', notes: 'Technical contact for implementations.', syncedAt: now, createdAt: now, updatedAt: now },

  // cust-002 Nexgen Retail
  { id: 'con-004', customerId: 'cust-002', firstName: 'Thomas', lastName: 'Willems', jobTitle: 'CTO', email: 'thomas.w@nexgenretail.com', phone: '+32 3 987 65 44', mobile: '+32 470 345 678', notes: null, syncedAt: now, createdAt: now, updatedAt: now },
  { id: 'con-005', customerId: 'cust-002', firstName: 'Nathalie', lastName: 'Peeters', jobTitle: 'Operations Manager', email: 'n.peeters@nexgenretail.com', phone: '+32 3 987 65 45', mobile: null, notes: 'Contact for scheduling visits.', syncedAt: now, createdAt: now, updatedAt: now },

  // cust-003 FinBank Europe
  { id: 'con-006', customerId: 'cust-003', firstName: 'Erik', lastName: 'van den Berg', jobTitle: 'VP Technology', email: 'e.vandenberg@finbank.eu', phone: '+31 20 555 0101', mobile: '+31 6 12345678', notes: 'Executive sponsor. Very busy.', syncedAt: now, createdAt: now, updatedAt: now },
  { id: 'con-007', customerId: 'cust-003', firstName: 'Anna', lastName: 'Koopman', jobTitle: 'IT Buyer', email: 'a.koopman@finbank.eu', phone: '+31 20 555 0102', mobile: null, notes: null, syncedAt: now, createdAt: now, updatedAt: now },
  { id: 'con-008', customerId: 'cust-003', firstName: 'Jeroen', lastName: 'Smits', jobTitle: 'Security Architect', email: 'j.smits@finbank.eu', phone: null, mobile: '+31 6 87654321', notes: 'Interested in cybersecurity products.', syncedAt: now, createdAt: now, updatedAt: now },

  // cust-004 MediCare
  { id: 'con-009', customerId: 'cust-004', firstName: 'Lien', lastName: 'Vandenberghe', jobTitle: 'ICT Manager', email: 'l.vandenberghe@medcaresys.be', phone: '+32 9 654 32 11', mobile: '+32 476 456 789', notes: null, syncedAt: now, createdAt: now, updatedAt: now },
  { id: 'con-010', customerId: 'cust-004', firstName: 'Bart', lastName: 'Declercq', jobTitle: 'CFO', email: 'b.declercq@medcaresys.be', phone: '+32 9 654 32 12', mobile: null, notes: 'Budget approver.', syncedAt: now, createdAt: now, updatedAt: now },

  // cust-005 EduLearn
  { id: 'con-011', customerId: 'cust-005', firstName: 'Sarah', lastName: 'Michiels', jobTitle: 'Director', email: 's.michiels@edulearn.be', phone: '+32 16 234 56 79', mobile: '+32 471 567 890', notes: null, syncedAt: now, createdAt: now, updatedAt: now },

  // cust-006 AutoDrive
  { id: 'con-012', customerId: 'cust-006', firstName: 'Frederik', lastName: 'Goossens', jobTitle: 'IT Manager', email: 'f.goossens@autodrive.be', phone: '+32 11 345 67 90', mobile: null, notes: null, syncedAt: now, createdAt: now, updatedAt: now },
  { id: 'con-013', customerId: 'cust-006', firstName: 'Heidi', lastName: 'Lemmens', jobTitle: 'Fleet Manager', email: 'h.lemmens@autodrive.be', phone: '+32 11 345 67 91', mobile: '+32 472 678 901', notes: 'Primary contact for fleet software.', syncedAt: now, createdAt: now, updatedAt: now },

  // cust-007 GreenEnergy
  { id: 'con-014', customerId: 'cust-007', firstName: 'Daan', lastName: 'Visser', jobTitle: 'CIO', email: 'd.visser@greenenergy.nl', phone: '+31 10 789 01 24', mobile: '+31 6 23456789', notes: null, syncedAt: now, createdAt: now, updatedAt: now },

  // cust-008 LogiFlow
  { id: 'con-015', customerId: 'cust-008', firstName: 'Wendy', lastName: 'Claessens', jobTitle: 'IT Director', email: 'w.claessens@logiflow.be', phone: '+32 3 456 78 91', mobile: '+32 473 789 012', notes: null, syncedAt: now, createdAt: now, updatedAt: now },
  { id: 'con-016', customerId: 'cust-008', firstName: 'Johan', lastName: 'Hermans', jobTitle: 'Warehouse Manager', email: 'j.hermans@logiflow.be', phone: '+32 3 456 78 92', mobile: null, notes: 'Interested in WMS upgrade.', syncedAt: now, createdAt: now, updatedAt: now },

  // cust-009 CyberShield
  { id: 'con-017', customerId: 'cust-009', firstName: 'Alexandre', lastName: 'Bernard', jobTitle: 'CEO', email: 'a.bernard@cybershield.be', phone: '+32 2 567 89 02', mobile: '+32 474 890 123', notes: 'Solo decision maker.', syncedAt: now, createdAt: now, updatedAt: now },

  // cust-010 RetailPro
  { id: 'con-018', customerId: 'cust-010', firstName: 'Claire', lastName: 'Weber', jobTitle: 'IT Procurement', email: 'c.weber@retailpro.lu', phone: '+352 2 678 90 13', mobile: null, notes: null, syncedAt: now, createdAt: now, updatedAt: now },
  { id: 'con-019', customerId: 'cust-010', firstName: 'Luc', lastName: 'Braun', jobTitle: 'CTO', email: 'l.braun@retailpro.lu', phone: '+352 2 678 90 14', mobile: '+352 691 234 567', notes: null, syncedAt: now, createdAt: now, updatedAt: now },

  // cust-012 InsureTech
  { id: 'con-020', customerId: 'cust-012', firstName: 'Marieke', lastName: 'de Jong', jobTitle: 'IT Manager', email: 'm.dejong@insuretech.nl', phone: '+31 70 890 12 35', mobile: '+31 6 34567890', notes: 'Very responsive.', syncedAt: now, createdAt: now, updatedAt: now },

  // cust-013 CloudBase
  { id: 'con-021', customerId: 'cust-013', firstName: 'Cedric', lastName: 'Renard', jobTitle: 'VP Sales', email: 'c.renard@cloudbase.be', phone: '+32 2 901 23 46', mobile: '+32 475 901 234', notes: null, syncedAt: now, createdAt: now, updatedAt: now },
  { id: 'con-022', customerId: 'cust-013', firstName: 'Amelie', lastName: 'Dupont', jobTitle: 'Cloud Architect', email: 'a.dupont@cloudbase.be', phone: null, mobile: '+32 476 012 345', notes: 'Technical evaluator.', syncedAt: now, createdAt: now, updatedAt: now },

  // cust-014 PharmaCare
  { id: 'con-023', customerId: 'cust-014', firstName: 'Raf', lastName: 'Janssens', jobTitle: 'Head of IT', email: 'r.janssens@pharmacare.be', phone: '+32 14 012 34 57', mobile: '+32 477 123 456', notes: null, syncedAt: now, createdAt: now, updatedAt: now },

  // cust-018 DataVault
  { id: 'con-024', customerId: 'cust-018', firstName: 'Lars', lastName: 'Hendriksen', jobTitle: 'Data Director', email: 'l.hendriksen@datavault.nl', phone: '+31 20 456 78 91', mobile: '+31 6 45678901', notes: null, syncedAt: now, createdAt: now, updatedAt: now },
  { id: 'con-025', customerId: 'cust-018', firstName: 'Femke', lastName: 'Bakker', jobTitle: 'Procurement', email: 'f.bakker@datavault.nl', phone: '+31 20 456 78 92', mobile: null, notes: null, syncedAt: now, createdAt: now, updatedAt: now },

  // cust-022 BioPharma
  { id: 'con-026', customerId: 'cust-022', firstName: 'Koen', lastName: 'Wouters', jobTitle: 'IT Director', email: 'k.wouters@biopharma.be', phone: '+32 16 890 12 35', mobile: '+32 478 234 567', notes: 'Prefers morning meetings.', syncedAt: now, createdAt: now, updatedAt: now },

  // cust-025 ProHR
  { id: 'con-027', customerId: 'cust-025', firstName: 'Valérie', lastName: 'Lecomte', jobTitle: 'Managing Director', email: 'v.lecomte@prohr.be', phone: '+32 2 123 45 01', mobile: '+32 479 345 678', notes: null, syncedAt: now, createdAt: now, updatedAt: now },
  { id: 'con-028', customerId: 'cust-025', firstName: 'Nicolas', lastName: 'Simon', jobTitle: 'HR Technology Lead', email: 'n.simon@prohr.be', phone: '+32 2 123 45 02', mobile: null, notes: 'Evaluating new HRIS.', syncedAt: now, createdAt: now, updatedAt: now },
];
