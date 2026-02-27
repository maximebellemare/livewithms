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

    const userId = userData.user.id;

    // Fetch profile, medications, recent entries, and today's energy budget in parallel
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    const today = new Date().toISOString().slice(0, 10);

    const [profileRes, medsRes, entriesRes, energyRes, ratingsRes] = await Promise.all([
      supabaseClient
        .from("profiles")
        .select("is_premium, premium_until, ms_type, symptoms, medications, goals, sleep_goal, hydration_goal")
        .eq("user_id", userId)
        .single(),
      supabaseClient
        .from("medications")
        .select("name, dosage, schedule_type")
        .eq("user_id", userId)
        .eq("active", true),
      supabaseClient
        .from("daily_entries")
        .select("date, fatigue, pain, brain_fog, mood, mobility, sleep_hours, spasticity, stress")
        .eq("user_id", userId)
        .gte("date", sevenDaysAgo)
        .order("date", { ascending: false })
        .limit(7),
      supabaseClient
        .from("energy_budgets")
        .select("total_spoons")
        .eq("user_id", userId)
        .eq("date", today)
        .maybeSingle(),
      supabaseClient
        .from("meal_ratings")
        .select("meal_name, rating, diet_plan")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    const profile = profileRes.data;
    const isPremium = profile?.is_premium && (!profile.premium_until || new Date(profile.premium_until) > new Date());
    if (!isPremium) {
      return new Response(JSON.stringify({ error: "Premium subscription required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { recipes, diet_name, preferences, single_day } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("AI service not configured");

    // ── Build rich context ──
    const medications = (medsRes.data || []).map((m: any) => `${m.name}${m.dosage ? ` (${m.dosage})` : ""} — ${m.schedule_type}`);
    const recentEntries = entriesRes.data || [];

    // Compute symptom averages over last 7 days
    const symptomFields = ["fatigue", "pain", "brain_fog", "spasticity", "stress", "mood", "mobility"] as const;
    const symptomAverages: Record<string, string> = {};
    for (const field of symptomFields) {
      const values = recentEntries.map((e: any) => e[field]).filter((v: any) => v != null);
      if (values.length > 0) {
        const avg = values.reduce((a: number, b: number) => a + b, 0) / values.length;
        symptomAverages[field] = avg.toFixed(1);
      }
    }
    const sleepValues = recentEntries.map((e: any) => e.sleep_hours).filter((v: any) => v != null);
    const avgSleep = sleepValues.length > 0
      ? (sleepValues.reduce((a: number, b: number) => a + b, 0) / sleepValues.length).toFixed(1)
      : null;

    const energySpoons = energyRes.data?.total_spoons;

    // Identify dominant symptoms (avg ≥ 5 on 0-10 scale, lower-is-better metrics)
    const highSymptoms: string[] = [];
    for (const field of ["fatigue", "pain", "brain_fog", "spasticity", "stress"] as const) {
      if (symptomAverages[field] && parseFloat(symptomAverages[field]) >= 5) {
        highSymptoms.push(field.replace("_", " "));
      }
    }
    // Build meal preference context from ratings
    const ratings = ratingsRes.data || [];
    const likedMeals = ratings.filter((r: any) => r.rating === "up").map((r: any) => r.meal_name);
    const dislikedMeals = ratings.filter((r: any) => r.rating === "down").map((r: any) => r.meal_name);

    const isSingleDay = !!single_day;
    const dayScope = isSingleDay ? `ONLY for ${single_day}` : "for the full week (monday through sunday)";

    const prompt = `You are an MS nutrition specialist. Generate a personalized meal plan ${dayScope} for the "${diet_name}" diet.

## User's MS Profile
- MS type: ${profile?.ms_type || "not specified"}
- Key symptoms: ${(profile?.symptoms || []).join(", ") || "not specified"}
- Health goals: ${(profile?.goals || []).join(", ") || "not specified"}

## Current Medications (consider food-drug interactions!)
${medications.length > 0 ? medications.map((m: string) => `- ${m}`).join("\n") : "- None reported"}

## Last 7-Day Symptom Trends (0-10 scale)
${Object.entries(symptomAverages).map(([k, v]) => `- ${k.replace("_", " ")}: ${v}/10 avg`).join("\n") || "- No recent data"}
${avgSleep ? `- Average sleep: ${avgSleep} hours (goal: ${profile?.sleep_goal || 8}h)` : ""}

## Currently Elevated Symptoms
${highSymptoms.length > 0 ? highSymptoms.map(s => `- ${s} (elevated — prioritize foods that help with this)`).join("\n") : "- All symptoms within normal range"}

## Energy Level Today
${energySpoons != null ? `- Energy budget: ${energySpoons} spoons (${energySpoons <= 6 ? "LOW energy day — suggest easy, quick-prep meals" : energySpoons <= 10 ? "moderate energy — balanced prep complexity" : "good energy day — full range of meals ok"})` : "- Not set"}

## Dietary Preferences
${preferences || "None specified"}

## User's Meal Ratings (IMPORTANT — respect these preferences!)
${likedMeals.length > 0 ? `Liked meals (include more of these): ${likedMeals.join(", ")}` : "No liked meals yet"}
${dislikedMeals.length > 0 ? `Disliked meals (AVOID these or similar): ${dislikedMeals.join(", ")}` : "No disliked meals yet"}

## Nutrition Strategy Based on Symptoms
IMPORTANT: Tailor meals to address the user's specific symptom profile:
- High fatigue → Iron-rich foods, B-vitamins, steady energy (complex carbs, lean proteins). Avoid sugar spikes.
- Brain fog → Omega-3 rich foods (fatty fish, walnuts, flaxseed), blueberries, leafy greens. Limit processed foods.
- Pain/spasticity → Anti-inflammatory foods (turmeric, ginger, dark leafy greens, berries). Avoid refined sugars.
- High stress → Magnesium-rich foods (dark chocolate, avocado, nuts), chamomile, complex carbs for serotonin.
- Poor sleep → Tryptophan-rich foods for dinner (turkey, bananas, milk), limit caffeine after noon.
- Low mood → Vitamin D foods (fatty fish, eggs), probiotics, dark chocolate. Regular balanced meals.
- Low mobility → Lighter, easily digestible meals. Anti-inflammatory focus.

## Medication Interaction Awareness
- If on corticosteroids: increase calcium/vitamin D, limit sodium
- If on DMTs: support liver health (cruciferous vegetables, avoid excessive alcohol)
- If on muscle relaxants: avoid excessive sedative foods at same time
- Note any specific interactions with the medications listed above

## Available Recipes
${JSON.stringify(recipes.map((r: any) => ({ id: r.id, name: r.name, meal: r.meal })), null, 2)}

Return a JSON object with three keys:
1. "plan" — mapping each day to meal assignments using recipe IDs or "custom:Meal Name"
2. "reasoning" — an array of 3-5 short explanations (max 120 chars each) about WHY specific meals were chosen, linking them to the user's symptoms, medications, or energy level. Use this format: "Meal Name — benefit for symptom/condition"
3. "daily_nutrition" — an object mapping each day to estimated nutrition:
   { "calories": number, "omega3_mg": number, "anti_inflammatory_score": number (1-10), "top_nutrients": ["nutrient1", "nutrient2"] }
   - calories: estimated total daily calories from all 4 meals
   - omega3_mg: estimated omega-3 fatty acids in milligrams
   - anti_inflammatory_score: 1-10 rating of how anti-inflammatory the day's meals are (10 = most anti-inflammatory)
   - top_nutrients: 2-3 key nutrients that day's meals are especially rich in (e.g. "Vitamin D", "Iron", "Magnesium")

${isSingleDay ? `Format (single day):
{
  "plan": { "${single_day}": { "breakfast": "recipe_id_or_custom:name", "lunch": "...", "dinner": "...", "snack": "..." } },
  "reasoning": [
    "Meal Name — benefit for symptom/condition"
  ],
  "daily_nutrition": {
    "${single_day}": { "calories": 1650, "omega3_mg": 2200, "anti_inflammatory_score": 8, "top_nutrients": ["Omega-3", "Turmeric", "Vitamin D"] }
  }
}

Rules:
- Generate meals ONLY for ${single_day}
- Cover all 4 meal types (breakfast, lunch, dinner, snack)` : `Format:
{
  "plan": { "monday": { "breakfast": "recipe_id_or_custom:name", "lunch": "...", "dinner": "...", "snack": "..." }, ... },
  "reasoning": [
    "Turmeric Salmon Bowl — omega-3s to ease brain fog",
    "Golden Milk Oats — anti-inflammatory turmeric for pain relief",
    "Simple wraps on low-energy days — quick prep to conserve spoons"
  ],
  "daily_nutrition": {
    "monday": { "calories": 1650, "omega3_mg": 2200, "anti_inflammatory_score": 8, "top_nutrients": ["Omega-3", "Turmeric", "Vitamin D"] },
    "tuesday": { "calories": 1580, "omega3_mg": 900, "anti_inflammatory_score": 7, "top_nutrients": ["Iron", "Fiber", "B-vitamins"] }
  }
}

Rules:
- Cover all 7 days (monday through sunday)
- Cover all 4 meal types (breakfast, lunch, dinner, snack)`}
- Prioritize anti-inflammatory and nutrient-dense foods
- Adapt meal complexity to the user's energy level
- Vary meals across the week for nutritional diversity
- Use available recipe IDs when appropriate, custom meals for variety
- The reasoning entries should reference the user's ACTUAL symptoms, medications, and energy
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
          { role: "system", content: "You are an MS nutrition specialist. Return only valid JSON." },
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

    let parsed;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
    } catch {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to generate meal plan");
    }

    // Support both nested { plan, reasoning } and flat plan object
    const plan = parsed.plan || parsed;
    const reasoning = parsed.reasoning || [];
    const daily_nutrition = parsed.daily_nutrition || {};

    return new Response(JSON.stringify({ plan, reasoning, daily_nutrition }), {
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
