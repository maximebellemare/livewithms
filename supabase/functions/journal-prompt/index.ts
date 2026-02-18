import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface DayEntry {
  date: string;
  fatigue: number | null;
  pain: number | null;
  brain_fog: number | null;
  mood: number | null;
  mobility: number | null;
  sleep_hours: number | null;
  mood_tags: string[];
}

interface RequestBody {
  // Today's data
  fatigue: number | null;
  pain: number | null;
  brain_fog: number | null;
  mood: number | null;
  mobility: number | null;
  sleep_hours: number | null;
  mood_tags: string[];
  // Past 6 days (optional)
  weekly_history?: DayEntry[];
}

const fmt = (v: number | null, label: string, unit = "/10") =>
  v !== null ? `${label}: ${v}${unit}` : null;

function summariseDay(e: DayEntry): string {
  const parts = [
    fmt(e.fatigue, "fatigue"),
    fmt(e.pain, "pain"),
    fmt(e.brain_fog, "brain fog"),
    fmt(e.mood, "mood"),
    fmt(e.mobility, "mobility"),
    e.sleep_hours !== null ? `sleep: ${e.sleep_hours}h` : null,
    e.mood_tags?.length ? `tags: ${e.mood_tags.join(", ")}` : null,
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : "no data";
}

/** Compute a simple trend label for a metric across days */
function trend(values: (number | null)[]): string | null {
  const nums = values.filter((v): v is number => v !== null);
  if (nums.length < 2) return null;
  const first = nums[0];
  const last = nums[nums.length - 1];
  const diff = last - first;
  if (Math.abs(diff) < 1) return "stable";
  return diff > 0 ? "worsening" : "improving";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: RequestBody = await req.json();
    const { fatigue, pain, brain_fog, mood, mobility, sleep_hours, mood_tags, weekly_history = [] } = body;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // ── Today's summary ──────────────────────────────────────────
    const todayLines = [
      fmt(fatigue, "Fatigue"),
      fmt(pain, "Pain"),
      fmt(brain_fog, "Brain fog"),
      fmt(mood, "Mood"),
      fmt(mobility, "Mobility"),
      sleep_hours !== null ? `Sleep last night: ${sleep_hours} hours` : null,
      mood_tags?.length ? `Mood tags: ${mood_tags.join(", ")}` : null,
    ].filter(Boolean);

    const todayBlock = todayLines.length
      ? todayLines.join("\n")
      : "No symptoms logged yet today.";

    // ── Weekly history summary ────────────────────────────────────
    let weeklyBlock = "";
    if (weekly_history.length > 0) {
      // Per-day summary lines
      const dayLines = weekly_history.map((e) => `  ${e.date}: ${summariseDay(e)}`).join("\n");

      // Trend analysis across the week (history oldest→newest)
      const all = [...weekly_history].reverse();
      const fatigues = all.map((e) => e.fatigue);
      const pains = all.map((e) => e.pain);
      const moods = all.map((e) => e.mood);
      const mobilities = all.map((e) => e.mobility);

      const trends: string[] = [];
      const ft = trend(fatigues); if (ft) trends.push(`fatigue ${ft}`);
      const pt = trend(pains);    if (pt) trends.push(`pain ${pt}`);
      const mt = trend(moods);    if (mt) trends.push(`mood ${mt}`);
      const mbt = trend(mobilities); if (mbt) trends.push(`mobility ${mbt}`);

      // Frequent mood tags over the week
      const tagCount: Record<string, number> = {};
      weekly_history.forEach((e) =>
        (e.mood_tags ?? []).forEach((t) => { tagCount[t] = (tagCount[t] ?? 0) + 1; })
      );
      const topTags = Object.entries(tagCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([t, c]) => `${t} (${c}×)`);

      weeklyBlock = `
Past 6 days of data (most recent first):
${dayLines}

Weekly trends: ${trends.length ? trends.join(", ") : "insufficient data"}
Most frequent mood tags this week: ${topTags.length ? topTags.join(", ") : "none recorded"}`;
    }

    // ── Prompts ───────────────────────────────────────────────────
    const systemPrompt = `You are a warm, empathetic journaling coach for someone living with Multiple Sclerosis.
Your job is to suggest 3 short, open-ended journal prompts that feel personally meaningful.

You have access to today's symptom data AND the past 6 days of data. Use both to:
- Notice weekly patterns (e.g. fatigue improving, mood consistently low, recurring mood tags)
- Reflect on change or stability over the week, not just today
- Connect today's feelings to the broader journey

Rules:
- Each prompt must be one sentence ending in "?" or an open invitation.
- Do NOT interpret symptoms clinically — focus on feelings, moments, coping, gratitude, resilience, or reflection.
- Translate numbers into plain feelings (e.g. fatigue 7/10 → "a draining day", mood 8/10 → "a good emotional day").
- Reference weekly context naturally when relevant (e.g. "after a tough few days", "now that things seem to be easing").
- Keep tone gentle, curious, and human — never preachy or clinical.
- Return ONLY the prompts as a numbered list (1. … 2. … 3. …), nothing else.`;

    const userPrompt = `Today's symptoms:\n${todayBlock}${weeklyBlock ? `\n${weeklyBlock}` : ""}\n\nSuggest 3 journal prompts.`;

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
        JSON.stringify({ error: "Could not generate prompts" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const json = await response.json();
    const raw = json.choices?.[0]?.message?.content ?? "";

    // Parse numbered list → array of strings
    const prompts = raw
      .split("\n")
      .map((l: string) => l.replace(/^\d+\.\s*/, "").trim())
      .filter((l: string) => l.length > 4);

    return new Response(
      JSON.stringify({ prompts }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("journal-prompt error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
