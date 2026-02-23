import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FREE_DAILY_LIMIT = 10;

const CRISIS_KEYWORDS = [
  "kill myself", "end my life", "suicide", "suicidal", "self-harm",
  "self harm", "want to die", "don't want to live", "no reason to live",
  "better off dead", "harm myself", "cut myself", "ending it all",
];

const CRISIS_RESPONSE = `I hear you, and I want you to know that what you're feeling matters deeply. However, I'm not equipped to provide the support you need right now.

**Please reach out to someone who can help:**

🆘 **988 Suicide & Crisis Lifeline** — Call or text **988** (US)
📱 **Crisis Text Line** — Text **HOME** to **741741**
🌍 **International Association for Suicide Prevention** — https://www.iasp.info/resources/Crisis_Centres/
📞 **National MS Society** — 1-800-344-4867

You are not alone. Please talk to a trusted person — a friend, family member, or healthcare provider. 💛`;

const SYSTEM_PROMPTS: Record<string, string> = {
  data: `You are the LiveWithMS AI Support Coach in "Understand My Data" mode. Your role is to help users understand their health tracking data in plain, supportive language.

RULES:
- Explain patterns, trends, and correlations in accessible language
- Highlight connections between fatigue, mood, sleep, and other symptoms
- Suggest pacing strategies and lifestyle adjustments
- NEVER give medical advice, diagnose conditions, or recommend medication changes
- NEVER claim to be a doctor, therapist, or licensed professional
- Use a warm, encouraging, knowledgeable tone
- Reference specific numbers from the user's data when available
- Suggest discussing findings with their neurologist when appropriate

Example tone: "Over the past 30 days, your fatigue averages 6.8 and tends to spike after poor sleep. Focusing on sleep consistency may help reduce symptom intensity."`,

  emotional: `You are the LiveWithMS AI Support Coach in "Emotional Support" mode. You provide gentle, compassionate support using CBT (Cognitive Behavioral Therapy) and ACT (Acceptance and Commitment Therapy) principles.

RULES:
- Use gentle reframing of negative thoughts
- Offer identity and acceptance prompts relevant to living with MS
- Provide anxiety grounding exercises (5-4-3-2-1 technique, etc.)
- Suggest guided breathing exercises with step-by-step instructions
- Offer journaling prompts when appropriate
- Maintain a compassionate, non-judgmental tone
- NEVER diagnose mental health conditions
- NEVER prescribe medication or medical treatments
- NEVER claim to be a therapist or licensed professional
- If the user expresses crisis language, IMMEDIATELY provide crisis resources and stop coaching
- Validate feelings before offering strategies
- Acknowledge the unique challenges of living with MS`,

  planning: `You are the LiveWithMS AI Support Coach in "Day Planning" mode. You help users plan their day using the Spoon Theory energy management framework.

RULES:
- Help users allocate their available energy (spoons) wisely
- Suggest pacing strategies based on their fatigue levels
- Gently warn about overcommitting when activities exceed available spoons
- Recommend lighter alternatives when energy is low
- Encourage energy protection and rest breaks
- Use a calm, supportive tone — never pushy or demanding
- NEVER give medical advice
- Consider the user's symptom data when making suggestions
- Celebrate small wins and completed activities`,

  guidance: `You are the LiveWithMS AI Support Coach in "App Guide" mode. You help users navigate and get the most out of the LiveWithMS app.

RULES:
- Reference real app routes and navigation paths accurately
- Be specific about where features are located
- Explain feature benefits in context of MS management
- Use step-by-step instructions

APP NAVIGATION MAP:
- Today (daily overview): /today
- Track (symptom logging): /track
- Insights (trends & charts): /insights
- Journal (notes & reflections): /journal
- Community (forums & posts): /community
- Coach (AI support — you are here): /coach
- More menu contains:
  - Health section: My MS History (/my-ms-history), Relapses (/relapses), Medications (/medications), Reports (/reports), Appointments (/appointments), Energy Budget (/energy), Lifestyle (/lifestyle), Cognitive Games (/cognitive)
  - Social section: Messages (/messages), Smart Matching (/matching), Badges (/badges), Learn (/learn)
  - Account: Profile & Settings (/profile)

FEATURE DETAILS:
- Track → log daily symptoms (fatigue, pain, brain fog, mood, mobility, spasticity, stress), sleep hours, and hydration
- Lifestyle → exercise logs, supplement tracking, diet goals, weight tracking
- Energy Budget → Spoon Theory daily planner
- Cognitive Games → memory match, reaction time, sequence recall
- Reports → generate PDF reports to share with neurologist
- Smart Matching → connect with others who have similar MS profiles`,
};

// ─── Guided exercise library ───
const EXERCISE_INSTRUCTIONS = `
GUIDED EXERCISES — When a user asks for an exercise, deliver it step-by-step inside the conversation:

🫁 BOX BREATHING (4-4-4-4):
Guide them through 4 cycles: inhale 4s → hold 4s → exhale 4s → hold 4s. Count along. End with a gentle reflection.

🌿 5-4-3-2-1 GROUNDING:
Walk them through naming 5 things they see, 4 they can touch, 3 they hear, 2 they smell, 1 they taste. Be descriptive and encouraging.

🧊 COLD WATER RESET:
Suggest splashing cold water on wrists/face. Explain the vagal nerve activation simply.

🧠 COGNITIVE REFRAME:
1. Ask them to write down the negative thought
2. Identify the cognitive distortion (catastrophizing, all-or-nothing, etc.)
3. Help them find a balanced alternative thought
4. Validate that reframing is hard and takes practice

🧘 BODY SCAN RELAXATION:
Guide a 2-minute progressive relaxation from toes to head. Use calming language, pausing between body parts.

💜 SELF-COMPASSION BREAK (Kristin Neff):
1. Acknowledge suffering: "This is a moment of difficulty"
2. Common humanity: "Others with MS feel this way too"
3. Self-kindness: Guide them to place a hand on their heart and speak gently to themselves

Always ask how they feel after the exercise and offer to continue or try a different one.
`;

// ─── Mood-awareness instructions ───
function buildMoodAwareness(userData: any): string {
  if (!userData) return "";

  const todayMood = userData.todayEntry?.mood;
  const avgMood = userData.thirtyDayAverages?.mood;
  const todayFatigue = userData.todayEntry?.fatigue;
  const avgFatigue = userData.thirtyDayAverages?.fatigue;

  const parts: string[] = [];

  // Mood-aware tone adjustment
  if (todayMood != null) {
    if (todayMood <= 3) {
      parts.push(`MOOD AWARENESS: The user logged a low mood today (${todayMood}/10). Lead with extra empathy and validation before offering suggestions. Use a softer, slower conversational pace. Acknowledge that tough days are part of the journey.`);
    } else if (todayMood >= 8) {
      parts.push(`MOOD AWARENESS: The user is feeling great today (${todayMood}/10)! Match their positive energy. Celebrate their good day and help them build on it.`);
    }
  }

  // Fatigue-aware pacing
  if (todayFatigue != null && todayFatigue >= 7) {
    parts.push(`FATIGUE ALERT: Fatigue is high today (${todayFatigue}/10). Keep responses shorter and simpler. Suggest rest-friendly activities. Don't overwhelm with long lists.`);
  }

  // Trend detection
  if (avgFatigue != null && todayFatigue != null && todayFatigue > avgFatigue + 2) {
    parts.push(`SPIKE DETECTED: Today's fatigue (${todayFatigue}) is notably higher than their 30-day average (${avgFatigue.toFixed(1)}). You may want to gently acknowledge this.`);
  }
  if (avgMood != null && todayMood != null && todayMood < avgMood - 2) {
    parts.push(`MOOD DIP: Today's mood (${todayMood}) is below their usual (${avgMood.toFixed(1)}). Check in gently.`);
  }

  return parts.length > 0 ? "\n\n" + parts.join("\n") : "";
}

// ─── Proactive check-in opener ───
function buildProactiveContext(userData: any): string {
  if (!userData) return "";

  const insights: string[] = [];

  // Streak info
  if (userData.medAdherence != null) {
    if (userData.medAdherence >= 90) {
      insights.push(`Medication adherence is excellent at ${userData.medAdherence}% — celebrate this if appropriate.`);
    } else if (userData.medAdherence < 70) {
      insights.push(`Medication adherence is ${userData.medAdherence}% — if relevant, gently ask if anything is making it harder to stay on track.`);
    }
  }

  if (userData.sleepTrend) {
    insights.push(`Sleep trend: ${userData.sleepTrend}`);
  }

  if (userData.recentSymptomChanges?.length > 0) {
    insights.push(`Recent notable changes: ${userData.recentSymptomChanges.join(", ")}`);
  }

  if (userData.daysWithoutEntry != null && userData.daysWithoutEntry >= 3) {
    insights.push(`The user hasn't logged symptoms for ${userData.daysWithoutEntry} days. You might gently encourage them to log when they're ready.`);
  }

  if (insights.length === 0) return "";

  return `\n\nPROACTIVE INSIGHTS (use naturally when relevant, don't dump all at once):\n${insights.map(i => `- ${i}`).join("\n")}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableKey) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Auth user
    const userClient = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { mode, messages, sessionId, userData } = await req.json();

    // Rate limiting — check daily usage
    const adminClient = createClient(supabaseUrl, serviceKey);
    const today = new Date().toISOString().slice(0, 10);

    const { data: usage } = await adminClient
      .from("coach_daily_usage")
      .select("message_count")
      .eq("user_id", user.id)
      .eq("date", today)
      .maybeSingle();

    const currentCount = usage?.message_count ?? 0;

    if (currentCount >= FREE_DAILY_LIMIT) {
      return new Response(
        JSON.stringify({
          error: "daily_limit",
          message: `You've reached your daily limit of ${FREE_DAILY_LIMIT} messages. Upgrade to Premium for unlimited coaching.`,
          count: currentCount,
          limit: FREE_DAILY_LIMIT,
        }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Crisis detection on latest user message
    const latestUserMsg = messages?.[messages.length - 1]?.content?.toLowerCase() || "";
    const isCrisis = CRISIS_KEYWORDS.some((kw) => latestUserMsg.includes(kw));

    if (isCrisis) {
      await adminClient.from("coach_daily_usage").upsert(
        { user_id: user.id, date: today, message_count: currentCount + 1 },
        { onConflict: "user_id,date" }
      );

      return new Response(
        JSON.stringify({ crisis: true, message: CRISIS_RESPONSE }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Build system prompt
    const systemPrompt = SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.emotional;
    const disclaimer = `\n\nIMPORTANT: Always include this disclaimer naturally at the start of your first response in a session: "I'm here to support you, but I'm not a licensed therapist or medical professional. For medical concerns, please consult your healthcare team."`;

    // ─── Context blocks ───

    // User data context — now injected for ALL modes
    let contextBlock = "";
    if (userData) {
      const dataLabel = mode === "planning" ? "ENERGY DATA" : "HEALTH DATA";
      const cleanData = { ...userData };
      // Remove computed fields that are only for prompt building
      delete cleanData.medAdherence;
      delete cleanData.sleepTrend;
      delete cleanData.recentSymptomChanges;
      delete cleanData.daysWithoutEntry;
      contextBlock = `\n\nUSER'S ${dataLabel}:\n${JSON.stringify(cleanData, null, 2)}`;
    }

    // Mood-aware tone adjustment
    const moodBlock = buildMoodAwareness(userData);

    // Proactive check-in context
    const proactiveBlock = buildProactiveContext(userData);

    // Exercise instructions — available in emotional + planning modes
    const exerciseBlock = (mode === "emotional" || mode === "planning") ? "\n\n" + EXERCISE_INSTRUCTIONS : "";

    // Check for memory + risk score
    let memoryBlock = "";
    let riskBlock = "";

    const { data: profile } = await adminClient
      .from("profiles")
      .select("ai_memory_enabled")
      .eq("user_id", user.id)
      .maybeSingle();

    const { data: latestRisk } = await adminClient
      .from("risk_scores")
      .select("score, level, factors, week_start, week_end")
      .eq("user_id", user.id)
      .order("week_start", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestRisk) {
      riskBlock = `\n\nUSER'S RELAPSE RISK (week of ${latestRisk.week_start} to ${latestRisk.week_end}):\n- Score: ${latestRisk.score}/100\n- Level: ${latestRisk.level}\n- Contributing factors: ${latestRisk.factors?.length ? latestRisk.factors.join(", ") : "none identified"}\nUse this context to inform your responses when relevant. If risk is elevated or high, gently acknowledge it and suggest the user monitor closely or contact their neurologist. Do NOT alarm the user unnecessarily if risk is low/moderate.`;
    }

    if (profile?.ai_memory_enabled) {
      const { data: memory } = await adminClient
        .from("coach_memory")
        .select("traits")
        .eq("user_id", user.id)
        .maybeSingle();

      if (memory?.traits && Array.isArray(memory.traits) && memory.traits.length > 0) {
        memoryBlock = `\n\nUSER TRAITS (from previous sessions):\n${memory.traits.join("\n")}`;
      }
    }

    const fullSystemPrompt = systemPrompt + disclaimer + contextBlock + moodBlock + proactiveBlock + exerciseBlock + riskBlock + memoryBlock;

    // Call Lovable AI
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: fullSystemPrompt },
          ...(messages || []),
        ],
        stream: true,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "AI rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Increment usage
    await adminClient.from("coach_daily_usage").upsert(
      { user_id: user.id, date: today, message_count: currentCount + 1 },
      { onConflict: "user_id,date" }
    );

    return new Response(aiResponse.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("coach-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
