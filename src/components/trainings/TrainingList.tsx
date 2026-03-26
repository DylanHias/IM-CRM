'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmPopover } from '@/components/ui/ConfirmPopover';
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
  triggerAdd?: number;
  onTrainingAdded: (training: Training) => void;
  onTrainingUpdated: (training: Training) => void;
  onTrainingDeleted: (id: string) => void;
}

export function TrainingList({ trainings, customerId, triggerAdd, onTrainingAdded, onTrainingUpdated, onTrainingDeleted }: TrainingListProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingTraining, setEditingTraining] = useState<Training | undefined>(undefined);
  const sorted = [...trainings].sort((a, b) => b.trainingDate.localeCompare(a.trainingDate));

  useEffect(() => {
    if (triggerAdd && triggerAdd > 0) {
      setEditingTraining(undefined);
      setFormOpen(true);
    }
  }, [triggerAdd]);

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
        <div className="bg-card border border-border/70 rounded-xl overflow-hidden shadow-sm divide-y divide-border/40">
          {sorted.map((training, i) => {
            const statusConfig = training.status ? STATUS_CONFIG[training.status] : null;
            return (
              <motion.div
                key={training.id}
                className="flex items-start gap-3.5 px-4 py-3.5 group"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.05, 0.4), ease: 'easeOut' }}
              >
                <div className="w-9 h-9 rounded-full bg-training-bg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <GraduationCap size={15} className="text-training" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-foreground">{training.title}</span>
                        {statusConfig && (
                          <Badge variant={statusConfig.variant} className="text-[10px]">{statusConfig.label}</Badge>
                        )}
                      </div>
                      <div className="mt-1.5 text-xs text-muted-foreground flex flex-wrap gap-2">
                        {training.provider && <span>Instructor: {training.provider}</span>}
                        {training.participant && <span>· {training.participant}</span>}
                      </div>
                    </div>
                    <div className="flex items-start gap-1.5 flex-shrink-0">
                      <span className="text-xs text-muted-foreground whitespace-nowrap pt-0.5 transition-transform duration-150 translate-x-8 group-hover:translate-x-0">
                        {formatDate(training.trainingDate)}
                      </span>
                      <div className="flex flex-col gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                        <button
                          className="h-6 w-6 rounded-md inline-flex items-center justify-center text-muted-foreground bg-muted/50 hover:bg-primary/10 hover:text-primary transition-all duration-150 active:scale-95"
                          onClick={() => openEdit(training)}
                          title="Edit"
                        >
                          <Pencil size={11} />
                        </button>
                        <ConfirmPopover message={`Delete "${training.title}"?`} confirmLabel="Delete" onConfirm={() => handleDelete(training)}>
                          <button
                            className="h-6 w-6 rounded-md inline-flex items-center justify-center text-muted-foreground bg-muted/50 hover:bg-destructive/10 hover:text-destructive transition-all duration-150 active:scale-95"
                            title="Delete"
                          >
                            <Trash2 size={11} />
                          </button>
                        </ConfirmPopover>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
