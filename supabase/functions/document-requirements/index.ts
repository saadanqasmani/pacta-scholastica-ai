import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LANGUAGE_INSTRUCTIONS: Record<string, string> = {
  en: "Respond entirely in English. All text fields in the JSON must be in English.",
  tr: "Tüm yanıtlarını Türkçe olarak ver. JSON içindeki tüm metin alanları Türkçe olmalı.",
  de: "Antworte vollständig auf Deutsch. Alle Textfelder im JSON müssen auf Deutsch sein.",
  ar: "أجب بالكامل باللغة العربية. جميع حقول النص في JSON يجب أن تكون بالعربية.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { country, educationSystem, stage, degreeLevel, language } = await req.json();
    const lang = language || "en";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const langInstruction = LANGUAGE_INSTRUCTIONS[lang] || LANGUAGE_INSTRUCTIONS.en;

    const systemPrompt = `You are an expert in international student document requirements for Turkish universities. 
You have comprehensive knowledge of:
- Document requirements for different countries' education systems
- Stamp and attestation requirements (MOFA, Apostille, Turkish Consulate, etc.)
- Denklik (equivalency) processes
- İkamet (residence permit) requirements
- Specific requirements for different exam boards (Cambridge, IB, WAEC, CBSE, etc.)

${langInstruction}

Provide detailed, accurate, and actionable information about required documents.`;

    const userPrompt = `A student from ${country} with ${educationSystem || 'standard national'} education system is applying for ${degreeLevel} program. 
Their current stage is: ${stage}.

Please provide:
1. List of required documents specific to their country and education system
2. For each document:
   - Exact name and description
   - Required stamps/attestations (be specific about which ministry/authority)
   - Step-by-step instructions on how to obtain it
   - Any special notes or warnings
3. Common issues or rejections for students from this country
4. Timeline estimates for obtaining documents

Format your response as a JSON object with this structure:
{
  "documents": [
    {
      "name": "Document Name",
      "category": "academic|legal|identity|financial|other",
      "description": "What this document is",
      "isRequired": true/false,
      "stampsRequired": ["Stamp 1", "Stamp 2"],
      "howToObtain": "Step by step instructions",
      "timeline": "Estimated time to obtain",
      "notes": "Any special notes or warnings"
    }
  ],
  "commonIssues": ["Issue 1", "Issue 2"],
  "generalAdvice": "Overall advice for students from this country",
  "estimatedTotalTime": "Total time to gather all documents"
}`;

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
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    let requirements;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        requirements = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      requirements = { documents: [], commonIssues: [], generalAdvice: content, estimatedTotalTime: "Unknown", parseError: true };
    }

    return new Response(JSON.stringify(requirements), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Document requirements error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
