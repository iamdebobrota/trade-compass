import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Demo stock data for when API is not available or for testing
const demoStocks = {
  topGainers: [
    { symbol: 'NVDA', name: 'NVIDIA Corp', price: 875.25, change: 45.30, changePercent: 5.47 },
    { symbol: 'TSLA', name: 'Tesla Inc', price: 248.50, change: 12.80, changePercent: 5.43 },
    { symbol: 'AMD', name: 'AMD Inc', price: 142.30, change: 6.20, changePercent: 4.56 },
    { symbol: 'META', name: 'Meta Platforms', price: 505.25, change: 18.50, changePercent: 3.80 },
    { symbol: 'AAPL', name: 'Apple Inc', price: 198.75, change: 5.25, changePercent: 2.71 },
  ],
  topLosers: [
    { symbol: 'INTC', name: 'Intel Corp', price: 35.20, change: -2.80, changePercent: -7.37 },
    { symbol: 'BA', name: 'Boeing Co', price: 198.40, change: -12.60, changePercent: -5.97 },
    { symbol: 'DIS', name: 'Walt Disney', price: 95.30, change: -4.70, changePercent: -4.70 },
    { symbol: 'PYPL', name: 'PayPal Holdings', price: 62.80, change: -2.20, changePercent: -3.39 },
    { symbol: 'NFLX', name: 'Netflix Inc', price: 485.60, change: -15.40, changePercent: -3.07 },
  ],
  mostActive: [
    { symbol: 'AAPL', name: 'Apple Inc', price: 198.75, volume: '125.4M', change: 5.25, changePercent: 2.71 },
    { symbol: 'TSLA', name: 'Tesla Inc', price: 248.50, volume: '98.2M', change: 12.80, changePercent: 5.43 },
    { symbol: 'NVDA', name: 'NVIDIA Corp', price: 875.25, volume: '85.6M', change: 45.30, changePercent: 5.47 },
    { symbol: 'AMZN', name: 'Amazon.com', price: 178.25, volume: '72.3M', change: 3.50, changePercent: 2.00 },
    { symbol: 'MSFT', name: 'Microsoft', price: 375.80, volume: '65.1M', change: 8.20, changePercent: 2.23 },
  ],
  forexPairs: [
    { symbol: 'EUR/USD', name: 'Euro/US Dollar', price: 1.0892, change: 0.0023, changePercent: 0.21 },
    { symbol: 'GBP/USD', name: 'British Pound/US Dollar', price: 1.2715, change: -0.0045, changePercent: -0.35 },
    { symbol: 'USD/JPY', name: 'US Dollar/Japanese Yen', price: 149.25, change: 0.85, changePercent: 0.57 },
    { symbol: 'USD/INR', name: 'US Dollar/Indian Rupee', price: 83.12, change: 0.15, changePercent: 0.18 },
    { symbol: 'AUD/USD', name: 'Australian Dollar/US Dollar', price: 0.6542, change: -0.0012, changePercent: -0.18 },
  ],
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, symbol } = await req.json();
    const apiKey = Deno.env.get('ALPHA_VANTAGE_API_KEY');

    console.log('Market data request:', { action, symbol, hasApiKey: !!apiKey });

    if (action === 'getOverview') {
      // Return demo data for overview
      // In production, you'd fetch from multiple API calls
      console.log('Returning market overview data');
      return new Response(
        JSON.stringify(demoStocks),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'search' && symbol) {
      if (!apiKey) {
        // Return mock search results
        const mockResults = [
          { symbol: symbol.toUpperCase(), name: `${symbol.toUpperCase()} Inc`, type: 'Equity', region: 'United States' },
        ];
        return new Response(
          JSON.stringify({ results: mockResults }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Search for symbol using Alpha Vantage
      const searchUrl = `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${symbol}&apikey=${apiKey}`;
      const searchResponse = await fetch(searchUrl);
      const searchData = await searchResponse.json();

      console.log('Alpha Vantage search response:', searchData);

      const results = (searchData.bestMatches || []).map((match: any) => ({
        symbol: match['1. symbol'],
        name: match['2. name'],
        type: match['3. type'],
        region: match['4. region'],
      }));

      return new Response(
        JSON.stringify({ results }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'getQuote' && symbol) {
      if (!apiKey) {
        // Return mock quote
        const mockQuote = {
          symbol: symbol.toUpperCase(),
          price: (Math.random() * 500 + 50).toFixed(2),
          change: ((Math.random() - 0.5) * 20).toFixed(2),
          changePercent: ((Math.random() - 0.5) * 10).toFixed(2),
          high: (Math.random() * 500 + 60).toFixed(2),
          low: (Math.random() * 500 + 40).toFixed(2),
          volume: Math.floor(Math.random() * 50000000).toString(),
          previousClose: (Math.random() * 500 + 50).toFixed(2),
        };
        return new Response(
          JSON.stringify(mockQuote),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get quote from Alpha Vantage
      const quoteUrl = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;
      const quoteResponse = await fetch(quoteUrl);
      const quoteData = await quoteResponse.json();

      console.log('Alpha Vantage quote response:', quoteData);

      const quote = quoteData['Global Quote'];
      if (!quote || Object.keys(quote).length === 0) {
        return new Response(
          JSON.stringify({ error: 'Quote not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const result = {
        symbol: quote['01. symbol'],
        price: parseFloat(quote['05. price']),
        change: parseFloat(quote['09. change']),
        changePercent: parseFloat(quote['10. change percent']?.replace('%', '')),
        high: parseFloat(quote['03. high']),
        low: parseFloat(quote['04. low']),
        volume: quote['06. volume'],
        previousClose: parseFloat(quote['08. previous close']),
      };

      return new Response(
        JSON.stringify(result),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error in market-data:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
