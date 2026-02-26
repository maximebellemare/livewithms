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
    const { meal_logs, daily_entries, ms_type, symptoms, diet_name } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a warm, expert MS nutrition coach. Based on the user's recent food diary, symptom data, MS type, and current diet plan, provide personalized weekly nutrition tips.

Return a JSON object:
{
  "greeting": "A warm one-line personalized greeting",
  "tips": [
    {
      "emoji": "single emoji",
      "title": "short actionable title (max 6 words)",
      "body": "2-3 sentences with specific, practical advice tailored to their data",
      "priority": "high" | "medium" | "low"
    }
  ],
  "weekly_focus": "One key nutrition focus area for the week (1 sentence)"
}

Provide 3-5 tips. Be specific — reference their actual foods and symptoms. Prioritize anti-inflammatory guidance for MS.
Return ONLY the JSON, no markdown fences.`;

    const mealSummary = meal_logs?.length
      ? meal_logs.slice(0, 30).map((m: any) => `${m.date} ${m.meal_type}: ${m.name}`).join("\n")
      : "No meal logs available yet.";

    const entrySummary = daily_entries?.length
      ? daily_entries.slice(0, 14).map((e: any) => `${e.date}: fatigue=${e.fatigue ?? "?"}, pain=${e.pain ?? "?"}, brain_fog=${e.brain_fog ?? "?"}, mood=${e.mood ?? "?"}, sleep=${e.sleep_hours ?? "?"}h`).join("\n")
      : "No symptom entries available yet.";

    const userPrompt = `MS Type: ${ms_type || "Not specified"}
Key symptoms: ${symptoms?.join(", ") || "Not specified"}
Current diet plan: ${diet_name || "None"}

Recent meals:
${mealSummary}

Recent symptom entries:
${entrySummary}

Please provide personalized nutrition coaching tips.`;

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
      return new Response(JSON.stringify({ error: "Could not generate coaching tips" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const json = await response.json();
    let raw = json.choices?.[0]?.message?.content ?? "{}";
    raw = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    let result;
    try { result = JSON.parse(raw); } catch { console.error("Failed to parse:", raw); result = { tips: [], greeting: "", weekly_focus: "" }; }

    return new Response(JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("nutrition-coaching error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
