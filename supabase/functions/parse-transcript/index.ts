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

    const systemPrompt = `You are an academic course matching expert. Your task is to:
1. Parse the student's transcript text to extract course information
2. Match each course with the best equivalent at the host university
3. Calculate a match score (0-100) based on content similarity

Always respond using the provided tool/function.`;

    const userPrompt = `Parse this transcript and match courses with the host university:

TRANSCRIPT TEXT:
${transcriptText}

HOST UNIVERSITY COURSES:
${JSON.stringify(hostUniversityCourses, null, 2)}

Extract courses from the transcript and find the best matching host courses. For each home course, identify the most similar host course based on:
- Course content/description similarity
- Credit equivalence
- Subject area match`;

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
