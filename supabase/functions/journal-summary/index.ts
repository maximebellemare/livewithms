import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface DayEntry {
  date: string;
  notes: string | null;
  fatigue: number | null;
  pain: number | null;
  brain_fog: number | null;
  mood: number | null;
  mobility: number | null;
  sleep_hours: number | null;
  mood_tags: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { entries } = (await req.json()) as { entries: DayEntry[] };

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!entries || entries.length === 0) {
      return new Response(
        JSON.stringify({ summary: null }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const entrySummaries = entries.map((e) => {
      const parts = [
        `Date: ${e.date}`,
        e.fatigue !== null ? `Fatigue: ${e.fatigue}/10` : null,
        e.pain !== null ? `Pain: ${e.pain}/10` : null,
        e.brain_fog !== null ? `Brain fog: ${e.brain_fog}/10` : null,
        e.mood !== null ? `Mood: ${e.mood}/10` : null,
        e.mobility !== null ? `Mobility: ${e.mobility}/10` : null,
        e.sleep_hours !== null ? `Sleep: ${e.sleep_hours}h` : null,
        e.mood_tags?.length ? `Mood tags: ${e.mood_tags.join(", ")}` : null,
        e.notes ? `Journal: "${e.notes.slice(0, 300)}"` : null,
      ].filter(Boolean);
      return parts.join(" | ");
    }).join("\n");

    const systemPrompt = `You are a compassionate wellness coach for someone living with Multiple Sclerosis.
You're writing a brief, warm weekly reflection summary based on their journal entries and symptom data.

Guidelines:
- Write 3-4 short paragraphs (total ~150 words)
- First paragraph: Overall emotional tone of the week
- Second paragraph: Notable patterns (e.g. fatigue spiking mid-week, mood improving, recurring themes in journal entries)
- Third paragraph: One strength or positive thing you noticed (gratitude, resilience, self-care)
- Optional fourth paragraph: A gentle, forward-looking thought for next week
- Use warm, human language — never clinical
- Reference their actual journal words when relevant (briefly)
- Use emoji sparingly (1-2 max)
- Do NOT give medical advice`;

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
          { role: "user", content: `Here are this week's entries:\n${entrySummaries}\n\nWrite a brief, warm weekly reflection summary.` },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit reached — please try again shortly." }),
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
        JSON.stringify({ error: "Could not generate summary" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const json = await response.json();
    const summary = json.choices?.[0]?.message?.content ?? "";

    return new Response(
      JSON.stringify({ summary }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("journal-summary error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
