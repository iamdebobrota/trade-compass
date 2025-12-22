import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol, currentPrice } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Analyzing stock:', symbol, 'at price:', currentPrice);

    const systemPrompt = `You are an expert Indian stock market analyst with deep knowledge of NSE and BSE listed companies. 
Your job is to analyze stocks and provide clear, actionable trading recommendations.

Consider:
- Technical analysis (moving averages, RSI, MACD, support/resistance)
- Fundamental analysis (P/E, EPS, market cap, sector trends)
- Recent news and market sentiment
- Risk factors and volatility

Provide specific, actionable advice for Indian retail investors.`;

    const userPrompt = `Analyze the Indian stock ${symbol} currently trading at ₹${currentPrice}.

Provide a comprehensive analysis including:
1. Clear buy/sell/hold recommendation with confidence level
2. Summary of your analysis (2-3 sentences)
3. Key technical signals (3-4 points)
4. Fundamental strengths or concerns (3-4 points)
5. Risk factors to consider (2-3 points)
6. Suggested entry price, target price, and stop loss levels`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'provide_stock_analysis',
              description: 'Provide comprehensive stock analysis with recommendation',
              parameters: {
                type: 'object',
                properties: {
                  recommendation: {
                    type: 'string',
                    enum: ['strong_buy', 'buy', 'hold', 'sell', 'strong_sell'],
                    description: 'Trading recommendation'
                  },
                  confidence: {
                    type: 'number',
                    description: 'Confidence level 0-100'
                  },
                  summary: {
                    type: 'string',
                    description: 'Brief 2-3 sentence summary of analysis'
                  },
                  technicalSignals: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'List of key technical signals'
                  },
                  fundamentalPoints: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'List of fundamental analysis points'
                  },
                  riskFactors: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'List of risk factors'
                  },
                  entryPrice: {
                    type: 'number',
                    description: 'Suggested entry price in INR'
                  },
                  targetPrice: {
                    type: 'number',
                    description: 'Target price in INR'
                  },
                  stopLoss: {
                    type: 'number',
                    description: 'Stop loss price in INR'
                  }
                },
                required: ['recommendation', 'confidence', 'summary', 'technicalSignals', 'fundamentalPoints', 'riskFactors']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'provide_stock_analysis' } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'AI service error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('AI analysis received for:', symbol);

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const analysis = JSON.parse(toolCall.function.arguments);
      return new Response(
        JSON.stringify(analysis),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fallback response
    return new Response(
      JSON.stringify({
        recommendation: 'hold',
        confidence: 50,
        summary: 'Unable to generate detailed analysis. Please try again.',
        technicalSignals: ['Analysis pending'],
        fundamentalPoints: ['Analysis pending'],
        riskFactors: ['Market volatility'],
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in analyze-stock:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
