import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Target, Activity, BarChart3, Percent, Briefcase, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { TradeCard } from '@/components/dashboard/TradeCard';
import { useTradingStats, useActiveTrades } from '@/hooks/useTrades';
import { useTradingSettings } from '@/hooks/useTradingSettings';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { MarketIndicesTicker } from '@/components/market/MarketIndicesTicker';
import { Trade } from '@/types/trading';

interface LiveHolding {
  trade: Trade;
  livePrice: number;
  livePnl: number;
  livePnlPercent: number;
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useTradingStats();
  const { data: activeTrades, isLoading: tradesLoading } = useActiveTrades();
  const { data: settings } = useTradingSettings();
  const navigate = useNavigate();
  const [liveHoldings, setLiveHoldings] = useState<LiveHolding[]>([]);

  const equityTrades = activeTrades?.filter(t => t.segment === 'equity') || [];
  const forexTrades = activeTrades?.filter(t => t.segment === 'forex') || [];

  // Initialize and update live prices for holdings summary
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <AppLayout>
      {/* Market Indices Ticker */}
      <div className="-mx-4 lg:-mx-8 -mt-4 lg:-mt-8 mb-6">
        <MarketIndicesTicker />
      </div>

      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here's your trading overview.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsLoading ? (
            <>
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </>
          ) : (
            <>
              <StatsCard
                title="Current Balance"
                value={`$${(settings?.current_balance || 100000).toLocaleString()}`}
                icon={<DollarSign className="h-5 w-5" />}
              />
              <StatsCard
                title="Total P&L"
                value={`${stats?.totalPnl && stats.totalPnl > 0 ? '+' : ''}$${(stats?.totalPnl || 0).toFixed(2)}`}
                trend={stats?.totalPnl && stats.totalPnl > 0 ? 'up' : stats?.totalPnl && stats.totalPnl < 0 ? 'down' : 'neutral'}
                icon={<TrendingUp className="h-5 w-5" />}
              />
              <StatsCard
                title="Win Rate"
                value={`${(stats?.winRate || 0).toFixed(1)}%`}
                subtitle={`${stats?.winningTrades || 0}W / ${stats?.losingTrades || 0}L`}
                icon={<Percent className="h-5 w-5" />}
              />
              <StatsCard
                title="Active Trades"
                value={stats?.openTrades || 0}
                subtitle={`of ${stats?.totalTrades || 0} total`}
                icon={<Activity className="h-5 w-5" />}
              />
            </>
          )}
        </div>

        {/* Live Holdings Summary */}
        {liveHoldings.length > 0 && (
          <Card className="border-profit/20 bg-gradient-to-r from-profit/5 to-transparent">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  Your Investments
                  <div className="h-2 w-2 rounded-full bg-profit animate-pulse" />
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => navigate('/holdings')}>
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Current Value</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalCurrentValue)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Invested</p>
                  <p className="text-xl font-semibold text-muted-foreground">{formatCurrency(totalInvested)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Today's Returns</p>
                  <div className={`flex items-center gap-1 ${totalLivePnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                    {totalLivePnl >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                    <span className="text-xl font-bold">
                      {totalLivePnl >= 0 ? '+' : ''}{formatCurrency(totalLivePnl)}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Returns</p>
                  <p className={`text-xl font-bold ${totalLivePnlPercent >= 0 ? 'text-profit' : 'text-loss'}`}>
                    {totalLivePnlPercent >= 0 ? '+' : ''}{totalLivePnlPercent.toFixed(2)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Active Trades by Segment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Active Positions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="all">All ({activeTrades?.length || 0})</TabsTrigger>
                <TabsTrigger value="equity">Equity ({equityTrades.length})</TabsTrigger>
                <TabsTrigger value="forex">Forex ({forexTrades.length})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all">
                {tradesLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-40 rounded-xl" />
                    ))}
                  </div>
                ) : activeTrades && activeTrades.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeTrades.map(trade => (
                      <TradeCard 
                        key={trade.id} 
                        trade={trade}
                        onClick={() => navigate('/trades')}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No active trades</p>
                    <p className="text-sm">Set up your TradingView webhook to start receiving signals</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="equity">
                {equityTrades.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {equityTrades.map(trade => (
                      <TradeCard key={trade.id} trade={trade} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No equity trades
                  </div>
                )}
              </TabsContent>

              <TabsContent value="forex">
                {forexTrades.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {forexTrades.map(trade => (
                      <TradeCard key={trade.id} trade={trade} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No forex trades
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Risk Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Stop Loss</span>
                <span className="font-medium">{settings?.stop_loss_percent || 1.5}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Trailing Target</span>
                <span className="font-medium">{settings?.trailing_target_percent || 9}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Position Size</span>
                <span className="font-medium">{settings?.default_position_size_percent || 10}%</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Avg Win</span>
                <span className="font-medium text-profit">
                  ${(stats?.avgWin || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Avg Loss</span>
                <span className="font-medium text-loss">
                  -${(stats?.avgLoss || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Trades</span>
                <span className="font-medium">{stats?.totalTrades || 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
