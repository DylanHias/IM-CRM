'use client';

import { useState } from 'react';
import { Mail, Phone, Smartphone, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ContactForm } from '@/components/contacts/ContactForm';
import type { Contact } from '@/types/entities';

interface ContactListProps {
  contacts: Contact[];
  customerId: string;
  onContactAdded: (contact: Contact) => void;
}

export function ContactList({ contacts, customerId, onContactAdded }: ContactListProps) {
  const [formOpen, setFormOpen] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" className="gap-1.5" onClick={() => setFormOpen(true)}>
          <Plus size={13} />
          Add Contact
        </Button>
      </div>

      <ContactForm
        open={formOpen}
        onOpenChange={setFormOpen}
        customerId={customerId}
        onContactAdded={onContactAdded}
      />

      {contacts.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-sm text-muted-foreground">No contacts found for this customer.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {contacts.map((contact) => (
            <div key={contact.id} className="bg-white border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
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
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-3">
                {contact.email && (
                  <a
                    href={`mailto:${contact.email}`}
                    className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline"
                  >
                    <Mail size={12} />
                    {contact.email}
                  </a>
                )}
                {contact.phone && (
                  <a
                    href={`tel:${contact.phone}`}
                    className="flex items-center gap-1.5 text-xs text-slate-600"
                  >
                    <Phone size={12} />
                    {contact.phone}
                  </a>
                )}
                {contact.mobile && (
                  <a
                    href={`tel:${contact.mobile}`}
                    className="flex items-center gap-1.5 text-xs text-slate-600"
                  >
                    <Smartphone size={12} />
                    {contact.mobile}
                  </a>
                )}
              </div>

              {contact.notes && (
                <p className="mt-2 text-xs text-slate-500 italic border-t pt-2">{contact.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
