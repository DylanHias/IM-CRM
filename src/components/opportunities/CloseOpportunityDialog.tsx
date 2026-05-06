'use client';

import { useState } from 'react';
import { Loader2, Trophy, XOctagon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/DatePicker';
import { WON_STATUS_REASONS, LOST_STATUS_REASONS } from '@/lib/opportunityRules';
import { todayISO } from '@/lib/utils/dateUtils';

export type CloseOutcome = 'Won' | 'Lost';

export interface CloseFormData {
  outcome: CloseOutcome;
  statusReason: string;
  actualRevenue: number;
  closeDate: string;
  competitorId: string | null;
  closeDescription: string | null;
}

interface Props {
  open: boolean;
  outcome: CloseOutcome;
  currency: string;
  onClose: () => void;
  onConfirm: (data: CloseFormData) => Promise<void>;
}

export function CloseOpportunityDialog({ open, outcome, currency, onClose, onConfirm }: Props) {
  const reasons = outcome === 'Won' ? WON_STATUS_REASONS : LOST_STATUS_REASONS;
  const [statusReason, setStatusReason] = useState<string>('');
  const [actualRevenue, setActualRevenue] = useState('0');
  const [closeDate, setCloseDate] = useState(() => todayISO());
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setStatusReason('');
    setActualRevenue('0');
    setCloseDate(todayISO());
    setDescription('');
  };

  const handleConfirm = async () => {
    if (!statusReason) return;
    setSaving(true);
    try {
      await onConfirm({
        outcome,
        statusReason,
        actualRevenue: parseFloat(actualRevenue) || 0,
        closeDate,
        competitorId: null,
        closeDescription: description.trim() || null,
      });
      reset();
      onClose();
    } catch (err) {
      console.error('[opportunity] Close confirm failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const Icon = outcome === 'Won' ? Trophy : XOctagon;
  const accent = outcome === 'Won' ? 'text-emerald-500' : 'text-rose-500';
  const ctaClass = outcome === 'Won'
    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
    : 'bg-rose-600 hover:bg-rose-700 text-white';

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Icon size={18} className={accent} />
            <DialogTitle>Close as {outcome}</DialogTitle>
          </div>
          <DialogDescription>
            Provide the following information about why this opportunity is being closed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Status reason *</Label>
            <Select value={statusReason} onValueChange={setStatusReason}>
              <SelectTrigger><SelectValue placeholder="Select reason" /></SelectTrigger>
              <SelectContent>
                {reasons.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Actual revenue * <span className="text-muted-foreground text-xs">({currency})</span></Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={actualRevenue}
              onChange={(e) => setActualRevenue(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label>Close date *</Label>
            <DatePicker value={closeDate} onChange={setCloseDate} />
          </div>

          <div className="space-y-1">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Optional notes"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!statusReason || saving}
            className={`flex-1 ${ctaClass}`}
          >
            {saving ? <><Loader2 size={14} className="animate-spin mr-2" />Closing…</> : `Confirm ${outcome}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
