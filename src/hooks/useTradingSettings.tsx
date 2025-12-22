import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TradingSettings } from '@/types/trading';
import { useAuth } from './useAuth';

// Define the safe settings type without sensitive fields
type SafeTradingSettings = Omit<TradingSettings, 'alpha_vantage_api_key' | 'webhook_secret'>;

export function useTradingSettings() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['trading-settings'],
    queryFn: async () => {
      // Only fetch non-sensitive columns
      const { data, error } = await supabase
        .from('trading_settings')
        .select('id, user_id, initial_capital, current_balance, stop_loss_percent, trailing_target_percent, trailing_activation_percent, default_position_size_percent, max_trades_per_day, created_at, updated_at')
        .maybeSingle();

      if (error) throw error;
      return data as SafeTradingSettings | null;
    },
    enabled: !!user,
  });
}

export function useCreateOrUpdateSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Partial<SafeTradingSettings>) => {
      if (!user) throw new Error('Not authenticated');

      // Check if settings exist
      const { data: existing } = await supabase
        .from('trading_settings')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('trading_settings')
          .update(settings)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('trading_settings')
          .insert({ ...settings, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trading-settings'] });
    },
  });
}
