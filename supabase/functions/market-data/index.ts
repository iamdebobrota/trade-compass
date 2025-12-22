import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Indian stocks demo data (NSE symbols)
const demoStocks = {
  topGainers: [
    { symbol: 'TATAMOTORS.NS', name: 'Tata Motors Ltd', price: 892.50, change: 45.30, changePercent: 5.35, exchange: 'NSE' },
    { symbol: 'ADANIENT.NS', name: 'Adani Enterprises', price: 2845.75, change: 125.80, changePercent: 4.63, exchange: 'NSE' },
    { symbol: 'BAJFINANCE.NS', name: 'Bajaj Finance Ltd', price: 7245.20, change: 285.50, changePercent: 4.10, exchange: 'NSE' },
    { symbol: 'TATAPOWER.NS', name: 'Tata Power Company', price: 425.80, change: 15.20, changePercent: 3.70, exchange: 'NSE' },
    { symbol: 'ONGC.NS', name: 'Oil & Natural Gas Corp', price: 275.45, change: 8.90, changePercent: 3.34, exchange: 'NSE' },
  ],
  topLosers: [
    { symbol: 'INFY.NS', name: 'Infosys Ltd', price: 1485.30, change: -65.20, changePercent: -4.21, exchange: 'NSE' },
    { symbol: 'TCS.NS', name: 'Tata Consultancy Services', price: 3820.50, change: -142.30, changePercent: -3.59, exchange: 'NSE' },
    { symbol: 'WIPRO.NS', name: 'Wipro Ltd', price: 445.25, change: -15.80, changePercent: -3.43, exchange: 'NSE' },
    { symbol: 'HCLTECH.NS', name: 'HCL Technologies', price: 1625.40, change: -48.60, changePercent: -2.90, exchange: 'NSE' },
    { symbol: 'TECHM.NS', name: 'Tech Mahindra Ltd', price: 1345.75, change: -32.45, changePercent: -2.35, exchange: 'NSE' },
  ],
  mostActive: [
    { symbol: 'RELIANCE.NS', name: 'Reliance Industries', price: 2485.60, volume: '45.2M', change: 35.40, changePercent: 1.45, exchange: 'NSE' },
    { symbol: 'HDFCBANK.NS', name: 'HDFC Bank Ltd', price: 1685.25, volume: '38.5M', change: 22.80, changePercent: 1.37, exchange: 'NSE' },
    { symbol: 'ICICIBANK.NS', name: 'ICICI Bank Ltd', price: 1125.40, volume: '32.1M', change: -8.60, changePercent: -0.76, exchange: 'NSE' },
    { symbol: 'SBIN.NS', name: 'State Bank of India', price: 785.30, volume: '28.7M', change: 12.50, changePercent: 1.62, exchange: 'NSE' },
    { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel Ltd', price: 1545.80, volume: '25.3M', change: 28.40, changePercent: 1.87, exchange: 'NSE' },
  ],
  nifty50: [
    { symbol: 'RELIANCE.NS', name: 'Reliance Industries', price: 2485.60, change: 35.40, changePercent: 1.45, exchange: 'NSE' },
    { symbol: 'TCS.NS', name: 'Tata Consultancy Services', price: 3820.50, change: -142.30, changePercent: -3.59, exchange: 'NSE' },
    { symbol: 'HDFCBANK.NS', name: 'HDFC Bank Ltd', price: 1685.25, change: 22.80, changePercent: 1.37, exchange: 'NSE' },
    { symbol: 'INFY.NS', name: 'Infosys Ltd', price: 1485.30, change: -65.20, changePercent: -4.21, exchange: 'NSE' },
    { symbol: 'ICICIBANK.NS', name: 'ICICI Bank Ltd', price: 1125.40, change: -8.60, changePercent: -0.76, exchange: 'NSE' },
    { symbol: 'HINDUNILVR.NS', name: 'Hindustan Unilever', price: 2580.45, change: 18.90, changePercent: 0.74, exchange: 'NSE' },
    { symbol: 'ITC.NS', name: 'ITC Ltd', price: 485.20, change: 5.80, changePercent: 1.21, exchange: 'NSE' },
    { symbol: 'KOTAKBANK.NS', name: 'Kotak Mahindra Bank', price: 1845.60, change: -12.40, changePercent: -0.67, exchange: 'NSE' },
  ],
  indices: [
    { symbol: 'NIFTY50', name: 'Nifty 50', price: 24567.25, change: 125.40, changePercent: 0.51, exchange: 'NSE' },
    { symbol: 'SENSEX', name: 'BSE Sensex', price: 81234.50, change: 412.30, changePercent: 0.51, exchange: 'BSE' },
    { symbol: 'BANKNIFTY', name: 'Nifty Bank', price: 52345.80, change: -285.60, changePercent: -0.54, exchange: 'NSE' },
    { symbol: 'NIFTYIT', name: 'Nifty IT', price: 38452.15, change: -856.40, changePercent: -2.18, exchange: 'NSE' },
    { symbol: 'NIFTYPHARMA', name: 'Nifty Pharma', price: 21845.30, change: 145.80, changePercent: 0.67, exchange: 'NSE' },
  ],
};

// Generate mock price history for charts
function generatePriceHistory(basePrice: number, days: number = 30) {
  const history = [];
  let currentPrice = basePrice * 0.9;
  const now = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    const change = (Math.random() - 0.45) * (basePrice * 0.03);
    currentPrice = Math.max(currentPrice + change, basePrice * 0.7);
    
    history.push({
      date: date.toISOString().split('T')[0],
      open: currentPrice - Math.random() * 10,
      high: currentPrice + Math.random() * 15,
      low: currentPrice - Math.random() * 15,
      close: currentPrice,
      volume: Math.floor(Math.random() * 10000000) + 1000000,
    });
  }
  
  return history;
}

// Generate mock investor activity
function generateInvestorActivity() {
  return {
    last10Min: { buyers: Math.floor(Math.random() * 5000) + 1000, sellers: Math.floor(Math.random() * 4000) + 800 },
    last1Hour: { buyers: Math.floor(Math.random() * 25000) + 5000, sellers: Math.floor(Math.random() * 20000) + 4000 },
    last24Hours: { buyers: Math.floor(Math.random() * 150000) + 30000, sellers: Math.floor(Math.random() * 120000) + 25000 },
    last7Days: { buyers: Math.floor(Math.random() * 800000) + 150000, sellers: Math.floor(Math.random() * 700000) + 130000 },
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, symbol } = await req.json();
    const apiKey = Deno.env.get('ALPHA_VANTAGE_API_KEY');

    console.log('Market data request:', { action, symbol, hasApiKey: !!apiKey });

    if (action === 'getOverview') {
      console.log('Returning Indian market overview data');
      return new Response(
        JSON.stringify(demoStocks),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'getStockDetails' && symbol) {
      // Find stock in our data
      const allStocks = [
        ...demoStocks.topGainers,
        ...demoStocks.topLosers,
        ...demoStocks.mostActive,
        ...demoStocks.nifty50,
      ];
      
      const stock = allStocks.find(s => s.symbol === symbol) || {
        symbol,
        name: symbol.replace('.NS', '').replace('.BO', ''),
        price: 1000 + Math.random() * 2000,
        change: (Math.random() - 0.5) * 100,
        changePercent: (Math.random() - 0.5) * 10,
        exchange: 'NSE',
      };

      const basePrice = typeof stock.price === 'number' ? stock.price : 1000;
      
      const details = {
        ...stock,
        priceHistory: generatePriceHistory(basePrice),
        investorActivity: generateInvestorActivity(),
        marketCap: (basePrice * (Math.random() * 1000000000 + 100000000)).toFixed(0),
        pe: (Math.random() * 40 + 10).toFixed(2),
        eps: (basePrice / (Math.random() * 30 + 10)).toFixed(2),
        dividend: (Math.random() * 3).toFixed(2),
        high52Week: (basePrice * 1.3).toFixed(2),
        low52Week: (basePrice * 0.7).toFixed(2),
        avgVolume: Math.floor(Math.random() * 20000000) + 5000000,
        beta: (Math.random() * 1.5 + 0.5).toFixed(2),
      };

      console.log('Returning stock details for:', symbol);
      return new Response(
        JSON.stringify(details),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'search' && symbol) {
      // Search Indian stocks
      const searchTerm = symbol.toUpperCase();
      const allStocks = [
        ...demoStocks.topGainers,
        ...demoStocks.topLosers,
        ...demoStocks.mostActive,
        ...demoStocks.nifty50,
      ];
      
      const results = allStocks
        .filter(s => s.symbol.includes(searchTerm) || s.name.toUpperCase().includes(searchTerm))
        .map(s => ({
          symbol: s.symbol,
          name: s.name,
          type: 'Equity',
          region: 'India',
          exchange: s.exchange || 'NSE',
        }));

      // Add some popular stocks if no results
      if (results.length === 0) {
        results.push(
          { symbol: `${searchTerm}.NS`, name: `${searchTerm}`, type: 'Equity', region: 'India', exchange: 'NSE' },
        );
      }

      return new Response(
        JSON.stringify({ results: results.slice(0, 10) }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'getQuote' && symbol) {
      const allStocks = [
        ...demoStocks.topGainers,
        ...demoStocks.topLosers,
        ...demoStocks.mostActive,
        ...demoStocks.nifty50,
      ];
      
      const stock = allStocks.find(s => s.symbol === symbol);
      
      if (stock) {
        return new Response(
          JSON.stringify({
            symbol: stock.symbol,
            price: stock.price,
            change: stock.change,
            changePercent: stock.changePercent,
            high: stock.price * 1.02,
            low: stock.price * 0.98,
            volume: Math.floor(Math.random() * 10000000),
            previousClose: stock.price - stock.change,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Return mock quote for unknown symbols
      const mockPrice = 500 + Math.random() * 2000;
      return new Response(
        JSON.stringify({
          symbol,
          price: mockPrice,
          change: (Math.random() - 0.5) * 50,
          changePercent: (Math.random() - 0.5) * 5,
          high: mockPrice * 1.02,
          low: mockPrice * 0.98,
          volume: Math.floor(Math.random() * 10000000),
          previousClose: mockPrice * 0.99,
        }),
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
