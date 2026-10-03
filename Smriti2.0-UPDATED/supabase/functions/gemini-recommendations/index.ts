// Supabase Edge Function: gemini-recommendations
// Generates gentle caregiver explanations and adaptive activity recommendations
// DEMENTIA-SAFE: Strictly cognitive wellness guidance, ZERO medical diagnosis.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { patientName, completedActivities, accuracyAvg, preferredLanguage } = await req.json();
    const apiKey = Deno.env.get("GEMINI_API_KEY");

    // If Gemini API is not configured or fails, smoothly return rule-based fallback
    if (!apiKey) {
      const fallbackSummary = `${patientName || "Patient"} has completed ${completedActivities || 3} gentle cognitive exercises this week with an average accuracy of ${accuracyAvg || 88}%. Memory and daily routine consistency remain strong.`;
      const fallbackRecommendation = "Recommended next activity: Daily Routine Builder or a peaceful visit to the Memory Garden.";
      return new Response(
        JSON.stringify({
          source: "rule-based-engine",
          summary: fallbackSummary,
          recommendation: fallbackRecommendation,
          disclaimer: "This observation is for wellness tracking and is not a medical diagnosis.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const prompt = `
You are an expert cognitive wellness assistant for elderly individuals with mild memory loss and their caregivers in North East India.
Patient Name: ${patientName || "Anita Devi"}
Completed Activities this week: ${completedActivities || 3}
Average Accuracy: ${accuracyAvg || 85}%
Language: ${preferredLanguage || "en"}

Generate:
1. A warm, encouraging 2-sentence caregiver summary of recent engagement.
2. One suggested gentle next activity from: [Memory Weave, Daily Routine Builder, Sensory Soundscape, Rhythm Weaver, Living Market Mission, Landmark Pathfinder, Memory Garden].

RULES:
- NEVER make medical diagnoses or use clinical terms like "stage of dementia" or "neurological decline".
- Keep the tone calm, respectful, supportive and dignified.
Return in JSON format: {"summary": "...", "recommendation": "..."}
`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    // Parse JSON from model output
    let parsedResult = { summary: "", recommendation: "" };
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResult = JSON.parse(jsonMatch[0]);
      } else {
        parsedResult = { summary: rawText.slice(0, 200), recommendation: "Daily Routine Builder" };
      }
    } catch {
      parsedResult = {
        summary: `${patientName} engaged well in recent activities.`,
        recommendation: "Memory Weave and watering the Memory Garden.",
      };
    }

    return new Response(
      JSON.stringify({
        source: "gemini-ai",
        summary: parsedResult.summary,
        recommendation: parsedResult.recommendation,
        disclaimer: "This observation is for wellness tracking and is not a medical diagnosis.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        source: "rule-based-fallback",
        summary: "Weekly activity engagement was steady and encouraging.",
        recommendation: "Sensory Soundscape or Memory Garden.",
        error: error.message,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  }
});
