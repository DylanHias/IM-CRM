import CustomerDetailClient from './CustomerDetailClient';

export function generateStaticParams() {
  // Placeholder for static export — real customer pages are reached via client-side navigation
  return [{ id: '_' }];
}

export default function CustomerDetailPage() {
  return <CustomerDetailClient />;
}
