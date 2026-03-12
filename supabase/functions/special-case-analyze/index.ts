import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { studentName, studentId, department, country, educationSystem, degreeLevel, situation, language } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are an expert university admissions officer specializing in international student documentation, credential recognition (Denklik), and special cases for Turkish universities. You understand YÖK regulations, MEB Denklik processes, Hague Convention apostille requirements, and country-specific authentication chains.

Given a student's details and their situation description, you must:
1. Classify the case category (credential_recognition, academic_failure, war_zone, visa_issue, or other)
2. Determine the case status (open, in_progress, pending_documents, escalated)
3. Write a clear summary of the issue
4. Write detailed case analysis
5. Generate a step-by-step progress timeline with realistic steps needed to resolve the case

${language === 'tr' ? 'Respond in Turkish.' : 'Respond in English.'}`;

    const userPrompt = `Student Details:
- Name: ${studentName}
- Student ID: ${studentId}
- Department: ${department}
- Country of Origin: ${country}
- Education System: ${educationSystem || 'Not specified'}
- Degree Level: ${degreeLevel || 'Not specified'}

Situation Description:
${situation}

Analyze this case and provide a comprehensive assessment.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_special_case",
              description: "Generate a complete special case analysis with timeline steps for a student documentation issue.",
              parameters: {
                type: "object",
                properties: {
                  category: {
                    type: "string",
                    enum: ["credential_recognition", "academic_failure", "war_zone", "visa_issue", "other"],
                    description: "The category of the special case"
                  },
                  status: {
                    type: "string",
                    enum: ["open", "in_progress", "pending_documents", "escalated"],
                    description: "The initial status of the case"
                  },
                  summary: {
                    type: "string",
                    description: "A concise 1-2 sentence summary of the issue"
                  },
                  details: {
                    type: "string",
                    description: "Detailed analysis of the case, including relevant regulations, challenges, and context"
                  },
                  steps: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string", description: "Step title" },
                        description: { type: "string", description: "What needs to be done in this step" },
                        status: { type: "string", enum: ["pending", "in_progress", "completed", "blocked"], description: "Initial status of this step" },
                        estimatedDuration: { type: "string", description: "Estimated time for this step (e.g. '1-2 weeks')" },
                        notes: { type: "string", description: "Any important notes or tips for this step" }
                      },
                      required: ["title", "description", "status"],
                      additionalProperties: false
                    },
                    description: "Ordered list of steps to resolve this case"
                  },
                  riskLevel: {
                    type: "string",
                    enum: ["low", "medium", "high"],
                    description: "Risk level of the case not being resolved"
                  },
                  estimatedResolutionTime: {
                    type: "string",
                    description: "Overall estimated time to resolve (e.g. '2-3 months')"
                  },
                  recommendations: {
                    type: "array",
                    items: { type: "string" },
                    description: "Key recommendations for handling this case"
                  }
                },
                required: ["category", "status", "summary", "details", "steps", "riskLevel", "estimatedResolutionTime", "recommendations"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generate_special_case" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error("No tool call response from AI");
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Special case analysis error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
