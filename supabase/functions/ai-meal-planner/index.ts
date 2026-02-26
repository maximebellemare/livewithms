import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Authentication failed");

    // Check premium
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("is_premium, premium_until, ms_type, symptoms")
      .eq("user_id", userData.user.id)
      .single();

    const isPremium = profile?.is_premium && (!profile.premium_until || new Date(profile.premium_until) > new Date());
    if (!isPremium) {
      return new Response(JSON.stringify({ error: "Premium subscription required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { recipes, diet_name, preferences } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("AI service not configured");

    const prompt = `You are a nutrition expert specializing in MS-friendly diets. Generate a complete weekly meal plan for the "${diet_name}" diet.

User context:
- MS type: ${profile?.ms_type || "not specified"}
- Symptoms: ${(profile?.symptoms || []).join(", ") || "not specified"}
- Preferences: ${preferences || "none"}

Available recipes (use these recipe IDs when possible):
${JSON.stringify(recipes.map((r: any) => ({ id: r.id, name: r.name, meal: r.meal })), null, 2)}

Return a JSON object mapping each day to meal assignments. Use recipe IDs from the available list. For variety, you can suggest custom meals using "custom:Meal Name" format.

Format: { "monday": { "breakfast": "recipe_id_or_custom:name", "lunch": "...", "dinner": "...", "snack": "..." }, ... }

Rules:
- Cover all 7 days (monday through sunday)
- Cover all 4 meal types (breakfast, lunch, dinner, snack)
- Prioritize anti-inflammatory foods for MS
- Ensure nutritional variety across the week
- Use available recipe IDs when appropriate, custom meals for variety
- Return ONLY valid JSON, no markdown or explanation`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a nutrition AI. Return only valid JSON." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "AI rate limit reached, please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI service credits depleted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    // Extract JSON from response
    let plan;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      plan = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
    } catch {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to generate meal plan");
    }

    return new Response(JSON.stringify({ plan }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[AI-MEAL-PLANNER]", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
