import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MarketIndex {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

const initialIndices: MarketIndex[] = [
  { symbol: 'NIFTY', name: 'NIFTY 50', price: 26134.35, change: 167.95, changePercent: 0.65 },
  { symbol: 'SENSEX', name: 'BSE SENSEX', price: 85419.43, change: 490.07, changePercent: 0.58 },
  { symbol: 'BANKNIFTY', name: 'NIFTY BANK', price: 59276.50, change: 207.30, changePercent: 0.35 },
  { symbol: 'MIDCPNIFTY', name: 'NIFTY MIDCAP', price: 13947.75, change: 85.40, changePercent: 0.62 },
  { symbol: 'FINNIFTY', name: 'NIFTY FIN', price: 27459.05, change: 124.55, changePercent: 0.46 },
];

export function MarketIndicesTicker() {
  const [indices, setIndices] = useState<MarketIndex[]>(initialIndices);

  // Simulate live price updates
  useEffect(() => {
    const interval = setInterval(() => {
      setIndices(prev => prev.map(index => {
        const fluctuation = (Math.random() - 0.5) * 0.002 * index.price;
        const newPrice = parseFloat((index.price + fluctuation).toFixed(2));
        const newChange = parseFloat((index.change + fluctuation).toFixed(2));
        const newChangePercent = parseFloat(((newChange / (index.price - index.change)) * 100).toFixed(2));
        
        return {
          ...index,
          price: newPrice,
          change: newChange,
          changePercent: newChangePercent,
        };
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num: number) => {
    return num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="w-full overflow-hidden bg-card/50 border-b">
      <div className="flex items-center gap-6 px-4 py-2 overflow-x-auto scrollbar-hide">
        {indices.map((index) => {
          const isPositive = index.change >= 0;
          return (
            <div 
              key={index.symbol}
              className="flex items-center gap-2 flex-shrink-0"
            >
              <span className="font-medium text-foreground text-sm">{index.symbol}</span>
              <span className="text-foreground font-semibold text-sm">
                {formatNumber(index.price)}
              </span>
              <div className={`flex items-center text-xs ${isPositive ? 'text-profit' : 'text-loss'}`}>
                {isPositive ? (
                  <TrendingUp className="h-3 w-3 mr-0.5" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-0.5" />
                )}
                <span>
                  {isPositive ? '+' : ''}{formatNumber(Math.abs(index.change))} ({isPositive ? '+' : ''}{index.changePercent.toFixed(2)}%)
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
