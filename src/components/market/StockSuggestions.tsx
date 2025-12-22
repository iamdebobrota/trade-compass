import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  ShoppingCart,
  AlertCircle,
  Sparkles,
  Target,
  Shield
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Suggestion {
  symbol: string;
  name: string;
  action: 'buy' | 'sell';
  currentPrice?: number;
  entryRange?: string;
  stopLoss?: number;
  target?: number;
  risk: 'low' | 'medium' | 'high';
  reasoning: string;
  technicalSignals?: string[];
}

interface SuggestionsData {
  marketOverview: string;
  suggestions: Suggestion[];
}

interface StockSuggestionsProps {
  onTrade: (symbol: string, price: number) => void;
}

export function StockSuggestions({ onTrade }: StockSuggestionsProps) {
  const [segment, setSegment] = useState<'equity' | 'forex'>('equity');

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['stock-suggestions', segment],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('stock-suggestions', {
        body: { segment }
      });
      
      if (error) {
        console.error('Suggestions error:', error);
        throw error;
      }
      
      return data as SuggestionsData;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1,
  });

  const handleRefresh = () => {
    refetch();
    toast({ title: 'Refreshing', description: 'Generating new AI suggestions...' });
  };

  const getRiskBadgeVariant = (risk: string) => {
    switch (risk) {
      case 'low': return 'default';
      case 'medium': return 'secondary';
      case 'high': return 'destructive';
      default: return 'outline';
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-4">Failed to load AI suggestions</p>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Tabs value={segment} onValueChange={(v) => setSegment(v as 'equity' | 'forex')}>
          <TabsList>
            <TabsTrigger value="equity">Stocks</TabsTrigger>
            <TabsTrigger value="forex">Forex</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleRefresh}
          disabled={isRefetching}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
          {isRefetching ? 'Analyzing...' : 'Get New Ideas'}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-20 w-full" />
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : (
        <>
          {/* Market Overview */}
          {data?.marketOverview && (
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
              <div className="flex items-start gap-2">
                <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Market Analysis</p>
                  <p className="text-sm text-muted-foreground mt-1">{data.marketOverview}</p>
                </div>
              </div>
            </div>
          )}

          {/* Suggestions List */}
          <div className="space-y-4">
            {data?.suggestions?.map((suggestion, index) => (
              <div 
                key={`${suggestion.symbol}-${index}`}
                className="p-4 rounded-lg border bg-card hover:bg-accent/30 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${suggestion.action === 'buy' ? 'bg-profit/10' : 'bg-loss/10'}`}>
                      {suggestion.action === 'buy' ? (
                        <TrendingUp className="h-5 w-5 text-profit" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-loss" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg">{suggestion.symbol}</span>
                        <Badge className={suggestion.action === 'buy' ? 'bg-profit' : 'bg-loss'}>
                          {suggestion.action.toUpperCase()}
                        </Badge>
                        <Badge variant={getRiskBadgeVariant(suggestion.risk)}>
                          <Shield className="h-3 w-3 mr-1" />
                          {suggestion.risk} risk
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{suggestion.name}</p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => onTrade(suggestion.symbol, suggestion.currentPrice || 0)}
                    className={suggestion.action === 'buy' ? 'bg-profit hover:bg-profit/90' : 'bg-loss hover:bg-loss/90'}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Trade
                  </Button>
                </div>

                <p className="text-sm mb-3">{suggestion.reasoning}</p>

                {/* Trade Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  {suggestion.currentPrice && (
                    <div className="p-2 bg-muted rounded">
                      <span className="text-muted-foreground block text-xs">Current Price</span>
                      <span className="font-medium">${suggestion.currentPrice}</span>
                    </div>
                  )}
                  {suggestion.entryRange && (
                    <div className="p-2 bg-muted rounded">
                      <span className="text-muted-foreground block text-xs">Entry Range</span>
                      <span className="font-medium">{suggestion.entryRange}</span>
                    </div>
                  )}
                  {suggestion.stopLoss && (
                    <div className="p-2 bg-muted rounded">
                      <span className="text-muted-foreground block text-xs">Stop Loss</span>
                      <span className="font-medium text-loss">${suggestion.stopLoss}</span>
                    </div>
                  )}
                  {suggestion.target && (
                    <div className="p-2 bg-muted rounded">
                      <span className="text-muted-foreground block text-xs">Target</span>
                      <span className="font-medium text-profit">${suggestion.target}</span>
                    </div>
                  )}
                </div>

                {/* Technical Signals */}
                {suggestion.technicalSignals && suggestion.technicalSignals.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {suggestion.technicalSignals.map((signal, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        <Target className="h-3 w-3 mr-1" />
                        {signal}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {(!data?.suggestions || data.suggestions.length === 0) && !isLoading && (
              <div className="text-center py-8 text-muted-foreground">
                <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No suggestions available</p>
                <Button onClick={handleRefresh} variant="link" className="mt-2">
                  Generate suggestions
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
