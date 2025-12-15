import { AppLayout } from '@/components/layout/AppLayout';
import { TradesTable } from '@/components/trades/TradesTable';
import { useClosedTrades } from '@/hooks/useTrades';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { History } from 'lucide-react';

export default function TradeHistory() {
  const { data: trades, isLoading } = useClosedTrades();

  const equityTrades = trades?.filter(t => t.segment === 'equity') || [];
  const forexTrades = trades?.filter(t => t.segment === 'forex') || [];
  const winningTrades = trades?.filter(t => Number(t.pnl) > 0) || [];
  const losingTrades = trades?.filter(t => Number(t.pnl) < 0) || [];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Trade History</h1>
          <p className="text-muted-foreground mt-1">
            Review your completed trades and analyze performance
          </p>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total Trades</p>
              <p className="text-2xl font-bold">{trades?.length || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Winning</p>
              <p className="text-2xl font-bold text-profit">{winningTrades.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Losing</p>
              <p className="text-2xl font-bold text-loss">{losingTrades.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Win Rate</p>
              <p className="text-2xl font-bold">
                {trades && trades.length > 0
                  ? `${((winningTrades.length / trades.length) * 100).toFixed(1)}%`
                  : '0%'}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Completed Trades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList className="mb-4">
                <TabsTrigger value="all">All ({trades?.length || 0})</TabsTrigger>
                <TabsTrigger value="equity">Equity ({equityTrades.length})</TabsTrigger>
                <TabsTrigger value="forex">Forex ({forexTrades.length})</TabsTrigger>
                <TabsTrigger value="winners">Winners ({winningTrades.length})</TabsTrigger>
                <TabsTrigger value="losers">Losers ({losingTrades.length})</TabsTrigger>
              </TabsList>

              {isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <>
                  <TabsContent value="all">
                    <TradesTable trades={trades || []} showActions={false} />
                  </TabsContent>
                  <TabsContent value="equity">
                    <TradesTable trades={equityTrades} showActions={false} />
                  </TabsContent>
                  <TabsContent value="forex">
                    <TradesTable trades={forexTrades} showActions={false} />
                  </TabsContent>
                  <TabsContent value="winners">
                    <TradesTable trades={winningTrades} showActions={false} />
                  </TabsContent>
                  <TabsContent value="losers">
                    <TradesTable trades={losingTrades} showActions={false} />
                  </TabsContent>
                </>
              )}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
