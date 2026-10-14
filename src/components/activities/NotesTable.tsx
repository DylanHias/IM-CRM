'use client';

import { useState, useMemo } from 'react';
import { Clock, AlertCircle, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmPopover } from '@/components/ui/ConfirmPopover';
import { CompactPager } from '@/components/ui/compact-pager';
import { Panel, PanelHeader } from '@/components/ui/panel';
import { ActivityTypeIcon } from './ActivityTypeIcon';
import { usePaginationPreference } from '@/hooks/usePaginationPreference';
import { formatDate } from '@/lib/utils/dateUtils';
import { stripHtml } from '@/lib/utils/htmlUtils';
import { cn } from '@/lib/utils';
import type { Activity, Contact } from '@/types/entities';

interface NotesTableProps {
  notes: Activity[];
  contacts: Contact[];
  onEdit: (activity: Activity) => void;
  onDelete: (activity: Activity) => void;
  onPreview?: (activity: Activity) => void;
}

const TH = 'h-8 border-b border-border bg-surface-2 px-3 text-left text-[11px] font-semibold text-muted-foreground';
const ICON_BTN = 'size-7 text-muted-foreground hover:bg-sunken hover:text-foreground';

export function NotesTable({ notes, contacts, onEdit, onDelete, onPreview }: NotesTableProps) {
  const [page, setPage] = useState(1);
  const { pageSize } = usePaginationPreference('customer-notes', 5);

  const sorted = useMemo(
    () => [...notes].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)),
    [notes],
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visible = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  const getContactName = (contactId: string | null) => {
    if (!contactId) return null;
    const c = contacts.find((ct) => ct.id === contactId);
    return c ? `${c.firstName} ${c.lastName}` : null;
  };

  if (notes.length === 0) return null;

  return (
    <Panel>
      <PanelHeader title="Notes" sub={<span className="tabular-nums">{notes.length}</span>} />
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr>
              <th className={TH}>Subject</th>
              <th className={TH}>Description</th>
              <th className={cn(TH, 'w-28')}>Date</th>
              <th className={cn(TH, 'w-36')}>Contact</th>
              <th className={cn(TH, 'w-[72px]')} />
            </tr>
          </thead>
          <tbody className="stagger-in">
            {visible.map((note) => {
              const contactName = getContactName(note.contactId);
              return (
                <tr
                  key={note.id}
                  className={cn(
                    'group border-t border-border transition-colors first:border-t-0 hover:bg-surface-2',
                    onPreview && 'cursor-pointer',
                  )}
                  onClick={onPreview ? () => onPreview(note) : undefined}
                >
                  <td className="px-3 py-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <ActivityTypeIcon type="note" size="sm" />
                      <span className="truncate font-[550] text-foreground">{note.subject}</span>
                      {note.syncStatus === 'pending' && (
                        <Badge variant="warning">
                          <Clock size={10} />
                          Pending
                        </Badge>
                      )}
                      {note.syncStatus === 'error' && (
                        <Badge variant="destructive">
                          <AlertCircle size={10} />
                          Error
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="max-w-[280px] px-3 py-2 text-muted-foreground">
                    <span className="block truncate">{note.description ? stripHtml(note.description) : '—'}</span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 tabular-nums text-muted-foreground">
                    {formatDate(note.occurredAt)}
                  </td>
                  <td className="max-w-[160px] truncate px-3 py-2 text-foreground-2">
                    {contactName ?? '—'}
                  </td>
                  <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                      <Button variant="ghost" size="icon" className={ICON_BTN} onClick={() => onEdit(note)} title="Edit" aria-label="Edit">
                        <Pencil size={13} />
                      </Button>
                      <ConfirmPopover message={`Delete "${note.subject}"?`} confirmLabel="Delete" onConfirm={() => onDelete(note)}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(ICON_BTN, 'hover:bg-destructive/10 hover:text-destructive')}
                          title="Delete"
                          aria-label="Delete"
                        >
                          <Trash2 size={13} />
                        </Button>
                      </ConfirmPopover>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <CompactPager page={safePage} pageSize={pageSize} total={sorted.length} onPageChange={setPage} />
    </Panel>
  );
}
