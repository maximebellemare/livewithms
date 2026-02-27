import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { weightLogs, symptomEntries, profile } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const prompt = `You are a health insights assistant for someone with Multiple Sclerosis. Analyze their weight data and provide actionable insights.

USER DATA:
- MS Type: ${profile?.ms_type || "Unknown"}
- Height: ${profile?.height_cm ? profile.height_cm + " cm" : "Not set"}
- Goal Weight: ${profile?.goal_weight ? profile.goal_weight + " " + (profile?.goal_weight_unit || "kg") : "Not set"}

WEIGHT LOGS (last 90 days, date → weight):
${(weightLogs || []).map((l: any) => `${l.date}: ${l.weight} ${l.unit}`).join("\n") || "No data"}

SYMPTOM ENTRIES (matching weight dates, date → fatigue/mood/pain/brain_fog):
${(symptomEntries || []).map((e: any) => `${e.date}: fatigue=${e.fatigue ?? "?"}, mood=${e.mood ?? "?"}, pain=${e.pain ?? "?"}, brain_fog=${e.brain_fog ?? "?"}`).join("\n") || "No data"}

Respond with a JSON object using this exact schema:
{
  "weekly_summary": "A 2-3 sentence summary of the current weight trend and what it means for MS management.",
  "recommendations": ["Tip 1", "Tip 2", "Tip 3"],
  "anomalies": ["Alert 1"] or [],
  "correlation_insight": "A sentence about how weight changes relate to their symptoms, or null if insufficient data."
}

Guidelines:
- If weight increased sharply (>2% in a week), flag it as a possible medication side effect or fluid retention (common in MS treatments like corticosteroids).
- Recommendations should be MS-specific: consider fatigue-friendly exercise, anti-inflammatory nutrition, and the impact of weight on mobility/spasticity.
- Keep tone supportive and non-judgmental.
- If data is insufficient, say so honestly rather than guessing.
- Return ONLY valid JSON, no markdown.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || "";

    // Extract JSON from response
    let parsed;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch {
      parsed = {
        weekly_summary: content,
        recommendations: [],
        anomalies: [],
        correlation_insight: null,
      };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("weight-insights error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
