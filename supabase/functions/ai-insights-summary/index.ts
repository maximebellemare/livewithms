import { createClient } from "npm:@supabase/supabase-js@2";
import { applyTrustLayer } from "../../../lib/ai-trust/applyTrustLayer";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type EntryData = {
  date: string;
  fatigue: number | null;
  mood: number | null;
  stress: number | null;
  sleep_hours: number | null;
  water_glasses?: number | null;
  notes?: string | null;
};

type RequestBody = {
  entries?: EntryData[];
  range?: 7 | 30;
};

const OPENAI_TIMEOUT_MS = 15000;
const MAX_NOTES_LENGTH = 160;
const MAX_SUGGESTIONS = 3;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function truncate(value: string, maxLength: number) {
  const trimmed = value.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxLength).trimEnd()}…`;
}

function average(values: Array<number | null | undefined>) {
  const valid = values.filter((value): value is number => typeof value === "number");
  if (!valid.length) {
    return null;
  }

  return Math.round((valid.reduce((sum, value) => sum + value, 0) / valid.length) * 10) / 10;
}

function computeDirection(values: Array<number | null | undefined>, higherIsBetter: boolean) {
  const valid = values.filter((value): value is number => typeof value === "number");
  if (valid.length < 4) {
    return "steady";
  }

  const midpoint = Math.ceil(valid.length / 2);
  const firstHalf = valid.slice(0, midpoint);
  const secondHalf = valid.slice(midpoint);
  const firstAverage = average(firstHalf);
  const secondAverage = average(secondHalf);

  if (firstAverage === null || secondAverage === null) {
    return "steady";
  }

  const difference = secondAverage - firstAverage;
  if (Math.abs(difference) < 0.35) {
    return "steady";
  }

  if (higherIsBetter) {
    return difference > 0 ? "improving" : "lower";
  }

  return difference < 0 ? "improving" : "higher";
}

function buildFallbackSummary(entries: EntryData[], range: 7 | 30) {
  const averageFatigue = average(entries.map((entry) => entry.fatigue));
  const averageMood = average(entries.map((entry) => entry.mood));
  const averageStress = average(entries.map((entry) => entry.stress));
  const averageSleep = average(entries.map((entry) => entry.sleep_hours));

  let summary = "Your recent check-ins are starting to show a clearer picture of how this stretch has felt.";
  const helping: string[] = [];
  const suggestions: string[] = [];

  if (averageSleep !== null && averageSleep >= 7) {
    helping.push("More sleep may be helping on steadier days.");
  }

  if (averageStress !== null && averageStress <= 2.5) {
    helping.push("Lower stress seems to be part of your steadier days.");
  }

  if (entries.length >= Math.ceil(range / 2)) {
    helping.push("Consistent check-ins are making these patterns easier to spot.");
  }

  if (averageFatigue !== null && averageFatigue >= 4) {
    summary = "Fatigue has been one of the stronger signals in your recent check-ins. Gentler pacing may help keep things steadier.";
    suggestions.push("A lighter to-do list may help on higher-fatigue days.");
  } else if (averageStress !== null && averageStress >= 4) {
    summary = "Stress has been standing out lately. Quieter pauses and a lighter pace may help you settle back into the day.";
    suggestions.push("A short Calm Reset may help on higher-stress days.");
  } else if (averageMood !== null && averageMood >= 4) {
    summary = "Your recent check-ins suggest a steadier stretch overall. It may help to notice what is supporting those better days.";
  } else if (averageSleep !== null && averageSleep < 6.5) {
    summary = "Sleep seems a little lighter lately, and that may be shaping how the week feels.";
    suggestions.push("A softer evening routine may help support steadier sleep.");
  }

  return {
    summary,
    helping:
      helping.length > 0
        ? helping.slice(0, 3)
        : ["Check in consistently to unlock clearer insights."],
    suggestions: suggestions.slice(0, MAX_SUGGESTIONS),
    source: "fallback" as const,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: true, message: "missing_authorization" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const openAiKey = Deno.env.get("OPENAI_API_KEY");
    const model = Deno.env.get("OPENAI_MODEL") ?? "gpt-4.1-mini";

    if (!supabaseUrl || !supabaseAnonKey || !openAiKey) {
      return jsonResponse({ error: true, message: "temporary_failure" }, 500);
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return jsonResponse({ error: true, message: "unauthorized" }, 401);
    }

    const body = (await req.json()) as RequestBody;
    const range = body.range === 30 ? 30 : 7;
    const entries = Array.isArray(body.entries) ? body.entries.slice(0, range) : [];

    if (entries.length < 3) {
      return jsonResponse(buildFallbackSummary(entries, range));
    }

    const compactEntries = entries.map((entry) => ({
      date: entry.date,
      fatigue: entry.fatigue,
      mood: entry.mood,
      stress: entry.stress,
      sleep_hours: entry.sleep_hours,
      notes:
        typeof entry.notes === "string" && entry.notes.trim().length > 0
          ? truncate(entry.notes, MAX_NOTES_LENGTH)
          : null,
    }));

    const derivedContext = {
      average_fatigue: average(entries.map((entry) => entry.fatigue)),
      average_mood: average(entries.map((entry) => entry.mood)),
      average_stress: average(entries.map((entry) => entry.stress)),
      average_sleep: average(entries.map((entry) => entry.sleep_hours)),
      fatigue_direction: computeDirection(entries.map((entry) => entry.fatigue), false),
      mood_direction: computeDirection(entries.map((entry) => entry.mood), true),
      stress_direction: computeDirection(entries.map((entry) => entry.stress), false),
      sleep_direction: computeDirection(entries.map((entry) => entry.sleep_hours), true),
      days_logged: entries.length,
    };

    const systemPrompt = `You are writing a short supportive insight summary for a multiple sclerosis self-tracking app.

Rules:
- This is not medical analysis.
- Do not diagnose, give medical advice, give treatment guidance, or make certainty claims.
- Do not imply causation unless it is clearly framed as a possibility.
- Avoid alarming language.
- Keep the tone calm, readable, and supportive.
- Keep the summary to 2-4 short paragraphs total.
- Focus on the most meaningful patterns instead of listing everything.
- Prefer wording like "may", "seems", or "might".
- Return JSON only with this shape:
{"summary":"string","helping":["string","string","string"],"suggestions":["string","string","string"]}`;

    const userPrompt = `Summarize recent self-tracking patterns for the last ${range} days.

Focus on:
- fatigue trends
- mood trends
- stress trends
- sleep patterns
- consistency of check-ins
- careful pattern reflection, not certainty

Derived context:
${JSON.stringify(derivedContext)}

Data:
${JSON.stringify(compactEntries)}`;

    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), OPENAI_TIMEOUT_MS);

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openAiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.4,
          max_tokens: 220,
          response_format: { type: "json_object" },
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const text = await response.text();
        console.error("ai-insights-summary openai error", { status: response.status, body: text, model });
        return jsonResponse(buildFallbackSummary(entries, range));
      }

      const json = await response.json();
      const content = json.choices?.[0]?.message?.content;

      if (typeof content !== "string" || !content.trim()) {
        console.error("ai-insights-summary empty content", { json });
        return jsonResponse(buildFallbackSummary(entries, range));
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(content);
      } catch (error) {
        console.error("ai-insights-summary parse error", {
          message: error instanceof Error ? error.message : "Unknown parse error",
          content,
        });
        return jsonResponse(buildFallbackSummary(entries, range));
      }

      const summary =
        typeof (parsed as { summary?: unknown }).summary === "string"
          ? truncate((parsed as { summary: string }).summary, 700)
          : buildFallbackSummary(entries, range).summary;

      const helping = Array.isArray((parsed as { helping?: unknown }).helping)
        ? (parsed as { helping: unknown[] }).helping
            .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
            .map((item) => truncate(item, 120))
            .slice(0, 3)
        : [];
      const suggestions = Array.isArray((parsed as { suggestions?: unknown }).suggestions)
        ? (parsed as { suggestions: unknown[] }).suggestions
            .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
            .map((item) => truncate(item, 120))
            .slice(0, MAX_SUGGESTIONS)
        : [];

      const trustedSummary = applyTrustLayer({
        text: summary,
        channel: "insight-summary",
        adaptiveState: entries.length >= 8 ? "REFLECTIVE" : "STABLE",
        includeTransparencyNote: true,
      });
      const trustedHelping = helping
        .map((item) =>
          applyTrustLayer({
            text: item,
            channel: "insight-list-item",
            adaptiveState: "STABLE",
          }).text,
        )
        .filter(Boolean);
      const trustedSuggestions = suggestions
        .map((item) =>
          applyTrustLayer({
            text: item,
            channel: "insight-list-item",
            adaptiveState: "STABLE",
          }).text,
        )
        .filter(Boolean);

      return jsonResponse({
        summary: trustedSummary.text,
        helping: trustedHelping.length > 0 ? trustedHelping : buildFallbackSummary(entries, range).helping,
        suggestions: trustedSuggestions,
        disclaimer: trustedSummary.trustNote,
        source: "ai",
      });
    } catch (error) {
      console.error("ai-insights-summary request failed", {
        message: error instanceof Error ? error.message : "Unknown error",
      });
      return jsonResponse(buildFallbackSummary(entries, range));
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    console.error("ai-insights-summary error", error);
    return jsonResponse({
      summary: "Check in consistently to unlock clearer insights.",
      helping: ["Check in consistently to unlock clearer insights."],
      suggestions: [],
      source: "fallback",
    });
  }
});
