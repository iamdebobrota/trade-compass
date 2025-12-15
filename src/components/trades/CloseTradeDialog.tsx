import { useState } from 'react';
import { Trade } from '@/types/trading';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCloseTrade } from '@/hooks/useTrades';
import { toast } from '@/hooks/use-toast';

interface CloseTradeDialogProps {
  trade: Trade | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CloseTradeDialog({ trade, open, onOpenChange }: CloseTradeDialogProps) {
  const [exitPrice, setExitPrice] = useState('');
  const [reason, setReason] = useState('');
  const closeTrade = useCloseTrade();

  const handleClose = async () => {
    if (!trade || !exitPrice) return;

    try {
      await closeTrade.mutateAsync({
        tradeId: trade.id,
        exitPrice: parseFloat(exitPrice),
        reason: reason || 'Manual close',
      });
      toast({
        title: 'Trade Closed',
        description: `${trade.symbol} has been closed at $${exitPrice}`,
      });
      onOpenChange(false);
      setExitPrice('');
      setReason('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to close trade',
        variant: 'destructive',
      });
    }
  };

  if (!trade) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Close Trade - {trade.symbol}</DialogTitle>
          <DialogDescription>
            Enter the exit price to close this trade manually.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="exitPrice">Exit Price</Label>
            <Input
              id="exitPrice"
              type="number"
              step="0.01"
              placeholder={trade.current_price?.toString() || trade.entry_price.toString()}
              value={exitPrice}
              onChange={(e) => setExitPrice(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason">Reason (optional)</Label>
            <Textarea
              id="reason"
              placeholder="Why are you closing this trade?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleClose} 
            disabled={!exitPrice || closeTrade.isPending}
          >
            {closeTrade.isPending ? 'Closing...' : 'Close Trade'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
