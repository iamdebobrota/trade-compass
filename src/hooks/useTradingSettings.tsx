import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TradingSettings } from '@/types/trading';
import { useAuth } from './useAuth';

export function useTradingSettings() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['trading-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trading_settings')
        .select('*')
        .maybeSingle();

      if (error) throw error;
      return data as TradingSettings | null;
    },
    enabled: !!user,
  });
}

export function useCreateOrUpdateSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Partial<TradingSettings>) => {
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
