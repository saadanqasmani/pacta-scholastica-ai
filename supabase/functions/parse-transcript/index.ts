import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { transcriptText, hostUniversityCourses } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Parsing transcript and matching courses...");

    const systemPrompt = `You are an academic course matching expert specializing in student mobility and credit transfer. Your task is to:
1. Parse the student's transcript text to extract course information (code, name, credits, department)
2. Match each home course with the BEST equivalent course at the host university based on CONTENT DESCRIPTION SIMILARITY
3. Calculate an accurate match score (0-100) based on how well the course descriptions align

CRITICAL MATCHING RULES - READ CAREFULLY:

1. DEPARTMENT MATCHING IS MANDATORY:
   - Civil Engineering courses → ONLY match with Civil Engineering courses
   - Computer Engineering courses → ONLY match with Computer Engineering courses
   - Economics courses → ONLY match with Economics courses
   - Business Administration → ONLY match with Business Administration courses
   - Media and Visual Arts → ONLY match with Media and Visual Arts courses
   - Industrial Design → ONLY match with Industrial Design courses
   - NEVER match across unrelated fields (e.g., Engineering to Business, Arts to Engineering)

2. CONTENT-BASED SCORING using course DESCRIPTIONS:
   - 90-100: Same department, nearly identical topics in descriptions (e.g., both cover "equilibrium, trusses, frames, friction")
   - 80-89: Same department, very similar content with minor topic differences
   - 70-79: Same department, similar core topics but some variation in depth/scope
   - 60-69: Same department, related topics with notable differences
   - 50-59: Same department but only partially overlapping content
   - 30-49: Related department, some transferable concepts
   - 0-29: No suitable match OR cross-department mismatch (ALWAYS use this for mismatched departments!)

3. EXAMPLES of correct matching:
   - "Statics" (forces, equilibrium, trusses) → matches "Statics for Civil Engineers" (90%+)
   - "Structural Analysis" (indeterminate structures) → matches "Structural Analysis" (90%+)
   - "Data Structures" (lists, trees, queues) → matches "Data Structures and Abstractions" (90%+)
   - "Statics" → does NOT match "Microeconomics" (0-10%, different department!)

4. If no suitable match exists in the same/related department, return score 0-20 and explain why.

Always respond using the provided tool/function.`;

    const userPrompt = `Match home university courses with host university courses based on CONTENT SIMILARITY.

HOME COURSES (from student's transcript):
${transcriptText}

HOST UNIVERSITY COURSES (available for matching):
${JSON.stringify(hostUniversityCourses, null, 2)}

MATCHING INSTRUCTIONS:
1. For each home course, identify its DEPARTMENT (e.g., "CE101 - Statics" → Civil Engineering)
2. Filter host courses to ONLY those in the SAME department
3. Compare course DESCRIPTIONS to find the best content match
4. Score based on how many topics/concepts overlap between descriptions
5. If no host course exists in the same department, score 0-20 and explain

CRITICAL: A Civil Engineering course like "Statics" MUST match with a Civil Engineering course like "Statics for Civil Engineers", NOT with Economics, Business, or Computer courses. The department field in the host courses tells you which department each course belongs to.`;

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
          { role: "user", content: userPrompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_course_matches",
              description: "Return parsed transcript courses and their matches with host courses",
              parameters: {
                type: "object",
                properties: {
                  parsedCourses: {
                    type: "array",
                    description: "Courses extracted from the transcript",
                    items: {
                      type: "object",
                      properties: {
                        courseCode: { type: "string", description: "Course code from transcript" },
                        courseName: { type: "string", description: "Course name" },
                        credits: { type: "number", description: "Number of credits" },
                        grade: { type: "string", description: "Grade received if visible" },
                        department: { type: "string", description: "Department or subject area" }
                      },
                      required: ["courseCode", "courseName", "credits"]
                    }
                  },
                  courseMatches: {
                    type: "array",
                    description: "Matches between home and host courses",
                    items: {
                      type: "object",
                      properties: {
                        homeCourseCode: { type: "string" },
                        homeCourseName: { type: "string" },
                        homeCredits: { type: "number" },
                        hostCourseId: { type: "string", description: "UUID of matched host course" },
                        hostCourseCode: { type: "string" },
                        hostCourseName: { type: "string" },
                        hostCredits: { type: "number" },
                        matchScore: { type: "number", description: "0-100 score of match quality" },
                        matchReason: { type: "string", description: "Brief explanation of why these courses match" }
                      },
                      required: ["homeCourseCode", "homeCourseName", "matchScore"]
                    }
                  },
                  summary: {
                    type: "object",
                    properties: {
                      totalHomeCourses: { type: "number" },
                      totalMatchedCourses: { type: "number" },
                      averageMatchScore: { type: "number" },
                      totalHomeCredits: { type: "number" },
                      totalHostCredits: { type: "number" }
                    }
                  }
                },
                required: ["parsedCourses", "courseMatches", "summary"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "return_course_matches" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI response received");

    // Extract the tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall && toolCall.function?.arguments) {
      const result = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback if no tool call
    return new Response(JSON.stringify({ 
      error: "Failed to parse courses",
      rawResponse: data 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Error in parse-transcript:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
