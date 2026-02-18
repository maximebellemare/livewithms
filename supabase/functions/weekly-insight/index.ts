import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface EntryData {
  date: string;
  fatigue: number | null;
  pain: number | null;
  brain_fog: number | null;
  mood: number | null;
  mobility: number | null;
  sleep_hours: number | null;
}

interface RequestBody {
  entries: EntryData[];
  range: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { entries, range } = (await req.json()) as RequestBody;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!entries || entries.length === 0) {
      return new Response(
        JSON.stringify({ error: "No entries provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Compute averages
    function avg(vals: (number | null)[]): number | null {
      const v = vals.filter((x): x is number => x !== null);
      return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
    }

    const avgFatigue  = avg(entries.map((e) => e.fatigue));
    const avgPain     = avg(entries.map((e) => e.pain));
    const avgBrainFog = avg(entries.map((e) => e.brain_fog));
    const avgMood     = avg(entries.map((e) => e.mood));
    const avgMobility = avg(entries.map((e) => e.mobility));
    const avgSleep    = avg(entries.map((e) => e.sleep_hours));

    const fmt = (v: number | null, unit = "/10") =>
      v !== null ? `${v.toFixed(1)}${unit}` : "not recorded";

    const dataBlock = `
Period: last ${range} days (${entries.length} entries logged)
- Average fatigue:   ${fmt(avgFatigue)}
- Average pain:      ${fmt(avgPain)}
- Average brain fog: ${fmt(avgBrainFog)}
- Average mood:      ${fmt(avgMood)}
- Average mobility:  ${fmt(avgMobility)}
- Average sleep:     ${fmt(avgSleep, " hours")}
    `.trim();

    const systemPrompt = `You are a compassionate health coach helping someone who lives with Multiple Sclerosis (MS). 
Your job is to write a brief, warm, plain-language weekly insight summary based on their symptom data. 

Guidelines:
- Write 3–4 short sentences total.
- Start with a positive observation or acknowledgement.
- Highlight what changed or stood out (good or bad), but always phrase negatives with empathy.
- End with one practical, actionable tip or words of encouragement specific to the data.
- Do NOT use bullet points or headers — write flowing, conversational prose.
- Do NOT mention specific numbers; translate them into plain language (e.g. "moderate fatigue" for 5–6/10).
- Keep the tone warm, human, and non-clinical.`;

    const userPrompt = `Here is my symptom data for the past ${range} days:\n\n${dataBlock}\n\nPlease write my weekly insight summary.`;

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
        JSON.stringify({ error: "Could not generate insight" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const json = await response.json();
    const insight = json.choices?.[0]?.message?.content ?? "";

    return new Response(
      JSON.stringify({ insight }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("weekly-insight error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
