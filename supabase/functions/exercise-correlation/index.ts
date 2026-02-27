import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { exerciseLogs, symptomEntries, msType, mode } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    let prompt: string;

    if (mode === "daily_suggestion") {
      prompt = `You are an MS wellness specialist. Based on recent exercise and symptom data, suggest ONE exercise for today.

Recent exercises: ${JSON.stringify(exerciseLogs)}
Recent symptoms (last 7 days): ${JSON.stringify(symptomEntries)}
MS Type: ${msType || "Not specified"}

Consider:
- If fatigue is high recently, suggest low-intensity
- Avoid repeating the same exercise too many consecutive days
- Account for MS-specific needs (heat sensitivity, balance, spasticity)
- If no data, give a safe general suggestion

Respond with ONLY valid JSON:
{
  "exercise": "Exercise name",
  "duration": "e.g. 15-20 minutes",
  "intensity": "light/moderate/vigorous",
  "reason": "1-2 sentences explaining why this is ideal today",
  "alternative": "A lower-energy alternative if they're not feeling up to it",
  "caution": "Any MS-specific caution, or null if none"
}`;
    } else {
      prompt = `You are an MS wellness specialist analyzing the relationship between exercise and symptoms.

Exercise data (last 30 days): ${JSON.stringify(exerciseLogs)}
Symptom data (last 30 days): ${JSON.stringify(symptomEntries)}
MS Type: ${msType || "Not specified"}

Analyze the correlation between exercise patterns and symptom changes. Respond with ONLY valid JSON:
{
  "summary": "2-3 sentence overview of exercise-symptom patterns",
  "best_exercise": { "type": "string (best exercise type for this user)", "reason": "why it helps" },
  "worst_days": "pattern of when symptoms worsen relative to exercise",
  "recommendations": ["3-4 specific actionable tips"],
  "fatigue_insight": "how exercise timing/intensity affects fatigue levels",
  "optimal_pattern": "recommended exercise frequency and intensity based on data"
}

Guidelines:
- Be specific to THIS user's data patterns
- Consider MS-specific concerns like heat sensitivity, fatigue management
- Note if certain exercise types correlate with better or worse symptom days
- If data is limited, say so and give general MS exercise guidance`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are an MS exercise specialist. Return only valid JSON, no markdown." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${status}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "";
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(content);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("exercise-correlation error:", e);
    return new Response(JSON.stringify({ error: e.message || "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
