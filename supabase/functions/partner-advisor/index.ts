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
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const { partners, university_name } = await req.json();

    const systemPrompt = `You are an expert strategic advisor for international academic partnerships. 
Analyze partnership data and provide actionable recommendations for each partner relationship.
Focus on maximizing ROI, improving collaboration outcomes, and identifying opportunities for growth.
Be specific and data-driven in your recommendations.`;

    const partnerSummary = partners.map((p: any) => 
      `- ${p.name} (${p.country}): ${p.projects_count} projects, ${p.mou_status || 'no MOU'}, satisfaction: ${p.satisfaction || 'N/A'}`
    ).join('\n');

    const userPrompt = `Analyze the partnership portfolio for "${university_name}" and provide strategic recommendations.

Current Partners:
${partnerSummary}

For each partner, provide:
1. A strategic action recommendation (expand, maintain, restructure, or pause)
2. Specific next steps to take
3. Priority level (high, medium, low)
4. Key opportunity or risk to address`;

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
              name: 'provide_partner_recommendations',
              description: 'Return strategic recommendations for each partner',
              parameters: {
                type: 'object',
                properties: {
                  recommendations: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        partner_name: { type: 'string' },
                        action: { 
                          type: 'string', 
                          enum: ['expand', 'maintain', 'restructure', 'pause'],
                        },
                        priority: {
                          type: 'string',
                          enum: ['high', 'medium', 'low'],
                        },
                        recommendation: { type: 'string', description: 'Specific recommendation' },
                        next_steps: { type: 'string', description: 'Concrete next steps to take' },
                        opportunity: { type: 'string', description: 'Key opportunity to leverage' },
                        risk: { type: 'string', description: 'Key risk to address' }
                      },
                      required: ['partner_name', 'action', 'priority', 'recommendation', 'next_steps'],
                      additionalProperties: false
                    }
                  },
                  overall_strategy: {
                    type: 'string',
                    description: 'Overall portfolio strategy summary'
                  }
                },
                required: ['recommendations', 'overall_strategy'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'provide_partner_recommendations' } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      const result = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ recommendations: [], overall_strategy: '' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in partner-advisor:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
