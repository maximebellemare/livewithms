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

        // Fetch last 7 days of entries
        const { data: entries, error: entErr } = await supabase
          .from("daily_entries")
          .select("date, fatigue, pain, brain_fog, mood, mobility, sleep_hours")
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