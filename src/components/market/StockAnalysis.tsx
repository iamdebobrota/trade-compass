import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle,
  Target,
  Shield,
  Lightbulb,
  CheckCircle
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface AnalysisData {
  recommendation: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
  confidence: number;
  summary: string;
  technicalSignals: string[];
  fundamentalPoints: string[];
  riskFactors: string[];
  entryPrice?: number;
  targetPrice?: number;
  stopLoss?: number;
}

interface StockAnalysisProps {
  symbol: string;
  currentPrice: number;
}

export function StockAnalysis({ symbol, currentPrice }: StockAnalysisProps) {
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['stock-analysis', symbol],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('analyze-stock', {
        body: { symbol, currentPrice }
      });
      
      if (error) throw error;
      return data as AnalysisData;
    },
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    retry: 1,
  });

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'strong_buy': return 'bg-profit text-white';
      case 'buy': return 'bg-profit/80 text-white';
      case 'hold': return 'bg-yellow-500 text-white';
      case 'sell': return 'bg-loss/80 text-white';
      case 'strong_sell': return 'bg-loss text-white';
      default: return 'bg-muted';
    }
  };

  const getRecommendationLabel = (rec: string) => {
    return rec.replace('_', ' ').toUpperCase();
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <AlertCircle className="h-10 w-10 text-muted-foreground mb-3" />
        <p className="text-muted-foreground mb-3">Failed to load AI analysis</p>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <Button onClick={() => refetch()} variant="outline">
          <Lightbulb className="h-4 w-4 mr-2" />
          Generate Analysis
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Recommendation Header */}
      <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
        <div className="flex items-center gap-4">
          <Badge className={`text-lg px-4 py-2 ${getRecommendationColor(data.recommendation)}`}>
            {getRecommendationLabel(data.recommendation)}
          </Badge>
          <div>
            <p className="text-sm text-muted-foreground">Confidence Level</p>
            <p className="text-xl font-bold">{data.confidence}%</p>
          </div>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm" disabled={isRefetching}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary */}
      <div className="p-4 rounded-lg border bg-card">
        <p className="text-sm leading-relaxed">{data.summary}</p>
      </div>

      {/* Price Levels */}
      {(data.entryPrice || data.targetPrice || data.stopLoss) && (
        <div className="grid grid-cols-3 gap-4">
          {data.entryPrice && (
            <div className="p-3 rounded-lg border bg-card text-center">
              <p className="text-xs text-muted-foreground mb-1">Entry Price</p>
              <p className="text-lg font-bold">₹{data.entryPrice.toFixed(2)}</p>
            </div>
          )}
          {data.targetPrice && (
            <div className="p-3 rounded-lg border bg-card text-center">
              <p className="text-xs text-muted-foreground mb-1">Target Price</p>
              <p className="text-lg font-bold text-profit">₹{data.targetPrice.toFixed(2)}</p>
            </div>
          )}
          {data.stopLoss && (
            <div className="p-3 rounded-lg border bg-card text-center">
              <p className="text-xs text-muted-foreground mb-1">Stop Loss</p>
              <p className="text-lg font-bold text-loss">₹{data.stopLoss.toFixed(2)}</p>
            </div>
          )}
        </div>
      )}

      {/* Signals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Technical Signals */}
        <div className="p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-2 mb-3">
            <Target className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">Technical Signals</span>
          </div>
          <ul className="space-y-2">
            {data.technicalSignals?.map((signal, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-profit mt-0.5 flex-shrink-0" />
                <span>{signal}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Fundamental Points */}
        <div className="p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">Fundamental Points</span>
          </div>
          <ul className="space-y-2">
            {data.fundamentalPoints?.map((point, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Risk Factors */}
        <div className="p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="h-4 w-4 text-loss" />
            <span className="font-medium text-sm">Risk Factors</span>
          </div>
          <ul className="space-y-2">
            {data.riskFactors?.map((risk, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <AlertCircle className="h-4 w-4 text-loss mt-0.5 flex-shrink-0" />
                <span>{risk}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        AI analysis is for informational purposes only. Always do your own research before trading.
      </p>
    </div>
  );
}
