import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Clock,
  ShoppingCart,
  Trash2,
  X,
} from 'lucide-react';

// Note: In a real app, you would have a separate "orders" table for pending orders
// For now, this is a placeholder that can be connected when the orders feature is implemented

interface PendingOrder {
  id: string;
  symbol: string;
  type: 'buy' | 'sell';
  orderType: 'limit' | 'market' | 'stop_loss';
  quantity: number;
  limitPrice?: number;
  stopPrice?: number;
  status: 'pending' | 'partial' | 'cancelled';
  createdAt: string;
}

interface OrdersSectionProps {
  orders?: PendingOrder[];
}

export function OrdersSection({ orders = [] }: OrdersSectionProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(value);
  };

  if (orders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Orders
          </CardTitle>
          <CardDescription>Your pending and executed orders</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <ShoppingCart className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-sm">No pending orders</p>
            <p className="text-xs text-muted-foreground mt-1">
              Your limit and stop-loss orders will appear here
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Orders ({orders.length})
            </CardTitle>
            <CardDescription>Your pending and executed orders</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Symbol</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>
                  <span className="font-medium">{order.symbol.replace('.NS', '').replace('.BO', '')}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge variant={order.type === 'buy' ? 'default' : 'secondary'}>
                      {order.type.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-muted-foreground capitalize">
                      {order.orderType.replace('_', ' ')}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">{order.quantity}</TableCell>
                <TableCell className="text-right">
                  {order.limitPrice ? formatCurrency(order.limitPrice) : 'Market'}
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={
                      order.status === 'pending' ? 'outline' : 
                      order.status === 'partial' ? 'secondary' : 
                      'destructive'
                    }
                    className="capitalize"
                  >
                    {order.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-loss">
                    <X className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
