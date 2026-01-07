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

    const { cooperation_scope, initiator_name, partner_name, existing_clauses } = await req.json();

    const systemPrompt = `You are an expert in international academic cooperation agreements and MOU (Memorandum of Understanding) drafting. 
Your task is to suggest professional, balanced, and legally sound clauses for university partnership agreements.
Always consider both parties' interests and follow international best practices for academic cooperation.`;

    const userPrompt = `Generate recommended MOU clauses for a partnership between "${initiator_name}" and "${partner_name}".

Cooperation Scope: ${cooperation_scope?.join(', ') || 'General academic cooperation'}

${existing_clauses?.length > 0 ? `Existing clauses to build upon:\n${existing_clauses.map((c: any) => `- ${c.title}: ${c.content}`).join('\n')}` : 'No existing clauses yet.'}

Please suggest 3-5 professional MOU clauses that cover the essential aspects of this partnership. Each clause should be specific, actionable, and balanced.`;

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
              name: 'suggest_mou_clauses',
              description: 'Return suggested MOU clauses for the partnership',
              parameters: {
                type: 'object',
                properties: {
                  clauses: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        title: { type: 'string', description: 'Short title for the clause' },
                        content: { type: 'string', description: 'Full text of the clause' },
                        category: { 
                          type: 'string', 
                          enum: ['governance', 'academic', 'financial', 'mobility', 'research', 'termination', 'general'],
                          description: 'Category of the clause'
                        },
                        priority: {
                          type: 'string',
                          enum: ['essential', 'recommended', 'optional'],
                          description: 'Priority level of including this clause'
                        }
                      },
                      required: ['title', 'content', 'category', 'priority'],
                      additionalProperties: false
                    }
                  }
                },
                required: ['clauses'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'suggest_mou_clauses' } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add funds.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract the tool call response
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const result = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fallback if no tool call
    return new Response(JSON.stringify({ clauses: [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in mou-suggest function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
