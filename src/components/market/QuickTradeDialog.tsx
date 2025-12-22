import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTradingSettings } from '@/hooks/useTradingSettings';
import { toast } from '@/hooks/use-toast';
import { Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

interface QuickTradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  symbol: string;
  initialPrice: number;
}

export function QuickTradeDialog({ open, onOpenChange, symbol, initialPrice }: QuickTradeDialogProps) {
  const { user } = useAuth();
  const { data: settings } = useTradingSettings();
  const queryClient = useQueryClient();
  
  const [direction, setDirection] = useState<'long' | 'short'>('long');
  const [segment, setSegment] = useState<'equity' | 'forex'>('equity');
  const [entryPrice, setEntryPrice] = useState(initialPrice.toString());
  const [quantity, setQuantity] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate suggested quantity based on position size
  const calculateSuggestedQuantity = () => {
    if (!settings || !entryPrice) return 0;
    const positionValue = (settings.current_balance * settings.default_position_size_percent) / 100;
    const price = parseFloat(entryPrice);
    if (price <= 0) return 0;
    return Math.floor(positionValue / price);
  };

  const suggestedQty = calculateSuggestedQuantity();

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: 'Error', description: 'Please log in first', variant: 'destructive' });
      return;
    }

    const price = parseFloat(entryPrice);
    const qty = parseInt(quantity) || suggestedQty;

    if (price <= 0 || qty <= 0) {
      toast({ title: 'Error', description: 'Invalid price or quantity', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);

    try {
      const stopLossPercent = settings?.stop_loss_percent || 1.5;
      const targetPercent = settings?.trailing_target_percent || 9;

      const slPrice = direction === 'long' 
        ? price * (1 - stopLossPercent / 100)
        : price * (1 + stopLossPercent / 100);

      const targetPrice = direction === 'long'
        ? price * (1 + targetPercent / 100)
        : price * (1 - targetPercent / 100);

      const { error } = await supabase
        .from('trades')
        .insert({
          user_id: user.id,
          symbol: symbol.toUpperCase(),
          segment,
          direction,
          entry_price: price,
          quantity: qty,
          initial_sl_price: slPrice,
          current_sl_price: slPrice,
          target_price: targetPrice,
          current_price: price,
          status: 'open',
          signal_source: 'manual',
        });

      if (error) throw error;

      toast({ title: 'Trade Opened', description: `${direction.toUpperCase()} ${qty} ${symbol} @ $${price}` });
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      queryClient.invalidateQueries({ queryKey: ['trading-stats'] });
      onOpenChange(false);
      
      // Reset form
      setDirection('long');
      setQuantity('');
    } catch (error) {
      console.error('Error creating trade:', error);
      toast({ title: 'Error', description: 'Failed to create trade', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Trade {symbol || 'Stock'}
          </DialogTitle>
          <DialogDescription>
            Open a new position in your paper trading portfolio
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Direction Selection */}
          <div className="space-y-2">
            <Label>Direction</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={direction === 'long' ? 'default' : 'outline'}
                className={direction === 'long' ? 'bg-profit hover:bg-profit/90' : ''}
                onClick={() => setDirection('long')}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Long (Buy)
              </Button>
              <Button
                type="button"
                variant={direction === 'short' ? 'default' : 'outline'}
                className={direction === 'short' ? 'bg-loss hover:bg-loss/90' : ''}
                onClick={() => setDirection('short')}
              >
                <TrendingDown className="h-4 w-4 mr-2" />
                Short (Sell)
              </Button>
            </div>
          </div>

          {/* Segment */}
          <div className="space-y-2">
            <Label>Market Segment</Label>
            <Select value={segment} onValueChange={(v) => setSegment(v as 'equity' | 'forex')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="equity">Equity</SelectItem>
                <SelectItem value="forex">Forex</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Entry Price */}
          <div className="space-y-2">
            <Label htmlFor="entryPrice">Entry Price ($)</Label>
            <Input
              id="entryPrice"
              type="number"
              step="0.01"
              value={entryPrice}
              onChange={(e) => setEntryPrice(e.target.value)}
              placeholder="Enter price"
            />
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="quantity">
              Quantity 
              {suggestedQty > 0 && (
                <span className="text-muted-foreground font-normal ml-2">
                  (Suggested: {suggestedQty} based on {settings?.default_position_size_percent}% position size)
                </span>
              )}
            </Label>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder={suggestedQty > 0 ? suggestedQty.toString() : 'Enter quantity'}
            />
          </div>

          {/* Summary */}
          <div className="p-3 bg-muted rounded-lg space-y-1 text-sm">
            <p className="font-medium">Trade Summary:</p>
            <p>
              <span className="text-muted-foreground">Position Value:</span>{' '}
              ${((parseFloat(entryPrice) || 0) * (parseInt(quantity) || suggestedQty)).toLocaleString()}
            </p>
            <p>
              <span className="text-muted-foreground">Stop Loss:</span>{' '}
              {settings?.stop_loss_percent}% ({direction === 'long' ? 'below' : 'above'} entry)
            </p>
            <p>
              <span className="text-muted-foreground">Target:</span>{' '}
              {settings?.trailing_target_percent}% trailing
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className={direction === 'long' ? 'bg-profit hover:bg-profit/90' : 'bg-loss hover:bg-loss/90'}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {direction === 'long' ? 'Buy' : 'Sell'} {symbol}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
