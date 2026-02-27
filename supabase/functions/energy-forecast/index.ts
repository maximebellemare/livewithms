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
      .select("is_premium, premium_until")
      .eq("user_id", user.id)
      .single();

    if (!profile?.is_premium) {
      return new Response(JSON.stringify({ error: "Premium required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch last 14 days of daily entries
    const fourteenDaysAgo = new Date(Date.now() - 14 * 86400000).toISOString().split("T")[0];
    const { data: entries } = await supabase
      .from("daily_entries")
      .select("date, fatigue, mood, sleep_hours, stress, pain, brain_fog, spasticity")
      .eq("user_id", user.id)
      .gte("date", fourteenDaysAgo)
      .order("date", { ascending: false });

    // Fetch last 14 days of energy budgets + activities
    const { data: budgets } = await supabase
      .from("energy_budgets")
      .select("id, date, total_spoons")
      .eq("user_id", user.id)
      .gte("date", fourteenDaysAgo)
      .order("date", { ascending: false });

    let activitiesData: any[] = [];
    if (budgets && budgets.length > 0) {
      const budgetIds = budgets.map((b: any) => b.id);
      const { data: acts } = await supabase
        .from("energy_activities")
        .select("budget_id, name, spoon_cost, completed")
        .in("budget_id", budgetIds);
      activitiesData = acts ?? [];
    }

    // Fetch today's appointments
    const today = new Date().toISOString().split("T")[0];
    const { data: appointments } = await supabase
      .from("appointments")
      .select("title, type, time")
      .eq("user_id", user.id)
      .eq("date", today);

    // Build context for AI
    const historyContext = (budgets ?? []).map((b: any) => {
      const acts = activitiesData.filter((a: any) => a.budget_id === b.id);
      const used = acts.filter((a: any) => a.completed).reduce((s: number, a: any) => s + a.spoon_cost, 0);
      return { date: b.date, budget: b.total_spoons, used, activities: acts.map((a: any) => `${a.name}(${a.spoon_cost})`) };
    });

    const entriesContext = (entries ?? []).slice(0, 7).map((e: any) => ({
      date: e.date,
      fatigue: e.fatigue,
      mood: e.mood,
      sleep: e.sleep_hours,
      stress: e.stress,
      pain: e.pain,
    }));

    const prompt = `You are an MS energy management expert. Based on the user's recent symptom data and energy budget history, predict their optimal spoon budget for today and suggest a daily activity plan.

RECENT SYMPTOM DATA (last 7 days):
${JSON.stringify(entriesContext, null, 1)}

ENERGY BUDGET HISTORY (last 14 days):
${JSON.stringify(historyContext, null, 1)}

TODAY'S APPOINTMENTS:
${JSON.stringify(appointments ?? [], null, 1)}

Respond ONLY with a JSON object (no markdown, no backticks):
{
  "recommended_spoons": <number 4-20>,
  "confidence": <"high"|"medium"|"low">,
  "reasoning": "<1-2 sentence explanation of why this budget>",
  "key_factors": ["<factor1>", "<factor2>", "<factor3>"],
  "suggested_activities": [
    { "name": "<activity>", "spoon_cost": <number>, "priority": "<must-do|should-do|optional>" }
  ],
  "tip": "<one personalized energy management tip for today>"
}

Rules:
- If sleep was poor recently, suggest a lower budget
- If fatigue trends are worsening, be conservative
- Account for today's appointments in the plan
- Keep suggested activities to 4-6 max
- recommended_spoons should be realistic based on their history`;

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
          { role: "system", content: "You are an MS energy management specialist. Return only valid JSON." },
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
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error: " + status);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content ?? "";

    // Parse JSON from response (handle possible markdown wrapping)
    let forecast;
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      forecast = JSON.parse(cleaned);
    } catch {
      throw new Error("Failed to parse AI response");
    }

    return new Response(JSON.stringify(forecast), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("energy-forecast error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
