import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  TrendingUp,
  TrendingDown,
  Eye,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { Trade } from '@/types/trading';
import { useActiveTrades } from '@/hooks/useTrades';
import { CloseTradeDialog } from '@/components/trades/CloseTradeDialog';

interface LiveHolding {
  trade: Trade;
  livePrice: number;
  livePnl: number;
  livePnlPercent: number;
}

export function HoldingsSection() {
  const navigate = useNavigate();
  const { data: activeTrades, isLoading } = useActiveTrades();
  const [liveHoldings, setLiveHoldings] = useState<LiveHolding[]>([]);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);

  // Initialize and update live prices
  useEffect(() => {
    if (!activeTrades) return;

    // Initialize with current prices
    const initialHoldings = activeTrades.map(trade => ({
      trade,
      livePrice: Number(trade.current_price) || Number(trade.entry_price),
      livePnl: Number(trade.pnl) || 0,
      livePnlPercent: Number(trade.pnl_percent) || 0,
    }));
    setLiveHoldings(initialHoldings);

    // Update prices every 2 seconds
    const interval = setInterval(() => {
      setLiveHoldings(prev => prev.map(holding => {
        // Simulate small price fluctuations
        const fluctuation = (Math.random() - 0.5) * 0.006 * holding.livePrice;
        const newPrice = parseFloat((holding.livePrice + fluctuation).toFixed(2));
        
        // Calculate P&L based on direction
        const entryPrice = Number(holding.trade.entry_price);
        const quantity = Number(holding.trade.quantity);
        
        let newPnl: number;
        let newPnlPercent: number;
        
        if (holding.trade.direction === 'long') {
          newPnl = (newPrice - entryPrice) * quantity;
          newPnlPercent = ((newPrice - entryPrice) / entryPrice) * 100;
        } else {
          newPnl = (entryPrice - newPrice) * quantity;
          newPnlPercent = ((entryPrice - newPrice) / entryPrice) * 100;
        }

        return {
          ...holding,
          livePrice: newPrice,
          livePnl: parseFloat(newPnl.toFixed(2)),
          livePnlPercent: parseFloat(newPnlPercent.toFixed(2)),
        };
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, [activeTrades]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Calculate totals
  const totalInvested = liveHoldings.reduce((sum, h) => 
    sum + (Number(h.trade.entry_price) * Number(h.trade.quantity)), 0
  );
  const totalCurrentValue = liveHoldings.reduce((sum, h) => 
    sum + (h.livePrice * Number(h.trade.quantity)), 0
  );
  const totalPnl = liveHoldings.reduce((sum, h) => sum + h.livePnl, 0);
  const totalPnlPercent = totalInvested > 0 ? ((totalCurrentValue - totalInvested) / totalInvested) * 100 : 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!liveHoldings.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Holdings
          </CardTitle>
          <CardDescription>Your active stock positions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No holdings yet</p>
            <Button onClick={() => navigate('/market')}>
              Explore Stocks
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Holdings ({liveHoldings.length})
            </CardTitle>
            <CardDescription className="mt-1">Your active stock positions</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-profit animate-pulse" />
            <span className="text-xs text-muted-foreground">Live</span>
          </div>
        </div>
      </CardHeader>
      
      {/* Summary Section */}
      <CardContent className="border-b pb-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Current value</p>
            <p className="text-2xl font-bold">{formatCurrency(totalCurrentValue)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Invested value</p>
            <p className="text-lg font-semibold text-muted-foreground">
              {formatCurrency(totalInvested)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total returns</p>
            <p className={`text-xl font-bold ${totalPnl >= 0 ? 'text-profit' : 'text-loss'}`}>
              {totalPnl >= 0 ? '+' : ''}{formatCurrency(totalPnl)} ({totalPnlPercent >= 0 ? '+' : ''}{totalPnlPercent.toFixed(2)}%)
            </p>
          </div>
        </div>
      </CardContent>

      {/* Holdings Table */}
      <CardContent className="pt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead className="text-right">Market Price</TableHead>
              <TableHead className="text-right">Returns (%)</TableHead>
              <TableHead className="text-right">Current (Invested)</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {liveHoldings.map((holding) => {
              const isPositive = holding.livePnl >= 0;
              const investedValue = Number(holding.trade.entry_price) * Number(holding.trade.quantity);
              const currentValue = holding.livePrice * Number(holding.trade.quantity);
              
              return (
                <TableRow 
                  key={holding.trade.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/stock/${encodeURIComponent(holding.trade.symbol)}`)}
                >
                  <TableCell>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {holding.trade.symbol.replace('.NS', '').replace('.BO', '')}
                        </span>
                        <Badge variant={holding.trade.direction === 'long' ? 'default' : 'secondary'} className="text-xs">
                          {holding.trade.direction.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {Number(holding.trade.quantity)} shares • Avg. {formatCurrency(Number(holding.trade.entry_price))}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div>
                      <p className="font-medium">{formatCurrency(holding.livePrice)}</p>
                      <p className={`text-xs ${isPositive ? 'text-profit' : 'text-loss'}`}>
                        {isPositive ? '+' : ''}{(holding.livePrice - Number(holding.trade.entry_price)).toFixed(2)} ({isPositive ? '+' : ''}{holding.livePnlPercent.toFixed(2)}%)
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className={`flex items-center justify-end gap-1 ${isPositive ? 'text-profit' : 'text-loss'}`}>
                      {isPositive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                      <div>
                        <p className="font-medium">{isPositive ? '+' : ''}{formatCurrency(holding.livePnl)}</p>
                        <p className="text-xs">{holding.livePnlPercent.toFixed(2)}%</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div>
                      <p className="font-medium">{formatCurrency(currentValue)}</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(investedValue)}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/stock/${encodeURIComponent(holding.trade.symbol)}`);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-loss border-loss hover:bg-loss hover:text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTrade(holding.trade);
                          setCloseDialogOpen(true);
                        }}
                      >
                        Sell
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>

      {selectedTrade && (
        <CloseTradeDialog
          open={closeDialogOpen}
          onOpenChange={setCloseDialogOpen}
          trade={selectedTrade}
        />
      )}
    </Card>
  );
}
