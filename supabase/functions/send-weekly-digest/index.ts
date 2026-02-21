import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Klaviyo REST API base
const KLAVIYO_BASE = "https://a.klaviyo.com/api";
const KLAVIYO_REVISION = "2024-10-15";

async function generateUnsubscribeToken(userId: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(userId));
  return btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function avg(vals: (number | null)[]): number | null {
  const v = vals.filter((x): x is number => x !== null);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}

function levelWord(v: number | null): string {
  if (v === null) return "not recorded";
  if (v <= 3) return "low";
  if (v <= 6) return "moderate";
  return "high";
}

function fmt(v: number | null, unit = "/10"): string {
  return v !== null ? `${v.toFixed(1)}${unit}` : "not recorded";
}

function pearson(xs: number[], ys: number[]): number | null {
  if (xs.length < 3) return null;
  const mx = xs.reduce((a, b) => a + b, 0) / xs.length;
  const my = ys.reduce((a, b) => a + b, 0) / ys.length;
  const num = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0);
  const den = Math.sqrt(
    xs.reduce((s, x) => s + (x - mx) ** 2, 0) *
    ys.reduce((s, y) => s + (y - my) ** 2, 0)
  );
  return den === 0 ? null : num / den;
}

interface CorrelationResult {
  metricA: string;
  metricB: string;
  r: number;
  lag: string;
  pairCount: number;
}

const METRIC_KEYS = ["fatigue", "pain", "brain_fog", "mood", "mobility", "spasticity", "stress", "sleep_hours"] as const;
const METRIC_LABELS: Record<string, string> = {
  fatigue: "Fatigue", pain: "Pain", brain_fog: "Brain Fog", mood: "Mood",
  mobility: "Mobility", spasticity: "Spasticity", stress: "Stress", sleep_hours: "Sleep",
};

const NEXT_DAY_PAIRS: [string, string][] = [
  ["sleep_hours", "fatigue"], ["sleep_hours", "mood"], ["sleep_hours", "brain_fog"],
  ["sleep_hours", "pain"], ["stress", "fatigue"], ["stress", "pain"],
  ["stress", "sleep_hours"], ["mood", "fatigue"],
];

// deno-lint-ignore no-explicit-any
function computeCorrelations(entries: any[]): CorrelationResult[] {
  const sorted = [...entries].sort((a: { date: string }, b: { date: string }) => a.date.localeCompare(b.date));
  const results: CorrelationResult[] = [];

  // Same-day
  for (let i = 0; i < METRIC_KEYS.length; i++) {
    for (let j = i + 1; j < METRIC_KEYS.length; j++) {
      const a = METRIC_KEYS[i], b = METRIC_KEYS[j];
      const pairs = sorted
        .map((e: Record<string, unknown>) => ({ x: e[a] as number | null, y: e[b] as number | null }))
        .filter((p): p is { x: number; y: number } => p.x !== null && p.y !== null);
      if (pairs.length < 5) continue;
      const r = pearson(pairs.map((p) => p.x), pairs.map((p) => p.y));
      if (r !== null && Math.abs(r) >= 0.25) {
        results.push({ metricA: METRIC_LABELS[a], metricB: METRIC_LABELS[b], r, lag: "same-day", pairCount: pairs.length });
      }
    }
  }

  // Next-day
  for (const [aKey, bKey] of NEXT_DAY_PAIRS) {
    const pairs: { x: number; y: number }[] = [];
    for (let i = 0; i < sorted.length - 1; i++) {
      const x = sorted[i][aKey] as number | null;
      const y = sorted[i + 1][bKey] as number | null;
      if (x !== null && y !== null) pairs.push({ x, y });
    }
    if (pairs.length < 5) continue;
    const r = pearson(pairs.map((p) => p.x), pairs.map((p) => p.y));
    if (r !== null && Math.abs(r) >= 0.25) {
      results.push({ metricA: METRIC_LABELS[aKey], metricB: METRIC_LABELS[bKey], r, lag: "next-day", pairCount: pairs.length });
    }
  }

  return results.sort((a, b) => Math.abs(b.r) - Math.abs(a.r)).slice(0, 4);
}

async function generateCorrelationInsights(correlations: CorrelationResult[]): Promise<string[]> {
  if (correlations.length === 0) return [];

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) return [];

  const corrBlock = correlations
    .map((c) => `- ${c.metricA} ↔ ${c.metricB} (${c.lag}): r=${c.r.toFixed(2)}, ${c.pairCount} data points`)
    .join("\n");

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a compassionate health coach for someone with MS.
Given symptom correlations, write 2-3 short bullet points (one sentence each) explaining the most meaningful patterns in warm, plain language with practical tips.
Do NOT cite r values or statistics. Return ONLY a JSON array of strings.`,
          },
          { role: "user", content: `Correlations:\n${corrBlock}` },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      console.error("AI gateway error for correlations:", response.status);
      return [];
    }

    const json = await response.json();
    let raw = json.choices?.[0]?.message?.content ?? "[]";
    raw = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to generate correlation insights:", e);
    return [];
  }
}

/** Returns how many consecutive past weeks (including current) the user hit their goal. */
async function computeWeekStreak(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  userId: string,
  goal: number,
  currentWeekStart: string,
  currentWeekGoalAchieved: boolean,
): Promise<number> {
  if (!currentWeekGoalAchieved) return 0;

  // Fetch up to 52 weeks of past entries (before current week)
  const lookbackStart = new Date(currentWeekStart + "T00:00:00Z");
  lookbackStart.setUTCDate(lookbackStart.getUTCDate() - 52 * 7);

  const { data: pastEntries } = await supabase
    .from("daily_entries")
    .select("date")
    .eq("user_id", userId)
    .gte("date", lookbackStart.toISOString().slice(0, 10))
    .lt("date", currentWeekStart);

  // Group entries by their Monday (week key)
  const weekCounts = new Map<string, number>();
  for (const entry of (pastEntries ?? [])) {
    const d = new Date(entry.date + "T00:00:00Z");
    const day = d.getUTCDay(); // 0=Sun
    d.setUTCDate(d.getUTCDate() + (day === 0 ? -6 : 1 - day));
    const key = d.toISOString().slice(0, 10);
    weekCounts.set(key, (weekCounts.get(key) ?? 0) + 1);
  }

  // Count backward from the week before current
  let streak = 1; // current week already confirmed
  const check = new Date(currentWeekStart + "T00:00:00Z");
  for (let i = 0; i < 52; i++) {
    check.setUTCDate(check.getUTCDate() - 7);
    const key = check.toISOString().slice(0, 10);
    if ((weekCounts.get(key) ?? 0) >= goal) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

async function klaviyoPost(path: string, body: unknown, apiKey: string, allow409 = false) {
  const res = await fetch(`${KLAVIYO_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Klaviyo-API-Key ${apiKey}`,
      "Content-Type": "application/json",
      revision: KLAVIYO_REVISION,
      accept: "application/json",
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  // 409 on profile upsert = profile already exists, that's fine
  if (!res.ok && !(allow409 && res.status === 409)) {
    throw new Error(`Klaviyo ${path} [${res.status}]: ${text}`);
  }
  return text ? JSON.parse(text) : null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const KLAVIYO_API_KEY = Deno.env.get("KLAVIYO_API_KEY");

    if (!KLAVIYO_API_KEY) throw new Error("KLAVIYO_API_KEY is not configured");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Support optional test_email override in request body
    let testEmail: string | null = null;
    if (req.method === "POST") {
      try {
        const body = await req.json();
        testEmail = body?.test_email ?? null;
      } catch { /* no body */ }
    }

    let profiles: { user_id: string; weekly_log_goal: number }[];

    if (testEmail) {
      // Find the user by email via admin API
      const { data: listData, error: listErr } = await supabase.auth.admin.listUsers();
      if (listErr) throw listErr;
      const match = listData?.users?.find((u) => u.email === testEmail);
      if (!match) {
        return new Response(
          JSON.stringify({ error: `No user found with email ${testEmail}` }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      // Fetch their profile to get weekly_log_goal
      const { data: profData } = await supabase
        .from("profiles")
        .select("user_id, weekly_log_goal")
        .eq("user_id", match.id)
        .single();
      profiles = [{ user_id: match.id, weekly_log_goal: profData?.weekly_log_goal ?? 7 }];
    } else {
      // Fetch all opted-in profiles
      const { data, error: profErr } = await supabase
        .from("profiles")
        .select("user_id, weekly_log_goal")
        .eq("weekly_digest_enabled", true);

      if (profErr) throw profErr;
      if (!data || data.length === 0) {
        return new Response(
          JSON.stringify({ message: "No opted-in users found" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      profiles = data.map((p) => ({ user_id: p.user_id, weekly_log_goal: p.weekly_log_goal ?? 7 }));
    }

    const now = new Date();
    const weekEnd = now.toISOString().slice(0, 10);
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    const results: { user_id: string; status: string; error?: string }[] = [];

    for (const profile of profiles) {
      try {
        // Get the user's auth email
        const { data: userData, error: userErr } = await supabase.auth.admin.getUserById(
          profile.user_id
        );
        if (userErr || !userData?.user?.email) {
          results.push({ user_id: profile.user_id, status: "skipped", error: "no email" });
          continue;
        }
        const email = userData.user.email;

        // Fetch last 7 days of entries (include all metrics for correlations)
        const { data: entries, error: entErr } = await supabase
          .from("daily_entries")
          .select("date, fatigue, pain, brain_fog, mood, mobility, sleep_hours, spasticity, stress")
          .eq("user_id", profile.user_id)
          .gte("date", weekStart)
          .lte("date", weekEnd);

        if (entErr) throw entErr;
        if (!entries || entries.length === 0) {
          results.push({ user_id: profile.user_id, status: "skipped", error: "no entries this week" });
          continue;
        }

        const avgFatigue = avg(entries.map((e) => e.fatigue));
        const avgPain = avg(entries.map((e) => e.pain));
        const avgBrainFog = avg(entries.map((e) => e.brain_fog));
        const avgMood = avg(entries.map((e) => e.mood));
        const avgMobility = avg(entries.map((e) => e.mobility));
        const avgSleep = avg(entries.map((e) => e.sleep_hours));

        const goalAchieved = entries.length >= profile.weekly_log_goal;

        // Compute consecutive-week streak
        const weekStreak = await computeWeekStreak(
          supabase,
          profile.user_id,
          profile.weekly_log_goal,
          weekStart,
          goalAchieved,
        );
        const weekStreakLabel = weekStreak === 0
          ? `You logged ${entries.length} of your ${profile.weekly_log_goal}-day goal`
          : weekStreak === 1
          ? `Week 1 goal hit — keep it up! ⚡`
          : `Week ${weekStreak} in a row! 🔥`;

        // Generate a secure unsubscribe token (HMAC-SHA256 of user_id)
        const unsubToken = await generateUnsubscribeToken(profile.user_id, SUPABASE_SERVICE_ROLE_KEY);
        const unsubscribeUrl = `https://fpjfoadvytpvrhligdye.supabase.co/functions/v1/unsubscribe?uid=${encodeURIComponent(profile.user_id)}&token=${encodeURIComponent(unsubToken)}`;

        // Fetch 30 days of entries for correlation analysis
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        const { data: allEntries } = await supabase
          .from("daily_entries")
          .select("date, fatigue, pain, brain_fog, mood, mobility, sleep_hours, spasticity, stress")
          .eq("user_id", profile.user_id)
          .gte("date", thirtyDaysAgo)
          .lte("date", weekEnd)
          .order("date", { ascending: true });

        // Compute correlations and generate AI insights
        const correlations = computeCorrelations(allEntries ?? entries);
        console.log(`[digest] ${email}: ${(allEntries ?? []).length} entries, ${correlations.length} correlations found`);
        if (correlations.length > 0) {
          console.log(`[digest] Top correlation: ${correlations[0].metricA} ↔ ${correlations[0].metricB}, r=${correlations[0].r.toFixed(2)}`);
        }
        const correlationInsights = await generateCorrelationInsights(correlations);
        console.log(`[digest] Generated ${correlationInsights.length} AI insights:`, JSON.stringify(correlationInsights));

        // Step 1: Upsert a Klaviyo profile (409 = already exists, that's fine)
        await klaviyoPost("/profiles/", {
          data: {
            type: "profile",
            attributes: { email },
          },
        }, KLAVIYO_API_KEY, true);

        // Step 2: Create a Klaviyo event — triggers the "Weekly Digest" flow in Klaviyo
        await klaviyoPost("/events/", {
          data: {
            type: "event",
            attributes: {
              time: new Date().toISOString(),
              metric: {
                data: { type: "metric", attributes: { name: "Weekly Digest" } },
              },
              profile: {
                data: { type: "profile", attributes: { email } },
              },
              properties: {
                week_start: weekStart,
                week_end: weekEnd,
                days_logged: entries.length,
                avg_fatigue: avgFatigue !== null ? +avgFatigue.toFixed(1) : null,
                avg_pain: avgPain !== null ? +avgPain.toFixed(1) : null,
                avg_brain_fog: avgBrainFog !== null ? +avgBrainFog.toFixed(1) : null,
                avg_mood: avgMood !== null ? +avgMood.toFixed(1) : null,
                avg_mobility: avgMobility !== null ? +avgMobility.toFixed(1) : null,
                avg_sleep_hours: avgSleep !== null ? +avgSleep.toFixed(1) : null,
                fatigue_level: levelWord(avgFatigue),
                pain_level: levelWord(avgPain),
                brain_fog_level: levelWord(avgBrainFog),
                mood_level: levelWord(avgMood),
                mobility_level: levelWord(avgMobility),
                avg_fatigue_label: fmt(avgFatigue),
                avg_pain_label: fmt(avgPain),
                avg_brain_fog_label: fmt(avgBrainFog),
                avg_mood_label: fmt(avgMood),
                avg_mobility_label: fmt(avgMobility),
                avg_sleep_label: fmt(avgSleep, " hrs"),
                weekly_log_goal: profile.weekly_log_goal,
                goal_achieved: goalAchieved,
                goal_summary: goalAchieved
                  ? `You hit your ${profile.weekly_log_goal}-day goal this week! 🔥`
                  : `You logged ${entries.length} of your ${profile.weekly_log_goal}-day goal`,
                week_streak: weekStreak,
                week_streak_label: weekStreakLabel,
                unsubscribe_url: unsubscribeUrl,
                // Symptom correlations
                has_correlations: correlationInsights.length > 0,
                correlation_count: correlationInsights.length,
                correlation_insights: correlationInsights,
                correlation_insight_1: correlationInsights[0] ?? null,
                correlation_insight_2: correlationInsights[1] ?? null,
                correlation_insight_3: correlationInsights[2] ?? null,
              },
            },
          },
        }, KLAVIYO_API_KEY);

        results.push({ user_id: profile.user_id, status: "sent" });
      } catch (e) {
        console.error("Error for user", profile.user_id, e);
        results.push({
          user_id: profile.user_id,
          status: "error",
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-weekly-digest error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});