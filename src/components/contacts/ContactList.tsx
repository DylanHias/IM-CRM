'use client';

import { useState, useEffect, useMemo } from 'react';
import { Mail, Phone, Smartphone, Plus, Pencil, Trash2, Search, Star, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { CompactPager } from '@/components/ui/compact-pager';
import { usePaginationPreference } from '@/hooks/usePaginationPreference';
import { ConfirmPopover } from '@/components/ui/ConfirmPopover';
import { ContactForm } from '@/components/contacts/ContactForm';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import { deleteContact } from '@/lib/db/queries/contacts';
import { directDeleteContact } from '@/lib/sync/directPushService';
import { cn } from '@/lib/utils';
import type { Contact } from '@/types/entities';

interface ContactListProps {
  contacts: Contact[];
  customerId: string;
  triggerAdd?: number;
  onContactAdded: (contact: Contact) => void;
  onContactUpdated: (contact: Contact) => void;
  onContactDeleted: (id: string) => void;
  onPrimaryChanged?: (contactId: string) => void;
}

const ICON_BTN = 'size-[26px] shrink-0 text-muted-foreground';

export function ContactList({ contacts, customerId, triggerAdd, onContactAdded, onContactUpdated, onContactDeleted, onPrimaryChanged }: ContactListProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const { pageSize } = usePaginationPreference('contacts', 20);

  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;
    const q = searchQuery.toLowerCase();
    return contacts.filter((c) =>
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(q)
    );
  }, [contacts, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredContacts.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedContacts = useMemo(
    () => filteredContacts.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filteredContacts, safePage, pageSize],
  );

  useEffect(() => {
    if (triggerAdd && triggerAdd > 0) {
      setEditingContact(undefined);
      setFormOpen(true);
    }
  }, [triggerAdd]);

  const openAdd = () => {
    setEditingContact(undefined);
    setFormOpen(true);
  };

  const openEdit = (contact: Contact) => {
    setEditingContact(contact);
    setFormOpen(true);
  };

  const handleSaved = (contact: Contact) => {
    if (editingContact) {
      onContactUpdated(contact);
    } else {
      onContactAdded(contact);
    }
  };

  const handleDelete = async (contact: Contact) => {
    try {
      if (isTauriApp()) {
        await deleteContact(contact.id);
        if (contact.remoteId) {
          await directDeleteContact(contact.remoteId);
        }
      }
      onContactDeleted(contact.id);
    } catch (err) {
      console.error('[contact] Failed to delete:', err);
    }
  };

  const isSearching = searchQuery.trim().length > 0;

  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-2">
        <div className="relative max-w-[320px] flex-1">
          <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-faint" />
          <Input
            type="search"
            placeholder="Search contacts…"
            aria-label="Search contacts"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            className="pl-8"
          />
        </div>
        <span className="flex-1" />
        <Button onClick={openAdd}>
          <Plus size={13} />
          Add Contact
        </Button>
      </div>

      <ContactForm
        open={formOpen}
        onOpenChange={setFormOpen}
        customerId={customerId}
        onContactSaved={handleSaved}
        initialData={editingContact}
      />

      {filteredContacts.length === 0 ? (
        isSearching ? (
          <EmptyState icon={Search} title="No matching contacts" description="Try a different name." />
        ) : (
          <EmptyState icon={Users} title="No contacts yet" description="Add the people you work with at this customer." />
        )
      ) : (
        <div className="stagger-in grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-[10px]">
          {pagedContacts.map((contact) => {
            const fullName = `${contact.firstName} ${contact.lastName}`.trim();
            return (
              <article
                key={contact.id}
                aria-label={fullName}
                className="relative grid min-w-0 content-start gap-2 rounded-[calc(var(--radius)*1.5)] border border-border bg-card p-3"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span className="relative grid size-9 shrink-0 place-items-center rounded-full border border-border bg-sunken text-xs font-semibold text-foreground-2">
                    {contact.firstName.charAt(0)}{contact.lastName.charAt(0)}
                    {contact.isPrimary && (
                      <Star size={11} aria-hidden className="absolute -bottom-[3px] -right-[3px] fill-current text-warning" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-semibold text-foreground">
                      {fullName}
                      {contact.isPrimary && (
                        <span className="ml-1.5 text-[11px] font-medium text-warning">Primary</span>
                      )}
                    </div>
                    {contact.jobTitle && (
                      <div className="truncate text-[11.5px] text-muted-foreground">{contact.jobTitle}</div>
                    )}
                  </div>
                  {onPrimaryChanged && !contact.isPrimary && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(ICON_BTN, 'hover:text-warning')}
                      onClick={() => onPrimaryChanged(contact.id)}
                      title="Set as primary contact"
                      aria-label="Set as primary contact"
                    >
                      <Star size={13} />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className={ICON_BTN}
                    onClick={() => openEdit(contact)}
                    title="Edit"
                    aria-label="Edit"
                  >
                    <Pencil size={13} />
                  </Button>
                  <ConfirmPopover message={`Delete ${fullName}?`} confirmLabel="Delete" onConfirm={() => handleDelete(contact)}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(ICON_BTN, 'hover:text-destructive')}
                      title="Delete"
                      aria-label="Delete"
                    >
                      <Trash2 size={13} />
                    </Button>
                  </ConfirmPopover>
                </div>

                {(contact.email || contact.phone || contact.mobile) && (
                  <div className="grid select-text gap-[3px] text-xs text-foreground-2">
                    {contact.email && (
                      <a href={`mailto:${contact.email}`} className="flex min-w-0 items-center gap-1.5 text-accent-foreground hover:underline">
                        <Mail size={11} className="shrink-0" />
                        <span className="truncate">{contact.email}</span>
                      </a>
                    )}
                    {contact.phone && (
                      <a href={`tel:${contact.phone}`} className="flex items-center gap-1.5 hover:text-foreground">
                        <Phone size={11} className="shrink-0 text-muted-foreground" />
                        {contact.phone}
                      </a>
                    )}
                    {contact.mobile && (
                      <a href={`tel:${contact.mobile}`} className="flex items-center gap-1.5 hover:text-foreground">
                        <Smartphone size={11} className="shrink-0 text-muted-foreground" />
                        {contact.mobile}
                      </a>
                    )}
                  </div>
                )}

                {contact.notes && (
                  <p className="select-text border-t border-border pt-1.5 text-xs italic text-muted-foreground">{contact.notes}</p>
                )}
              </article>
            );
          })}
        </div>
      )}

      <CompactPager
        page={safePage}
        pageSize={pageSize}
        total={filteredContacts.length}
        onPageChange={setPage}
        className="rounded-[calc(var(--radius)*1.5)] border"
      />
    </div>
  );
}
