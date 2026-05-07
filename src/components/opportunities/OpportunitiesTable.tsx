'use client';

import { Target, ChevronRight, AlertTriangle, Calendar, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { listContainerVariants as containerVariants, listItemVariants as itemVariants } from '@/lib/motion';
import styled, { css } from 'styled-components';
import { Badge } from '@/components/ui/badge';
import { useSettingsStore } from '@/store/settingsStore';
import { formatCurrency } from '@/lib/utils/currencyUtils';
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

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type StatusKey = Opportunity['status'];

function statusColor(status: StatusKey) {
  switch (status) {
    case 'Open': return 'hsl(var(--primary))';
    case 'Won': return 'hsl(var(--success))';
    case 'Lost': return 'hsl(var(--destructive))';
  }
}

function statusVariant(status: StatusKey) {
  switch (status) {
    case 'Open': return 'default' as const;
    case 'Won': return 'success' as const;
    case 'Lost': return 'destructive' as const;
  }
}

function relativeExpiration(dateStr: string | null): { label: string; tone: 'overdue' | 'soon' | 'near' | 'neutral' } | null {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  if (isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const t = new Date(target);
  t.setHours(0, 0, 0, 0);
  const diffDays = Math.round((t.getTime() - today.getTime()) / 86400000);
  if (diffDays < 0) return { label: `${Math.abs(diffDays)}d overdue`, tone: 'overdue' };
  if (diffDays === 0) return { label: 'today', tone: 'soon' };
  if (diffDays <= 7) return { label: `in ${diffDays}d`, tone: 'soon' };
  if (diffDays <= 30) return { label: `in ${diffDays}d`, tone: 'near' };
  return { label: `in ${diffDays}d`, tone: 'neutral' };
}

function formatExpDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const List = styled.div`
  display: flex;
  flex-direction: column;
  border-radius: 14px;
  overflow: hidden;
  background: hsl(var(--card));
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04);
`;

const Card = styled.div<{ $status: StatusKey }>`
  position: relative;
  display: grid;
  grid-template-columns: 4px 44px 1fr auto 16px;
  grid-template-rows: auto auto auto;
  column-gap: 14px;
  row-gap: 6px;
  align-items: center;
  padding: 16px 20px 16px 0;
  cursor: pointer;
  border-bottom: 1px solid hsl(var(--border) / 0.5);
  transition: background-color 0.12s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: hsl(var(--muted) / 0.45);
  }
`;

const Accent = styled.div<{ $status: StatusKey }>`
  grid-row: 1 / -1;
  grid-column: 1;
  align-self: stretch;
  width: 4px;
  background: ${(p) => statusColor(p.$status)};
  opacity: 0.85;
`;

const IconWrap = styled.div<{ $bg: string; $fg: string }>`
  grid-column: 2;
  grid-row: 1 / span 3;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background-color: ${(p) => p.$bg};
  color: ${(p) => p.$fg};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.02em;
  flex-shrink: 0;
  align-self: start;
  margin-top: 2px;
`;

const HeaderRow = styled.div`
  grid-column: 3;
  grid-row: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 2px;
`;

const CompanyEyebrow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: hsl(var(--muted-foreground));
  min-width: 0;

  & > .name {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
  }
`;

const Subject = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: hsl(var(--foreground));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
`;

const StageRow = styled.div`
  grid-column: 3;
  grid-row: 2;
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  margin-top: 4px;
`;

const ProgressTrack = styled.div`
  position: relative;
  height: 4px;
  width: 100%;
  max-width: 180px;
  background: hsl(var(--muted));
  border-radius: 999px;
  overflow: hidden;
  flex-shrink: 1;
  min-width: 60px;
`;

const ProgressFill = styled.div<{ $value: number; $status: StatusKey }>`
  height: 100%;
  width: ${(p) => Math.max(2, Math.min(100, p.$value))}%;
  background: ${(p) => statusColor(p.$status)};
  border-radius: 999px;
  transition: width 0.3s ease;
`;

const StageLabel = styled.div`
  display: flex;
  align-items: baseline;
  gap: 6px;
  font-size: 12px;
  color: hsl(var(--foreground));
  white-space: nowrap;
  min-width: 0;

  & > .stage {
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  & > .pct {
    font-weight: 600;
    color: hsl(var(--muted-foreground));
    font-variant-numeric: tabular-nums;
    font-size: 11px;
  }
`;

const FooterRow = styled.div`
  grid-column: 3;
  grid-row: 3;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  margin-top: 2px;
`;

const VendorChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 6px;
  background: hsl(var(--muted) / 0.7);
  color: hsl(var(--foreground) / 0.8);
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ExpiryChip = styled.span<{ $tone: 'overdue' | 'soon' | 'near' | 'neutral' }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;

  ${(p) => p.$tone === 'overdue' && css`
    color: hsl(var(--destructive));
    font-weight: 600;
  `}
  ${(p) => p.$tone === 'soon' && css`
    color: hsl(var(--warning));
    font-weight: 600;
  `}
  ${(p) => p.$tone === 'near' && css`
    color: hsl(var(--muted-foreground));
  `}
  ${(p) => p.$tone === 'neutral' && css`
    color: hsl(var(--muted-foreground));
  `}

  & > .date {
    color: hsl(var(--foreground) / 0.7);
    font-weight: 500;
  }
  & > .sep {
    opacity: 0.4;
  }
`;

const StaleChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 1px 6px;
  border-radius: 5px;
  background: hsl(var(--warning) / 0.12);
  color: hsl(var(--warning));
  font-size: 10.5px;
  font-weight: 600;
  white-space: nowrap;
`;

const Right = styled.div`
  grid-column: 4;
  grid-row: 1 / span 3;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  gap: 6px;
  flex-shrink: 0;
  padding-left: 12px;
`;

const Value = styled.div`
  font-size: 16px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: hsl(var(--foreground));
  letter-spacing: -0.01em;
  line-height: 1.1;
  white-space: nowrap;
`;

const ValuePlaceholder = styled.div`
  font-size: 13px;
  color: hsl(var(--muted-foreground) / 0.6);
  font-style: italic;
`;

const Chevron = styled.div`
  grid-column: 5;
  grid-row: 1 / span 3;
  display: flex;
  align-items: center;
  color: hsl(var(--muted-foreground) / 0.7);
`;

interface OpportunitiesTableProps {
  opportunities: Opportunity[];
  customerMap: Map<string, string>;
  onEdit: (opp: Opportunity) => void;
}

export function OpportunitiesTable({ opportunities, customerMap, onEdit }: OpportunitiesTableProps) {
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
          const exp = relativeExpiration(opp.expirationDate);
          const hasValue = opp.estimatedRevenue != null && opp.estimatedRevenue > 0;

          return (
            <motion.div key={opp.id} variants={itemVariants}>
              <Card $status={opp.status} onClick={() => onEdit(opp)}>
                <Accent $status={opp.status} />

                <IconWrap $bg={iconColor.bg} $fg={iconColor.fg} aria-hidden>
                  {getInitials(companyName)}
                </IconWrap>

                <HeaderRow>
                  <CompanyEyebrow>
                    <Building2 size={10} strokeWidth={2.5} />
                    <span className="name">{companyName}</span>
                  </CompanyEyebrow>
                  <Subject>{opp.subject}</Subject>
                </HeaderRow>

                <StageRow>
                  <ProgressTrack>
                    <ProgressFill $value={opp.probability ?? 0} $status={opp.status} />
                  </ProgressTrack>
                  <StageLabel>
                    <span className="stage">{opp.stage}</span>
                    <span className="pct">{opp.probability ?? 0}%</span>
                  </StageLabel>
                </StageRow>

                <FooterRow>
                  {opp.primaryVendor && (
                    <VendorChip title={opp.primaryVendor}>{opp.primaryVendor}</VendorChip>
                  )}
                  {exp && (
                    <ExpiryChip $tone={exp.tone}>
                      <Calendar size={10} strokeWidth={2.5} />
                      <span className="date">{formatExpDate(opp.expirationDate!)}</span>
                      <span className="sep">·</span>
                      <span>{exp.label}</span>
                    </ExpiryChip>
                  )}
                  {stale && (
                    <StaleChip title={`No updates in ${staleDays}+ days`}>
                      <AlertTriangle size={10} strokeWidth={2.5} />
                      Stale
                    </StaleChip>
                  )}
                </FooterRow>

                <Right>
                  <Badge variant={statusVariant(opp.status)} className="text-[10px] px-2 py-0.5">
                    {opp.status}
                  </Badge>
                  {hasValue ? (
                    <Value>{formatCurrency(opp.estimatedRevenue!, opp.currency)}</Value>
                  ) : (
                    <ValuePlaceholder>No value</ValuePlaceholder>
                  )}
                </Right>

                <Chevron>
                  <ChevronRight size={16} />
                </Chevron>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>
    </List>
  );
}
