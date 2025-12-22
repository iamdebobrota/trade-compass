import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowUpRight,
  ArrowDownRight,
  ShoppingCart,
  ChevronRight,
} from 'lucide-react';

interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: string;
}

interface LiveStockCardProps {
  stock: Stock;
  showVolume?: boolean;
  onQuickBuy: (symbol: string, price: number) => void;
}

export function LiveStockCard({ stock, showVolume = false, onQuickBuy }: LiveStockCardProps) {
  const navigate = useNavigate();
  const [livePrice, setLivePrice] = useState(stock.price);
  const [priceFlash, setPriceFlash] = useState<'up' | 'down' | null>(null);

  // Live price simulation - updates every 3 seconds
  useEffect(() => {
    setLivePrice(stock.price);
    
    const interval = setInterval(() => {
      setLivePrice(prev => {
        // Simulate small price fluctuations (±0.3%)
        const fluctuation = (Math.random() - 0.5) * 0.006 * prev;
        const newPrice = parseFloat((prev + fluctuation).toFixed(2));
        
        // Flash effect on price change
        if (newPrice > prev) {
          setPriceFlash('up');
        } else if (newPrice < prev) {
          setPriceFlash('down');
        }
        
        setTimeout(() => setPriceFlash(null), 500);
        
        return newPrice;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [stock.price]);

  const handleViewDetails = () => {
    navigate(`/stock/${encodeURIComponent(stock.symbol)}`);
  };

  const priceChange = livePrice - stock.price + stock.change;
  const priceChangePercent = ((livePrice - stock.price) / stock.price * 100) + stock.changePercent;
  const isPositive = priceChange >= 0;

  return (
    <div 
      className="flex items-center justify-between p-4 rounded-lg bg-card border hover:bg-accent/50 transition-all cursor-pointer group"
      onClick={handleViewDetails}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-foreground">{stock.symbol.replace('.NS', '').replace('.BO', '')}</span>
          <span className="text-sm text-muted-foreground truncate max-w-[150px]">{stock.name}</span>
          <div className="h-1.5 w-1.5 rounded-full bg-profit animate-pulse" title="Live" />
        </div>
        {showVolume && stock.volume && (
          <span className="text-xs text-muted-foreground">Vol: {stock.volume}</span>
        )}
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p 
            className={`font-semibold transition-colors duration-300 ${
              priceFlash === 'up' ? 'text-profit' : 
              priceFlash === 'down' ? 'text-loss' : 
              'text-foreground'
            }`}
          >
            ₹{livePrice.toFixed(2)}
          </p>
          <div className={`flex items-center justify-end text-sm ${isPositive ? 'text-profit' : 'text-loss'}`}>
            {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            <span>{isPositive ? '+' : ''}{priceChangePercent.toFixed(2)}%</span>
          </div>
        </div>
        <Button 
          size="sm" 
          variant="outline"
          className="opacity-70 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onQuickBuy(stock.symbol, livePrice);
          }}
        >
          <ShoppingCart className="h-4 w-4" />
        </Button>
        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  );
}
