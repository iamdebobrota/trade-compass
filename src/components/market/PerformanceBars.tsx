import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

interface PerformanceBarsProps {
  currentPrice: number;
  todaysLow: number;
  todaysHigh: number;
  low52Week: number;
  high52Week: number;
}

export function PerformanceBars({
  currentPrice,
  todaysLow,
  todaysHigh,
  low52Week,
  high52Week,
}: PerformanceBarsProps) {
  // Calculate position percentage for today's range
  const todayRange = todaysHigh - todaysLow;
  const todayPosition = todayRange > 0 
    ? ((currentPrice - todaysLow) / todayRange) * 100 
    : 50;

  // Calculate position percentage for 52-week range
  const yearRange = high52Week - low52Week;
  const yearPosition = yearRange > 0 
    ? ((currentPrice - low52Week) / yearRange) * 100 
    : 50;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-4 w-4 text-primary" />
          Performance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Today's Range */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Today's Low</span>
            <span className="text-muted-foreground">Today's High</span>
          </div>
          <div className="relative">
            <div className="h-2 rounded-full bg-gradient-to-r from-loss via-amber-400 to-profit" />
            <div 
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
              style={{ left: `${Math.min(Math.max(todayPosition, 5), 95)}%` }}
            >
              <div className="flex flex-col items-center">
                <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[8px] border-l-transparent border-r-transparent border-b-foreground" />
              </div>
            </div>
          </div>
          <div className="flex justify-between text-sm font-medium">
            <span className="text-loss">{formatPrice(todaysLow)}</span>
            <span className="text-profit">{formatPrice(todaysHigh)}</span>
          </div>
        </div>

        {/* 52 Week Range */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">52W Low</span>
            <span className="text-muted-foreground">52W High</span>
          </div>
          <div className="relative">
            <div className="h-2 rounded-full bg-gradient-to-r from-loss via-amber-400 to-profit" />
            <div 
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
              style={{ left: `${Math.min(Math.max(yearPosition, 5), 95)}%` }}
            >
              <div className="flex flex-col items-center">
                <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[8px] border-l-transparent border-r-transparent border-b-foreground" />
              </div>
            </div>
          </div>
          <div className="flex justify-between text-sm font-medium">
            <span className="text-loss">{formatPrice(low52Week)}</span>
            <span className="text-profit">{formatPrice(high52Week)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
