'use client';

import { Bookmark } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CustomerList } from '@/components/customers/CustomerList';
import { useCustomerStore } from '@/store/customerStore';

export function FavoritedCustomersCard() {
  const customers = useCustomerStore((s) => s.customers);
  const favoriteIds = useCustomerStore((s) => s.favoriteIds);

  const favorites = customers.filter((c) => favoriteIds.has(c.id));

  if (favorites.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Bookmark size={14} className="text-muted-foreground" />
          Favorited Customers
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <CustomerList customers={favorites} showFavoriteButton={false} />
      </CardContent>
    </Card>
  );
}
