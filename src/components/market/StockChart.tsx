import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, CandlestickChart } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  ComposedChart,
  Bar,
  Cell,
  ReferenceLine,
} from 'recharts';

interface PriceHistory {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface StockChartProps {
  priceHistory: PriceHistory[];
  isPositive: boolean;
  chartPeriod: '1D' | '1W' | '1M' | '3M' | '1Y';
  onPeriodChange: (period: '1D' | '1W' | '1M' | '3M' | '1Y') => void;
}

type ChartType = 'line' | 'candle';

export function StockChart({ priceHistory, isPositive, chartPeriod, onPeriodChange }: StockChartProps) {
  const [chartType, setChartType] = useState<ChartType>('line');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Prepare candlestick data
  const candleData = priceHistory.map((item, index) => ({
    ...item,
    index,
    // For candlestick visual representation
    candleHeight: Math.abs(item.close - item.open),
    candleBase: Math.min(item.open, item.close),
    wickTop: item.high - Math.max(item.open, item.close),
    wickBottom: Math.min(item.open, item.close) - item.low,
    isGreen: item.close >= item.open,
  }));

  const CustomCandlestick = ({ x, y, width, height, payload }: any) => {
    if (!payload) return null;
    
    const isGreen = payload.close >= payload.open;
    const color = isGreen ? 'hsl(var(--profit))' : 'hsl(var(--loss))';
    const candleWidth = Math.max(width * 0.6, 4);
    const wickWidth = 1;
    
    // Calculate positions
    const centerX = x + width / 2;
    const yScale = height / (payload.high - payload.low || 1);
    
    const openY = y + (payload.high - payload.open) * yScale;
    const closeY = y + (payload.high - payload.close) * yScale;
    const highY = y;
    const lowY = y + height;
    
    const bodyTop = Math.min(openY, closeY);
    const bodyHeight = Math.abs(closeY - openY) || 1;

    return (
      <g>
        {/* Wick (high to low) */}
        <line
          x1={centerX}
          y1={highY}
          x2={centerX}
          y2={lowY}
          stroke={color}
          strokeWidth={wickWidth}
        />
        {/* Body */}
        <rect
          x={centerX - candleWidth / 2}
          y={bodyTop}
          width={candleWidth}
          height={bodyHeight}
          fill={isGreen ? color : color}
          stroke={color}
          strokeWidth={1}
        />
      </g>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Price Chart
          </CardTitle>
          <div className="flex items-center gap-2">
            {/* Chart Type Toggle */}
            <div className="flex border rounded-lg overflow-hidden">
              <Button
                variant={chartType === 'line' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-none h-8 px-3"
                onClick={() => setChartType('line')}
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
              <Button
                variant={chartType === 'candle' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-none h-8 px-3"
                onClick={() => setChartType('candle')}
              >
                <CandlestickChart className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Period Selector */}
            <div className="flex gap-1">
              {(['1D', '1W', '1M', '3M', '1Y'] as const).map((period) => (
                <Button
                  key={period}
                  variant={chartPeriod === period ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 px-3"
                  onClick={() => onPeriodChange(period)}
                >
                  {period}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'line' ? (
              <AreaChart data={priceHistory}>
                <defs>
                  <linearGradient id="colorPriceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isPositive ? 'hsl(var(--profit))' : 'hsl(var(--loss))'} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={isPositive ? 'hsl(var(--profit))' : 'hsl(var(--loss))'} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return chartPeriod === '1D' 
                      ? date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) 
                      : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
                  }}
                />
                <YAxis 
                  domain={['auto', 'auto']}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `₹${value.toFixed(0)}`}
                  width={60}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Price']}
                  labelFormatter={(label) => new Date(label).toLocaleDateString('en-IN', { 
                    weekday: 'short', 
                    day: 'numeric', 
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                />
                <Area 
                  type="monotone" 
                  dataKey="close" 
                  stroke={isPositive ? 'hsl(var(--profit))' : 'hsl(var(--loss))'} 
                  strokeWidth={2}
                  fill="url(#colorPriceGradient)"
                  dot={false}
                  activeDot={{ 
                    r: 6, 
                    fill: isPositive ? 'hsl(var(--profit))' : 'hsl(var(--loss))',
                    stroke: 'hsl(var(--background))',
                    strokeWidth: 2
                  }}
                />
              </AreaChart>
            ) : (
              <ComposedChart data={candleData}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return chartPeriod === '1D' 
                      ? date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) 
                      : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
                  }}
                />
                <YAxis 
                  domain={['auto', 'auto']}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `₹${value.toFixed(0)}`}
                  width={60}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="p-3 space-y-1">
                          <p className="text-sm font-medium">
                            {new Date(data.date).toLocaleDateString('en-IN', { 
                              day: 'numeric', 
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                            <span className="text-muted-foreground">Open:</span>
                            <span className="font-medium">{formatCurrency(data.open)}</span>
                            <span className="text-muted-foreground">High:</span>
                            <span className="font-medium text-profit">{formatCurrency(data.high)}</span>
                            <span className="text-muted-foreground">Low:</span>
                            <span className="font-medium text-loss">{formatCurrency(data.low)}</span>
                            <span className="text-muted-foreground">Close:</span>
                            <span className="font-medium">{formatCurrency(data.close)}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="high" 
                  shape={<CustomCandlestick />}
                />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
