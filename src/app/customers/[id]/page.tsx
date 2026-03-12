import { mockCustomers } from '@/lib/mock/customers';
import CustomerDetailClient from './CustomerDetailClient';

export function generateStaticParams() {
  return mockCustomers.map((c) => ({ id: c.id }));
}

export default function CustomerDetailPage() {
  return <CustomerDetailClient />;
}
