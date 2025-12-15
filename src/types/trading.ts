export type TradeStatus = 'open' | 'trailing' | 'closed_sl' | 'closed_target' | 'closed_manual';
export type TradeDirection = 'long' | 'short';
export type MarketSegment = 'equity' | 'forex';

export interface Trade {
  id: string;
  user_id: string;
  symbol: string;
  segment: MarketSegment;
  direction: TradeDirection;
  entry_price: number;
  current_price: number | null;
  quantity: number;
  initial_sl_price: number;
  current_sl_price: number;
  target_price: number | null;
  status: TradeStatus;
  pnl: number;
  pnl_percent: number;
  trailing_activated: boolean;
  exit_price: number | null;
  exit_reason: string | null;
  signal_source: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
}

export interface TradingSettings {
  id: string;
  user_id: string;
  initial_capital: number;
  current_balance: number;
  stop_loss_percent: number;
  trailing_target_percent: number;
  trailing_activation_percent: number;
  default_position_size_percent: number;
  max_trades_per_day: number;
  alpha_vantage_api_key: string | null;
  webhook_secret: string;
  created_at: string;
  updated_at: string;
}

export interface TradeEvent {
  id: string;
  trade_id: string;
  event_type: string;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  description: string | null;
  created_at: string;
}

export interface TradingStats {
  totalPnl: number;
  totalPnlPercent: number;
  winRate: number;
  totalTrades: number;
  openTrades: number;
  winningTrades: number;
  losingTrades: number;
  avgWin: number;
  avgLoss: number;
  maxDrawdown: number;
}

export interface TradingViewAlert {
  symbol: string;
  action: 'buy' | 'sell';
  price?: number;
  segment?: MarketSegment;
  quantity?: number;
}
