import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useTradingSettings, useCreateOrUpdateSettings } from '@/hooks/useTradingSettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Settings as SettingsIcon, Save, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function Settings() {
  const { data: settings, isLoading } = useTradingSettings();
  const updateSettings = useCreateOrUpdateSettings();

  const [formData, setFormData] = useState({
    initial_capital: 100000,
    stop_loss_percent: 1.5,
    trailing_target_percent: 9.0,
    trailing_activation_percent: 1.0,
    default_position_size_percent: 10.0,
    max_trades_per_day: 5,
    alpha_vantage_api_key: '',
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        initial_capital: Number(settings.initial_capital),
        stop_loss_percent: Number(settings.stop_loss_percent),
        trailing_target_percent: Number(settings.trailing_target_percent),
        trailing_activation_percent: Number(settings.trailing_activation_percent),
        default_position_size_percent: Number(settings.default_position_size_percent),
        max_trades_per_day: settings.max_trades_per_day || 5,
        alpha_vantage_api_key: settings.alpha_vantage_api_key || '',
      });
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSettings.mutateAsync({
        ...formData,
        current_balance: settings?.current_balance || formData.initial_capital,
      });
      toast({ title: 'Settings saved', description: 'Your trading settings have been updated' });
    } catch {
      toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <Skeleton className="h-96 w-full" />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Configure your trading parameters and risk management rules
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5 text-primary" />
                Paper Trading Capital
              </CardTitle>
              <CardDescription>
                Set your starting capital for paper trading
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="initial_capital">Initial Capital ($)</Label>
                  <Input
                    id="initial_capital"
                    type="number"
                    value={formData.initial_capital}
                    onChange={(e) => setFormData({ ...formData, initial_capital: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Current Balance</Label>
                  <Input
                    value={`$${(settings?.current_balance || formData.initial_capital).toLocaleString()}`}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Risk Management</CardTitle>
              <CardDescription>
                These rules are strictly enforced and cannot be overridden
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="stop_loss_percent">Stop Loss (%)</Label>
                  <Input
                    id="stop_loss_percent"
                    type="number"
                    step="0.1"
                    value={formData.stop_loss_percent}
                    onChange={(e) => setFormData({ ...formData, stop_loss_percent: parseFloat(e.target.value) })}
                  />
                  <p className="text-xs text-muted-foreground">Initial stop loss from entry price</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="trailing_target_percent">Trailing Target (%)</Label>
                  <Input
                    id="trailing_target_percent"
                    type="number"
                    step="0.1"
                    value={formData.trailing_target_percent}
                    onChange={(e) => setFormData({ ...formData, trailing_target_percent: parseFloat(e.target.value) })}
                  />
                  <p className="text-xs text-muted-foreground">Maximum trailing profit target</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="trailing_activation_percent">Trailing Activation (%)</Label>
                  <Input
                    id="trailing_activation_percent"
                    type="number"
                    step="0.1"
                    value={formData.trailing_activation_percent}
                    onChange={(e) => setFormData({ ...formData, trailing_activation_percent: parseFloat(e.target.value) })}
                  />
                  <p className="text-xs text-muted-foreground">Profit level to activate trailing stop</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="default_position_size_percent">Position Size (%)</Label>
                  <Input
                    id="default_position_size_percent"
                    type="number"
                    step="0.1"
                    value={formData.default_position_size_percent}
                    onChange={(e) => setFormData({ ...formData, default_position_size_percent: parseFloat(e.target.value) })}
                  />
                  <p className="text-xs text-muted-foreground">Default % of capital per trade</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Trading Limits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-w-sm">
                <Label htmlFor="max_trades_per_day">Max Trades Per Day</Label>
                <Input
                  id="max_trades_per_day"
                  type="number"
                  value={formData.max_trades_per_day}
                  onChange={(e) => setFormData({ ...formData, max_trades_per_day: parseInt(e.target.value) })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Market Data API</CardTitle>
              <CardDescription>
                Optional: Add an Alpha Vantage API key for real-time price updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-w-lg">
                <Label htmlFor="alpha_vantage_api_key">Alpha Vantage API Key</Label>
                <Input
                  id="alpha_vantage_api_key"
                  type="password"
                  placeholder="Enter your API key"
                  value={formData.alpha_vantage_api_key}
                  onChange={(e) => setFormData({ ...formData, alpha_vantage_api_key: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Get a free API key at{' '}
                  <a href="https://www.alphavantage.co/support/#api-key" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    alphavantage.co
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={updateSettings.isPending}>
              {updateSettings.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Settings
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
