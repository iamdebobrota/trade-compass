import { AppLayout } from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HoldingsSection } from '@/components/holdings/HoldingsSection';
import { OrdersSection } from '@/components/holdings/OrdersSection';
import { MarketIndicesTicker } from '@/components/market/MarketIndicesTicker';
import { BarChart3, Clock } from 'lucide-react';

export default function Holdings() {
  return (
    <AppLayout>
      {/* Market Indices Ticker */}
      <div className="-mx-6 -mt-6 mb-6">
        <MarketIndicesTicker />
      </div>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Portfolio</h1>
          <p className="text-muted-foreground mt-1">
            Manage your holdings and orders
          </p>
        </div>

        <Tabs defaultValue="holdings" className="w-full">
          <TabsList>
            <TabsTrigger value="holdings" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Holdings
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Orders
            </TabsTrigger>
          </TabsList>

          <TabsContent value="holdings" className="mt-4">
            <HoldingsSection />
          </TabsContent>

          <TabsContent value="orders" className="mt-4">
            <OrdersSection />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
