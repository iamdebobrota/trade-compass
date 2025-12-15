import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TradingViewAlert {
  symbol: string;
  action: 'buy' | 'sell';
  price?: number;
  segment?: 'equity' | 'forex';
  quantity?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const secret = url.searchParams.get('secret');

    if (!secret) {
      console.error('Missing webhook secret');
      return new Response(
        JSON.stringify({ error: 'Missing webhook secret' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the alert data
    const alertData: TradingViewAlert = await req.json();
    console.log('Received alert:', JSON.stringify(alertData));

    // Validate required fields
    if (!alertData.symbol || !alertData.action) {
      console.error('Missing required fields');
      return new Response(
        JSON.stringify({ error: 'Missing required fields: symbol and action are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!['buy', 'sell'].includes(alertData.action)) {
      console.error('Invalid action:', alertData.action);
      return new Response(
        JSON.stringify({ error: 'Invalid action. Must be "buy" or "sell"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find user by webhook secret
    const { data: settings, error: settingsError } = await supabase
      .from('trading_settings')
      .select('*')
      .eq('webhook_secret', secret)
      .single();

    if (settingsError || !settings) {
      console.error('Invalid webhook secret or settings not found');
      return new Response(
        JSON.stringify({ error: 'Invalid webhook secret' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Found settings for user:', settings.user_id);

    // Calculate trade parameters
    const entryPrice = alertData.price || 100; // Default price if not provided
    const segment = alertData.segment || 'equity';
    const direction = alertData.action === 'buy' ? 'long' : 'short';
    
    // Calculate position size based on settings
    const positionValue = (Number(settings.current_balance) * Number(settings.default_position_size_percent)) / 100;
    const quantity = alertData.quantity || positionValue / entryPrice;
    
    // Calculate stop loss based on direction
    const stopLossPercent = Number(settings.stop_loss_percent) / 100;
    const initialSlPrice = direction === 'long' 
      ? entryPrice * (1 - stopLossPercent)
      : entryPrice * (1 + stopLossPercent);
    
    // Calculate target price
    const targetPercent = Number(settings.trailing_target_percent) / 100;
    const targetPrice = direction === 'long'
      ? entryPrice * (1 + targetPercent)
      : entryPrice * (1 - targetPercent);

    // Create the trade
    const { data: trade, error: tradeError } = await supabase
      .from('trades')
      .insert({
        user_id: settings.user_id,
        symbol: alertData.symbol.toUpperCase(),
        segment,
        direction,
        entry_price: entryPrice,
        current_price: entryPrice,
        quantity,
        initial_sl_price: initialSlPrice,
        current_sl_price: initialSlPrice,
        target_price: targetPrice,
        status: 'open',
        signal_source: 'tradingview',
      })
      .select()
      .single();

    if (tradeError) {
      console.error('Error creating trade:', tradeError);
      return new Response(
        JSON.stringify({ error: 'Failed to create trade', details: tradeError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Trade created successfully:', trade.id);

    // Create trade event log
    await supabase
      .from('trade_events')
      .insert({
        trade_id: trade.id,
        event_type: 'trade_opened',
        new_value: { 
          symbol: trade.symbol, 
          direction, 
          entry_price: entryPrice,
          stop_loss: initialSlPrice,
          target: targetPrice
        },
        description: `Trade opened via TradingView webhook: ${direction.toUpperCase()} ${trade.symbol} at $${entryPrice}`,
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        trade_id: trade.id,
        message: `Trade created: ${direction.toUpperCase()} ${trade.symbol} at $${entryPrice}`
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Webhook error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
