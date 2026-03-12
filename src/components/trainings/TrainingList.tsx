'use client';

import { useState } from 'react';
import { GraduationCap, Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrainingForm } from '@/components/trainings/TrainingForm';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import { deleteTraining } from '@/lib/db/queries/trainings';
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
  onTrainingUpdated: (training: Training) => void;
  onTrainingDeleted: (id: string) => void;
}

export function TrainingList({ trainings, customerId, onTrainingAdded, onTrainingUpdated, onTrainingDeleted }: TrainingListProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingTraining, setEditingTraining] = useState<Training | undefined>(undefined);
  const sorted = [...trainings].sort((a, b) => b.trainingDate.localeCompare(a.trainingDate));

  const openAdd = () => {
    setEditingTraining(undefined);
    setFormOpen(true);
  };

  const openEdit = (training: Training) => {
    setEditingTraining(training);
    setFormOpen(true);
  };

  const handleSaved = (training: Training) => {
    if (editingTraining) {
      onTrainingUpdated(training);
    } else {
      onTrainingAdded(training);
    }
  };

  const handleDelete = async (training: Training) => {
    if (!confirm(`Delete "${training.title}"?`)) return;
    if (isTauriApp()) {
      await deleteTraining(training.id);
    }
    onTrainingDeleted(training.id);
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" className="gap-1.5" onClick={openAdd}>
          <Plus size={13} />
          Add Training
        </Button>
      </div>

      <TrainingForm
        open={formOpen}
        onOpenChange={setFormOpen}
        customerId={customerId}
        onTrainingSaved={handleSaved}
        initialData={editingTraining}
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
              <div key={training.id} className="flex items-start gap-3 px-4 py-3 group">
                <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <GraduationCap size={15} className="text-indigo-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-slate-900">{training.title}</span>
                    {statusConfig && (
                      <Badge variant={statusConfig.variant} className="text-xs">{statusConfig.label}</Badge>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground flex flex-wrap gap-2">
                    <span>{formatDate(training.trainingDate)}</span>
                    {training.provider && <span>· Instructor: {training.provider}</span>}
                    {training.participant && <span>· {training.participant}</span>}
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(training)} title="Edit">
                    <Pencil size={13} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(training)} title="Delete">
                    <Trash2 size={13} />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
