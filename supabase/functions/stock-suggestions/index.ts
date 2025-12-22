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
    const { segment = 'equity' } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generating stock suggestions for segment:', segment);

    const systemPrompt = `You are an expert stock market analyst and trading advisor. Your job is to provide actionable stock suggestions based on current market conditions, technical analysis, and fundamental research.

Always provide specific, researched recommendations with clear reasoning. Include:
- Stock symbol and company name
- Current market conditions affecting the stock
- Technical indicators (support/resistance levels, moving averages)
- Risk assessment (low/medium/high)
- Suggested entry price range
- Stop loss suggestion
- Target price

Be specific and actionable. Format your response as JSON.`;

    const userPrompt = segment === 'forex' 
      ? `Suggest 3-5 forex currency pairs that are currently showing strong trading opportunities. Consider technical patterns, economic news, and central bank policies. Provide analysis for day trading and swing trading opportunities.`
      : `Suggest 3-5 stocks that are currently showing strong buy signals. Consider both growth stocks and value plays. Focus on US market stocks with good liquidity and clear technical setups. Include a mix of large-cap and mid-cap opportunities.`;

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
              name: 'suggest_stocks',
              description: 'Return stock or forex suggestions with analysis',
              parameters: {
                type: 'object',
                properties: {
                  marketOverview: {
                    type: 'string',
                    description: 'Brief overview of current market conditions'
                  },
                  suggestions: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        symbol: { type: 'string' },
                        name: { type: 'string' },
                        action: { type: 'string', enum: ['buy', 'sell'] },
                        currentPrice: { type: 'number' },
                        entryRange: { type: 'string' },
                        stopLoss: { type: 'number' },
                        target: { type: 'number' },
                        risk: { type: 'string', enum: ['low', 'medium', 'high'] },
                        reasoning: { type: 'string' },
                        technicalSignals: {
                          type: 'array',
                          items: { type: 'string' }
                        }
                      },
                      required: ['symbol', 'name', 'action', 'reasoning', 'risk']
                    }
                  }
                },
                required: ['marketOverview', 'suggestions']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'suggest_stocks' } }
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
    console.log('AI response received');

    // Extract the tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const suggestions = JSON.parse(toolCall.function.arguments);
      return new Response(
        JSON.stringify(suggestions),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fallback to message content if no tool call
    const content = data.choices?.[0]?.message?.content;
    return new Response(
      JSON.stringify({ marketOverview: content, suggestions: [] }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in stock-suggestions:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
