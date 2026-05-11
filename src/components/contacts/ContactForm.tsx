'use client';

import { useState, useEffect, useMemo } from 'react';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import { upsertContact } from '@/lib/db/queries/contacts';
import { directPushContact } from '@/lib/sync/directPushService';
import { syncLookupTables } from '@/lib/sync/syncService';
import { getAccessToken } from '@/lib/auth/authHelpers';
import { d365Request } from '@/lib/auth/msalConfig';
import { useLookupTableStore } from '@/store/lookupTableStore';
import type { Contact } from '@/types/entities';

const ALLOWED_COUNTRIES = new Set(['Belgium', 'Netherlands', 'Luxembourg']);

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
  const [countryId, setCountryId] = useState('');
  const [contactTypeId, setContactTypeId] = useState('');
  const [cloudContact, setCloudContact] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookupTables = useLookupTableStore((s) => s.lookupTables);
  const countryOptions = useMemo(
    () => (lookupTables['opportunity.country'] ?? []).filter((c) => ALLOWED_COUNTRIES.has(c.label)),
    [lookupTables],
  );
  const contactTypeOptions = useMemo(
    () => lookupTables['contact.contacttype'] ?? [],
    [lookupTables],
  );

  useEffect(() => {
    if (open) {
      setFirstName(initialData?.firstName ?? '');
      setLastName(initialData?.lastName ?? '');
      setJobTitle(initialData?.jobTitle ?? '');
      setEmail(initialData?.email ?? '');
      setPhone(initialData?.phone ?? '');
      setMobile(initialData?.mobile ?? '');
      setNotes(initialData?.notes ?? '');
      setCountryId(initialData?.countryId ?? '');
      setContactTypeId(initialData?.contactTypeId ?? '');
      setCloudContact(initialData?.cloudContact ?? false);
      setSuccess(false);
      setError(null);
    }
  }, [open, initialData]);

  useEffect(() => {
    if (!open || !isTauriApp()) return;
    if (contactTypeOptions.length > 0) return;
    let cancelled = false;
    (async () => {
      try {
        const token = await getAccessToken(d365Request.scopes);
        if (!token) return;
        await syncLookupTables(token);
        if (!cancelled) await useLookupTableStore.getState().hydrateFromDb();
      } catch (err) {
        console.error('[contact] Lookup table refresh failed:', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, contactTypeOptions.length]);

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

    const selectedCountry = countryOptions.find((c) => c.remoteId === countryId);
    const selectedContactType = contactTypeOptions.find((c) => c.remoteId === contactTypeId);

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
      contactType: selectedContactType?.label ?? initialData?.contactType ?? null,
      contactTypeId: contactTypeId || null,
      countryId: countryId || null,
      countryName: selectedCountry?.label ?? initialData?.countryName ?? null,
      cloudContact,
      isPrimary: initialData?.isPrimary ?? false,
      syncStatus: 'pending',
      remoteId: initialData?.remoteId ?? null,
      source: initialData?.source ?? 'local',
      syncedAt: now,
      createdAt: initialData?.createdAt ?? now,
      updatedAt: now,
    };

    try {
      if (isTauriApp()) {
        await upsertContact(contact);
        const pushed = await directPushContact(contact);
        if (pushed) {
          contact.remoteId = pushed.remoteId;
          contact.syncStatus = 'synced';
        }
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

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="cf-country">Country</Label>
                <Select value={countryId} onValueChange={setCountryId}>
                  <SelectTrigger id="cf-country">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countryOptions.map((c) => (
                      <SelectItem key={c.remoteId} value={c.remoteId}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="cf-contactType">Contact Type</Label>
                <Select value={contactTypeId} onValueChange={setContactTypeId}>
                  <SelectTrigger id="cf-contactType">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {contactTypeOptions.map((c) => (
                      <SelectItem key={c.remoteId} value={c.remoteId}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="cf-cloudContact">Cloud Contact</Label>
              <Select value={cloudContact ? 'yes' : 'no'} onValueChange={(v) => setCloudContact(v === 'yes')}>
                <SelectTrigger id="cf-cloudContact">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                </SelectContent>
              </Select>
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
