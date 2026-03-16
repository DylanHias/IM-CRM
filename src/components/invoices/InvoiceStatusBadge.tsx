'use client';

import { Badge } from '@/components/ui/badge';

const STATUS_MAP: Record<string, { label: string; variant: 'info' | 'success' | 'destructive' | 'secondary' }> = {
  'Open': { label: 'Open', variant: 'info' },
  'Paid': { label: 'Paid', variant: 'success' },
  'Past Due': { label: 'Past Due', variant: 'destructive' },
};

interface InvoiceStatusBadgeProps {
  status: string;
}

export function InvoiceStatusBadge({ status }: InvoiceStatusBadgeProps) {
  const config = STATUS_MAP[status] ?? { label: status, variant: 'secondary' as const };
  return <Badge variant={config.variant} className="text-[10px]">{config.label}</Badge>;
}
