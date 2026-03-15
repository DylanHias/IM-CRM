'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, Smartphone, Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ContactForm } from '@/components/contacts/ContactForm';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import { deleteContact } from '@/lib/db/queries/contacts';
import type { Contact } from '@/types/entities';

interface ContactListProps {
  contacts: Contact[];
  customerId: string;
  onContactAdded: (contact: Contact) => void;
  onContactUpdated: (contact: Contact) => void;
  onContactDeleted: (id: string) => void;
}

export function ContactList({ contacts, customerId, onContactAdded, onContactUpdated, onContactDeleted }: ContactListProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | undefined>(undefined);

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
    if (!confirm(`Delete ${contact.firstName} ${contact.lastName}?`)) return;
    if (isTauriApp()) {
      await deleteContact(contact.id);
    }
    onContactDeleted(contact.id);
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
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

      {contacts.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-sm text-muted-foreground">No contacts found for this customer.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {contacts.map((contact, i) => (
            <motion.div
              key={contact.id}
              className="bg-white border rounded-lg p-4 group"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(i * 0.06, 0.36), ease: 'easeOut' }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm">
                    {contact.firstName[0]}{contact.lastName[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-slate-900">
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
                  <button
                    className="h-6 w-6 rounded-md inline-flex items-center justify-center text-muted-foreground bg-muted/50 hover:bg-destructive/10 hover:text-destructive transition-all duration-150 active:scale-95"
                    onClick={() => handleDelete(contact)}
                    title="Delete"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-3">
                {contact.email && (
                  <a href={`mailto:${contact.email}`} className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline">
                    <Mail size={12} />
                    {contact.email}
                  </a>
                )}
                {contact.phone && (
                  <a href={`tel:${contact.phone}`} className="flex items-center gap-1.5 text-xs text-slate-600">
                    <Phone size={12} />
                    {contact.phone}
                  </a>
                )}
                {contact.mobile && (
                  <a href={`tel:${contact.mobile}`} className="flex items-center gap-1.5 text-xs text-slate-600">
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
    </div>
  );
}
