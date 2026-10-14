'use client';

import { Copy, ExternalLink, PanelRightOpen, ThumbsDown, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { d365RecordUrl } from '@/lib/d365/recordUrl';
import { openExternal } from '@/lib/utils/openExternal';
import type { Opportunity } from '@/types/entities';

interface Props {
  opportunity: Opportunity;
  onOpen: () => void;
  onCloseAs?: (outcome: 'Won' | 'Lost') => void;
  children: React.ReactNode;
}

/** Right-click menu for an opportunity row or board card. */
export function OpportunityContextMenu({ opportunity: o, onOpen, onCloseAs, children }: Props) {
  const d365Url = o.remoteId ? d365RecordUrl('opportunity', o.remoteId) : null;
  const copyNumber = async () => {
    const value = o.opportunityNumber ?? o.remoteId;
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      toast.success('Copied opportunity ID');
    } catch (err) {
      console.error('[opportunity] Failed to copy ID:', err);
    }
  };
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuLabel>Opportunity</ContextMenuLabel>
        <ContextMenuItem onSelect={onOpen}>
          <PanelRightOpen /> Open
        </ContextMenuItem>
        {onCloseAs && o.status === 'Open' && (
          <>
            <ContextMenuItem onSelect={() => onCloseAs('Won')}>
              <Trophy /> Close as Won
            </ContextMenuItem>
            <ContextMenuItem onSelect={() => onCloseAs('Lost')}>
              <ThumbsDown /> Close as Lost
            </ContextMenuItem>
          </>
        )}
        <ContextMenuSeparator />
        <ContextMenuItem disabled={!o.opportunityNumber && !o.remoteId} onSelect={copyNumber}>
          <Copy /> Copy opportunity ID
        </ContextMenuItem>
        <ContextMenuItem disabled={!d365Url} onSelect={() => d365Url && openExternal(d365Url)}>
          <ExternalLink /> Open in Dynamics 365
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
