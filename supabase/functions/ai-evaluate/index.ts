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
    const { university_id, evaluation_type } = await req.json();

    console.log("AI Evaluate request:", { university_id, evaluation_type });

    if (!university_id) {
      throw new Error("university_id is required");
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

    if (!university) {
      throw new Error("University not found");
    }

    // Fetch faculties and departments
    const { data: faculties } = await supabase
      .from("faculties")
      .select("*, departments(*)")
      .eq("university_id", university_id);

    // Fetch mobility data
    const { data: mobilityData } = await supabase
      .from("mobility_records")
      .select("*")
      .or(`university_id.eq.${university_id},partner_university_id.eq.${university_id}`);

    // Fetch MOUs
    const { data: mous } = await supabase
      .from("mous")
      .select("*")
      .or(`initiator_university_id.eq.${university_id},partner_university_id.eq.${university_id}`);

    // Fetch all universities for partner recommendations
    const { data: allUniversities } = await supabase
      .from("universities")
      .select("*")
      .neq("id", university_id);

    // Build context for AI
    const universityContext = `
UNIVERSITY PROFILE:
Name: ${university.name}
Country: ${university.country}
Region: ${university.region}
Type: ${university.type}
Size: ${university.size}
Internationalization Maturity: ${university.internationalization_maturity}

FACULTIES AND DEPARTMENTS:
${faculties?.map(f => `- ${f.name}: ${f.departments?.map((d: { name: string }) => d.name).join(", ") || "No departments listed"}`).join("\n") || "No faculty data"}

MOBILITY STATISTICS:
Total Records: ${mobilityData?.length || 0}
Erasmus Programs: ${mobilityData?.filter(m => m.program_type === "erasmus").length || 0}
Incoming Students: ${mobilityData?.filter(m => m.direction === "incoming").reduce((sum, m) => sum + m.student_count, 0) || 0}
Outgoing Students: ${mobilityData?.filter(m => m.direction === "outgoing").reduce((sum, m) => sum + m.student_count, 0) || 0}

PARTNERSHIPS:
Total MOUs: ${mous?.length || 0}
Active: ${mous?.filter(m => m.status === "accepted").length || 0}
Pending: ${mous?.filter(m => ["pending", "revised", "counter_proposed"].includes(m.status)).length || 0}

AVAILABLE PARTNER UNIVERSITIES:
${allUniversities?.slice(0, 20).map(u => `- ${u.name} (${u.country}, ${u.type}, ${u.internationalization_maturity} maturity)`).join("\n") || "None"}
`;

    let systemPrompt = "";
    let userPrompt = "";

    switch (evaluation_type) {
      case "health_index":
        systemPrompt = `You are an AI governance analyst for IARSMS. Generate an Institutional Health Index for a university.

Return ONLY valid JSON with this exact structure (no markdown, no code blocks):
{
  "overall_score": <number 0-100>,
  "recruitment_efficiency": <number 0-100>,
  "offer_to_enrollment_quality": <number 0-100>,
  "retention_stability": <number 0-100>,
  "internationalization_impact": <number 0-100>,
  "mobility_participation": <number 0-100>,
  "partner_performance": <number 0-100>,
  "summary": "<2-3 sentence executive summary>"
}

Base scores on: institution type, size, internationalization maturity, mobility data, and partnerships. Private institutions with high maturity should score higher. Generate realistic, varied scores.`;
        userPrompt = `Generate an Institutional Health Index for:\n${universityContext}`;
        break;

      case "strengths_weaknesses":
        systemPrompt = `You are an AI governance analyst for IARSMS. Analyze university strengths and weaknesses by department.

Return ONLY valid JSON with this exact structure (no markdown, no code blocks):
{
  "strengths": [
    {
      "department_name": "<name>",
      "faculty_name": "<name>",
      "score": <number 60-100>,
      "analysis": "<1-2 sentences>",
      "action_required": "scale" or "none"
    }
  ],
  "weaknesses": [
    {
      "department_name": "<name>",
      "faculty_name": "<name>",
      "score": <number 20-59>,
      "analysis": "<1-2 sentences>",
      "action_required": "structural_reform" or "strategic_partnership" or "capacity_adjustment"
    }
  ],
  "recommendations": ["<actionable recommendation 1>", "<actionable recommendation 2>", "<actionable recommendation 3>"]
}

Include 2-4 strengths and 2-4 weaknesses based on the university profile. Use actual department/faculty names from the data.`;
        userPrompt = `Analyze strengths and weaknesses for:\n${universityContext}`;
        break;

      case "department_roi":
        systemPrompt = `You are an AI governance analyst for IARSMS. Evaluate department-level ROI for international recruitment.

Return ONLY valid JSON with this exact structure (no markdown, no code blocks):
{
  "departments": [
    {
      "department_name": "<name>",
      "faculty_name": "<name>",
      "international_recruitment_roi": <number 0-100>,
      "cost_outcome_ratio": <number 0-100>,
      "market_program_fit": <number 0-100>,
      "brand_contribution": <number 0-100>,
      "category": "scale" or "correct" or "pause" or "exit",
      "analysis": "<1-2 sentences explaining the categorization>"
    }
  ]
}

Evaluate ALL departments from the faculty data. Assign realistic scores and categories based on department type and university profile.`;
        userPrompt = `Generate department ROI analysis for:\n${universityContext}`;
        break;

      case "partner_recommendations":
        systemPrompt = `You are an AI governance analyst for IARSMS. Recommend strategic partner universities.

Return ONLY valid JSON with this exact structure (no markdown, no code blocks):
{
  "recommendations": [
    {
      "university_name": "<exact name from available partners>",
      "country": "<country>",
      "match_score": <number 60-100>,
      "reasoning": {
        "departmental_complementarity": "<1 sentence>",
        "geographic_diversification": "<1 sentence>",
        "mobility_balance": "<1 sentence>",
        "strategic_alignment": "<1 sentence>"
      }
    }
  ]
}

Recommend 5-8 universities from the AVAILABLE PARTNER UNIVERSITIES list. Use EXACT names. Prioritize universities that complement weaknesses and diversify geographic reach.`;
        userPrompt = `Recommend strategic partners for:\n${universityContext}`;
        break;

      case "market_intelligence":
        systemPrompt = `You are an AI governance analyst for IARSMS. Generate market intelligence for student recruitment.

Return ONLY valid JSON with this exact structure (no markdown, no code blocks):
{
  "markets": [
    {
      "country": "<country name>",
      "region": "<Europe/Asia/MENA/North America/Africa/Latin America>",
      "conversion_efficiency": <number 0-100>,
      "over_offering_indicator": <number 0-100>,
      "application_waste_ratio": <number 0-100>,
      "agent_driven_ratio": <number 0-100>
    }
  ],
  "recommendations": [
    {
      "country": "<country>",
      "action": "scale" or "maintain" or "pause" or "exit",
      "reason": "<1-2 sentences>"
    }
  ]
}

Generate data for 8-12 markets relevant to the university's region and profile. Turkish universities should include European, Central Asian, MENA, and African markets.`;
        userPrompt = `Generate market intelligence for:\n${universityContext}`;
        break;

      default:
        throw new Error(`Unknown evaluation_type: ${evaluation_type}`);
    }

    // Call Lovable AI Gateway
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

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
          { role: "user", content: userPrompt },
        ],
        max_tokens: 4096,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    let content = aiResponse.choices?.[0]?.message?.content || "";

    console.log("Raw AI response length:", content.length);

    // Clean up the response - remove markdown code blocks if present
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    // Try to fix incomplete JSON by finding the last complete object
    let evaluationData;
    try {
      evaluationData = JSON.parse(content);
    } catch (parseError) {
      console.log("Initial parse failed, attempting to repair JSON...");
      
      // Try to find the last complete closing brace
      let fixedContent = content;
      
      // Count braces to find if JSON is incomplete
      const openBraces = (fixedContent.match(/{/g) || []).length;
      const closeBraces = (fixedContent.match(/}/g) || []).length;
      const openBrackets = (fixedContent.match(/\[/g) || []).length;
      const closeBrackets = (fixedContent.match(/]/g) || []).length;
      
      // Add missing closing brackets and braces
      for (let i = 0; i < openBrackets - closeBrackets; i++) {
        fixedContent += "]";
      }
      for (let i = 0; i < openBraces - closeBraces; i++) {
        fixedContent += "}";
      }
      
      // Try parsing the fixed content
      try {
        evaluationData = JSON.parse(fixedContent);
        console.log("JSON repair successful");
      } catch (e) {
        console.error("Failed to parse AI response after repair:", content.substring(0, 500));
        throw new Error("Failed to parse AI evaluation response");
      }
    }

    // Cache the evaluation
    const { error: cacheError } = await supabase
      .from("ai_evaluations")
      .upsert({
        university_id,
        evaluation_type,
        evaluation_data: evaluationData,
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
      }, {
        onConflict: "university_id,evaluation_type",
        ignoreDuplicates: false,
      });

    if (cacheError) {
      console.warn("Failed to cache evaluation:", cacheError);
    }

    console.log(`AI evaluation generated: ${evaluation_type} for ${university.name}`);

    return new Response(
      JSON.stringify({ evaluation: evaluationData }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in ai-evaluate function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
