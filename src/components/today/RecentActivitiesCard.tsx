'use client';

import { useRouter } from 'next/navigation';
import { Clock, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCustomerStore } from '@/store/customerStore';
import { cn } from '@/lib/utils';
import { ACTIVITY_ICONS, STATUS_CONFIG } from '@/components/activities/ActivityItem';
import type { Activity } from '@/types/entities';

const BORDER_COLOR: Record<Activity['type'], string> = {
  meeting: 'border-l-activity-meeting',
  visit: 'border-l-activity-visit',
  call: 'border-l-activity-call',
  note: 'border-l-activity-note',
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
              const typeConfig = ACTIVITY_ICONS[a.type] ?? ACTIVITY_ICONS.note;
              const statusConfig = STATUS_CONFIG[a.activityStatus];
              const Icon = typeConfig.icon;
              const StatusIcon = statusConfig.icon;
              const borderClass = BORDER_COLOR[a.type] ?? 'border-l-muted';

              const occurred = new Date(a.occurredAt).toLocaleDateString('en-BE', {
                month: 'short',
                day: 'numeric',
              });

              return (
                <li
                  key={a.id}
                  className={cn(
                    'flex items-center gap-2.5 cursor-pointer rounded-md px-2 py-2',
                    'border-l-2 border border-transparent',
                    borderClass,
                    'hover:bg-accent/50 transition-colors',
                  )}
                  onClick={() => router.push(`/customers?id=${a.customerId}&tab=activities`)}
                >
                  {/* Type icon */}
                  <div className={cn(
                    'shrink-0 w-7 h-7 rounded-md flex items-center justify-center',
                    typeConfig.bgClass,
                  )}>
                    <Icon size={13} className={typeConfig.colorClass} />
                  </div>

                  {/* Subject + customer */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate leading-tight">{a.subject}</p>
                    <p className="text-xs text-muted-foreground truncate">{customerName(a.customerId)}</p>
                  </div>

                  {/* Status + date */}
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    <Badge
                      variant="outline"
                      className={cn('text-[10px] px-1.5 py-0 h-4 gap-0.5 font-medium', statusConfig.className)}
                    >
                      <StatusIcon size={8} />
                      {statusConfig.label}
                    </Badge>
                    <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                      {a.type === 'call' && a.direction === 'outgoing' && <ArrowUpRight size={9} />}
                      {a.type === 'call' && a.direction === 'incoming' && <ArrowDownLeft size={9} />}
                      {occurred}
                    </div>
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
