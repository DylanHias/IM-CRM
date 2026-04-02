'use client';

import { useRouter } from 'next/navigation';
import { Bookmark, Building2, ChevronRight, MapPin, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useCustomerStore } from '@/store/customerStore';
import { formatRelative } from '@/lib/utils/dateUtils';
import type { Customer } from '@/types/entities';
import { motion } from 'framer-motion';
import styled from 'styled-components';

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

function getIconColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
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

  &:hover .bookmark-btn {
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

const Name = styled.div`
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
`;

const Right = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  margin-left: 12px;
`;

const LastActivity = styled.div`
  font-size: 11px;
  color: hsl(var(--muted-foreground));
`;

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04, delayChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' as const } },
};

interface CustomerListProps {
  customers: Customer[];
}

export function CustomerList({ customers }: CustomerListProps) {
  const router = useRouter();
  const { setSelectedCustomerId, favoriteIds, toggleFavorite } = useCustomerStore();

  const handleClick = (customer: Customer) => {
    setSelectedCustomerId(customer.id);
    router.push(`/customers?id=${customer.id}`);
  };

  if (customers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Building2 size={40} className="text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">No customers found</p>
        <p className="text-xs text-muted-foreground mt-1">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <List>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {customers.map((customer) => {
          const iconColor = getIconColor(customer.name);
          const isFavorite = favoriteIds.has(customer.id);
          return (
          <motion.div key={customer.id} variants={itemVariants}>
            <Row onClick={() => handleClick(customer)}>
              <Icon $bg={iconColor.bg} $fg={iconColor.fg}>
                <Building2 size={16} />
              </Icon>

              <Info>
                <Name>{customer.name}</Name>
                <Meta>
                  {customer.industry && <span>{customer.industry}</span>}
                  {customer.industry && customer.addressCity && <span>·</span>}
                  {customer.addressCity && (
                    <span className="flex items-center gap-1">
                      <MapPin size={10} />
                      {customer.addressCity}
                    </span>
                  )}
                  {customer.ownerName && (
                    <>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <User size={10} />
                        {customer.ownerName}
                      </span>
                    </>
                  )}
                </Meta>
              </Info>

              <button
                className={`bookmark-btn ml-2 flex-shrink-0 text-muted-foreground hover:text-primary transition-all ${isFavorite ? 'opacity-100' : 'opacity-0'}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(customer.id);
                }}
                title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Bookmark size={16} className={isFavorite ? 'fill-primary text-primary' : ''} />
              </button>

              <Right>
                <Badge
                  variant={customer.status === 'active' ? 'success' : 'secondary'}
                  className="text-xs"
                >
                  {customer.status}
                </Badge>
                <LastActivity>
                  {customer.lastActivityAt
                    ? formatRelative(customer.lastActivityAt)
                    : 'No activity'}
                </LastActivity>
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
