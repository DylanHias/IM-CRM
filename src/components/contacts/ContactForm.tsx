'use client';

import { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import { upsertContact } from '@/lib/db/queries/contacts';
import type { Contact } from '@/types/entities';

interface ContactFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  onContactSaved: (contact: Contact) => void;
  initialData?: Contact;
}

export function ContactForm({ open, onOpenChange, customerId, onContactSaved, initialData }: ContactFormProps) {
  const isEdit = !!initialData;
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [mobile, setMobile] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setFirstName(initialData?.firstName ?? '');
      setLastName(initialData?.lastName ?? '');
      setJobTitle(initialData?.jobTitle ?? '');
      setEmail(initialData?.email ?? '');
      setPhone(initialData?.phone ?? '');
      setMobile(initialData?.mobile ?? '');
      setNotes(initialData?.notes ?? '');
      setSuccess(false);
      setError(null);
    }
  }, [open, initialData]);

  const handleOpenChange = (value: boolean) => {
    if (!value) setSuccess(false);
    onOpenChange(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) return;

    setIsSubmitting(true);
    setError(null);
    const now = new Date().toISOString();

    const contact: Contact = {
      id: initialData?.id ?? crypto.randomUUID(),
      customerId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      jobTitle: jobTitle.trim() || null,
      email: email.trim() || null,
      phone: phone.trim() || null,
      mobile: mobile.trim() || null,
      notes: notes.trim() || null,
      contactType: initialData?.contactType ?? null,
      cloudContact: initialData?.cloudContact ?? null,
      syncedAt: now,
      createdAt: initialData?.createdAt ?? now,
      updatedAt: now,
    };

    try {
      if (isTauriApp()) {
        await upsertContact(contact);
      }
      setSuccess(true);
      onContactSaved(contact);
      setTimeout(() => handleOpenChange(false), 900);
    } catch (err) {
      console.error('[contact] Failed:', err);
      setError(err instanceof Error ? err.message : typeof err === 'string' ? err : JSON.stringify(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Contact' : 'Add Contact'}</DialogTitle>
          <DialogDescription>{isEdit ? 'Update contact details.' : 'Add a new contact for this customer.'}</DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <CheckCircle2 size={40} className="text-success" />
            <p className="text-foreground font-medium">{isEdit ? 'Contact updated!' : 'Contact added!'}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                {error}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="cf-firstName">First Name *</Label>
                <Input id="cf-firstName" placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cf-lastName">Last Name *</Label>
                <Input id="cf-lastName" placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="cf-jobTitle">Job Title</Label>
              <Input id="cf-jobTitle" placeholder="e.g. IT Director" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
            </div>

            <div className="space-y-1">
              <Label htmlFor="cf-email">Email</Label>
              <Input id="cf-email" type="email" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="cf-phone">Phone</Label>
                <Input id="cf-phone" type="tel" placeholder="+32 ..." value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cf-mobile">Mobile</Label>
                <Input id="cf-mobile" type="tel" placeholder="+32 ..." value={mobile} onChange={(e) => setMobile(e.target.value)} />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="cf-notes">Notes</Label>
              <Textarea id="cf-notes" placeholder="Any notes about this contact..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </div>

            <div className="flex gap-3 pt-1">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} className="flex-1">Cancel</Button>
              <Button type="submit" disabled={isSubmitting || !firstName.trim() || !lastName.trim()} className="flex-1">
                {isSubmitting ? <><Loader2 size={15} className="animate-spin mr-2" />Saving...</> : isEdit ? 'Save Changes' : 'Add Contact'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
