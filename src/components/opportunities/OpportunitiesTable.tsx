'use client';

import { useRouter } from 'next/navigation';
import { Target, ChevronRight, Pencil, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { listContainerVariants as containerVariants, listItemVariants as itemVariants } from '@/lib/motion';
import styled from 'styled-components';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSettingsStore } from '@/store/settingsStore';
import type { Opportunity } from '@/types/entities';

const ICON_COLORS = [
  { bg: 'hsl(215 80% 95%)', fg: 'hsl(215 70% 45%)' },
  { bg: 'hsl(150 60% 92%)', fg: 'hsl(150 55% 35%)' },
  { bg: 'hsl(340 70% 94%)', fg: 'hsl(340 60% 45%)' },
  { bg: 'hsl(30 80% 93%)',  fg: 'hsl(30 70% 40%)' },
  { bg: 'hsl(270 60% 94%)', fg: 'hsl(270 50% 45%)' },
  { bg: 'hsl(180 55% 92%)', fg: 'hsl(180 50% 35%)' },
  { bg: 'hsl(0 65% 94%)',   fg: 'hsl(0 55% 45%)' },
  { bg: 'hsl(50 70% 92%)',  fg: 'hsl(50 60% 35%)' },
  { bg: 'hsl(200 65% 93%)', fg: 'hsl(200 55% 40%)' },
  { bg: 'hsl(120 50% 92%)', fg: 'hsl(120 45% 35%)' },
];

function getIconColor(key: string) {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash);
  }
  return ICON_COLORS[Math.abs(hash) % ICON_COLORS.length];
}

const List = styled.div`
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  overflow: hidden;
  background: hsl(var(--card));
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04);
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  padding: 13px 18px;
  cursor: pointer;
  border-bottom: 1px solid hsl(var(--border) / 0.7);
  transition: background-color 0.1s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: hsl(var(--muted) / 0.6);
  }

  &:hover .row-actions {
    opacity: 1;
  }
`;

const Icon = styled.div<{ $bg: string; $fg: string }>`
  width: 32px;
  height: 32px;
  border-radius: 9px;
  background-color: ${(p) => p.$bg};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${(p) => p.$fg};
  margin-right: 14px;
  flex-shrink: 0;
`;

const Info = styled.div`
  flex: 1;
  min-width: 0;
`;

const Subject = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: hsl(var(--foreground));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Meta = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 3px;
  font-size: 12px;
  color: hsl(var(--muted-foreground));
  min-width: 0;

  & > span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const Right = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  margin-left: 12px;
  flex-shrink: 0;
`;

const SubMeta = styled.div`
  font-size: 11px;
  color: hsl(var(--muted-foreground));
  white-space: nowrap;
`;


function statusVariant(status: Opportunity['status']) {
  switch (status) {
    case 'Open': return 'default' as const;
    case 'Won': return 'success' as const;
    case 'Lost': return 'destructive' as const;
  }
}

interface OpportunitiesTableProps {
  opportunities: Opportunity[];
  customerMap: Map<string, string>;
  onEdit: (opp: Opportunity) => void;
}

export function OpportunitiesTable({ opportunities, customerMap, onEdit }: OpportunitiesTableProps) {
  const router = useRouter();
  const staleDays = useSettingsStore((s) => s.opportunityStaleReminderDays);

  const isStale = (opp: Opportunity) =>
    opp.status === 'Open' &&
    (Date.now() - new Date(opp.updatedAt).getTime()) > staleDays * 86400000;

  if (opportunities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Target size={40} className="text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">No opportunities found</p>
        <p className="text-xs text-muted-foreground mt-1">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <List>
      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        {opportunities.map((opp) => {
          const companyName = customerMap.get(opp.customerId) ?? 'Unknown company';
          const iconColor = getIconColor(companyName);
          const stale = isStale(opp);
          return (
            <motion.div key={opp.id} variants={itemVariants}>
              <Row onClick={() => router.push(`/customers?id=${opp.customerId}`)}>
                <Icon $bg={iconColor.bg} $fg={iconColor.fg}>
                  <Target size={16} />
                </Icon>

                <Info>
                  <Subject>{opp.subject}</Subject>
                  <Meta>
                    <span>{companyName}</span>
                    <span>·</span>
                    <span>{opp.stage} ({opp.probability}%)</span>
                    {opp.primaryVendor && (
                      <>
                        <span>·</span>
                        <span>{opp.primaryVendor}</span>
                      </>
                    )}
                    {stale && (
                      <span
                        className="flex items-center gap-0.5 text-amber-600 dark:text-amber-400"
                        title={`No updates in ${staleDays}+ days`}
                      >
                        <AlertTriangle size={11} />
                        Stale
                      </span>
                    )}
                  </Meta>
                </Info>

                <div
                  className="row-actions flex gap-1 opacity-0 transition-opacity mr-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(opp)}>
                    <Pencil size={13} />
                  </Button>
                </div>

                <Right>
                  <Badge variant={statusVariant(opp.status)} className="text-[10px]">{opp.status}</Badge>
                  <SubMeta>
                    {opp.estimatedRevenue != null && (
                      <>
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: opp.currency, maximumFractionDigits: 0 }).format(opp.estimatedRevenue)}
                        {opp.expirationDate && ' · '}
                      </>
                    )}
                    {opp.expirationDate && `Exp ${opp.expirationDate}`}
                  </SubMeta>
                </Right>

                <ChevronRight size={14} className="text-muted-foreground ml-2" />
              </Row>
            </motion.div>
          );
        })}
      </motion.div>
    </List>
  );
}
