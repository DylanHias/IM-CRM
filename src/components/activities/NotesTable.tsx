'use client';

import { useState, useMemo } from 'react';
import { FileText, Clock, AlertCircle, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmPopover } from '@/components/ui/ConfirmPopover';
import { TablePagination } from '@/components/ui/TablePagination';
import { usePaginationPreference } from '@/hooks/usePaginationPreference';
import { formatDate } from '@/lib/utils/dateUtils';
import type { Activity, Contact } from '@/types/entities';

interface NotesTableProps {
  notes: Activity[];
  contacts: Contact[];
  onEdit: (activity: Activity) => void;
  onDelete: (activity: Activity) => void;
}

export function NotesTable({ notes, contacts, onEdit, onDelete }: NotesTableProps) {
  const [page, setPage] = useState(1);
  const { pageSize, setPageSize, pageSizeOptions } = usePaginationPreference('customer-notes', 5);

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
    <div className="space-y-2">
      <div className="bg-card border border-border/70 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50 text-left text-xs text-muted-foreground">
              <th className="px-4 py-2.5 font-medium">Subject</th>
              <th className="px-4 py-2.5 font-medium">Description</th>
              <th className="px-4 py-2.5 font-medium w-28">Date</th>
              <th className="px-4 py-2.5 font-medium w-32">Contact</th>
              <th className="px-4 py-2.5 font-medium w-16" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {visible.map((note) => {
              const contactName = getContactName(note.contactId);
              return (
                <tr key={note.id} className="group hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 bg-activity-note-bg">
                        <FileText size={12} className="text-activity-note" />
                      </div>
                      <span className="font-medium text-foreground truncate">{note.subject}</span>
                      {note.syncStatus === 'pending' && (
                        <Badge variant="warning" className="text-xs gap-1 flex-shrink-0">
                          <Clock size={10} />
                          Pending
                        </Badge>
                      )}
                      {note.syncStatus === 'error' && (
                        <Badge variant="destructive" className="text-xs gap-1 flex-shrink-0">
                          <AlertCircle size={10} />
                          Error
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    <span className="line-clamp-1">{note.description ?? '—'}</span>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">
                    {formatDate(note.occurredAt)}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground truncate">
                    {contactName ?? '—'}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(note)} title="Edit">
                        <Pencil size={13} />
                      </Button>
                      <ConfirmPopover message={`Delete "${note.subject}"?`} confirmLabel="Delete" onConfirm={() => onDelete(note)}>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" title="Delete">
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

      <TablePagination
        totalItems={sorted.length}
        page={safePage}
        pageSize={pageSize}
        pageSizeOptions={pageSizeOptions}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
}
