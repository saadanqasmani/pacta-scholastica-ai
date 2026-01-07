import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, university_id, university_name } = await req.json();

    console.log("AI Chat request:", { message, university_id, university_name });

    // Initialize Supabase client for data access
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch university data for context
    let universityContext = "";
    if (university_id) {
      const { data: university } = await supabase
        .from("universities")
        .select("*")
        .eq("id", university_id)
        .single();

      const { data: faculties } = await supabase
        .from("faculties")
        .select("*, departments(*)")
        .eq("university_id", university_id);

      const { data: mobilityData } = await supabase
        .from("mobility_records")
        .select("*")
        .or(`university_id.eq.${university_id},partner_university_id.eq.${university_id}`);

      const { data: mous } = await supabase
        .from("mous")
        .select("*")
        .or(`initiator_university_id.eq.${university_id},partner_university_id.eq.${university_id}`);

      universityContext = `
UNIVERSITY PROFILE:
Name: ${university?.name || university_name}
Country: ${university?.country || "Unknown"}
Type: ${university?.type || "Unknown"}
Size: ${university?.size || "Unknown"}
Internationalization Maturity: ${university?.internationalization_maturity || "Unknown"}

FACULTIES AND DEPARTMENTS:
${faculties?.map(f => `- ${f.name}: ${f.departments?.map((d: { name: string }) => d.name).join(", ") || "No departments"}`).join("\n") || "No faculty data available"}

MOBILITY DATA:
Total Mobility Records: ${mobilityData?.length || 0}
Incoming Students: ${mobilityData?.filter(m => m.direction === "incoming").reduce((sum, m) => sum + m.student_count, 0) || 0}
Outgoing Students: ${mobilityData?.filter(m => m.direction === "outgoing").reduce((sum, m) => sum + m.student_count, 0) || 0}

ACTIVE PARTNERSHIPS (MOUs):
Total MOUs: ${mous?.length || 0}
Active: ${mous?.filter(m => m.status === "accepted").length || 0}
Pending: ${mous?.filter(m => ["pending", "revised", "counter_proposed"].includes(m.status)).length || 0}
`;
    }

    // Call Lovable AI Gateway
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const systemPrompt = `You are an authoritative AI governance advisor for IARSMS (International Academic Relations Strategic Management System). You provide data-driven, strategic intelligence for university internationalization.

Your role is to:
1. Analyze institutional performance with precision
2. Identify strengths, weaknesses, and opportunities
3. Recommend strategic partnerships and interventions
4. Provide actionable guidance, not vague suggestions

Response style:
- Be concise but comprehensive
- Use data when available
- Structure responses with clear sections if needed
- Be direct and authoritative - you are a governance tool, not a chatbot
- Never apologize or hedge excessively
- If asked about specific metrics, generate realistic assessments based on the institution profile

${universityContext ? `\nCURRENT CONTEXT:\n${universityContext}` : "No specific university context provided."}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const assistantMessage = aiResponse.choices?.[0]?.message?.content || "Unable to generate response.";

    console.log("AI response generated successfully");

    return new Response(
      JSON.stringify({ response: assistantMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in ai-chat function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
