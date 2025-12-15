import { AppLayout } from '@/components/layout/AppLayout';
import { useTradingSettings } from '@/hooks/useTradingSettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Copy, Check, Webhook, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

export default function WebhookSetup() {
  const { data: settings, isLoading } = useTradingSettings();
  const [copied, setCopied] = useState(false);

  const webhookUrl = settings?.webhook_secret 
    ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tradingview-webhook?secret=${settings.webhook_secret}`
    : '';

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopied(true);
      toast({ title: 'Copied!', description: 'Webhook URL copied to clipboard' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'Error', description: 'Failed to copy', variant: 'destructive' });
    }
  };

  const sampleAlert = `{
  "symbol": "AAPL",
  "action": "buy",
  "price": {{close}},
  "segment": "equity"
}`;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Webhook Setup</h1>
          <p className="text-muted-foreground mt-1">
            Configure TradingView alerts to send signals to TradePilot
          </p>
        </div>

        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : !settings ? (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-warning">
                <AlertCircle className="h-5 w-5" />
                <p>Please complete your settings setup first to get your webhook URL.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Webhook className="h-5 w-5 text-primary" />
                  Your Webhook URL
                </CardTitle>
                <CardDescription>
                  Use this URL in your TradingView alert webhook settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={webhookUrl}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button onClick={copyToClipboard} variant="outline">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Keep this URL secret! Anyone with this URL can send trades to your account.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>TradingView Alert Format</CardTitle>
                <CardDescription>
                  Use this JSON format in your TradingView alert message
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm font-mono">
                  {sampleAlert}
                </pre>
                <div className="space-y-3">
                  <h4 className="font-semibold">Available Fields:</h4>
                  <div className="grid gap-2 text-sm">
                    <div className="flex gap-3">
                      <code className="bg-muted px-2 py-1 rounded">symbol</code>
                      <span className="text-muted-foreground">Required. The trading symbol (e.g., AAPL, EUR/USD)</span>
                    </div>
                    <div className="flex gap-3">
                      <code className="bg-muted px-2 py-1 rounded">action</code>
                      <span className="text-muted-foreground">Required. Either "buy" or "sell"</span>
                    </div>
                    <div className="flex gap-3">
                      <code className="bg-muted px-2 py-1 rounded">price</code>
                      <span className="text-muted-foreground">Optional. Entry price (defaults to current price)</span>
                    </div>
                    <div className="flex gap-3">
                      <code className="bg-muted px-2 py-1 rounded">segment</code>
                      <span className="text-muted-foreground">Optional. Either "equity" or "forex" (defaults to equity)</span>
                    </div>
                    <div className="flex gap-3">
                      <code className="bg-muted px-2 py-1 rounded">quantity</code>
                      <span className="text-muted-foreground">Optional. Number of units (auto-calculated if not provided)</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Setup Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal list-inside space-y-3 text-sm">
                  <li>Open TradingView and create or edit an alert</li>
                  <li>In the "Notifications" section, enable "Webhook URL"</li>
                  <li>Paste your webhook URL from above</li>
                  <li>In the "Message" field, enter your JSON alert format</li>
                  <li>Use TradingView placeholders like <code className="bg-muted px-1 rounded">{"{{close}}"}</code> for dynamic values</li>
                  <li>Save your alert and start receiving trades!</li>
                </ol>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppLayout>
  );
}
