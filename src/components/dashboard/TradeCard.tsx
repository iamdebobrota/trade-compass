import { Trade } from '@/types/trading';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Clock, Target, Shield } from 'lucide-react';

interface TradeCardProps {
  trade: Trade;
  onClick?: () => void;
}

export function TradeCard({ trade, onClick }: TradeCardProps) {
  const isLong = trade.direction === 'long';
  const isProfitable = Number(trade.pnl) > 0;
  const pnlPercent = Number(trade.pnl_percent);

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

  return (
    <Card 
      className={cn(
        "overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200 animate-fade-in",
        "hover:border-primary/50"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={cn(
              "p-2 rounded-lg",
              isLong ? "bg-success/10" : "bg-destructive/10"
            )}>
              {isLong ? (
                <TrendingUp className="h-4 w-4 text-success" />
              ) : (
                <TrendingDown className="h-4 w-4 text-destructive" />
              )}
            </div>
            <div>
              <p className="font-semibold text-foreground">{trade.symbol}</p>
              <p className="text-xs text-muted-foreground capitalize">{trade.segment}</p>
            </div>
          </div>
          <Badge className={cn("font-medium", statusColors[trade.status])}>
            {statusLabels[trade.status]}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>Entry: ${Number(trade.entry_price).toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Shield className="h-3.5 w-3.5" />
            <span>SL: ${Number(trade.current_sl_price).toFixed(2)}</span>
          </div>
          {trade.current_price && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Target className="h-3.5 w-3.5" />
              <span>Current: ${Number(trade.current_price).toFixed(2)}</span>
            </div>
          )}
          <div className={cn(
            "font-semibold",
            isProfitable ? "text-profit" : "text-loss"
          )}>
            {isProfitable ? '+' : ''}{pnlPercent.toFixed(2)}%
          </div>
        </div>

        {trade.trailing_activated && (
          <div className="mt-3 flex items-center gap-1 text-xs text-success">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            Trailing Stop Active
          </div>
        )}
      </CardContent>
    </Card>
  );
}
