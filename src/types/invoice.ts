export interface InvoiceSearchParams {
  invoiceNumber?: string;
  orderNumber?: string;
  customerOrderNumber?: string;
  invoiceStatus?: string;
  invoiceDate?: string;
  invoiceDueDate?: string;
  pageSize?: number;
  pageNumber?: number;
  orderby?: string;
  direction?: 'asc' | 'desc';
}

export interface InvoiceSearchItem {
  invoiceNumber: string;
  invoiceStatus: string;
  invoiceDate: string;
  invoiceDueDate: string;
  invoicedAmountDue: number;
  invoiceAmountInclTax: number;
  customerOrderNumber: string | null;
  endCustomerOrderNumber: string | null;
  orderCreateDate: string | null;
  erpOrderNumber: string | null;
  paymentTermsDueDate: string | null;
}

export interface InvoiceSearchResponse {
  recordsFound: number;
  pageSize: number;
  pageNumber: number;
  invoices: InvoiceSearchItem[];
  nextPage: string | null;
}

export interface AddressInfo {
  companyName: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  countryCode: string | null;
}

export interface PaymentTermsInfo {
  paymentTermsDescription: string | null;
  paymentTermsDueDate: string | null;
  paymentTermsNetDays: number | null;
}

export interface InvoiceLineItem {
  ingramPartNumber: string;
  vendorPartNumber: string | null;
  vendorName: string | null;
  productDescription: string;
  quantity: number;
  unitPrice: number;
  extendedPrice: number;
  taxAmount: number;
  quantityOrdered: number;
  quantityShipped: number;
  currencyCode: string;
}

export interface InvoiceSummary {
  totalLines: number;
  totalAmount: number;
  totalTax: number;
  totalAmountInclTax: number;
  currencyCode: string;
}

export interface InvoiceDetail {
  invoiceNumber: string;
  invoiceStatus: string;
  invoiceDate: string;
  invoiceDueDate: string;
  customerOrderNumber: string | null;
  endCustomerOrderNumber: string | null;
  erpOrderNumber: string | null;
  orderCreateDate: string | null;
  billToInfo: AddressInfo;
  shipToInfo: AddressInfo;
  paymentTermsInfo: PaymentTermsInfo;
  lines: InvoiceLineItem[];
  summary: InvoiceSummary;
}
