import { Trade } from '@/types/trading';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, X } from 'lucide-react';
import { format } from 'date-fns';

interface TradesTableProps {
  trades: Trade[];
  onCloseTrade?: (trade: Trade) => void;
  showActions?: boolean;
}

export function TradesTable({ trades, onCloseTrade, showActions = true }: TradesTableProps) {
  const statusColors: Record<string, string> = {
    open: 'bg-primary/10 text-primary',
    trailing: 'bg-success/10 text-success',
    closed_sl: 'bg-destructive/10 text-destructive',
    closed_target: 'bg-success/10 text-success',
    closed_manual: 'bg-muted text-muted-foreground',
  };

  const statusLabels: Record<string, string> = {
    open: 'Open',
    trailing: 'Trailing',
    closed_sl: 'Stopped Out',
    closed_target: 'Target Hit',
    closed_manual: 'Closed',
  };

  if (trades.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No trades found
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Symbol</TableHead>
            <TableHead>Direction</TableHead>
            <TableHead>Segment</TableHead>
            <TableHead className="text-right">Entry</TableHead>
            <TableHead className="text-right">Current</TableHead>
            <TableHead className="text-right">Stop Loss</TableHead>
            <TableHead className="text-right">P&L</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            {showActions && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {trades.map((trade) => {
            const isProfitable = Number(trade.pnl) > 0;
            const isOpen = ['open', 'trailing'].includes(trade.status);

            return (
              <TableRow key={trade.id} className="hover:bg-muted/30">
                <TableCell className="font-medium">{trade.symbol}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {trade.direction === 'long' ? (
                      <TrendingUp className="h-4 w-4 text-success" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-destructive" />
                    )}
                    <span className="capitalize">{trade.direction}</span>
                  </div>
                </TableCell>
                <TableCell className="capitalize">{trade.segment}</TableCell>
                <TableCell className="text-right font-mono">
                  ${Number(trade.entry_price).toFixed(2)}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {trade.current_price ? `$${Number(trade.current_price).toFixed(2)}` : '-'}
                </TableCell>
                <TableCell className="text-right font-mono">
                  ${Number(trade.current_sl_price).toFixed(2)}
                </TableCell>
                <TableCell className={cn(
                  "text-right font-semibold font-mono",
                  isProfitable ? "text-profit" : "text-loss"
                )}>
                  {isProfitable ? '+' : ''}{Number(trade.pnl_percent).toFixed(2)}%
                </TableCell>
                <TableCell>
                  <Badge className={cn("font-medium", statusColors[trade.status])}>
                    {statusLabels[trade.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(trade.created_at), 'MMM d, HH:mm')}
                </TableCell>
                {showActions && (
                  <TableCell className="text-right">
                    {isOpen && onCloseTrade && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => onCloseTrade(trade)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Close
                      </Button>
                    )}
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
