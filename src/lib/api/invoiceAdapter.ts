import type { InvoiceSearchParams, InvoiceSearchResponse, InvoiceDetail } from '@/types/invoice';
import { mockSearchInvoices, mockGetInvoiceDetail } from '@/lib/mock/invoices';

export interface IInvoiceAdapter {
  searchInvoices(resellerId: string, countryCode: string, params?: InvoiceSearchParams): Promise<InvoiceSearchResponse>;
  getInvoiceDetail(invoiceNumber: string, resellerId: string, countryCode: string): Promise<InvoiceDetail | null>;
}

class MockInvoiceAdapter implements IInvoiceAdapter {
  async searchInvoices(resellerId: string, _countryCode: string, params?: InvoiceSearchParams): Promise<InvoiceSearchResponse> {
    return mockSearchInvoices(resellerId, params);
  }

  async getInvoiceDetail(invoiceNumber: string, _resellerId: string, _countryCode: string): Promise<InvoiceDetail | null> {
    return mockGetInvoiceDetail(invoiceNumber);
  }
}

class RealInvoiceAdapter implements IInvoiceAdapter {
  private baseUrl = process.env.NEXT_PUBLIC_XVANTAGE_API_URL ?? '';

  async searchInvoices(resellerId: string, countryCode: string, params?: InvoiceSearchParams): Promise<InvoiceSearchResponse> {
    const { getXvantageToken } = await import('./invoiceAuth');
    const token = await getXvantageToken();

    const searchParams = new URLSearchParams();
    if (params?.invoiceNumber) searchParams.set('invoiceNumber', params.invoiceNumber);
    if (params?.invoiceStatus) searchParams.set('invoiceStatus', params.invoiceStatus);
    if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize));
    if (params?.pageNumber) searchParams.set('pageNumber', String(params.pageNumber));
    if (params?.orderby) searchParams.set('orderby', params.orderby);
    if (params?.direction) searchParams.set('direction', params.direction);

    const url = `${this.baseUrl}/resellers/v6/invoices?${searchParams.toString()}`;
    const res = await fetch(url, {
      headers: {
        'IM-CustomerNumber': resellerId,
        'IM-CountryCode': countryCode,
        'IM-CorrelationID': crypto.randomUUID(),
        'IM-ApplicationID': 'im-crm',
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Xvantage search invoices failed ${res.status}: ${text}`);
    }

    return res.json();
  }

  async getInvoiceDetail(invoiceNumber: string, resellerId: string, countryCode: string): Promise<InvoiceDetail | null> {
    const { getXvantageToken } = await import('./invoiceAuth');
    const token = await getXvantageToken();

    const url = `${this.baseUrl}/resellers/v6.1/invoices/${encodeURIComponent(invoiceNumber)}`;
    const res = await fetch(url, {
      headers: {
        'IM-CustomerNumber': resellerId,
        'IM-CountryCode': countryCode,
        'IM-CorrelationID': crypto.randomUUID(),
        'IM-ApplicationID': 'im-crm',
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      if (res.status === 404) return null;
      const text = await res.text();
      throw new Error(`Xvantage get invoice detail failed ${res.status}: ${text}`);
    }

    return res.json();
  }
}

export function getInvoiceAdapter(): IInvoiceAdapter {
  if (process.env.NEXT_PUBLIC_XVANTAGE_API_URL) {
    return new RealInvoiceAdapter();
  }
  return new MockInvoiceAdapter();
}
