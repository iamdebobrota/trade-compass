import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HoldingsSection } from '@/components/holdings/HoldingsSection';
import { OrdersSection } from '@/components/holdings/OrdersSection';
import { TradesTable } from '@/components/trades/TradesTable';
import { MarketIndicesTicker } from '@/components/market/MarketIndicesTicker';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Briefcase, 
  Clock, 
  History,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  EyeOff
} from 'lucide-react';
import { useActiveTrades, useClosedTrades } from '@/hooks/useTrades';
import { Button } from '@/components/ui/button';
import { Trade } from '@/types/trading';

interface LiveHolding {
  trade: Trade;
  livePrice: number;
  livePnl: number;
  livePnlPercent: number;
}

export default function Holdings() {
  const { data: activeTrades } = useActiveTrades();
  const { data: closedTrades, isLoading: historyLoading } = useClosedTrades();
  const [liveHoldings, setLiveHoldings] = useState<LiveHolding[]>([]);
  const [showBalance, setShowBalance] = useState(true);

  // Live price updates for summary
  useEffect(() => {
    if (!activeTrades) return;

    const initialHoldings = activeTrades.map(trade => ({
      trade,
      livePrice: Number(trade.current_price) || Number(trade.entry_price),
      livePnl: Number(trade.pnl) || 0,
      livePnlPercent: Number(trade.pnl_percent) || 0,
    }));
    setLiveHoldings(initialHoldings);

    const interval = setInterval(() => {
      setLiveHoldings(prev => prev.map(holding => {
        const fluctuation = (Math.random() - 0.5) * 0.006 * holding.livePrice;
        const newPrice = parseFloat((holding.livePrice + fluctuation).toFixed(2));
        
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

  const totalInvested = liveHoldings.reduce((sum, h) => 
    sum + (Number(h.trade.entry_price) * Number(h.trade.quantity)), 0
  );
  const totalCurrentValue = liveHoldings.reduce((sum, h) => 
    sum + (h.livePrice * Number(h.trade.quantity)), 0
  );
  const totalLivePnl = liveHoldings.reduce((sum, h) => sum + h.livePnl, 0);
  const totalLivePnlPercent = totalInvested > 0 ? ((totalCurrentValue - totalInvested) / totalInvested) * 100 : 0;

  // Closed trades stats
  const winningTrades = closedTrades?.filter(t => Number(t.pnl) > 0) || [];
  const losingTrades = closedTrades?.filter(t => Number(t.pnl) < 0) || [];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(value);
  };

  const maskValue = (value: string) => showBalance ? value : '₹•••••';

  return (
    <AppLayout>
      {/* Market Indices Ticker */}
      <div className="-mx-4 lg:-mx-8 -mt-4 lg:-mt-8 mb-6">
        <MarketIndicesTicker />
      </div>

      <div className="space-y-6">
        {/* Portfolio Summary Header */}
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm text-muted-foreground">Current Value</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6"
                    onClick={() => setShowBalance(!showBalance)}
                  >
                    {showBalance ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-bold tracking-tight">
                    {maskValue(formatCurrency(totalCurrentValue))}
                  </span>
                  {liveHoldings.length > 0 && (
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-profit animate-pulse" />
                      <span className="text-xs text-muted-foreground">Live</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Invested</p>
                <p className="text-lg font-semibold">{maskValue(formatCurrency(totalInvested))}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">1D Returns</p>
                <div className={`flex items-center gap-1 ${totalLivePnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                  {totalLivePnl >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                  <span className="text-lg font-semibold">
                    {showBalance ? `${totalLivePnl >= 0 ? '+' : ''}${formatCurrency(totalLivePnl)}` : '₹•••••'}
                  </span>
                  <span className="text-sm">({totalLivePnlPercent >= 0 ? '+' : ''}{totalLivePnlPercent.toFixed(2)}%)</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Returns</p>
                <div className={`flex items-center gap-1 ${totalLivePnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                  <span className="text-lg font-semibold">
                    {showBalance ? `${totalLivePnl >= 0 ? '+' : ''}${formatCurrency(totalLivePnl)}` : '₹•••••'}
                  </span>
                  <span className="text-sm">({totalLivePnlPercent >= 0 ? '+' : ''}{totalLivePnlPercent.toFixed(2)}%)</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Holdings</p>
                <p className="text-lg font-semibold">{liveHoldings.length} stocks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for Holdings, Orders, History */}
        <Tabs defaultValue="holdings" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="holdings" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Holdings
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="holdings" className="mt-4">
            <HoldingsSection />
          </TabsContent>

          <TabsContent value="orders" className="mt-4">
            <OrdersSection />
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                {/* History Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Total Trades</p>
                    <p className="text-2xl font-bold">{closedTrades?.length || 0}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-profit/10">
                    <p className="text-sm text-muted-foreground">Winning</p>
                    <p className="text-2xl font-bold text-profit">{winningTrades.length}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-loss/10">
                    <p className="text-sm text-muted-foreground">Losing</p>
                    <p className="text-2xl font-bold text-loss">{losingTrades.length}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Win Rate</p>
                    <p className="text-2xl font-bold">
                      {closedTrades && closedTrades.length > 0
                        ? `${((winningTrades.length / closedTrades.length) * 100).toFixed(1)}%`
                        : '0%'}
                    </p>
                  </div>
                </div>

                {/* Trades Table */}
                {historyLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : closedTrades && closedTrades.length > 0 ? (
                  <TradesTable trades={closedTrades} showActions={false} />
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <History className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No trade history yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your completed trades will appear here
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
