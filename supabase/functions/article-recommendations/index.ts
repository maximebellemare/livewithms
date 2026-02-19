import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    // Fetch user profile symptoms
    const { data: profile } = await supabase
      .from("profiles")
      .select("symptoms, ms_type, goals")
      .eq("user_id", user.id)
      .single();

    // Fetch recent entries to understand current symptom severity
    const { data: recentEntries } = await supabase
      .from("daily_entries")
      .select("fatigue, pain, brain_fog, mobility, mood, spasticity, stress, sleep_hours")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(7);

    // Fetch all published articles
    const { data: articles } = await supabase
      .from("learn_articles")
      .select("id, category, title, summary")
      .eq("published", true)
      .order("sort_order");

    // Fetch already-read article IDs
    const { data: reads } = await supabase
      .from("learn_reads")
      .select("article_id")
      .eq("user_id", user.id);

    const readIds = new Set((reads || []).map((r: any) => r.article_id));

    if (!articles || articles.length === 0) {
      return new Response(JSON.stringify({ recommendations: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build context for AI
    const symptoms = profile?.symptoms || [];
    const msType = profile?.ms_type || "unknown";
    const goals = profile?.goals || [];

    const avgSymptoms: Record<string, number> = {};
    if (recentEntries && recentEntries.length > 0) {
      const fields = ["fatigue", "pain", "brain_fog", "mobility", "mood", "spasticity", "stress"];
      for (const f of fields) {
        const vals = recentEntries.map((e: any) => e[f]).filter((v: any) => v != null);
        if (vals.length > 0) avgSymptoms[f] = Math.round((vals.reduce((a: number, b: number) => a + b, 0) / vals.length) * 10) / 10;
      }
    }

    const articleList = articles.map((a: any) =>
      `ID:${a.id} | Category:${a.category} | Title:${a.title} | Summary:${a.summary} | Read:${readIds.has(a.id) ? "yes" : "no"}`
    ).join("\n");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const prompt = `You are a health content recommendation engine for a Multiple Sclerosis tracking app.

User profile:
- MS type: ${msType}
- Tracked symptoms: ${symptoms.length > 0 ? symptoms.join(", ") : "none specified"}
- Goals: ${goals.length > 0 ? goals.join(", ") : "none specified"}
- Recent 7-day average symptom scores (0-10): ${JSON.stringify(avgSymptoms)}

Available articles:
${articleList}

Select the top 3-5 most relevant articles for this user. Prioritize:
1. Articles addressing their most severe current symptoms
2. Unread articles over already-read ones
3. Articles matching their MS type and goals

Return ONLY a JSON array of objects with "id" (article UUID) and "reason" (one short sentence why it's recommended). No other text.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const raw = aiData.choices?.[0]?.message?.content || "[]";

    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = raw;
    const codeBlock = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlock) jsonStr = codeBlock[1];

    let recommendations: Array<{ id: string; reason: string }> = [];
    try {
      recommendations = JSON.parse(jsonStr.trim());
    } catch {
      console.error("Failed to parse AI response:", raw);
      recommendations = [];
    }

    // Filter to only valid article IDs
    const validIds = new Set(articles.map((a: any) => a.id));
    recommendations = recommendations.filter((r) => validIds.has(r.id));

    return new Response(JSON.stringify({ recommendations }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("article-recommendations error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
