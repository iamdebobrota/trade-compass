import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Sparkles, 
  RefreshCw,
  ShoppingCart,
  Loader2,
  Globe
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { QuickTradeDialog } from '@/components/market/QuickTradeDialog';
import { StockSuggestions } from '@/components/market/StockSuggestions';
import { LiveStockCard } from '@/components/market/LiveStockCard';

interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: string;
}

interface SearchResult {
  symbol: string;
  name: string;
  type: string;
  region: string;
}

export default function MarketOverview() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedStock, setSelectedStock] = useState<{ symbol: string; price: number } | null>(null);
  const [tradeDialogOpen, setTradeDialogOpen] = useState(false);

  const handleQuickBuy = (symbol: string, price: number) => {
    setSelectedStock({ symbol, price });
    setTradeDialogOpen(true);
  };

  // Fetch market overview data
  const { data: marketData, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['market-overview'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('market-data', {
        body: { action: 'getOverview' }
      });
      if (error) throw error;
      return data as {
        topGainers: Stock[];
        topLosers: Stock[];
        mostActive: Stock[];
        forexPairs: Stock[];
      };
    },
    refetchInterval: 60000, // Refresh every minute
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('market-data', {
        body: { action: 'search', symbol: searchQuery }
      });
      if (error) throw error;
      setSearchResults(data.results || []);
      if (data.results?.length === 0) {
        toast({ title: 'No results', description: 'No stocks found matching your search' });
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({ title: 'Search failed', description: 'Unable to search stocks', variant: 'destructive' });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Market Overview</h1>
            <p className="text-muted-foreground mt-1">
              Live market data, search stocks, and get AI-powered suggestions
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Search Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              Search Stocks
            </CardTitle>
            <CardDescription>
              Find any stock or forex pair by symbol or name
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search by symbol (e.g., AAPL, TSLA, EUR/USD)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={isSearching}>
                {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Search Results:</p>
                {searchResults.map((result) => (
                  <div 
                    key={result.symbol}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted hover:bg-accent transition-colors cursor-pointer"
                    onClick={() => handleQuickBuy(result.symbol, 0)}
                  >
                    <div>
                      <span className="font-bold">{result.symbol}</span>
                      <span className="text-sm text-muted-foreground ml-2">{result.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{result.type}</Badge>
                      <Badge variant="secondary">{result.region}</Badge>
                      <Button size="sm">
                        <ShoppingCart className="h-4 w-4 mr-1" />
                        Trade
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Market Data Tabs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Live Market Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="gainers" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="gainers" className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  Top Gainers
                </TabsTrigger>
                <TabsTrigger value="losers" className="flex items-center gap-1">
                  <TrendingDown className="h-4 w-4" />
                  Top Losers
                </TabsTrigger>
                <TabsTrigger value="active" className="flex items-center gap-1">
                  <Activity className="h-4 w-4" />
                  Most Active
                </TabsTrigger>
                <TabsTrigger value="forex" className="flex items-center gap-1">
                  <Globe className="h-4 w-4" />
                  Forex
                </TabsTrigger>
              </TabsList>

              {isLoading ? (
                <div className="space-y-3 mt-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-lg" />
                  ))}
                </div>
              ) : (
                <>
                  <TabsContent value="gainers" className="space-y-2 mt-4">
                    {marketData?.topGainers?.map((stock) => (
                      <LiveStockCard key={stock.symbol} stock={stock} onQuickBuy={handleQuickBuy} />
                    ))}
                  </TabsContent>

                  <TabsContent value="losers" className="space-y-2 mt-4">
                    {marketData?.topLosers?.map((stock) => (
                      <LiveStockCard key={stock.symbol} stock={stock} onQuickBuy={handleQuickBuy} />
                    ))}
                  </TabsContent>

                  <TabsContent value="active" className="space-y-2 mt-4">
                    {marketData?.mostActive?.map((stock) => (
                      <LiveStockCard key={stock.symbol} stock={stock} showVolume onQuickBuy={handleQuickBuy} />
                    ))}
                  </TabsContent>

                  <TabsContent value="forex" className="space-y-2 mt-4">
                    {marketData?.forexPairs?.map((pair) => (
                      <LiveStockCard key={pair.symbol} stock={pair} onQuickBuy={handleQuickBuy} />
                    ))}
                  </TabsContent>
                </>
              )}
            </Tabs>
          </CardContent>
        </Card>

        {/* AI Suggestions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI-Powered Suggestions
            </CardTitle>
            <CardDescription>
              Get intelligent stock recommendations based on market analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StockSuggestions onTrade={handleQuickBuy} />
          </CardContent>
        </Card>
      </div>

      {/* Quick Trade Dialog */}
      <QuickTradeDialog
        open={tradeDialogOpen}
        onOpenChange={setTradeDialogOpen}
        symbol={selectedStock?.symbol || ''}
        initialPrice={selectedStock?.price || 0}
      />
    </AppLayout>
  );
}
