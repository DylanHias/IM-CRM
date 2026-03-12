'use client';

import { useState } from 'react';
import { GraduationCap, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrainingForm } from '@/components/trainings/TrainingForm';
import { formatDate } from '@/lib/utils/dateUtils';
import type { Training } from '@/types/entities';

const STATUS_CONFIG = {
  completed: { label: 'Completed', variant: 'success' as const },
  registered: { label: 'Registered', variant: 'info' as const },
  cancelled: { label: 'Cancelled', variant: 'secondary' as const },
};

interface TrainingListProps {
  trainings: Training[];
  customerId: string;
  onTrainingAdded: (training: Training) => void;
}

export function TrainingList({ trainings, customerId, onTrainingAdded }: TrainingListProps) {
  const [formOpen, setFormOpen] = useState(false);
  const sorted = [...trainings].sort((a, b) => b.trainingDate.localeCompare(a.trainingDate));

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" className="gap-1.5" onClick={() => setFormOpen(true)}>
          <Plus size={13} />
          Add Training
        </Button>
      </div>

      <TrainingForm
        open={formOpen}
        onOpenChange={setFormOpen}
        customerId={customerId}
        onTrainingAdded={onTrainingAdded}
      />

      {sorted.length === 0 ? (
        <div className="text-center py-10">
          <GraduationCap size={28} className="mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No training records found.</p>
        </div>
      ) : (
        <div className="bg-white border rounded-lg divide-y">
          {sorted.map((training) => {
            const statusConfig = training.status ? STATUS_CONFIG[training.status] : null;
            return (
              <div key={training.id} className="flex items-start gap-3 px-4 py-3">
                <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <GraduationCap size={15} className="text-indigo-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-slate-900">{training.title}</span>
                    {statusConfig && (
                      <Badge variant={statusConfig.variant} className="text-xs">
                        {statusConfig.label}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground flex flex-wrap gap-2">
                    <span>{formatDate(training.trainingDate)}</span>
                    {training.provider && <span>· Instructor: {training.provider}</span>}
                    {training.participant && <span>· {training.participant}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
