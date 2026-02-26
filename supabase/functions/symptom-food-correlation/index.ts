import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { meal_logs, daily_entries } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!meal_logs?.length || !daily_entries?.length) {
      return new Response(
        JSON.stringify({ insights: [], message: "Not enough data yet. Log meals and symptoms for at least 7 days to see correlations." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `You are an MS nutrition analyst. You are given a user's food diary (meals eaten each day) alongside their daily symptom scores (fatigue, pain, brain_fog, mood, mobility, spasticity, stress on 0-10 scales, sleep_hours 0-12).

Analyze correlations between foods/meals and symptom changes. Look for patterns like:
- Certain foods appearing on days with worse/better symptoms
- Food types that precede better sleep or lower fatigue
- Dietary patterns associated with better/worse brain fog

Return a JSON object with:
{
  "insights": [
    {
      "emoji": "single emoji",
      "title": "short headline (max 8 words)",
      "body": "1-2 sentences explaining the food-symptom link with practical advice",
      "sentiment": "positive" | "warning" | "neutral",
      "foods": ["list", "of", "relevant", "foods"],
      "symptom": "affected symptom name"
    }
  ]
}

Return 2-5 insights. If no clear patterns, return fewer. Be warm and practical. Never cite statistics.
Return ONLY the JSON, no markdown fences.`;

    const userPrompt = `Here is my data:

MEAL LOGS (recent):
${meal_logs.map((m: any) => `${m.date} ${m.meal_type}: ${m.name}${m.notes ? ` (${m.notes})` : ""}`).join("\n")}

DAILY SYMPTOM ENTRIES (recent):
${daily_entries.map((e: any) => `${e.date}: fatigue=${e.fatigue ?? "?"}, pain=${e.pain ?? "?"}, brain_fog=${e.brain_fog ?? "?"}, mood=${e.mood ?? "?"}, sleep=${e.sleep_hours ?? "?"}h, stress=${e.stress ?? "?"}`).join("\n")}

Please analyze the food-symptom correlations.`;

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
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit reached — please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please add credits in Settings." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Could not analyze correlations" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const json = await response.json();
    let raw = json.choices?.[0]?.message?.content ?? "{}";
    raw = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    let result;
    try { result = JSON.parse(raw); } catch { console.error("Failed to parse:", raw); result = { insights: [] }; }

    return new Response(JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("symptom-food-correlation error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
