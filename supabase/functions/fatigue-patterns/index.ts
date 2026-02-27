import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing auth");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) throw new Error("Unauthorized");

    // Check premium
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_premium")
      .eq("user_id", user.id)
      .single();

    if (!profile?.is_premium) {
      return new Response(JSON.stringify({ error: "Premium required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch last 60 days of daily entries for pattern detection
    const sixtyDaysAgo = new Date(Date.now() - 60 * 86400000).toISOString().split("T")[0];

    const [entriesRes, budgetsRes] = await Promise.all([
      supabase
        .from("daily_entries")
        .select("date, fatigue, mood, sleep_hours, stress, pain, brain_fog, spasticity")
        .eq("user_id", user.id)
        .gte("date", sixtyDaysAgo)
        .order("date", { ascending: true }),
      supabase
        .from("energy_budgets")
        .select("id, date, total_spoons")
        .eq("user_id", user.id)
        .gte("date", sixtyDaysAgo)
        .order("date", { ascending: true }),
    ]);

    const entries = entriesRes.data ?? [];
    const budgets = budgetsRes.data ?? [];

    if (entries.length < 7) {
      return new Response(JSON.stringify({
        error: "insufficient_data",
        message: "Log at least 7 days of symptoms to unlock pattern analysis.",
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch activities for these budgets
    let activitiesData: any[] = [];
    if (budgets.length > 0) {
      const budgetIds = budgets.map((b: any) => b.id);
      const { data: acts } = await supabase
        .from("energy_activities")
        .select("budget_id, name, spoon_cost, completed")
        .in("budget_id", budgetIds);
      activitiesData = acts ?? [];
    }

    // Build day-by-day context
    const dayData = entries.map((e: any) => {
      const budget = budgets.find((b: any) => b.date === e.date);
      const acts = budget
        ? activitiesData.filter((a: any) => a.budget_id === budget.id)
        : [];
      const usedSpoons = acts.filter((a: any) => a.completed).reduce((s: number, a: any) => s + a.spoon_cost, 0);
      const dayOfWeek = new Date(e.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long" });
      return {
        date: e.date,
        day: dayOfWeek,
        fatigue: e.fatigue,
        mood: e.mood,
        sleep: e.sleep_hours,
        stress: e.stress,
        pain: e.pain,
        brain_fog: e.brain_fog,
        budget: budget?.total_spoons ?? null,
        used: usedSpoons || null,
        activities: acts.filter((a: any) => a.completed).map((a: any) => a.name).slice(0, 5),
      };
    });

    const prompt = `You are an MS fatigue pattern analyst. Analyze this user's symptom and energy data over the past ${dayData.length} days to find recurring fatigue patterns by day of week, activity type, and sequential-day effects.

DATA (day-by-day):
${JSON.stringify(dayData, null, 1)}

Respond ONLY with a JSON object (no markdown, no backticks):
{
  "patterns": [
    {
      "title": "<short pattern title, e.g. 'Tuesday Crash Pattern'>",
      "description": "<1-2 sentence explanation with specific days/numbers>",
      "severity": "<high|medium|low>",
      "icon": "<emoji representing the pattern>"
    }
  ],
  "worst_day": "<day of week with highest average fatigue>",
  "best_day": "<day of week with lowest average fatigue>",
  "pacing_tips": [
    "<actionable tip based on the patterns found>"
  ],
  "summary": "<2-3 sentence overview of their fatigue profile>"
}

Rules:
- Find 2-4 meaningful patterns (not generic advice)
- Look for day-after effects (high spoon usage → next day crash)
- Look for weekly rhythms (e.g., mid-week dips, weekend recovery)
- Look for activity-fatigue correlations (specific activities that precede high fatigue)
- Look for sleep-fatigue lag effects
- Provide 2-4 specific, actionable pacing tips
- If data is sparse for some days, note lower confidence
- Be specific with numbers: "Your fatigue averages 7.2 on Wednesdays vs 4.1 on Sundays"`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are an MS fatigue pattern specialist. Return only valid JSON." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, try again shortly" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error: " + status);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content ?? "";

    let analysis;
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      analysis = JSON.parse(cleaned);
    } catch {
      throw new Error("Failed to parse AI response");
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("fatigue-patterns error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});