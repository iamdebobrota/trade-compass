import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { TradesTable } from '@/components/trades/TradesTable';
import { CloseTradeDialog } from '@/components/trades/CloseTradeDialog';
import { useActiveTrades } from '@/hooks/useTrades';
import { Trade } from '@/types/trading';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp } from 'lucide-react';

export default function ActiveTrades() {
  const { data: trades, isLoading } = useActiveTrades();
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);

  const equityTrades = trades?.filter(t => t.segment === 'equity') || [];
  const forexTrades = trades?.filter(t => t.segment === 'forex') || [];

  const handleCloseTrade = (trade: Trade) => {
    setSelectedTrade(trade);
    setCloseDialogOpen(true);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Active Trades</h1>
          <p className="text-muted-foreground mt-1">
            Monitor and manage your open positions
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Open Positions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList className="mb-4">
                <TabsTrigger value="all">All ({trades?.length || 0})</TabsTrigger>
                <TabsTrigger value="equity">Equity ({equityTrades.length})</TabsTrigger>
                <TabsTrigger value="forex">Forex ({forexTrades.length})</TabsTrigger>
              </TabsList>

              {isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <>
                  <TabsContent value="all">
                    <TradesTable trades={trades || []} onCloseTrade={handleCloseTrade} />
                  </TabsContent>
                  <TabsContent value="equity">
                    <TradesTable trades={equityTrades} onCloseTrade={handleCloseTrade} />
                  </TabsContent>
                  <TabsContent value="forex">
                    <TradesTable trades={forexTrades} onCloseTrade={handleCloseTrade} />
                  </TabsContent>
                </>
              )}
            </Tabs>
          </CardContent>
        </Card>

        <CloseTradeDialog
          trade={selectedTrade}
          open={closeDialogOpen}
          onOpenChange={setCloseDialogOpen}
        />
      </div>
    </AppLayout>
  );
}
