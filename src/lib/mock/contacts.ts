import type { Contact } from '@/types/entities';

const now = new Date().toISOString();
const ago = (days: number) => new Date(Date.now() - days * 86400000).toISOString();

const syncDefaults = { syncStatus: 'synced' as const, remoteId: null, source: 'd365' as const };

export const mockContacts: Contact[] = [
  // cust-001 Technocom Solutions
  { id: 'con-001', customerId: 'cust-001', firstName: 'Marc', lastName: 'Dubois', jobTitle: 'IT Director', email: 'marc.dubois@technocom.be', phone: '+32 2 123 45 68', mobile: '+32 478 123 456', notes: 'Key decision maker. Prefers email.', contactType: 'Cloud Contact', cloudContact: null, ...syncDefaults, syncedAt: now, createdAt: now, updatedAt: ago(5) },
  { id: 'con-002', customerId: 'cust-001', firstName: 'Isabelle', lastName: 'Fontaine', jobTitle: 'Procurement Manager', email: 'i.fontaine@technocom.be', phone: '+32 2 123 45 69', mobile: null, notes: null, contactType: 'Reseller', cloudContact: null, ...syncDefaults, syncedAt: now, createdAt: now, updatedAt: ago(30) },
  { id: 'con-003', customerId: 'cust-001', firstName: 'Kevin', lastName: 'Adams', jobTitle: 'Systems Engineer', email: 'k.adams@technocom.be', phone: null, mobile: '+32 479 234 567', notes: 'Technical contact for implementations.', contactType: null, cloudContact: null, ...syncDefaults, syncedAt: now, createdAt: now, updatedAt: ago(60) },

  // cust-002 Nexgen Retail
  { id: 'con-004', customerId: 'cust-002', firstName: 'Thomas', lastName: 'Willems', jobTitle: 'CTO', email: 'thomas.w@nexgenretail.com', phone: '+32 3 987 65 44', mobile: '+32 470 345 678', notes: null, contactType: 'Cloud Contact', cloudContact: null, ...syncDefaults, syncedAt: now, createdAt: now, updatedAt: ago(2) },
  { id: 'con-005', customerId: 'cust-002', firstName: 'Nathalie', lastName: 'Peeters', jobTitle: 'Operations Manager', email: 'n.peeters@nexgenretail.com', phone: '+32 3 987 65 45', mobile: null, notes: 'Contact for scheduling visits.', contactType: 'Reseller', cloudContact: null, ...syncDefaults, syncedAt: now, createdAt: now, updatedAt: ago(15) },

  // cust-003 FinBank Europe
  { id: 'con-006', customerId: 'cust-003', firstName: 'Erik', lastName: 'van den Berg', jobTitle: 'VP Technology', email: 'e.vandenberg@finbank.eu', phone: '+31 20 555 0101', mobile: '+31 6 12345678', notes: 'Executive sponsor. Very busy.', contactType: 'Cloud Contact', cloudContact: null, ...syncDefaults, syncedAt: now, createdAt: now, updatedAt: ago(10) },
  { id: 'con-007', customerId: 'cust-003', firstName: 'Anna', lastName: 'Koopman', jobTitle: 'IT Buyer', email: 'a.koopman@finbank.eu', phone: '+31 20 555 0102', mobile: null, notes: null, contactType: 'Cloud Contact', cloudContact: null, ...syncDefaults, syncedAt: now, createdAt: now, updatedAt: ago(45) },
  { id: 'con-008', customerId: 'cust-003', firstName: 'Jeroen', lastName: 'Smits', jobTitle: 'Security Architect', email: 'j.smits@finbank.eu', phone: null, mobile: '+31 6 87654321', notes: 'Interested in cybersecurity products.', contactType: null, cloudContact: null, ...syncDefaults, syncedAt: now, createdAt: now, updatedAt: ago(90) },

  // cust-004 MediCare
  { id: 'con-009', customerId: 'cust-004', firstName: 'Lien', lastName: 'Vandenberghe', jobTitle: 'ICT Manager', email: 'l.vandenberghe@medcaresys.be', phone: '+32 9 654 32 11', mobile: '+32 476 456 789', notes: null, contactType: 'Cloud Contact', cloudContact: null, ...syncDefaults, syncedAt: now, createdAt: now, updatedAt: ago(3) },
  { id: 'con-010', customerId: 'cust-004', firstName: 'Bart', lastName: 'Declercq', jobTitle: 'CFO', email: 'b.declercq@medcaresys.be', phone: '+32 9 654 32 12', mobile: null, notes: 'Budget approver.', contactType: null, cloudContact: null, ...syncDefaults, syncedAt: now, createdAt: now, updatedAt: ago(20) },

  // cust-005 EduLearn
  { id: 'con-011', customerId: 'cust-005', firstName: 'Sarah', lastName: 'Michiels', jobTitle: 'Director', email: 's.michiels@edulearn.be', phone: '+32 16 234 56 79', mobile: '+32 471 567 890', notes: null, contactType: null, cloudContact: null, ...syncDefaults, syncedAt: now, createdAt: now, updatedAt: ago(120) },

  // cust-006 AutoDrive
  { id: 'con-012', customerId: 'cust-006', firstName: 'Frederik', lastName: 'Goossens', jobTitle: 'IT Manager', email: 'f.goossens@autodrive.be', phone: '+32 11 345 67 90', mobile: null, notes: null, contactType: 'Cloud Contact', cloudContact: null, ...syncDefaults, syncedAt: now, createdAt: now, updatedAt: ago(7) },
  { id: 'con-013', customerId: 'cust-006', firstName: 'Heidi', lastName: 'Lemmens', jobTitle: 'Fleet Manager', email: 'h.lemmens@autodrive.be', phone: '+32 11 345 67 91', mobile: '+32 472 678 901', notes: 'Primary contact for fleet software.', contactType: 'Reseller', cloudContact: null, ...syncDefaults, syncedAt: now, createdAt: now, updatedAt: ago(25) },

  // cust-007 GreenEnergy
  { id: 'con-014', customerId: 'cust-007', firstName: 'Daan', lastName: 'Visser', jobTitle: 'CIO', email: 'd.visser@greenenergy.nl', phone: '+31 10 789 01 24', mobile: '+31 6 23456789', notes: null, contactType: 'Cloud Contact', cloudContact: null, ...syncDefaults, syncedAt: now, createdAt: now, updatedAt: ago(1) },

  // cust-008 LogiFlow
  { id: 'con-015', customerId: 'cust-008', firstName: 'Wendy', lastName: 'Claessens', jobTitle: 'IT Director', email: 'w.claessens@logiflow.be', phone: '+32 3 456 78 91', mobile: '+32 473 789 012', notes: null, contactType: 'Cloud Contact', cloudContact: null, ...syncDefaults, syncedAt: now, createdAt: now, updatedAt: ago(8) },
  { id: 'con-016', customerId: 'cust-008', firstName: 'Johan', lastName: 'Hermans', jobTitle: 'Warehouse Manager', email: 'j.hermans@logiflow.be', phone: '+32 3 456 78 92', mobile: null, notes: 'Interested in WMS upgrade.', contactType: null, cloudContact: null, ...syncDefaults, syncedAt: now, createdAt: now, updatedAt: ago(40) },

  // cust-009 CyberShield
  { id: 'con-017', customerId: 'cust-009', firstName: 'Alexandre', lastName: 'Bernard', jobTitle: 'CEO', email: 'a.bernard@cybershield.be', phone: '+32 2 567 89 02', mobile: '+32 474 890 123', notes: 'Solo decision maker.', contactType: 'Cloud Contact', cloudContact: null, ...syncDefaults, syncedAt: now, createdAt: now, updatedAt: ago(12) },

  // cust-010 RetailPro
  { id: 'con-018', customerId: 'cust-010', firstName: 'Claire', lastName: 'Weber', jobTitle: 'IT Procurement', email: 'c.weber@retailpro.lu', phone: '+352 2 678 90 13', mobile: null, notes: null, contactType: null, cloudContact: null, ...syncDefaults, syncedAt: now, createdAt: now, updatedAt: ago(60) },
  { id: 'con-019', customerId: 'cust-010', firstName: 'Luc', lastName: 'Braun', jobTitle: 'CTO', email: 'l.braun@retailpro.lu', phone: '+352 2 678 90 14', mobile: '+352 691 234 567', notes: null, contactType: 'Cloud Contact', cloudContact: null, ...syncDefaults, syncedAt: now, createdAt: now, updatedAt: ago(4) },

  // cust-012 InsureTech
  { id: 'con-020', customerId: 'cust-012', firstName: 'Marieke', lastName: 'de Jong', jobTitle: 'IT Manager', email: 'm.dejong@insuretech.nl', phone: '+31 70 890 12 35', mobile: '+31 6 34567890', notes: 'Very responsive.', contactType: 'Cloud Contact', cloudContact: null, ...syncDefaults, syncedAt: now, createdAt: now, updatedAt: ago(1) },

  // cust-013 CloudBase
  { id: 'con-021', customerId: 'cust-013', firstName: 'Cedric', lastName: 'Renard', jobTitle: 'VP Sales', email: 'c.renard@cloudbase.be', phone: '+32 2 901 23 46', mobile: '+32 475 901 234', notes: null, contactType: 'Reseller', cloudContact: null, ...syncDefaults, syncedAt: now, createdAt: now, updatedAt: ago(20) },
  { id: 'con-022', customerId: 'cust-013', firstName: 'Amelie', lastName: 'Dupont', jobTitle: 'Cloud Architect', email: 'a.dupont@cloudbase.be', phone: null, mobile: '+32 476 012 345', notes: 'Technical evaluator.', contactType: 'Cloud Contact', cloudContact: null, ...syncDefaults, syncedAt: now, createdAt: now, updatedAt: ago(3) },

  // cust-014 PharmaCare
  { id: 'con-023', customerId: 'cust-014', firstName: 'Raf', lastName: 'Janssens', jobTitle: 'Head of IT', email: 'r.janssens@pharmacare.be', phone: '+32 14 012 34 57', mobile: '+32 477 123 456', notes: null, contactType: 'Cloud Contact', cloudContact: null, ...syncDefaults, syncedAt: now, createdAt: now, updatedAt: ago(6) },

  // cust-018 DataVault
  { id: 'con-024', customerId: 'cust-018', firstName: 'Lars', lastName: 'Hendriksen', jobTitle: 'Data Director', email: 'l.hendriksen@datavault.nl', phone: '+31 20 456 78 91', mobile: '+31 6 45678901', notes: null, contactType: 'Cloud Contact', cloudContact: null, ...syncDefaults, syncedAt: now, createdAt: now, updatedAt: ago(2) },
  { id: 'con-025', customerId: 'cust-018', firstName: 'Femke', lastName: 'Bakker', jobTitle: 'Procurement', email: 'f.bakker@datavault.nl', phone: '+31 20 456 78 92', mobile: null, notes: null, contactType: null, cloudContact: null, ...syncDefaults, syncedAt: now, createdAt: now, updatedAt: ago(50) },

  // cust-022 BioPharma
  { id: 'con-026', customerId: 'cust-022', firstName: 'Koen', lastName: 'Wouters', jobTitle: 'IT Director', email: 'k.wouters@biopharma.be', phone: '+32 16 890 12 35', mobile: '+32 478 234 567', notes: 'Prefers morning meetings.', contactType: 'Cloud Contact', cloudContact: null, ...syncDefaults, syncedAt: now, createdAt: now, updatedAt: ago(4) },

  // cust-025 ProHR
  { id: 'con-027', customerId: 'cust-025', firstName: 'Valérie', lastName: 'Lecomte', jobTitle: 'Managing Director', email: 'v.lecomte@prohr.be', phone: '+32 2 123 45 01', mobile: '+32 479 345 678', notes: null, contactType: null, cloudContact: null, ...syncDefaults, syncedAt: now, createdAt: now, updatedAt: ago(30) },
  { id: 'con-028', customerId: 'cust-025', firstName: 'Nicolas', lastName: 'Simon', jobTitle: 'HR Technology Lead', email: 'n.simon@prohr.be', phone: '+32 2 123 45 02', mobile: null, notes: 'Evaluating new HRIS.', contactType: 'Cloud Contact', cloudContact: null, ...syncDefaults, syncedAt: now, createdAt: now, updatedAt: ago(9) },

  // cust-011 AgroTech Partners
  { id: 'con-029', customerId: 'cust-011', firstName: 'Pieter', lastName: 'Coppens', jobTitle: 'IT Manager', email: 'p.coppens@agrotech.be', phone: '+32 89 234 56 10', mobile: '+32 478 345 012', notes: 'Main IT contact. Manages on-prem servers.', contactType: 'Cloud Contact', cloudContact: null, ...syncDefaults, syncedAt: now, createdAt: now, updatedAt: ago(3) },
  { id: 'con-030', customerId: 'cust-011', firstName: 'Elien', lastName: 'Maes', jobTitle: 'Procurement Manager', email: 'e.maes@agrotech.be', phone: '+32 89 234 56 11', mobile: null, notes: null, contactType: 'Reseller', cloudContact: null, ...syncDefaults, syncedAt: now, createdAt: now, updatedAt: ago(22) },
  { id: 'con-031', customerId: 'cust-011', firstName: 'Wim', lastName: 'Jacobs', jobTitle: 'Operations Manager', email: 'w.jacobs@agrotech.be', phone: '+32 89 234 56 12', mobile: '+32 470 456 123', notes: null, contactType: null, cloudContact: null, ...syncDefaults, syncedAt: now, createdAt: now, updatedAt: ago(45) },

  // cust-015 MediaHub Productions
  { id: 'con-032', customerId: 'cust-015', firstName: 'Jasper', lastName: 'De Smedt', jobTitle: 'CTO', email: 'j.desmedt@mediahub.be', phone: '+32 3 567 89 20', mobile: '+32 479 567 234', notes: 'Drives all tech decisions.', contactType: 'Cloud Contact', cloudContact: null, ...syncDefaults, syncedAt: now, createdAt: now, updatedAt: ago(5) },
  { id: 'con-033', customerId: 'cust-015', firstName: 'Noor', lastName: 'El Amrani', jobTitle: 'Creative Director', email: 'n.elamrani@mediahub.be', phone: '+32 3 567 89 21', mobile: null, notes: null, contactType: null, cloudContact: null, ...syncDefaults, syncedAt: now, createdAt: now, updatedAt: ago(18) },
  { id: 'con-034', customerId: 'cust-015', firstName: 'Stijn', lastName: 'Pauwels', jobTitle: 'Systems Engineer', email: 's.pauwels@mediahub.be', phone: null, mobile: '+32 471 678 345', notes: 'Handles storage and rendering infrastructure.', contactType: 'Cloud Contact', cloudContact: null, ...syncDefaults, syncedAt: now, createdAt: now, updatedAt: ago(35) },

  // cust-016 SmartBuild Engineering
  { id: 'con-035', customerId: 'cust-016', firstName: 'Ruben', lastName: 'Mertens', jobTitle: 'IT Director', email: 'r.mertens@smartbuild.be', phone: '+32 11 456 78 30', mobile: '+32 472 789 456', notes: null, contactType: 'Reseller', cloudContact: null, ...syncDefaults, syncedAt: now, createdAt: now, updatedAt: ago(7) },
  { id: 'con-036', customerId: 'cust-016', firstName: 'Katrien', lastName: 'Bogaert', jobTitle: 'CFO', email: 'k.bogaert@smartbuild.be', phone: '+32 11 456 78 31', mobile: null, notes: 'Budget holder. Requires formal quotes.', contactType: null, cloudContact: null, ...syncDefaults, syncedAt: now, createdAt: now, updatedAt: ago(28) },
  { id: 'con-037', customerId: 'cust-016', firstName: 'Tom', lastName: 'Aerts', jobTitle: 'BIM Coordinator', email: 't.aerts@smartbuild.be', phone: null, mobile: '+32 473 890 567', notes: null, contactType: 'Cloud Contact', cloudContact: null, ...syncDefaults, syncedAt: now, createdAt: now, updatedAt: ago(60) },

  // cust-017 TravelEase Benelux
  { id: 'con-038', customerId: 'cust-017', firstName: 'Sofie', lastName: 'Van Damme', jobTitle: 'CIO', email: 's.vandamme@travelease.be', phone: '+32 2 678 90 40', mobile: '+32 474 901 678', notes: 'Prefers video calls over in-person.', contactType: 'Cloud Contact', cloudContact: null, ...syncDefaults, syncedAt: now, createdAt: now, updatedAt: ago(2) },
  { id: 'con-039', customerId: 'cust-017', firstName: 'Mehdi', lastName: 'Benhaddou', jobTitle: 'Network Engineer', email: 'm.benhaddou@travelease.be', phone: '+32 2 678 90 41', mobile: null, notes: null, contactType: null, cloudContact: null, ...syncDefaults, syncedAt: now, createdAt: now, updatedAt: ago(40) },
  { id: 'con-040', customerId: 'cust-017', firstName: 'Lynn', lastName: 'Verhoeven', jobTitle: 'Procurement Manager', email: 'l.verhoeven@travelease.be', phone: '+32 2 678 90 42', mobile: '+32 475 012 789', notes: null, contactType: 'Reseller', cloudContact: null, ...syncDefaults, syncedAt: now, createdAt: now, updatedAt: ago(15) },

  // cust-019 FoodChain Logistics
  { id: 'con-041', customerId: 'cust-019', firstName: 'Rik', lastName: 'Peeters', jobTitle: 'IT Manager', email: 'r.peeters@foodchain.be', phone: '+32 15 789 01 50', mobile: '+32 476 123 890', notes: 'Looking into cold chain IoT solutions.', contactType: 'Cloud Contact', cloudContact: null, ...syncDefaults, syncedAt: now, createdAt: now, updatedAt: ago(4) },
  { id: 'con-042', customerId: 'cust-019', firstName: 'Hilde', lastName: 'Stevens', jobTitle: 'Supply Chain Director', email: 'h.stevens@foodchain.be', phone: '+32 15 789 01 51', mobile: null, notes: null, contactType: null, cloudContact: null, ...syncDefaults, syncedAt: now, createdAt: now, updatedAt: ago(30) },
  { id: 'con-043', customerId: 'cust-019', firstName: 'Youssef', lastName: 'Benali', jobTitle: 'Security Officer', email: 'y.benali@foodchain.be', phone: null, mobile: '+32 477 234 901', notes: 'GDPR and food safety compliance focus.', contactType: 'Cloud Contact', cloudContact: null, ...syncDefaults, syncedAt: now, createdAt: now, updatedAt: ago(55) },

  // cust-020 PublicSector IT
  { id: 'con-044', customerId: 'cust-020', firstName: 'Jan', lastName: 'Vermeersch', jobTitle: 'Head of IT', email: 'j.vermeersch@publicsectorit.be', phone: '+32 2 890 12 60', mobile: '+32 478 345 012', notes: 'Government framework agreements required.', contactType: 'Cloud Contact', cloudContact: null, ...syncDefaults, syncedAt: now, createdAt: now, updatedAt: ago(6) },
  { id: 'con-045', customerId: 'cust-020', firstName: 'Anja', lastName: 'Claes', jobTitle: 'Project Manager', email: 'a.claes@publicsectorit.be', phone: '+32 2 890 12 61', mobile: null, notes: null, contactType: null, cloudContact: null, ...syncDefaults, syncedAt: now, createdAt: now, updatedAt: ago(20) },
  { id: 'con-046', customerId: 'cust-020', firstName: 'Bram', lastName: 'De Wolf', jobTitle: 'Cloud Architect', email: 'b.dewolf@publicsectorit.be', phone: null, mobile: '+32 479 456 123', notes: 'Evaluating sovereign cloud options.', contactType: 'Cloud Contact', cloudContact: null, ...syncDefaults, syncedAt: now, createdAt: now, updatedAt: ago(10) },

  // cust-021 SecureNet Communications
  { id: 'con-047', customerId: 'cust-021', firstName: 'Dieter', lastName: 'Vos', jobTitle: 'CTO', email: 'd.vos@securenet.be', phone: '+32 9 901 23 70', mobile: '+32 470 567 234', notes: null, contactType: 'Cloud Contact', cloudContact: null, ...syncDefaults, syncedAt: now, createdAt: now, updatedAt: ago(1) },
  { id: 'con-048', customerId: 'cust-021', firstName: 'Charlotte', lastName: 'Lemaire', jobTitle: 'Sales Director', email: 'c.lemaire@securenet.be', phone: '+32 9 901 23 71', mobile: '+32 471 678 345', notes: 'Partner channel contact.', contactType: 'Reseller', cloudContact: null, ...syncDefaults, syncedAt: now, createdAt: now, updatedAt: ago(14) },
  { id: 'con-049', customerId: 'cust-021', firstName: 'Geert', lastName: 'Willems', jobTitle: 'Network Engineer', email: 'g.willems@securenet.be', phone: null, mobile: null, notes: null, contactType: null, cloudContact: null, ...syncDefaults, syncedAt: now, createdAt: now, updatedAt: ago(50) },

  // cust-023 Urban Mobility SPRL
  { id: 'con-050', customerId: 'cust-023', firstName: 'Marie', lastName: 'Laurent', jobTitle: 'Managing Director', email: 'm.laurent@urbanmobility.be', phone: '+32 2 012 34 80', mobile: '+32 472 789 456', notes: 'Final sign-off on all purchases.', contactType: null, cloudContact: null, ...syncDefaults, syncedAt: now, createdAt: now, updatedAt: ago(8) },
  { id: 'con-051', customerId: 'cust-023', firstName: 'Jens', lastName: 'Declerck', jobTitle: 'IT Manager', email: 'j.declerck@urbanmobility.be', phone: '+32 2 012 34 81', mobile: null, notes: null, contactType: 'Cloud Contact', cloudContact: null, ...syncDefaults, syncedAt: now, createdAt: now, updatedAt: ago(25) },

  // cust-024 EcoWaste Solutions
  { id: 'con-052', customerId: 'cust-024', firstName: 'Eva', lastName: 'Martens', jobTitle: 'Operations Manager', email: 'e.martens@ecowaste.be', phone: '+32 14 123 45 90', mobile: '+32 473 890 567', notes: null, contactType: 'Reseller', cloudContact: null, ...syncDefaults, syncedAt: now, createdAt: now, updatedAt: ago(11) },
  { id: 'con-053', customerId: 'cust-024', firstName: 'Sander', lastName: 'Thijs', jobTitle: 'Systems Engineer', email: 's.thijs@ecowaste.be', phone: '+32 14 123 45 91', mobile: null, notes: 'Manages fleet tracking and route optimization systems.', contactType: 'Cloud Contact', cloudContact: null, ...syncDefaults, syncedAt: now, createdAt: now, updatedAt: ago(33) },

  // cust-002 Nexgen Retail (extra)
  { id: 'con-054', customerId: 'cust-002', firstName: 'Julie', lastName: 'Hendrickx', jobTitle: 'Cloud Architect', email: 'j.hendrickx@nexgenretail.com', phone: null, mobile: '+32 474 901 678', notes: 'Technical evaluator for cloud migrations.', contactType: 'Cloud Contact', cloudContact: null, ...syncDefaults, syncedAt: now, createdAt: now, updatedAt: ago(9) },

  // cust-004 MediCare Systems (extra)
  { id: 'con-055', customerId: 'cust-004', firstName: 'Griet', lastName: 'Van Hoeck', jobTitle: 'Security Officer', email: 'g.vanhoeck@medcaresys.be', phone: '+32 9 654 32 13', mobile: null, notes: 'Handles GDPR and patient data compliance.', contactType: null, cloudContact: null, ...syncDefaults, syncedAt: now, createdAt: now, updatedAt: ago(16) },

  // cust-005 EduLearn Platform (extra)
  { id: 'con-056', customerId: 'cust-005', firstName: 'Robin', lastName: 'Celis', jobTitle: 'IT Coordinator', email: 'r.celis@edulearn.be', phone: '+32 16 234 56 80', mobile: '+32 475 012 789', notes: null, contactType: 'Cloud Contact', cloudContact: null, ...syncDefaults, syncedAt: now, createdAt: now, updatedAt: ago(42) },
  { id: 'con-057', customerId: 'cust-005', firstName: 'Ines', lastName: 'Verstraete', jobTitle: 'Procurement', email: 'i.verstraete@edulearn.be', phone: '+32 16 234 56 81', mobile: null, notes: 'Handles all purchase orders.', contactType: 'Reseller', cloudContact: null, ...syncDefaults, syncedAt: now, createdAt: now, updatedAt: ago(70) },

  // cust-007 GreenEnergy Benelux (extra)
  { id: 'con-058', customerId: 'cust-007', firstName: 'Wouter', lastName: 'De Graaf', jobTitle: 'Cloud Architect', email: 'w.degraaf@greenenergy.nl', phone: '+31 10 789 01 25', mobile: '+31 6 34567012', notes: 'Evaluating Azure migration.', contactType: 'Cloud Contact', cloudContact: null, ...syncDefaults, syncedAt: now, createdAt: now, updatedAt: ago(5) },

  // cust-009 CyberShield Security (extra)
  { id: 'con-059', customerId: 'cust-009', firstName: 'Liesbeth', lastName: 'Francois', jobTitle: 'Sales Director', email: 'l.francois@cybershield.be', phone: '+32 2 567 89 03', mobile: '+32 476 123 890', notes: null, contactType: 'Reseller', cloudContact: null, ...syncDefaults, syncedAt: now, createdAt: now, updatedAt: ago(19) },
  { id: 'con-060', customerId: 'cust-009', firstName: 'Maxime', lastName: 'Dumont', jobTitle: 'Systems Engineer', email: 'm.dumont@cybershield.be', phone: null, mobile: '+32 477 234 901', notes: 'Handles SOC tooling and SIEM deployments.', contactType: 'Cloud Contact', cloudContact: null, ...syncDefaults, syncedAt: now, createdAt: now, updatedAt: ago(38) },

  // cust-026 Flux Manufacturing
  { id: 'con-061', customerId: 'cust-026', firstName: 'Tom', lastName: 'Mertens', jobTitle: 'Plant IT Manager', email: 't.mertens@fluxmfg.be', phone: '+32 15 345 67 01', mobile: '+32 478 901 234', notes: 'Manages factory floor OT/IT convergence.', contactType: 'Cloud Contact', cloudContact: null, ...syncDefaults, syncedAt: now, createdAt: now, updatedAt: ago(3) },
  { id: 'con-062', customerId: 'cust-026', firstName: 'Eline', lastName: 'Maes', jobTitle: 'Procurement Lead', email: 'e.maes@fluxmfg.be', phone: '+32 15 345 67 02', mobile: null, notes: null, contactType: 'Reseller', cloudContact: null, ...syncDefaults, syncedAt: now, createdAt: now, updatedAt: ago(18) },

  // cust-027 Benelux Freight Services
  { id: 'con-063', customerId: 'cust-027', firstName: 'Stijn', lastName: 'Coppens', jobTitle: 'IT Director', email: 's.coppens@beneluxfreight.be', phone: '+32 3 567 89 10', mobile: '+32 479 012 345', notes: null, contactType: 'Cloud Contact', cloudContact: null, ...syncDefaults, syncedAt: now, createdAt: now, updatedAt: ago(7) },

  // cust-028 Ardenne Énergie
  { id: 'con-064', customerId: 'cust-028', firstName: 'François', lastName: 'Gilles', jobTitle: 'Responsable IT', email: 'f.gilles@ardenne-energie.be', phone: '+32 81 234 56 01', mobile: '+32 470 123 456', notes: 'French-speaking. Prefers calls over email.', contactType: null, cloudContact: null, ...syncDefaults, syncedAt: now, createdAt: now, updatedAt: ago(12) },

  // cust-029 DigiMedia Productions
  { id: 'con-065', customerId: 'cust-029', firstName: 'Sien', lastName: 'Van Damme', jobTitle: 'Creative Director', email: 's.vandamme@digimedia.be', phone: '+32 2 678 90 20', mobile: '+32 471 234 567', notes: null, contactType: 'Cloud Contact', cloudContact: null, ...syncDefaults, syncedAt: now, createdAt: now, updatedAt: ago(5) },
  { id: 'con-066', customerId: 'cust-029', firstName: 'Pieter-Jan', lastName: 'Aerts', jobTitle: 'Technical Producer', email: 'pj.aerts@digimedia.be', phone: null, mobile: '+32 472 345 678', notes: 'Evaluating cloud rendering solutions.', contactType: 'Cloud Contact', cloudContact: null, ...syncDefaults, syncedAt: now, createdAt: now, updatedAt: ago(22) },

  // cust-030 Luxembourg Health Institute
  { id: 'con-067', customerId: 'cust-030', firstName: 'Sophie', lastName: 'Muller', jobTitle: 'CIO', email: 's.muller@luxhealth.lu', phone: '+352 26 789 01', mobile: '+352 691 345 678', notes: 'Executive sponsor for digital health platform.', contactType: 'Cloud Contact', cloudContact: null, ...syncDefaults, syncedAt: now, createdAt: now, updatedAt: ago(2) },

  // cust-031 Vlaams Onderwijscentrum
  { id: 'con-068', customerId: 'cust-031', firstName: 'Rik', lastName: 'Verhoeven', jobTitle: 'ICT Coordinator', email: 'r.verhoeven@vlaamso.be', phone: '+32 16 456 78 01', mobile: null, notes: 'Public sector procurement rules apply.', contactType: null, cloudContact: null, ...syncDefaults, syncedAt: now, createdAt: now, updatedAt: ago(15) },

  // cust-032 Gemeente Brugge IT
  { id: 'con-069', customerId: 'cust-032', firstName: 'Annelies', lastName: 'De Smedt', jobTitle: 'IT Manager', email: 'a.desmedt@brugge.be', phone: '+32 50 345 67 01', mobile: '+32 473 456 789', notes: null, contactType: 'Cloud Contact', cloudContact: null, ...syncDefaults, syncedAt: now, createdAt: now, updatedAt: ago(8) },

  // cust-033 FinTrust Advisors
  { id: 'con-070', customerId: 'cust-033', firstName: 'Mathias', lastName: 'Bollen', jobTitle: 'Head of Technology', email: 'm.bollen@fintrust.be', phone: '+32 2 789 01 30', mobile: '+32 474 567 890', notes: 'Compliance-driven purchase decisions.', contactType: 'Cloud Contact', cloudContact: null, ...syncDefaults, syncedAt: now, createdAt: now, updatedAt: ago(4) },

  // cust-034 Precision Plastics
  { id: 'con-071', customerId: 'cust-034', firstName: 'Bart', lastName: 'Vanderstraeten', jobTitle: 'Operations Manager', email: 'b.vanderstraeten@precisionplastics.nl', phone: '+31 40 567 89 01', mobile: null, notes: null, contactType: 'Reseller', cloudContact: null, ...syncDefaults, syncedAt: now, createdAt: now, updatedAt: ago(30) },

  // cust-035 NovaTech Consulting
  { id: 'con-072', customerId: 'cust-035', firstName: 'Laura', lastName: 'Peeters', jobTitle: 'Managing Partner', email: 'l.peeters@novatech.be', phone: '+32 3 890 12 40', mobile: '+32 475 678 901', notes: 'Decision maker. Also a potential reseller partner.', contactType: 'Reseller', cloudContact: null, ...syncDefaults, syncedAt: now, createdAt: now, updatedAt: ago(6) },
];
