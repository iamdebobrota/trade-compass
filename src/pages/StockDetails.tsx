import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  ShoppingCart,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Sparkles
} from 'lucide-react';
import { 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import { QuickTradeDialog } from '@/components/market/QuickTradeDialog';
import { StockAnalysis } from '@/components/market/StockAnalysis';
import { StockChart } from '@/components/market/StockChart';
import { PerformanceBars } from '@/components/market/PerformanceBars';

interface PriceHistory {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface InvestorActivity {
  last10Min: { buyers: number; sellers: number };
  last1Hour: { buyers: number; sellers: number };
  last24Hours: { buyers: number; sellers: number };
  last7Days: { buyers: number; sellers: number };
}

interface StockDetails {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  exchange: string;
  priceHistory: PriceHistory[];
  investorActivity: InvestorActivity;
  marketCap: string;
  pe: string;
  eps: string;
  dividend: string;
  high52Week: string;
  low52Week: string;
  avgVolume: number;
  beta: string;
}

export default function StockDetailsPage() {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const [tradeDialogOpen, setTradeDialogOpen] = useState(false);
  const [chartPeriod, setChartPeriod] = useState<'1D' | '1W' | '1M' | '3M' | '1Y'>('1D');
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [livePriceHistory, setLivePriceHistory] = useState<PriceHistory[]>([]);
  const [isLive, setIsLive] = useState(true);
  const lastUpdateRef = useRef<Date>(new Date());

  const { data: stock, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['stock-details', symbol],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('market-data', {
        body: { action: 'getStockDetails', symbol }
      });
      if (error) throw error;
      return data as StockDetails;
    },
    enabled: !!symbol,
    staleTime: 0,
  });

  // Live price simulation - updates every 2 seconds
  useEffect(() => {
    if (!stock) return;
    
    setLivePrice(stock.price);
    setLivePriceHistory(stock.priceHistory || []);
    
    const interval = setInterval(() => {
      if (!isLive) return;
      
      setLivePrice(prev => {
        if (prev === null) return stock.price;
        // Simulate small price fluctuations (±0.5%)
        const fluctuation = (Math.random() - 0.5) * 0.01 * prev;
        return parseFloat((prev + fluctuation).toFixed(2));
      });
      
      // Add new point to live chart every 2 seconds for 1D view
      setLivePriceHistory(prev => {
        const now = new Date();
        const newPoint: PriceHistory = {
          date: now.toISOString(),
          open: livePrice || stock.price,
          high: (livePrice || stock.price) * 1.001,
          low: (livePrice || stock.price) * 0.999,
          close: livePrice || stock.price,
          volume: Math.floor(Math.random() * 100000) + 50000,
        };
        
        // Keep last 100 points for 1D view
        const updated = [...prev, newPoint];
        return updated.slice(-100);
      });
      
      lastUpdateRef.current = new Date();
    }, 2000);

    return () => clearInterval(interval);
  }, [stock, isLive]);

  // Also refetch full data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 30000);
    return () => clearInterval(interval);
  }, [refetch]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatLargeNumber = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
    return `₹${num.toLocaleString('en-IN')}`;
  };

  const getFilteredHistory = () => {
    if (chartPeriod === '1D') {
      // Use live price history for 1D view
      return livePriceHistory.slice(-50);
    }
    if (!stock?.priceHistory) return [];
    const days = chartPeriod === '1W' ? 7 : chartPeriod === '1M' ? 30 : chartPeriod === '3M' ? 90 : 365;
    return stock.priceHistory.slice(-Math.min(days, stock.priceHistory.length));
  };

  const currentPrice = livePrice ?? stock?.price ?? 0;
  const priceChange = stock ? currentPrice - stock.price + stock.change : 0;
  const priceChangePercent = stock ? ((currentPrice - stock.price) / stock.price * 100) + stock.changePercent : 0;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!stock) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Stock not found</p>
          <Button onClick={() => navigate('/market')} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Market
          </Button>
        </div>
      </AppLayout>
    );
  }

  const isPositive = priceChange >= 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/market')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">{stock.symbol.replace('.NS', '').replace('.BO', '')}</h1>
                <Badge variant="outline">{stock.exchange}</Badge>
              </div>
              <p className="text-muted-foreground">{stock.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant={isLive ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setIsLive(!isLive)}
              className={isLive ? 'bg-profit hover:bg-profit/90' : ''}
            >
              <div className={`h-2 w-2 rounded-full mr-2 ${isLive ? 'bg-white animate-pulse' : 'bg-muted-foreground'}`} />
              {isLive ? 'LIVE' : 'Paused'}
            </Button>
            <Button variant="outline" onClick={() => refetch()} disabled={isRefetching}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              onClick={() => setTradeDialogOpen(true)}
              className={isPositive ? 'bg-profit hover:bg-profit/90' : 'bg-loss hover:bg-loss/90'}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Trade
            </Button>
          </div>
        </div>

        {/* Price Section */}
        <Card className={`transition-all duration-300 ${isLive ? 'ring-2 ring-profit/30' : ''}`}>
          <CardContent className="pt-6">
            <div className="flex items-end gap-4">
              <span className={`text-4xl font-bold transition-colors duration-200 ${isLive ? (isPositive ? 'text-profit' : 'text-loss') : ''}`}>
                {formatCurrency(currentPrice)}
              </span>
              <div className={`flex items-center text-lg ${isPositive ? 'text-profit' : 'text-loss'}`}>
                {isPositive ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                <span>{isPositive ? '+' : ''}{priceChange.toFixed(2)}</span>
                <span className="ml-1">({isPositive ? '+' : ''}{priceChangePercent.toFixed(2)}%)</span>
              </div>
              {isLive && (
                <Badge variant="outline" className="text-profit border-profit animate-pulse">
                  <div className="h-1.5 w-1.5 rounded-full bg-profit mr-1.5" />
                  LIVE
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Last updated: {lastUpdateRef.current.toLocaleTimeString('en-IN')} IST
              {isLive && <span className="ml-2 text-profit">(Auto-updating every 2s)</span>}
            </p>
          </CardContent>
        </Card>

        {/* Price Chart */}
        <StockChart 
          priceHistory={getFilteredHistory()}
          isPositive={isPositive}
          chartPeriod={chartPeriod}
          onPeriodChange={setChartPeriod}
        />

        {/* Performance Bars - Zerodha Style */}
        <PerformanceBars
          currentPrice={currentPrice}
          todaysLow={Math.min(...(livePriceHistory.length > 0 ? livePriceHistory.map(p => p.low) : [currentPrice * 0.98]))}
          todaysHigh={Math.max(...(livePriceHistory.length > 0 ? livePriceHistory.map(p => p.high) : [currentPrice * 1.02]))}
          low52Week={parseFloat(stock.low52Week)}
          high52Week={parseFloat(stock.high52Week)}
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">Market Cap</p>
              <p className="text-xl font-bold">{formatLargeNumber(stock.marketCap)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">P/E Ratio</p>
              <p className="text-xl font-bold">{stock.pe}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">EPS</p>
              <p className="text-xl font-bold">₹{stock.eps}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">Dividend Yield</p>
              <p className="text-xl font-bold">{stock.dividend}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">52W High</p>
              <p className="text-xl font-bold text-profit">₹{stock.high52Week}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">52W Low</p>
              <p className="text-xl font-bold text-loss">₹{stock.low52Week}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">Avg Volume</p>
              <p className="text-xl font-bold">{(stock.avgVolume / 1000000).toFixed(2)}M</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">Beta</p>
              <p className="text-xl font-bold">{stock.beta}</p>
            </CardContent>
          </Card>
        </div>

        {/* Investor Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Investor Activity
            </CardTitle>
            <CardDescription>
              Real-time buying and selling activity from investors
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(stock.investorActivity).map(([period, data]) => {
                const labels: Record<string, string> = {
                  last10Min: 'Last 10 Minutes',
                  last1Hour: 'Last 1 Hour',
                  last24Hours: 'Last 24 Hours',
                  last7Days: 'Last 7 Days',
                };
                const buyerPercent = (data.buyers / (data.buyers + data.sellers)) * 100;
                return (
                  <div key={period} className="p-4 rounded-lg border bg-card">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{labels[period]}</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-profit flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          Buyers
                        </span>
                        <span className="font-medium">{data.buyers.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-loss flex items-center gap-1">
                          <TrendingDown className="h-3 w-3" />
                          Sellers
                        </span>
                        <span className="font-medium">{data.sellers.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="h-2 rounded-full bg-loss overflow-hidden">
                        <div 
                          className="h-full bg-profit transition-all" 
                          style={{ width: `${buyerPercent}%` }}
                        />
                      </div>
                      <p className="text-xs text-center text-muted-foreground">
                        {buyerPercent > 50 ? 'Bullish' : 'Bearish'} ({buyerPercent.toFixed(1)}% buying)
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* AI Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Stock Analysis
            </CardTitle>
            <CardDescription>
              AI-powered insights and trading recommendations for {stock.symbol}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StockAnalysis symbol={stock.symbol} currentPrice={stock.price} />
          </CardContent>
        </Card>

        {/* Volume Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Trading Volume
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getFilteredHistory()}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  />
                  <YAxis 
                    tick={{ fontSize: 10 }}
                    tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    formatter={(value: number) => [`${(value / 1000000).toFixed(2)}M`, 'Volume']}
                  />
                  <Bar dataKey="volume" fill="hsl(var(--primary))" opacity={0.7} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <QuickTradeDialog
        open={tradeDialogOpen}
        onOpenChange={setTradeDialogOpen}
        symbol={stock.symbol}
        initialPrice={currentPrice}
      />
    </AppLayout>
  );
}
