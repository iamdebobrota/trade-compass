
-- Create enum for trade status
CREATE TYPE trade_status AS ENUM ('open', 'trailing', 'closed_sl', 'closed_target', 'closed_manual');

-- Create enum for trade direction
CREATE TYPE trade_direction AS ENUM ('long', 'short');

-- Create enum for market segment
CREATE TYPE market_segment AS ENUM ('equity', 'forex');

-- Trades table - core of the trading system
CREATE TABLE public.trades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  segment market_segment NOT NULL DEFAULT 'equity',
  direction trade_direction NOT NULL DEFAULT 'long',
  entry_price DECIMAL(18, 8) NOT NULL,
  current_price DECIMAL(18, 8),
  quantity DECIMAL(18, 8) NOT NULL,
  initial_sl_price DECIMAL(18, 8) NOT NULL,
  current_sl_price DECIMAL(18, 8) NOT NULL,
  target_price DECIMAL(18, 8),
  status trade_status NOT NULL DEFAULT 'open',
  pnl DECIMAL(18, 8) DEFAULT 0,
  pnl_percent DECIMAL(8, 4) DEFAULT 0,
  trailing_activated BOOLEAN DEFAULT FALSE,
  exit_price DECIMAL(18, 8),
  exit_reason TEXT,
  signal_source TEXT DEFAULT 'webhook',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  closed_at TIMESTAMP WITH TIME ZONE
);

-- Trading settings table
CREATE TABLE public.trading_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  initial_capital DECIMAL(18, 2) NOT NULL DEFAULT 100000,
  current_balance DECIMAL(18, 2) NOT NULL DEFAULT 100000,
  stop_loss_percent DECIMAL(5, 2) NOT NULL DEFAULT 1.5,
  trailing_target_percent DECIMAL(5, 2) NOT NULL DEFAULT 9.0,
  trailing_activation_percent DECIMAL(5, 2) NOT NULL DEFAULT 1.0,
  default_position_size_percent DECIMAL(5, 2) NOT NULL DEFAULT 10.0,
  max_trades_per_day INTEGER DEFAULT 5,
  alpha_vantage_api_key TEXT,
  webhook_secret TEXT DEFAULT gen_random_uuid()::text,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Trade history/audit log
CREATE TABLE public.trade_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trade_id UUID NOT NULL REFERENCES public.trades(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  old_value JSONB,
  new_value JSONB,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for trades
CREATE POLICY "Users can view their own trades" 
ON public.trades FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own trades" 
ON public.trades FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trades" 
ON public.trades FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trades" 
ON public.trades FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for trading_settings
CREATE POLICY "Users can view their own settings" 
ON public.trading_settings FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own settings" 
ON public.trading_settings FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" 
ON public.trading_settings FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS Policies for trade_events
CREATE POLICY "Users can view their own trade events" 
ON public.trade_events FOR SELECT 
USING (trade_id IN (SELECT id FROM public.trades WHERE user_id = auth.uid()));

CREATE POLICY "Users can create trade events for their trades" 
ON public.trade_events FOR INSERT 
WITH CHECK (trade_id IN (SELECT id FROM public.trades WHERE user_id = auth.uid()));

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_trades_updated_at
BEFORE UPDATE ON public.trades
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trading_settings_updated_at
BEFORE UPDATE ON public.trading_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for trades table
ALTER PUBLICATION supabase_realtime ADD TABLE public.trades;
