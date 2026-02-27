import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { exerciseLogs, symptomEntries, msType, mode, coachInput } = body;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    let prompt: string | undefined;
    let messages: { role: string; content: string }[] | undefined;

    if (mode === "coach_chat") {
      const { chatMessages, planContext } = body;
      const systemPrompt = `You are a certified personal fitness coach specializing in MS (Multiple Sclerosis) patients.
You are having a conversation with a user about their fitness plan and exercise routine.

${planContext ? `**Their current training plan:**
${JSON.stringify(planContext)}` : "They don't have a saved plan yet."}

**Their MS Type:** ${msType || "Not specified"}
**Recent symptoms (last 7 days):** ${JSON.stringify(symptomEntries || [])}
**Recent exercise history:** ${JSON.stringify(exerciseLogs || [])}

GUIDELINES:
- Be warm, encouraging, and specific to MS
- If they ask to modify their plan, suggest specific changes with sets/reps/rest
- Account for MS fatigue, heat sensitivity, and balance issues
- If they describe new symptoms or pain, suggest modifications or rest
- Keep responses concise but helpful (2-4 paragraphs max)
- Use emoji sparingly for warmth
- If they ask something outside your expertise, say so and suggest consulting their neurologist
- When suggesting plan changes, be specific about which day/exercise to swap`;

      messages = [
        { role: "system", content: systemPrompt },
        ...(chatMessages || []).map((m: any) => ({ role: m.role, content: m.content })),
      ];
    } else if (mode === "fitness_coach") {
      prompt = `You are a certified personal fitness coach specializing in MS (Multiple Sclerosis) patients.
Create a detailed, personalized weekly training plan based on the following:

**User's Goals:** ${JSON.stringify(coachInput?.goals || [])}
**Exercises they can do:** ${JSON.stringify(coachInput?.abilities || [])}
**Session duration:** ${coachInput?.sessionDuration || "Not specified"}
**Weekly frequency:** ${coachInput?.weeklyFrequency || "Not specified"}
**Fitness level:** ${coachInput?.fitnessLevel || "beginner"}
**Gym access:** ${coachInput?.hasGym === true ? "Yes" : coachInput?.hasGym === false ? "No, home workouts only" : "Not specified"}
**Equipment available:** ${JSON.stringify(coachInput?.equipment || [])}
**Injuries/limitations:** ${coachInput?.limitations || "None reported"}
**Preferred workout time:** ${coachInput?.preferredTime || "Flexible"}
**Additional notes:** ${coachInput?.additionalNotes || "None"}

**MS Type:** ${msType || "Not specified"}
**Recent symptoms (last 7 days):** ${JSON.stringify(symptomEntries)}
**Recent exercise history:** ${JSON.stringify(exerciseLogs)}

CRITICAL GUIDELINES:
- ONLY recommend exercises from the abilities they listed
- Match the weekly_schedule to their weekly frequency (rest days on non-workout days)
- Each session should match their chosen session duration
- Adapt difficulty to their fitness level
- If no gym, ONLY use their listed equipment or bodyweight
- Account for MS fatigue: include rest days and lower-intensity options
- Consider heat sensitivity common in MS
- If high fatigue in recent symptoms, reduce intensity
- Respect any injuries/limitations listed
- If they prefer a specific time of day, tailor warmup/cooldown accordingly (e.g., morning = longer warmup)

IMPORTANT: For each workout day, provide SPECIFIC exercises with sets, reps, and rest times.

Respond with ONLY valid JSON:
{
  "overview": "2-3 sentence personalized overview of the plan and why it suits them",
  "weekly_schedule": [
    {
      "day": "Monday",
      "workout_name": "e.g. Upper Body Strength",
      "duration": "e.g. 30 minutes",
      "warmup": "Specific warmup instructions (2-3 min)",
      "exercises": [
        { "name": "Exercise name", "sets": "3", "reps": "10-12", "rest": "60s", "instruction": "Brief form tip or MS-specific modification" }
      ],
      "cooldown": "Specific cooldown instructions (2-3 min)",
      "notes": "Any MS-specific tips for this session"
    }
  ],
  "tips": ["4-6 actionable tips specific to their goals, fitness level, and MS"],
  "progression": "Detailed 4-6 week progression plan with specific milestones",
  "caution": "Any important MS-specific caution, or null if none"
}

Include ALL 7 days (Mon-Sun). Non-workout days should have workout_name "Rest Day" or "Active Recovery" with appropriate light activities.`;
    } else if (mode === "daily_suggestion") {
      prompt = `You are an MS wellness specialist. Based on recent exercise and symptom data, suggest ONE exercise for today.

Recent exercises: ${JSON.stringify(exerciseLogs)}
Recent symptoms (last 7 days): ${JSON.stringify(symptomEntries)}
MS Type: ${msType || "Not specified"}

Consider:
- If fatigue is high recently, suggest low-intensity
- Avoid repeating the same exercise too many consecutive days
- Account for MS-specific needs (heat sensitivity, balance, spasticity)
- If no data, give a safe general suggestion

Respond with ONLY valid JSON:
{
  "exercise": "Exercise name",
  "duration": "e.g. 15-20 minutes",
  "intensity": "light/moderate/vigorous",
  "reason": "1-2 sentences explaining why this is ideal today",
  "alternative": "A lower-energy alternative if they're not feeling up to it",
  "caution": "Any MS-specific caution, or null if none"
}`;
    } else {
      prompt = `You are an MS wellness specialist analyzing the relationship between exercise and symptoms.

Exercise data (last 30 days): ${JSON.stringify(exerciseLogs)}
Symptom data (last 30 days): ${JSON.stringify(symptomEntries)}
MS Type: ${msType || "Not specified"}

Analyze the correlation between exercise patterns and symptom changes. Respond with ONLY valid JSON:
{
  "summary": "2-3 sentence overview of exercise-symptom patterns",
  "best_exercise": { "type": "string (best exercise type for this user)", "reason": "why it helps" },
  "worst_days": "pattern of when symptoms worsen relative to exercise",
  "recommendations": ["3-4 specific actionable tips"],
  "fatigue_insight": "how exercise timing/intensity affects fatigue levels",
  "optimal_pattern": "recommended exercise frequency and intensity based on data"
}

Guidelines:
- Be specific to THIS user's data patterns
- Consider MS-specific concerns like heat sensitivity, fatigue management
- Note if certain exercise types correlate with better or worse symptom days
- If data is limited, say so and give general MS exercise guidance`;
    }

    const aiMessages = messages || [
      { role: "system", content: "You are an MS exercise specialist. Return only valid JSON, no markdown." },
      { role: "user", content: prompt! },
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: aiMessages,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${status}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "";

    // For chat mode, return the raw text reply
    if (mode === "coach_chat") {
      return new Response(JSON.stringify({ reply: content }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(content);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("exercise-correlation error:", e);
    return new Response(JSON.stringify({ error: e.message || "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
