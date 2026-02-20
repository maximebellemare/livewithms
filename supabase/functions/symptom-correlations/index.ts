import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Correlation {
  metricA: string;
  metricB: string;
  r: number;
  lag: string; // "same-day" | "next-day"
  pairCount: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { correlations } = (await req.json()) as { correlations: Correlation[] };

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!correlations || correlations.length === 0) {
      return new Response(
        JSON.stringify({ cards: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const corrBlock = correlations
      .map(
        (c) =>
          `- ${c.metricA} ↔ ${c.metricB} (${c.lag}): r=${c.r.toFixed(2)}, based on ${c.pairCount} data points`
      )
      .join("\n");

    const systemPrompt = `You are a compassionate health coach for someone with Multiple Sclerosis (MS).
You are given statistical correlations between their tracked health metrics.
Your job is to produce a JSON array of 2–4 "insight cards" that explain the most meaningful patterns in warm, plain language.

Each card object must have:
- "emoji": a single emoji representing the pattern
- "title": a short headline (max 8 words)
- "body": 1–2 sentences explaining the link in plain language with practical advice. Never cite r values.
- "sentiment": "warning" if the pattern suggests something to watch, "positive" if encouraging, "neutral" otherwise

Only include correlations with |r| >= 0.25. If none qualify, return an empty array [].
Return ONLY the JSON array, no markdown fences.`;

    const userPrompt = `Here are my symptom correlations:\n\n${corrBlock}\n\nPlease produce the insight cards.`;

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
        return new Response(
          JSON.stringify({ error: "Rate limit reached — please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached. Please add credits in Settings." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "Could not generate correlations" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const json = await response.json();
    let raw = json.choices?.[0]?.message?.content ?? "[]";

    // Strip markdown fences if present
    raw = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    let cards;
    try {
      cards = JSON.parse(raw);
    } catch {
      console.error("Failed to parse AI response:", raw);
      cards = [];
    }

    return new Response(
      JSON.stringify({ cards }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("symptom-correlations error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
