'use client';

import { useRouter } from 'next/navigation';
import { Clock, Phone, Users, FileText, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCustomerStore } from '@/store/customerStore';
import { cn } from '@/lib/utils';
import type { Activity } from '@/types/entities';

const TYPE_META: Record<Activity['type'], { icon: typeof Clock; label: string }> = {
  call: { icon: Phone, label: 'Call' },
  meeting: { icon: Users, label: 'Meeting' },
  note: { icon: FileText, label: 'Note' },
  visit: { icon: MapPin, label: 'Visit' },
};

interface Props {
  activities: Activity[];
}

export function RecentActivitiesCard({ activities }: Props) {
  const router = useRouter();
  const customers = useCustomerStore((s) => s.customers);

  const customerName = (id: string) => customers.find((c) => c.id === id)?.name ?? '';

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Clock size={14} className="text-muted-foreground" />
          Recent Activities
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No recent activities.</p>
        ) : (
          <ul className="space-y-1.5">
            {activities.map((a) => {
              const { icon: Icon, label } = TYPE_META[a.type] ?? { icon: Clock, label: a.type };
              const occurred = new Date(a.occurredAt).toLocaleDateString('en-BE', {
                month: 'short', day: 'numeric',
              });
              return (
                <li
                  key={a.id}
                  className="flex items-start gap-2.5 cursor-pointer group"
                  onClick={() => router.push(`/customers?id=${a.customerId}&tab=activities`)}
                >
                  <div className={cn(
                    'mt-0.5 shrink-0 w-5 h-5 rounded-md flex items-center justify-center bg-muted',
                    'group-hover:bg-accent transition-colors',
                  )}>
                    <Icon size={11} className="text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate leading-snug">{a.subject}</p>
                    <p className="text-xs text-muted-foreground truncate">{customerName(a.customerId)}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[10px] text-muted-foreground">{label}</p>
                    <p className="text-[10px] text-muted-foreground">{occurred}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
