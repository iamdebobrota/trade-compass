import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Trade, MarketSegment, TradingStats } from '@/types/trading';
import { useEffect } from 'react';
import { useAuth } from './useAuth';

export function useTrades(segment?: MarketSegment) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const tradesQuery = useQuery({
    queryKey: ['trades', segment],
    queryFn: async () => {
      let query = supabase
        .from('trades')
        .select('*')
        .order('created_at', { ascending: false });

      if (segment) {
        query = query.eq('segment', segment);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Trade[];
    },
    enabled: !!user,
  });

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('trades-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trades',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['trades'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return tradesQuery;
}

export function useActiveTrades() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['trades', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .in('status', ['open', 'trailing'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Trade[];
    },
    enabled: !!user,
  });
}

export function useClosedTrades() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['trades', 'closed'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .in('status', ['closed_sl', 'closed_target', 'closed_manual'])
        .order('closed_at', { ascending: false });

      if (error) throw error;
      return data as Trade[];
    },
    enabled: !!user,
  });
}

export function useTradingStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['trading-stats'],
    queryFn: async (): Promise<TradingStats> => {
      const { data: trades, error } = await supabase
        .from('trades')
        .select('*');

      if (error) throw error;

      const allTrades = trades as Trade[];
      const closedTrades = allTrades.filter(t => 
        ['closed_sl', 'closed_target', 'closed_manual'].includes(t.status)
      );
      const openTrades = allTrades.filter(t => 
        ['open', 'trailing'].includes(t.status)
      );
      const winningTrades = closedTrades.filter(t => t.pnl > 0);
      const losingTrades = closedTrades.filter(t => t.pnl < 0);

      const totalPnl = closedTrades.reduce((sum, t) => sum + Number(t.pnl), 0);
      const avgWin = winningTrades.length > 0 
        ? winningTrades.reduce((sum, t) => sum + Number(t.pnl), 0) / winningTrades.length 
        : 0;
      const avgLoss = losingTrades.length > 0 
        ? Math.abs(losingTrades.reduce((sum, t) => sum + Number(t.pnl), 0) / losingTrades.length) 
        : 0;

      return {
        totalPnl,
        totalPnlPercent: closedTrades.length > 0 
          ? closedTrades.reduce((sum, t) => sum + Number(t.pnl_percent), 0) / closedTrades.length 
          : 0,
        winRate: closedTrades.length > 0 
          ? (winningTrades.length / closedTrades.length) * 100 
          : 0,
        totalTrades: allTrades.length,
        openTrades: openTrades.length,
        winningTrades: winningTrades.length,
        losingTrades: losingTrades.length,
        avgWin,
        avgLoss,
        maxDrawdown: 0, // TODO: Calculate properly
      };
    },
    enabled: !!user,
  });
}

export function useCloseTrade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tradeId, exitPrice, reason }: { tradeId: string; exitPrice: number; reason: string }) => {
      const { data: trade, error: fetchError } = await supabase
        .from('trades')
        .select('*')
        .eq('id', tradeId)
        .single();

      if (fetchError) throw fetchError;

      const pnl = trade.direction === 'long' 
        ? (exitPrice - Number(trade.entry_price)) * Number(trade.quantity)
        : (Number(trade.entry_price) - exitPrice) * Number(trade.quantity);
      
      const pnlPercent = trade.direction === 'long'
        ? ((exitPrice - Number(trade.entry_price)) / Number(trade.entry_price)) * 100
        : ((Number(trade.entry_price) - exitPrice) / Number(trade.entry_price)) * 100;

      const { error } = await supabase
        .from('trades')
        .update({
          status: 'closed_manual',
          exit_price: exitPrice,
          exit_reason: reason,
          pnl,
          pnl_percent: pnlPercent,
          closed_at: new Date().toISOString(),
        })
        .eq('id', tradeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      queryClient.invalidateQueries({ queryKey: ['trading-stats'] });
    },
  });
}
