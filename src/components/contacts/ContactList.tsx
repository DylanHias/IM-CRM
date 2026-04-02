'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, Smartphone, Plus, Pencil, Trash2, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmPopover } from '@/components/ui/ConfirmPopover';
import { ContactForm } from '@/components/contacts/ContactForm';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import { deleteContact } from '@/lib/db/queries/contacts';
import type { Contact } from '@/types/entities';

interface ContactListProps {
  contacts: Contact[];
  customerId: string;
  triggerAdd?: number;
  onContactAdded: (contact: Contact) => void;
  onContactUpdated: (contact: Contact) => void;
  onContactDeleted: (id: string) => void;
}

const PAGE_SIZE = 10;

export function ContactList({ contacts, customerId, triggerAdd, onContactAdded, onContactUpdated, onContactDeleted }: ContactListProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;
    const q = searchQuery.toLowerCase();
    return contacts.filter((c) =>
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(q)
    );
  }, [contacts, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredContacts.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedContacts = useMemo(
    () => filteredContacts.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filteredContacts, safePage],
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
      }
      onContactDeleted(contact.id);
    } catch (err) {
      console.error('[contact] Failed to delete:', err);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end gap-2">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            className="h-8 w-52 pl-8 text-xs"
          />
        </div>
        <Button size="sm" className="gap-1.5" onClick={openAdd}>
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
        <div className="text-center py-10">
          <p className="text-sm text-muted-foreground">
            {searchQuery.trim() ? 'No contacts match your search.' : 'No contacts found for this customer.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {pagedContacts.map((contact, i) => (
            <motion.div
              key={contact.id}
              className="bg-card border rounded-lg p-4 group"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(i * 0.06, 0.36), ease: 'easeOut' }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center text-primary font-semibold text-sm">
                    {contact.firstName[0]}{contact.lastName[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">
                      {contact.firstName} {contact.lastName}
                    </p>
                    {contact.jobTitle && (
                      <p className="text-xs text-muted-foreground">{contact.jobTitle}</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  <button
                    className="h-6 w-6 rounded-md inline-flex items-center justify-center text-muted-foreground bg-muted/50 hover:bg-primary/10 hover:text-primary transition-all duration-150 active:scale-95"
                    onClick={() => openEdit(contact)}
                    title="Edit"
                  >
                    <Pencil size={11} />
                  </button>
                  <ConfirmPopover message={`Delete ${contact.firstName} ${contact.lastName}?`} confirmLabel="Delete" onConfirm={() => handleDelete(contact)}>
                    <button
                      className="h-6 w-6 rounded-md inline-flex items-center justify-center text-muted-foreground bg-muted/50 hover:bg-destructive/10 hover:text-destructive transition-all duration-150 active:scale-95"
                      title="Delete"
                    >
                      <Trash2 size={11} />
                    </button>
                  </ConfirmPopover>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-3">
                {contact.email && (
                  <a href={`mailto:${contact.email}`} className="flex items-center gap-1.5 text-xs text-primary hover:underline">
                    <Mail size={12} />
                    {contact.email}
                  </a>
                )}
                {contact.phone && (
                  <a href={`tel:${contact.phone}`} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Phone size={12} />
                    {contact.phone}
                  </a>
                )}
                {contact.mobile && (
                  <a href={`tel:${contact.mobile}`} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Smartphone size={12} />
                    {contact.mobile}
                  </a>
                )}
              </div>

              {contact.notes && (
                <p className="mt-2 text-xs text-muted-foreground italic border-t pt-2">{contact.notes}</p>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-muted-foreground">
            {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filteredContacts.length)} of {filteredContacts.length}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={safePage <= 1}
              onClick={() => setPage(safePage - 1)}
            >
              <ChevronLeft size={14} />
            </Button>
            <span className="text-xs text-muted-foreground px-2">
              {safePage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={safePage >= totalPages}
              onClick={() => setPage(safePage + 1)}
            >
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
