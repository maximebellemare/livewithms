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
    const { meal_name, meal_notes, ingredients } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!meal_name && !ingredients?.length) {
      return new Response(JSON.stringify({ error: "Provide a meal name or ingredients to scan." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const systemPrompt = `You are an MS inflammatory food specialist. Analyze the given meal or ingredients and flag items that may trigger or worsen inflammation, particularly for people with Multiple Sclerosis.

Consider MS-specific inflammatory triggers:
- Saturated fats, trans fats, refined sugars
- Gluten (for those with sensitivity)
- Processed meats, excessive dairy
- High-sodium foods
- Alcohol, artificial sweeteners
- Foods high in arachidonic acid

Also highlight anti-inflammatory ingredients present.

Return a JSON object:
{
  "overall_score": "green" | "yellow" | "red",
  "overall_label": "Anti-inflammatory" | "Moderate" | "Inflammatory",
  "summary": "One sentence overall assessment",
  "flags": [
    {
      "ingredient": "name of flagged item",
      "concern": "brief reason (max 15 words)",
      "severity": "high" | "medium" | "low",
      "alternative": "suggested replacement (optional)"
    }
  ],
  "positives": [
    {
      "ingredient": "name of beneficial item",
      "benefit": "brief reason (max 15 words)"
    }
  ]
}

Return ONLY the JSON, no markdown fences.`;

    const userPrompt = `Scan this meal for inflammatory triggers:
Meal: ${meal_name || "Unknown"}
${meal_notes ? `Notes: ${meal_notes}` : ""}
${ingredients?.length ? `Ingredients: ${ingredients.join(", ")}` : ""}`;

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
      return new Response(JSON.stringify({ error: "Could not scan meal" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const json = await response.json();
    let raw = json.choices?.[0]?.message?.content ?? "{}";
    raw = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    let result;
    try { result = JSON.parse(raw); } catch { console.error("Failed to parse:", raw); result = { overall_score: "yellow", flags: [], positives: [], summary: "Unable to analyze" }; }

    return new Response(JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("inflammatory-scanner error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
