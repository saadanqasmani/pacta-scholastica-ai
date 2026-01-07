import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { university_id } = await req.json();

    if (!university_id) {
      return new Response(
        JSON.stringify({ error: "university_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch university data
    const { data: university } = await supabase
      .from("universities")
      .select("*")
      .eq("id", university_id)
      .single();

    // Fetch mobility data for market analysis
    const { data: mobilityData } = await supabase
      .from("mobility_records")
      .select("*")
      .eq("university_id", university_id);

    // Fetch partner data
    const { data: partnerships } = await supabase
      .from("university_partners")
      .select("*, partner:partner_university_id(name, country)")
      .eq("university_id", university_id);

    // Build context for AI
    const universityContext = `
University: ${university?.name || "Unknown"}
Country: ${university?.country || "Unknown"}
Total Mobility Records: ${mobilityData?.length || 0}
Active Partnerships: ${partnerships?.length || 0}

Mobility by Direction:
- Outgoing: ${mobilityData?.filter(m => m.direction === 'outgoing').length || 0}
- Incoming: ${mobilityData?.filter(m => m.direction === 'incoming').length || 0}

Partner Countries: ${[...new Set(partnerships?.map(p => p.partner?.country).filter(Boolean))].join(", ") || "None"}
    `.trim();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert in international higher education recruitment and market intelligence. Analyze recruitment markets and provide actionable recommendations.

You must respond with a valid JSON object (no markdown, no code blocks) with this exact structure:
{
  "markets": [
    {
      "country": "string",
      "applications": number,
      "offers": number,
      "enrollments": number,
      "capacity": number,
      "agentDriven": number,
      "organic": number,
      "conversionRate": number,
      "offerAcceptanceRate": number,
      "overOfferingRatio": number,
      "wasteRatio": number
    }
  ],
  "recommendations": [
    {
      "country": "string",
      "action": "scale" | "pause" | "exit",
      "confidence": number (0-100),
      "reasoning": "string (1-2 sentences)",
      "riskLevel": "low" | "medium" | "high",
      "keyMetrics": {
        "conversionEfficiency": number (0-100),
        "recruitmentQuality": number (0-100),
        "capacityAlignment": number (0-100)
      }
    }
  ],
  "summary": {
    "totalApplications": number,
    "averageConversion": number,
    "marketsToScale": number,
    "marketsToPause": number,
    "marketsToExit": number
  },
  "generatedAt": "ISO date string"
}

Generate realistic simulated data for 8-12 recruitment markets based on the university context. Include a mix of:
- High-performing markets to scale (good conversion, low risk)
- Underperforming markets to pause (poor conversion, high waste)
- Problematic markets to exit (institutional risk, over-reliance on agents)

Consider factors like:
- Conversion efficiency (applications to enrollments)
- Over-offering vs capacity alignment
- Application waste ratios
- Agent-driven vs organic recruitment quality balance`;

    const userPrompt = `Analyze the recruitment markets for this university and generate market intelligence data with scale/pause/exit recommendations:

${universityContext}

Generate realistic market data and AI recommendations based on the university's profile and typical patterns for institutions of this type.`;

    console.log("Calling Lovable AI for market intelligence...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    console.log("AI response received, parsing...");

    // Clean and parse the JSON response
    let analysis;
    try {
      let cleanedContent = content.trim();
      if (cleanedContent.startsWith("```json")) {
        cleanedContent = cleanedContent.slice(7);
      }
      if (cleanedContent.startsWith("```")) {
        cleanedContent = cleanedContent.slice(3);
      }
      if (cleanedContent.endsWith("```")) {
        cleanedContent = cleanedContent.slice(0, -3);
      }
      analysis = JSON.parse(cleanedContent.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse AI response as JSON");
    }

    return new Response(
      JSON.stringify({ analysis }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Market intelligence error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
