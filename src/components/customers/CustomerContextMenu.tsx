'use client';

import { useRouter } from 'next/navigation';
import { Bookmark, Clock, Copy, Crosshair, ExternalLink, PanelRightOpen, Plus } from 'lucide-react';
import { toast } from 'sonner';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { useCustomerStore } from '@/store/customerStore';
import { d365RecordUrl } from '@/lib/d365/recordUrl';
import { openExternal } from '@/lib/utils/openExternal';
import type { Customer } from '@/types/entities';

interface Props {
  customer: Customer;
  children: React.ReactNode;
}

/** Right-click menu for a customer row. */
export function CustomerContextMenu({ customer, children }: Props) {
  const router = useRouter();
  const isFavorite = useCustomerStore((s) => s.favoriteIds.has(customer.id));
  const toggleFavorite = useCustomerStore((s) => s.toggleFavorite);
  const d365Url = d365RecordUrl('account', customer.id);
  const open = (action?: string) => router.push(`/customers?id=${customer.id}${action ? `&action=${action}` : ''}`);

  const copyAccountNumber = async () => {
    if (!customer.accountNumber) return;
    try {
      await navigator.clipboard.writeText(customer.accountNumber);
      toast.success('Copied account number');
    } catch (err) {
      console.error('[customer] Failed to copy account number:', err);
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuLabel>Customer</ContextMenuLabel>
        <ContextMenuItem onSelect={() => open()}>
          <PanelRightOpen /> Open
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => open('activity')}>
          <Plus /> Add activity
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => open('followup')}>
          <Clock /> Add follow-up
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => open('opportunity')}>
          <Crosshair /> Add opportunity
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={() => toggleFavorite(customer.id)}>
          <Bookmark /> {isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        </ContextMenuItem>
        <ContextMenuItem disabled={!customer.accountNumber} onSelect={copyAccountNumber}>
          <Copy /> Copy account number
        </ContextMenuItem>
        <ContextMenuItem disabled={!d365Url} onSelect={() => d365Url && openExternal(d365Url)}>
          <ExternalLink /> Open in Dynamics 365
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
