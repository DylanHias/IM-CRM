import type { InvoiceSearchItem, InvoiceSearchResponse, InvoiceDetail, InvoiceSearchParams } from '@/types/invoice';

const mockInvoiceItems: InvoiceSearchItem[] = [
  {
    invoiceNumber: 'INV-2026-001', invoiceStatus: 'Open', invoiceDate: '2026-03-01', invoiceDueDate: '2026-03-31',
    invoicedAmountDue: 12450.00, invoiceAmountInclTax: 15064.50, customerOrderNumber: 'PO-5001',
    endCustomerOrderNumber: 'EC-100', orderCreateDate: '2026-02-25', erpOrderNumber: 'ERP-90001', paymentTermsDueDate: '2026-03-31',
  },
  {
    invoiceNumber: 'INV-2026-002', invoiceStatus: 'Paid', invoiceDate: '2026-02-15', invoiceDueDate: '2026-03-15',
    invoicedAmountDue: 0, invoiceAmountInclTax: 8320.00, customerOrderNumber: 'PO-5002',
    endCustomerOrderNumber: null, orderCreateDate: '2026-02-10', erpOrderNumber: 'ERP-90002', paymentTermsDueDate: '2026-03-15',
  },
  {
    invoiceNumber: 'INV-2026-003', invoiceStatus: 'Past Due', invoiceDate: '2026-01-10', invoiceDueDate: '2026-02-10',
    invoicedAmountDue: 5600.00, invoiceAmountInclTax: 6776.00, customerOrderNumber: 'PO-5003',
    endCustomerOrderNumber: 'EC-101', orderCreateDate: '2026-01-05', erpOrderNumber: 'ERP-90003', paymentTermsDueDate: '2026-02-10',
  },
  {
    invoiceNumber: 'INV-2026-004', invoiceStatus: 'Open', invoiceDate: '2026-03-10', invoiceDueDate: '2026-04-10',
    invoicedAmountDue: 22800.00, invoiceAmountInclTax: 27588.00, customerOrderNumber: 'PO-5004',
    endCustomerOrderNumber: null, orderCreateDate: '2026-03-05', erpOrderNumber: 'ERP-90004', paymentTermsDueDate: '2026-04-10',
  },
  {
    invoiceNumber: 'INV-2026-005', invoiceStatus: 'Paid', invoiceDate: '2026-01-20', invoiceDueDate: '2026-02-20',
    invoicedAmountDue: 0, invoiceAmountInclTax: 3150.00, customerOrderNumber: 'PO-5005',
    endCustomerOrderNumber: null, orderCreateDate: '2026-01-15', erpOrderNumber: 'ERP-90005', paymentTermsDueDate: '2026-02-20',
  },
  {
    invoiceNumber: 'INV-2026-006', invoiceStatus: 'Open', invoiceDate: '2026-03-12', invoiceDueDate: '2026-04-12',
    invoicedAmountDue: 9875.50, invoiceAmountInclTax: 11949.36, customerOrderNumber: 'PO-5006',
    endCustomerOrderNumber: 'EC-102', orderCreateDate: '2026-03-08', erpOrderNumber: 'ERP-90006', paymentTermsDueDate: '2026-04-12',
  },
  {
    invoiceNumber: 'INV-2026-007', invoiceStatus: 'Paid', invoiceDate: '2026-02-01', invoiceDueDate: '2026-03-01',
    invoicedAmountDue: 0, invoiceAmountInclTax: 45200.00, customerOrderNumber: 'PO-5007',
    endCustomerOrderNumber: null, orderCreateDate: '2026-01-28', erpOrderNumber: 'ERP-90007', paymentTermsDueDate: '2026-03-01',
  },
  {
    invoiceNumber: 'INV-2026-008', invoiceStatus: 'Past Due', invoiceDate: '2025-12-15', invoiceDueDate: '2026-01-15',
    invoicedAmountDue: 7340.00, invoiceAmountInclTax: 8881.40, customerOrderNumber: 'PO-5008',
    endCustomerOrderNumber: 'EC-103', orderCreateDate: '2025-12-10', erpOrderNumber: 'ERP-90008', paymentTermsDueDate: '2026-01-15',
  },
  {
    invoiceNumber: 'INV-2026-009', invoiceStatus: 'Open', invoiceDate: '2026-03-14', invoiceDueDate: '2026-04-14',
    invoicedAmountDue: 16200.00, invoiceAmountInclTax: 19602.00, customerOrderNumber: 'PO-5009',
    endCustomerOrderNumber: null, orderCreateDate: '2026-03-10', erpOrderNumber: 'ERP-90009', paymentTermsDueDate: '2026-04-14',
  },
  {
    invoiceNumber: 'INV-2026-010', invoiceStatus: 'Paid', invoiceDate: '2026-02-20', invoiceDueDate: '2026-03-20',
    invoicedAmountDue: 0, invoiceAmountInclTax: 11500.00, customerOrderNumber: 'PO-5010',
    endCustomerOrderNumber: null, orderCreateDate: '2026-02-15', erpOrderNumber: 'ERP-90010', paymentTermsDueDate: '2026-03-20',
  },
  {
    invoiceNumber: 'INV-2026-011', invoiceStatus: 'Open', invoiceDate: '2026-03-05', invoiceDueDate: '2026-04-05',
    invoicedAmountDue: 4320.00, invoiceAmountInclTax: 5227.20, customerOrderNumber: 'PO-5011',
    endCustomerOrderNumber: 'EC-104', orderCreateDate: '2026-03-01', erpOrderNumber: 'ERP-90011', paymentTermsDueDate: '2026-04-05',
  },
  {
    invoiceNumber: 'INV-2026-012', invoiceStatus: 'Paid', invoiceDate: '2026-01-05', invoiceDueDate: '2026-02-05',
    invoicedAmountDue: 0, invoiceAmountInclTax: 28900.00, customerOrderNumber: 'PO-5012',
    endCustomerOrderNumber: null, orderCreateDate: '2025-12-30', erpOrderNumber: 'ERP-90012', paymentTermsDueDate: '2026-02-05',
  },
  {
    invoiceNumber: 'INV-2026-013', invoiceStatus: 'Open', invoiceDate: '2026-03-08', invoiceDueDate: '2026-04-08',
    invoicedAmountDue: 1890.00, invoiceAmountInclTax: 2286.90, customerOrderNumber: 'PO-5013',
    endCustomerOrderNumber: null, orderCreateDate: '2026-03-04', erpOrderNumber: 'ERP-90013', paymentTermsDueDate: '2026-04-08',
  },
  {
    invoiceNumber: 'INV-2026-014', invoiceStatus: 'Past Due', invoiceDate: '2025-11-20', invoiceDueDate: '2025-12-20',
    invoicedAmountDue: 3250.00, invoiceAmountInclTax: 3932.50, customerOrderNumber: 'PO-5014',
    endCustomerOrderNumber: 'EC-105', orderCreateDate: '2025-11-15', erpOrderNumber: 'ERP-90014', paymentTermsDueDate: '2025-12-20',
  },
  {
    invoiceNumber: 'INV-2026-015', invoiceStatus: 'Paid', invoiceDate: '2026-02-28', invoiceDueDate: '2026-03-28',
    invoicedAmountDue: 0, invoiceAmountInclTax: 6700.00, customerOrderNumber: 'PO-5015',
    endCustomerOrderNumber: null, orderCreateDate: '2026-02-22', erpOrderNumber: 'ERP-90015', paymentTermsDueDate: '2026-03-28',
  },
];

// Map reseller IDs to invoice indices
const RESELLER_INVOICE_MAP: Record<string, number[]> = {
  'RSL-10001': [0, 1, 2, 6, 11],
  'RSL-10002': [3, 4, 9],
  'RSL-10003': [5, 7, 12, 14],
  'RSL-10004': [8, 10, 13],
  'RSL-10005': [1, 5, 10],
  'RSL-10006': [0, 3, 7],
  'RSL-10007': [1, 8, 14],
  'RSL-10008': [2, 4, 11],
  'RSL-10009': [5, 9, 13],
  'RSL-10010': [0, 6, 12],
  'RSL-10011': [3, 10],
  'RSL-10012': [1, 7, 14],
  'RSL-10013': [2, 5, 8, 11],
  'RSL-10014': [4, 9, 13],
  'RSL-10015': [0, 6],
  'RSL-10016': [3, 12],
  'RSL-10017': [1, 10, 14],
  'RSL-10018': [2, 7, 8],
  'RSL-10019': [4, 5, 11],
  'RSL-10020': [0, 9, 13],
  'RSL-10021': [6, 12, 14],
  'RSL-10022': [1, 3, 8],
  'RSL-10023': [2, 10],
  'RSL-10024': [5, 7],
  'RSL-10025': [0, 4, 11],
};

const mockInvoiceDetails: Record<string, InvoiceDetail> = {
  'INV-2026-001': {
    invoiceNumber: 'INV-2026-001', invoiceStatus: 'Open', invoiceDate: '2026-03-01', invoiceDueDate: '2026-03-31',
    customerOrderNumber: 'PO-5001', endCustomerOrderNumber: 'EC-100', erpOrderNumber: 'ERP-90001', orderCreateDate: '2026-02-25',
    billToInfo: { companyName: 'Technocom Solutions BV', addressLine1: 'Rue de la Loi 1', addressLine2: null, city: 'Brussels', state: null, postalCode: '1000', countryCode: 'BE' },
    shipToInfo: { companyName: 'Technocom Solutions BV', addressLine1: 'Rue de la Loi 1', addressLine2: 'Floor 3', city: 'Brussels', state: null, postalCode: '1000', countryCode: 'BE' },
    paymentTermsInfo: { paymentTermsDescription: 'Net 30', paymentTermsDueDate: '2026-03-31', paymentTermsNetDays: 30 },
    lines: [
      { ingramPartNumber: 'IM-SRV-001', vendorPartNumber: 'HP-DL380-G11', vendorName: 'HP Enterprise', productDescription: 'HPE ProLiant DL380 Gen11 Server', quantity: 2, unitPrice: 4500.00, extendedPrice: 9000.00, taxAmount: 1890.00, quantityOrdered: 2, quantityShipped: 2, currencyCode: 'EUR' },
      { ingramPartNumber: 'IM-MEM-032', vendorPartNumber: 'KNG-DDR5-32', vendorName: 'Kingston', productDescription: 'Kingston DDR5 32GB ECC RDIMM', quantity: 8, unitPrice: 185.00, extendedPrice: 1480.00, taxAmount: 310.80, quantityOrdered: 8, quantityShipped: 8, currencyCode: 'EUR' },
      { ingramPartNumber: 'IM-SSD-002', vendorPartNumber: 'SAM-PM9A3-1T', vendorName: 'Samsung', productDescription: 'Samsung PM9A3 1.92TB NVMe SSD', quantity: 4, unitPrice: 492.50, extendedPrice: 1970.00, taxAmount: 413.70, quantityOrdered: 4, quantityShipped: 4, currencyCode: 'EUR' },
    ],
    summary: { totalLines: 3, totalAmount: 12450.00, totalTax: 2614.50, totalAmountInclTax: 15064.50, currencyCode: 'EUR' },
  },
  'INV-2026-004': {
    invoiceNumber: 'INV-2026-004', invoiceStatus: 'Open', invoiceDate: '2026-03-10', invoiceDueDate: '2026-04-10',
    customerOrderNumber: 'PO-5004', endCustomerOrderNumber: null, erpOrderNumber: 'ERP-90004', orderCreateDate: '2026-03-05',
    billToInfo: { companyName: 'Nexgen Retail Group', addressLine1: 'Meir 22', addressLine2: null, city: 'Antwerp', state: null, postalCode: '2000', countryCode: 'BE' },
    shipToInfo: { companyName: 'Nexgen Retail Group - Warehouse', addressLine1: 'Industrieweg 45', addressLine2: null, city: 'Antwerp', state: null, postalCode: '2030', countryCode: 'BE' },
    paymentTermsInfo: { paymentTermsDescription: 'Net 30', paymentTermsDueDate: '2026-04-10', paymentTermsNetDays: 30 },
    lines: [
      { ingramPartNumber: 'IM-NET-010', vendorPartNumber: 'CSCO-C9300-48', vendorName: 'Cisco', productDescription: 'Cisco Catalyst 9300 48-Port Switch', quantity: 3, unitPrice: 5200.00, extendedPrice: 15600.00, taxAmount: 3276.00, quantityOrdered: 3, quantityShipped: 3, currencyCode: 'EUR' },
      { ingramPartNumber: 'IM-NET-011', vendorPartNumber: 'CSCO-DNA-E', vendorName: 'Cisco', productDescription: 'Cisco DNA Essentials License 3Y', quantity: 3, unitPrice: 1800.00, extendedPrice: 5400.00, taxAmount: 1134.00, quantityOrdered: 3, quantityShipped: 3, currencyCode: 'EUR' },
      { ingramPartNumber: 'IM-CBL-050', vendorPartNumber: 'APC-SFP-10G', vendorName: 'APC', productDescription: 'SFP+ 10G Transceiver Module', quantity: 12, unitPrice: 150.00, extendedPrice: 1800.00, taxAmount: 378.00, quantityOrdered: 12, quantityShipped: 12, currencyCode: 'EUR' },
    ],
    summary: { totalLines: 3, totalAmount: 22800.00, totalTax: 4788.00, totalAmountInclTax: 27588.00, currencyCode: 'EUR' },
  },
  'INV-2026-006': {
    invoiceNumber: 'INV-2026-006', invoiceStatus: 'Open', invoiceDate: '2026-03-12', invoiceDueDate: '2026-04-12',
    customerOrderNumber: 'PO-5006', endCustomerOrderNumber: 'EC-102', erpOrderNumber: 'ERP-90006', orderCreateDate: '2026-03-08',
    billToInfo: { companyName: 'FinBank Europe', addressLine1: 'Herengracht 100', addressLine2: null, city: 'Amsterdam', state: null, postalCode: '1015 BS', countryCode: 'NL' },
    shipToInfo: { companyName: 'FinBank Europe - DC', addressLine1: 'Schipholweg 200', addressLine2: 'Building B', city: 'Hoofddorp', state: null, postalCode: '2153 NL', countryCode: 'NL' },
    paymentTermsInfo: { paymentTermsDescription: 'Net 30', paymentTermsDueDate: '2026-04-12', paymentTermsNetDays: 30 },
    lines: [
      { ingramPartNumber: 'IM-SEC-020', vendorPartNumber: 'FTNT-FG-600F', vendorName: 'Fortinet', productDescription: 'FortiGate 600F Next-Gen Firewall', quantity: 1, unitPrice: 7500.00, extendedPrice: 7500.00, taxAmount: 1575.00, quantityOrdered: 1, quantityShipped: 1, currencyCode: 'EUR' },
      { ingramPartNumber: 'IM-SEC-021', vendorPartNumber: 'FTNT-FC-UTM-3Y', vendorName: 'Fortinet', productDescription: 'FortiCare UTM Bundle 3Y License', quantity: 1, unitPrice: 2375.50, extendedPrice: 2375.50, taxAmount: 498.86, quantityOrdered: 1, quantityShipped: 1, currencyCode: 'EUR' },
    ],
    summary: { totalLines: 2, totalAmount: 9875.50, totalTax: 2073.86, totalAmountInclTax: 11949.36, currencyCode: 'EUR' },
  },
  'INV-2026-009': {
    invoiceNumber: 'INV-2026-009', invoiceStatus: 'Open', invoiceDate: '2026-03-14', invoiceDueDate: '2026-04-14',
    customerOrderNumber: 'PO-5009', endCustomerOrderNumber: null, erpOrderNumber: 'ERP-90009', orderCreateDate: '2026-03-10',
    billToInfo: { companyName: 'MediCare Systems', addressLine1: 'Kortrijksesteenweg 5', addressLine2: null, city: 'Ghent', state: null, postalCode: '9000', countryCode: 'BE' },
    shipToInfo: { companyName: 'MediCare Systems', addressLine1: 'Kortrijksesteenweg 5', addressLine2: null, city: 'Ghent', state: null, postalCode: '9000', countryCode: 'BE' },
    paymentTermsInfo: { paymentTermsDescription: 'Net 30', paymentTermsDueDate: '2026-04-14', paymentTermsNetDays: 30 },
    lines: [
      { ingramPartNumber: 'IM-WKS-005', vendorPartNumber: 'DELL-OPT-7420', vendorName: 'Dell', productDescription: 'Dell OptiPlex 7420 AIO Desktop', quantity: 20, unitPrice: 810.00, extendedPrice: 16200.00, taxAmount: 3402.00, quantityOrdered: 20, quantityShipped: 20, currencyCode: 'EUR' },
    ],
    summary: { totalLines: 1, totalAmount: 16200.00, totalTax: 3402.00, totalAmountInclTax: 19602.00, currencyCode: 'EUR' },
  },
  'INV-2026-002': {
    invoiceNumber: 'INV-2026-002', invoiceStatus: 'Paid', invoiceDate: '2026-02-15', invoiceDueDate: '2026-03-15',
    customerOrderNumber: 'PO-5002', endCustomerOrderNumber: null, erpOrderNumber: 'ERP-90002', orderCreateDate: '2026-02-10',
    billToInfo: { companyName: 'Technocom Solutions BV', addressLine1: 'Rue de la Loi 1', addressLine2: null, city: 'Brussels', state: null, postalCode: '1000', countryCode: 'BE' },
    shipToInfo: { companyName: 'Technocom Solutions BV', addressLine1: 'Rue de la Loi 1', addressLine2: null, city: 'Brussels', state: null, postalCode: '1000', countryCode: 'BE' },
    paymentTermsInfo: { paymentTermsDescription: 'Net 30', paymentTermsDueDate: '2026-03-15', paymentTermsNetDays: 30 },
    lines: [
      { ingramPartNumber: 'IM-LIC-010', vendorPartNumber: 'MS-365-E3', vendorName: 'Microsoft', productDescription: 'Microsoft 365 E3 License (Annual)', quantity: 50, unitPrice: 132.00, extendedPrice: 6600.00, taxAmount: 1386.00, quantityOrdered: 50, quantityShipped: 50, currencyCode: 'EUR' },
      { ingramPartNumber: 'IM-LIC-011', vendorPartNumber: 'MS-DEF-P2', vendorName: 'Microsoft', productDescription: 'Microsoft Defender for Endpoint P2', quantity: 50, unitPrice: 28.00, extendedPrice: 1400.00, taxAmount: 294.00, quantityOrdered: 50, quantityShipped: 50, currencyCode: 'EUR' },
    ],
    summary: { totalLines: 2, totalAmount: 8000.00, totalTax: 1680.00, totalAmountInclTax: 8320.00, currencyCode: 'EUR' },
  },
  'INV-2026-003': {
    invoiceNumber: 'INV-2026-003', invoiceStatus: 'Past Due', invoiceDate: '2026-01-10', invoiceDueDate: '2026-02-10',
    customerOrderNumber: 'PO-5003', endCustomerOrderNumber: 'EC-101', erpOrderNumber: 'ERP-90003', orderCreateDate: '2026-01-05',
    billToInfo: { companyName: 'DataFlow Analytics', addressLine1: 'Louizalaan 65', addressLine2: null, city: 'Brussels', state: null, postalCode: '1050', countryCode: 'BE' },
    shipToInfo: { companyName: 'DataFlow Analytics', addressLine1: 'Louizalaan 65', addressLine2: 'Suite 4B', city: 'Brussels', state: null, postalCode: '1050', countryCode: 'BE' },
    paymentTermsInfo: { paymentTermsDescription: 'Net 30', paymentTermsDueDate: '2026-02-10', paymentTermsNetDays: 30 },
    lines: [
      { ingramPartNumber: 'IM-STR-015', vendorPartNumber: 'QNAP-TS-873A', vendorName: 'QNAP', productDescription: 'QNAP TS-873A 8-Bay NAS', quantity: 2, unitPrice: 1850.00, extendedPrice: 3700.00, taxAmount: 777.00, quantityOrdered: 2, quantityShipped: 2, currencyCode: 'EUR' },
      { ingramPartNumber: 'IM-HDD-020', vendorPartNumber: 'WD-RED-8TB', vendorName: 'Western Digital', productDescription: 'WD Red Plus 8TB NAS HDD', quantity: 16, unitPrice: 118.75, extendedPrice: 1900.00, taxAmount: 399.00, quantityOrdered: 16, quantityShipped: 16, currencyCode: 'EUR' },
    ],
    summary: { totalLines: 2, totalAmount: 5600.00, totalTax: 1176.00, totalAmountInclTax: 6776.00, currencyCode: 'EUR' },
  },
  'INV-2026-005': {
    invoiceNumber: 'INV-2026-005', invoiceStatus: 'Paid', invoiceDate: '2026-01-20', invoiceDueDate: '2026-02-20',
    customerOrderNumber: 'PO-5005', endCustomerOrderNumber: null, erpOrderNumber: 'ERP-90005', orderCreateDate: '2026-01-15',
    billToInfo: { companyName: 'Nexgen Retail Group', addressLine1: 'Meir 22', addressLine2: null, city: 'Antwerp', state: null, postalCode: '2000', countryCode: 'BE' },
    shipToInfo: { companyName: 'Nexgen Retail Group', addressLine1: 'Meir 22', addressLine2: null, city: 'Antwerp', state: null, postalCode: '2000', countryCode: 'BE' },
    paymentTermsInfo: { paymentTermsDescription: 'Net 30', paymentTermsDueDate: '2026-02-20', paymentTermsNetDays: 30 },
    lines: [
      { ingramPartNumber: 'IM-PRN-005', vendorPartNumber: 'HP-LJ-M455', vendorName: 'HP', productDescription: 'HP LaserJet Enterprise M455dn', quantity: 5, unitPrice: 510.00, extendedPrice: 2550.00, taxAmount: 535.50, quantityOrdered: 5, quantityShipped: 5, currencyCode: 'EUR' },
    ],
    summary: { totalLines: 1, totalAmount: 2550.00, totalTax: 535.50, totalAmountInclTax: 3150.00, currencyCode: 'EUR' },
  },
  'INV-2026-007': {
    invoiceNumber: 'INV-2026-007', invoiceStatus: 'Paid', invoiceDate: '2026-02-01', invoiceDueDate: '2026-03-01',
    customerOrderNumber: 'PO-5007', endCustomerOrderNumber: null, erpOrderNumber: 'ERP-90007', orderCreateDate: '2026-01-28',
    billToInfo: { companyName: 'EuroCloud Services', addressLine1: 'Keizersgracht 440', addressLine2: null, city: 'Amsterdam', state: null, postalCode: '1016 GD', countryCode: 'NL' },
    shipToInfo: { companyName: 'EuroCloud Services - DC1', addressLine1: 'Schipholweg 100', addressLine2: null, city: 'Hoofddorp', state: null, postalCode: '2153 NL', countryCode: 'NL' },
    paymentTermsInfo: { paymentTermsDescription: 'Net 30', paymentTermsDueDate: '2026-03-01', paymentTermsNetDays: 30 },
    lines: [
      { ingramPartNumber: 'IM-SRV-010', vendorPartNumber: 'DELL-R760', vendorName: 'Dell', productDescription: 'Dell PowerEdge R760 Rack Server', quantity: 4, unitPrice: 8200.00, extendedPrice: 32800.00, taxAmount: 6888.00, quantityOrdered: 4, quantityShipped: 4, currencyCode: 'EUR' },
      { ingramPartNumber: 'IM-SSD-008', vendorPartNumber: 'INTEL-D7-P5620', vendorName: 'Intel', productDescription: 'Intel D7-P5620 3.2TB NVMe SSD', quantity: 8, unitPrice: 1550.00, extendedPrice: 12400.00, taxAmount: 2604.00, quantityOrdered: 8, quantityShipped: 8, currencyCode: 'EUR' },
    ],
    summary: { totalLines: 2, totalAmount: 45200.00, totalTax: 9492.00, totalAmountInclTax: 45200.00, currencyCode: 'EUR' },
  },
  'INV-2026-008': {
    invoiceNumber: 'INV-2026-008', invoiceStatus: 'Past Due', invoiceDate: '2025-12-15', invoiceDueDate: '2026-01-15',
    customerOrderNumber: 'PO-5008', endCustomerOrderNumber: 'EC-103', erpOrderNumber: 'ERP-90008', orderCreateDate: '2025-12-10',
    billToInfo: { companyName: 'BeneLux Logistics', addressLine1: 'Antwerpseweg 88', addressLine2: null, city: 'Mechelen', state: null, postalCode: '2800', countryCode: 'BE' },
    shipToInfo: { companyName: 'BeneLux Logistics - Hub', addressLine1: 'Havenweg 12', addressLine2: null, city: 'Mechelen', state: null, postalCode: '2800', countryCode: 'BE' },
    paymentTermsInfo: { paymentTermsDescription: 'Net 30', paymentTermsDueDate: '2026-01-15', paymentTermsNetDays: 30 },
    lines: [
      { ingramPartNumber: 'IM-NET-025', vendorPartNumber: 'UBQ-USW-PRO-48', vendorName: 'Ubiquiti', productDescription: 'UniFi Switch Pro 48 PoE', quantity: 3, unitPrice: 1180.00, extendedPrice: 3540.00, taxAmount: 743.40, quantityOrdered: 3, quantityShipped: 3, currencyCode: 'EUR' },
      { ingramPartNumber: 'IM-NET-026', vendorPartNumber: 'UBQ-UAP-U6-PRO', vendorName: 'Ubiquiti', productDescription: 'UniFi U6 Pro Access Point', quantity: 20, unitPrice: 190.00, extendedPrice: 3800.00, taxAmount: 798.00, quantityOrdered: 20, quantityShipped: 20, currencyCode: 'EUR' },
    ],
    summary: { totalLines: 2, totalAmount: 7340.00, totalTax: 1541.40, totalAmountInclTax: 8881.40, currencyCode: 'EUR' },
  },
  'INV-2026-010': {
    invoiceNumber: 'INV-2026-010', invoiceStatus: 'Paid', invoiceDate: '2026-02-20', invoiceDueDate: '2026-03-20',
    customerOrderNumber: 'PO-5010', endCustomerOrderNumber: null, erpOrderNumber: 'ERP-90010', orderCreateDate: '2026-02-15',
    billToInfo: { companyName: 'SmartEd Academy', addressLine1: 'Bondgenotenlaan 10', addressLine2: null, city: 'Leuven', state: null, postalCode: '3000', countryCode: 'BE' },
    shipToInfo: { companyName: 'SmartEd Academy', addressLine1: 'Bondgenotenlaan 10', addressLine2: null, city: 'Leuven', state: null, postalCode: '3000', countryCode: 'BE' },
    paymentTermsInfo: { paymentTermsDescription: 'Net 30', paymentTermsDueDate: '2026-03-20', paymentTermsNetDays: 30 },
    lines: [
      { ingramPartNumber: 'IM-LAP-003', vendorPartNumber: 'LNV-T14S-G4', vendorName: 'Lenovo', productDescription: 'Lenovo ThinkPad T14s Gen 4', quantity: 10, unitPrice: 1150.00, extendedPrice: 11500.00, taxAmount: 2415.00, quantityOrdered: 10, quantityShipped: 10, currencyCode: 'EUR' },
    ],
    summary: { totalLines: 1, totalAmount: 11500.00, totalTax: 2415.00, totalAmountInclTax: 11500.00, currencyCode: 'EUR' },
  },
  'INV-2026-011': {
    invoiceNumber: 'INV-2026-011', invoiceStatus: 'Open', invoiceDate: '2026-03-05', invoiceDueDate: '2026-04-05',
    customerOrderNumber: 'PO-5011', endCustomerOrderNumber: 'EC-104', erpOrderNumber: 'ERP-90011', orderCreateDate: '2026-03-01',
    billToInfo: { companyName: 'ArchVision Design', addressLine1: 'Cogels-Osylei 15', addressLine2: null, city: 'Antwerp', state: null, postalCode: '2600', countryCode: 'BE' },
    shipToInfo: { companyName: 'ArchVision Design', addressLine1: 'Cogels-Osylei 15', addressLine2: null, city: 'Antwerp', state: null, postalCode: '2600', countryCode: 'BE' },
    paymentTermsInfo: { paymentTermsDescription: 'Net 30', paymentTermsDueDate: '2026-04-05', paymentTermsNetDays: 30 },
    lines: [
      { ingramPartNumber: 'IM-GPU-002', vendorPartNumber: 'NV-RTX-4090', vendorName: 'NVIDIA', productDescription: 'NVIDIA RTX 4090 Professional GPU', quantity: 2, unitPrice: 1680.00, extendedPrice: 3360.00, taxAmount: 705.60, quantityOrdered: 2, quantityShipped: 2, currencyCode: 'EUR' },
      { ingramPartNumber: 'IM-MON-010', vendorPartNumber: 'DELL-U3223QE', vendorName: 'Dell', productDescription: 'Dell U3223QE 32" 4K USB-C Monitor', quantity: 2, unitPrice: 480.00, extendedPrice: 960.00, taxAmount: 201.60, quantityOrdered: 2, quantityShipped: 2, currencyCode: 'EUR' },
    ],
    summary: { totalLines: 2, totalAmount: 4320.00, totalTax: 907.20, totalAmountInclTax: 5227.20, currencyCode: 'EUR' },
  },
  'INV-2026-012': {
    invoiceNumber: 'INV-2026-012', invoiceStatus: 'Paid', invoiceDate: '2026-01-05', invoiceDueDate: '2026-02-05',
    customerOrderNumber: 'PO-5012', endCustomerOrderNumber: null, erpOrderNumber: 'ERP-90012', orderCreateDate: '2025-12-30',
    billToInfo: { companyName: 'MediCare Systems', addressLine1: 'Kortrijksesteenweg 5', addressLine2: null, city: 'Ghent', state: null, postalCode: '9000', countryCode: 'BE' },
    shipToInfo: { companyName: 'MediCare Systems', addressLine1: 'Kortrijksesteenweg 5', addressLine2: null, city: 'Ghent', state: null, postalCode: '9000', countryCode: 'BE' },
    paymentTermsInfo: { paymentTermsDescription: 'Net 30', paymentTermsDueDate: '2026-02-05', paymentTermsNetDays: 30 },
    lines: [
      { ingramPartNumber: 'IM-SRV-015', vendorPartNumber: 'HPE-DL360-G11', vendorName: 'HP Enterprise', productDescription: 'HPE ProLiant DL360 Gen11', quantity: 3, unitPrice: 6800.00, extendedPrice: 20400.00, taxAmount: 4284.00, quantityOrdered: 3, quantityShipped: 3, currencyCode: 'EUR' },
      { ingramPartNumber: 'IM-UPS-005', vendorPartNumber: 'APC-SRT3000', vendorName: 'APC', productDescription: 'APC Smart-UPS SRT 3000VA', quantity: 3, unitPrice: 2100.00, extendedPrice: 6300.00, taxAmount: 1323.00, quantityOrdered: 3, quantityShipped: 3, currencyCode: 'EUR' },
    ],
    summary: { totalLines: 2, totalAmount: 26700.00, totalTax: 5607.00, totalAmountInclTax: 28900.00, currencyCode: 'EUR' },
  },
  'INV-2026-013': {
    invoiceNumber: 'INV-2026-013', invoiceStatus: 'Open', invoiceDate: '2026-03-08', invoiceDueDate: '2026-04-08',
    customerOrderNumber: 'PO-5013', endCustomerOrderNumber: null, erpOrderNumber: 'ERP-90013', orderCreateDate: '2026-03-04',
    billToInfo: { companyName: 'GreenTech Solar', addressLine1: 'Industriepark Noord 22', addressLine2: null, city: 'Hasselt', state: null, postalCode: '3500', countryCode: 'BE' },
    shipToInfo: { companyName: 'GreenTech Solar', addressLine1: 'Industriepark Noord 22', addressLine2: null, city: 'Hasselt', state: null, postalCode: '3500', countryCode: 'BE' },
    paymentTermsInfo: { paymentTermsDescription: 'Net 30', paymentTermsDueDate: '2026-04-08', paymentTermsNetDays: 30 },
    lines: [
      { ingramPartNumber: 'IM-TAB-008', vendorPartNumber: 'SAM-TAB-S9FE', vendorName: 'Samsung', productDescription: 'Samsung Galaxy Tab S9 FE 128GB', quantity: 10, unitPrice: 189.00, extendedPrice: 1890.00, taxAmount: 396.90, quantityOrdered: 10, quantityShipped: 10, currencyCode: 'EUR' },
    ],
    summary: { totalLines: 1, totalAmount: 1890.00, totalTax: 396.90, totalAmountInclTax: 2286.90, currencyCode: 'EUR' },
  },
  'INV-2026-014': {
    invoiceNumber: 'INV-2026-014', invoiceStatus: 'Past Due', invoiceDate: '2025-11-20', invoiceDueDate: '2025-12-20',
    customerOrderNumber: 'PO-5014', endCustomerOrderNumber: 'EC-105', erpOrderNumber: 'ERP-90014', orderCreateDate: '2025-11-15',
    billToInfo: { companyName: 'CyberShield Security', addressLine1: 'Tervurenlaan 36', addressLine2: null, city: 'Brussels', state: null, postalCode: '1040', countryCode: 'BE' },
    shipToInfo: { companyName: 'CyberShield Security', addressLine1: 'Tervurenlaan 36', addressLine2: null, city: 'Brussels', state: null, postalCode: '1040', countryCode: 'BE' },
    paymentTermsInfo: { paymentTermsDescription: 'Net 30', paymentTermsDueDate: '2025-12-20', paymentTermsNetDays: 30 },
    lines: [
      { ingramPartNumber: 'IM-SEC-030', vendorPartNumber: 'PA-3220', vendorName: 'Palo Alto Networks', productDescription: 'Palo Alto PA-3220 Firewall', quantity: 1, unitPrice: 2650.00, extendedPrice: 2650.00, taxAmount: 556.50, quantityOrdered: 1, quantityShipped: 1, currencyCode: 'EUR' },
      { ingramPartNumber: 'IM-SEC-031', vendorPartNumber: 'PA-THREAT-3Y', vendorName: 'Palo Alto Networks', productDescription: 'Threat Prevention Subscription 3Y', quantity: 1, unitPrice: 600.00, extendedPrice: 600.00, taxAmount: 126.00, quantityOrdered: 1, quantityShipped: 1, currencyCode: 'EUR' },
    ],
    summary: { totalLines: 2, totalAmount: 3250.00, totalTax: 682.50, totalAmountInclTax: 3932.50, currencyCode: 'EUR' },
  },
  'INV-2026-015': {
    invoiceNumber: 'INV-2026-015', invoiceStatus: 'Paid', invoiceDate: '2026-02-28', invoiceDueDate: '2026-03-28',
    customerOrderNumber: 'PO-5015', endCustomerOrderNumber: null, erpOrderNumber: 'ERP-90015', orderCreateDate: '2026-02-22',
    billToInfo: { companyName: 'LegalEdge Partners', addressLine1: 'Frankrijklei 78', addressLine2: null, city: 'Antwerp', state: null, postalCode: '2000', countryCode: 'BE' },
    shipToInfo: { companyName: 'LegalEdge Partners', addressLine1: 'Frankrijklei 78', addressLine2: null, city: 'Antwerp', state: null, postalCode: '2000', countryCode: 'BE' },
    paymentTermsInfo: { paymentTermsDescription: 'Net 30', paymentTermsDueDate: '2026-03-28', paymentTermsNetDays: 30 },
    lines: [
      { ingramPartNumber: 'IM-LAP-008', vendorPartNumber: 'HP-EB-860-G10', vendorName: 'HP', productDescription: 'HP EliteBook 860 G10 Notebook', quantity: 5, unitPrice: 1080.00, extendedPrice: 5400.00, taxAmount: 1134.00, quantityOrdered: 5, quantityShipped: 5, currencyCode: 'EUR' },
      { ingramPartNumber: 'IM-DOC-002', vendorPartNumber: 'HP-USB-C-DOCK', vendorName: 'HP', productDescription: 'HP USB-C G5 Essential Dock', quantity: 5, unitPrice: 160.00, extendedPrice: 800.00, taxAmount: 168.00, quantityOrdered: 5, quantityShipped: 5, currencyCode: 'EUR' },
    ],
    summary: { totalLines: 2, totalAmount: 6200.00, totalTax: 1302.00, totalAmountInclTax: 6700.00, currencyCode: 'EUR' },
  },
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function mockSearchInvoices(
  resellerId: string,
  params: InvoiceSearchParams = {},
): Promise<InvoiceSearchResponse> {
  await delay(400);

  const indices = RESELLER_INVOICE_MAP[resellerId] ?? [];
  let items = indices.map((i) => mockInvoiceItems[i]);

  if (params.invoiceNumber) {
    items = items.filter((inv) => inv.invoiceNumber.toLowerCase().includes(params.invoiceNumber!.toLowerCase()));
  }
  if (params.invoiceStatus) {
    items = items.filter((inv) => inv.invoiceStatus === params.invoiceStatus);
  }

  if (params.orderby) {
    const field = params.orderby as keyof InvoiceSearchItem;
    const dir = params.direction === 'asc' ? 1 : -1;
    items.sort((a, b) => {
      const aVal = a[field] ?? '';
      const bVal = b[field] ?? '';
      if (typeof aVal === 'number' && typeof bVal === 'number') return (aVal - bVal) * dir;
      return String(aVal).localeCompare(String(bVal)) * dir;
    });
  }

  const total = items.length;
  const pageSize = params.pageSize ?? 10;
  const pageNumber = params.pageNumber ?? 1;
  const start = (pageNumber - 1) * pageSize;
  const paged = items.slice(start, start + pageSize);

  return {
    recordsFound: total,
    pageSize,
    pageNumber,
    invoices: paged,
    nextPage: start + pageSize < total ? String(pageNumber + 1) : null,
  };
}

export async function mockGetInvoiceDetail(invoiceNumber: string): Promise<InvoiceDetail | null> {
  await delay(300);
  return mockInvoiceDetails[invoiceNumber] ?? null;
}

export { mockInvoiceItems as MOCK_INVOICE_ITEMS, RESELLER_INVOICE_MAP as MOCK_RESELLER_INVOICE_MAP, mockInvoiceDetails as MOCK_INVOICE_DETAILS };
