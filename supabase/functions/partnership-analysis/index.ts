import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LANGUAGE_INSTRUCTIONS: Record<string, string> = {
  en: "Respond entirely in English.",
  tr: "Tüm yanıtlarını Türkçe olarak ver.",
  de: "Antworte vollständig auf Deutsch.",
  ar: "أجب بالكامل باللغة العربية.",
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const { university, partner, interactions, projects, mou_status, language } = await req.json();
    const lang = language || "en";
    const langInstruction = LANGUAGE_INSTRUCTIONS[lang] || LANGUAGE_INSTRUCTIONS.en;

    const systemPrompt = `You are an expert strategic advisor for international academic partnerships.
Analyze the partnership history, meetings, and current stage to provide:
1. An achievability assessment of stated goals
2. Resource requirements for upcoming activities
3. Strategic recommendations for next steps
4. Risk assessment and mitigation strategies

Be specific, data-driven, and actionable. Consider both universities' profiles.

${langInstruction}`;

    const interactionsSummary = interactions.map((i: any) =>
      `- ${i.meeting_date ? new Date(i.meeting_date).toLocaleDateString() : 'N/A'}: ${i.title} (${i.interaction_type}, ${i.status}) - Stage: ${i.stage}
        Notes: ${i.discussion_notes || 'N/A'}
        Outcomes: ${i.outcomes || 'N/A'}
        Goals: ${i.goals || 'N/A'}
        Waiting for: ${i.waiting_for || 'N/A'}`
    ).join('\n');

    const userPrompt = `Analyze this partnership between "${university.name}" (${university.country}) and "${partner.name}" (${partner.country}).

University Profile:
- Type: ${university.type}, Size: ${university.size}
- Internationalization: ${university.internationalization_maturity}
- Research strengths: ${university.research_strengths?.join(', ') || 'N/A'}
- Accreditations: ${university.accreditations?.join(', ') || 'N/A'}

Partner Profile:
- Type: ${partner.type}, Size: ${partner.size}
- Internationalization: ${partner.internationalization_maturity}
- Research strengths: ${partner.research_strengths?.join(', ') || 'N/A'}
- Accreditations: ${partner.accreditations?.join(', ') || 'N/A'}

MOU Status: ${mou_status || 'None'}
Active Projects: ${projects?.length || 0}

Interaction History:
${interactionsSummary || 'No interactions recorded yet.'}

Provide a comprehensive analysis.`;

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
              name: 'provide_partnership_analysis',
              description: 'Return comprehensive partnership analysis',
              parameters: {
                type: 'object',
                properties: {
                  achievability_score: { type: 'number', description: 'Score 0-100 of how achievable the partnership goals are' },
                  achievability_reasoning: { type: 'string', description: 'Detailed reasoning for the achievability score' },
                  strengths: { type: 'array', items: { type: 'string' }, description: 'Key strengths of this partnership' },
                  risks: { type: 'array', items: { type: 'string' }, description: 'Key risks to watch for' },
                  recommended_next_steps: { type: 'array', items: { type: 'string' }, description: 'Specific actionable next steps' },
                  resources_needed: {
                    type: 'object',
                    properties: {
                      personnel: { type: 'array', items: { type: 'string' } },
                      budget_items: { type: 'array', items: { type: 'string' } },
                      infrastructure: { type: 'array', items: { type: 'string' } },
                      timeline: { type: 'string' }
                    },
                    required: ['personnel', 'budget_items', 'infrastructure', 'timeline'],
                    additionalProperties: false
                  },
                  meeting_suggestions: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        title: { type: 'string' },
                        format: { type: 'string', enum: ['online', 'in_person', 'hybrid'] },
                        purpose: { type: 'string' },
                        suggested_attendees: { type: 'string' },
                        priority: { type: 'string', enum: ['high', 'medium', 'low'] }
                      },
                      required: ['title', 'format', 'purpose', 'suggested_attendees', 'priority'],
                      additionalProperties: false
                    }
                  },
                  overall_assessment: { type: 'string' }
                },
                required: ['achievability_score', 'achievability_reasoning', 'strengths', 'risks', 'recommended_next_steps', 'resources_needed', 'meeting_suggestions', 'overall_assessment'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'provide_partnership_analysis' } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (response.status === 402) return new Response(JSON.stringify({ error: 'AI credits exhausted' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const result = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'No analysis generated' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error: unknown) {
    console.error('Error in partnership-analysis:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
