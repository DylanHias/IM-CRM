'use client';

import { useRouter } from 'next/navigation';
import { Building2, ChevronRight, MapPin, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useCustomerStore } from '@/store/customerStore';
import { formatRelative } from '@/lib/utils/dateUtils';
import type { Customer } from '@/types/entities';
import { motion } from 'framer-motion';
import styled from 'styled-components';

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
  border: 1px solid hsl(var(--border));
  border-radius: 10px;
  overflow: hidden;
  background: hsl(var(--card));
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  padding: 14px 18px;
  cursor: pointer;
  border-bottom: 1px solid hsl(var(--border));
  transition: background-color 0.12s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: hsl(var(--muted));
  }
`;

const Icon = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background-color: hsl(var(--primary) / 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: hsl(var(--primary));
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

function getActivityVariant(lastActivityAt: string | null): string {
  if (!lastActivityAt) return 'warning';
  const days = (Date.now() - new Date(lastActivityAt).getTime()) / 86400000;
  if (days > 90) return 'warning';
  return 'success';
}

interface CustomerListProps {
  customers: Customer[];
}

export function CustomerList({ customers }: CustomerListProps) {
  const router = useRouter();
  const { setSelectedCustomerId } = useCustomerStore();

  const handleClick = (customer: Customer) => {
    setSelectedCustomerId(customer.id);
    router.push(`/customers/${customer.id}`);
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
        {customers.map((customer) => (
          <motion.div key={customer.id} variants={itemVariants}>
            <Row onClick={() => handleClick(customer)}>
              <Icon>
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
        ))}
      </motion.div>
    </List>
  );
}
