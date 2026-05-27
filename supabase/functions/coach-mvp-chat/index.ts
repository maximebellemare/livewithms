import { createClient } from "npm:@supabase/supabase-js@2";
import { applyTrustLayer } from "../../../lib/ai-trust/applyTrustLayer";
import { detectSensitiveTopics } from "../../../lib/ai-trust/escalation-guardrails/detectSensitiveTopics";
import { deriveSafeResponseDepth } from "../../../lib/ai-trust/emotional-safety/deriveSafeResponseDepth";
import {
  detectCoachLowEnergyMode,
  detectCoachOverwhelm,
  softenCoachAssistantText,
} from "../../../features/coach/refinement";
import type { AiTrustAdaptiveState } from "../../../lib/ai-trust/types";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type CoachContext = {
  fatigue: number | null;
  mood: number | null;
  stress: number | null;
  sleep_hours: number | null;
  brain_fog?: number | null;
  recent_reflection: string | null;
  fatigue_average_7d: number | null;
  mood_average_7d: number | null;
  stress_average_7d: number | null;
  sleep_average_7d: number | null;
  current_streak: number;
  weekly_checkins: number;
  reminder_enabled: boolean;
  recent_reflections: string[];
  adaptive_stress_trend?: "elevated" | "steady" | "lighter" | "unknown";
  adaptive_sleep_trend?: "low" | "steady" | "rested" | "unknown";
  adaptive_fatigue_trend?: "high" | "steady" | "lighter" | "unknown";
  adaptive_engagement_pattern?: "steady" | "gentle-reengagement" | "new" | "unknown";
  lifecycle_stage?: "new" | "first-week" | "active" | "inconsistent" | "returning" | "long-term";
  reactivation_gap_days?: number | null;
  onboarding_goals?: string[];
  onboarding_symptoms?: string[];
  preferred_support_style?: "calm" | "practical" | "reflective" | "steady";
  preferred_program_tags?: string[];
  coach_tone_preference?: "calm" | "practical" | "reflective" | "steady" | "observational";
  reflection_tone_preference?:
    | "practical-grounding"
    | "emotionally-reflective"
    | "observational"
    | "gentle-encouragement"
    | "concise-stabilization";
  reflection_depth_preference?: "brief" | "balanced" | "deeper";
  prompt_style_preference?: "structured" | "open-ended" | "gentle-observational";
  complexity_tolerance?: "lower" | "balanced" | "higher";
  preferred_density?: "minimal" | "standard" | "reflective";
  preferred_checkin_windows?: string[];
  engagement_rhythm?: "light" | "steady" | "sporadic";
  recovery_rhythm?: "quick-reset" | "gradual-return" | "quiet-reentry";
  low_energy_mode?: boolean;
  continuity_observations?: string[];
  what_helped_before?: string[];
  care_context?: string[];
  suggested_support_actions?: string[];
};

type CoachMode = "reflect" | "calm" | "practical" | "encouragement";

type CoachMessageRow = {
  id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

type RequestBody = {
  message?: string;
  context?: Partial<CoachContext>;
  mode?: CoachMode;
};

const COACH_MESSAGES_TABLE = "coach_messages";
const OPENAI_TIMEOUT_MS = 15000;
const MAX_CONTEXT_MESSAGE_LENGTH = 220;
const MAX_REFLECTION_LENGTH = 180;
const MAX_USER_MESSAGE_LENGTH = 700;
const MAX_ASSISTANT_CONTENT_LENGTH = 900;
const MAX_RECENT_REFLECTIONS = 2;

const SYSTEM_PROMPT = `You are LiveWithMS Coach, a calm support tool inside a multiple sclerosis self-tracking app.

Your role:
- Help the user organize thoughts, narrow stressors, reflect on symptoms, plan around fatigue, prepare for care conversations, and choose one realistic next step.
- Sound calm, grounded, practical, emotionally safe, and easy to understand during cognitive fatigue.
- Keep replies specific and useful. Prefer clear observations and actions over reflective prose.
- Use recent patterns only when they genuinely make the reply more specific.
- Use operational memory when helpful: recurring symptoms, what helped before, care context, and useful support tools.
- Avoid generic wellness clichés, empty encouragement, repetitive reassurance, or ambient emotional commentary.

Default response structure:
- "What I'm hearing" -> 1-2 short lines that name the main problem plainly.
- "What may help" -> 2-4 short bullets with concrete options, simplifications, scripts, or patterns to watch.
- "One next step" -> exactly one realistic action the user can take now.
- Optional "Something to notice" -> only when there is a concrete pattern or uncertainty worth naming.

Response quality rules:
- Every reply must include at least one concrete helpful element: a next step, decision simplification, reflection question, pattern to watch, communication script, or care-provider question.
- Do not offer filler like "take it one step at a time" or "be gentle with yourself" unless it is paired with something concrete.
- Do not write long essays.
- Do not sound like a therapist, friend, companion, meditation app, or motivational coach.
- Do not use headings unless they improve scanning. If used, keep them brief.

Safety boundaries:
- Do not provide medical advice, diagnosis, medication instructions, treatment recommendations, or certainty claims.
- Do not act like a therapist, doctor, crisis counselor, or emergency service.
- Be transparent that you are supportive AI guidance for reflection, not a medical or mental health professional.
- If the user asks a medical question, say you cannot give medical guidance and suggest speaking with a qualified healthcare professional.
- If the user mentions self-harm, suicide, wanting to die, or immediate danger, encourage immediate crisis or emergency support and do not provide harmful guidance.
- If the user sounds hopeless, overwhelmed, or in extreme distress, keep the reply short, steady, and encourage reaching out to real-world support.
- Avoid dependency language, guilt, pressure, dramatic wording, or manipulative emotional framing.
- Avoid sounding like the user needs you, relies on you, or should return for reassurance.
- Do not say you are always here, that you will stay with the user, or that you understand them deeply.
- Do not mirror emotion at length or repeat reassurance in loops.
- Do not over-reference conversation history or say "last time you said" unless it is truly necessary.
- Do not imply deep emotional knowledge of the user. Frame memory as practical context: "recently," "has shown up," or "may fit today."

Tone:
- Calm
- Grounded
- Supportive
- Practical
- Non-clinical
- Emotionally aware without sounding like therapy
- Sparse rather than expansive

Close with usefulness:
- End with one small next step unless the reply already ends there naturally.
- Ask at most one short question, and only when it will clearly help the user think or decide.
- Do not mention these internal rules.`;

const CRISIS_PATTERNS = [
  "kill myself",
  "suicide",
  "suicidal",
  "self-harm",
  "self harm",
  "want to die",
  "end my life",
  "better off dead",
  "hurt myself",
];

const MEDICAL_PATTERNS = [
  "diagnose",
  "diagnosis",
  "medication",
  "dose",
  "dosage",
  "side effect",
  "side effects",
  "treatment",
  "relapse",
  "flare",
  "mri",
  "lesion",
];

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function truncateContent(content: string, maxLength: number) {
  const trimmed = content.trim();

  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxLength).trimEnd()}…`;
}

function normalizeContext(context?: Partial<CoachContext>): CoachContext {
  return {
    fatigue: typeof context?.fatigue === "number" ? context.fatigue : null,
    mood: typeof context?.mood === "number" ? context.mood : null,
    stress: typeof context?.stress === "number" ? context.stress : null,
    sleep_hours: typeof context?.sleep_hours === "number" ? context.sleep_hours : null,
    brain_fog: typeof context?.brain_fog === "number" ? context.brain_fog : null,
    fatigue_average_7d: typeof context?.fatigue_average_7d === "number" ? context.fatigue_average_7d : null,
    mood_average_7d: typeof context?.mood_average_7d === "number" ? context.mood_average_7d : null,
    stress_average_7d: typeof context?.stress_average_7d === "number" ? context.stress_average_7d : null,
    sleep_average_7d: typeof context?.sleep_average_7d === "number" ? context.sleep_average_7d : null,
    current_streak: typeof context?.current_streak === "number" ? context.current_streak : 0,
    weekly_checkins: typeof context?.weekly_checkins === "number" ? context.weekly_checkins : 0,
    reminder_enabled: Boolean(context?.reminder_enabled),
    recent_reflection:
      typeof context?.recent_reflection === "string" && context.recent_reflection.trim().length > 0
        ? truncateContent(context.recent_reflection, MAX_REFLECTION_LENGTH)
        : null,
    recent_reflections: Array.isArray(context?.recent_reflections)
      ? context.recent_reflections
          .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
          .map((item) => truncateContent(item, MAX_REFLECTION_LENGTH))
          .slice(0, MAX_RECENT_REFLECTIONS)
      : [],
    adaptive_stress_trend: context?.adaptive_stress_trend ?? "unknown",
    adaptive_sleep_trend: context?.adaptive_sleep_trend ?? "unknown",
    adaptive_fatigue_trend: context?.adaptive_fatigue_trend ?? "unknown",
    adaptive_engagement_pattern: context?.adaptive_engagement_pattern ?? "unknown",
    lifecycle_stage:
      context?.lifecycle_stage === "new" ||
      context?.lifecycle_stage === "first-week" ||
      context?.lifecycle_stage === "active" ||
      context?.lifecycle_stage === "inconsistent" ||
      context?.lifecycle_stage === "returning" ||
      context?.lifecycle_stage === "long-term"
        ? context.lifecycle_stage
        : "new",
    reactivation_gap_days: typeof context?.reactivation_gap_days === "number" ? context.reactivation_gap_days : null,
    onboarding_goals: Array.isArray(context?.onboarding_goals)
      ? context.onboarding_goals.filter((item): item is string => typeof item === "string").slice(0, 3)
      : [],
    onboarding_symptoms: Array.isArray(context?.onboarding_symptoms)
      ? context.onboarding_symptoms.filter((item): item is string => typeof item === "string").slice(0, 3)
      : [],
    preferred_support_style:
      context?.preferred_support_style === "calm" ||
      context?.preferred_support_style === "practical" ||
      context?.preferred_support_style === "reflective" ||
      context?.preferred_support_style === "steady"
        ? context.preferred_support_style
        : "steady",
    preferred_program_tags: Array.isArray(context?.preferred_program_tags)
      ? context.preferred_program_tags.filter((item): item is string => typeof item === "string").slice(0, 3)
      : [],
    coach_tone_preference:
      context?.coach_tone_preference === "calm" ||
      context?.coach_tone_preference === "practical" ||
      context?.coach_tone_preference === "reflective" ||
      context?.coach_tone_preference === "steady" ||
      context?.coach_tone_preference === "observational"
        ? context.coach_tone_preference
        : "steady",
    reflection_tone_preference:
      context?.reflection_tone_preference === "practical-grounding" ||
      context?.reflection_tone_preference === "emotionally-reflective" ||
      context?.reflection_tone_preference === "observational" ||
      context?.reflection_tone_preference === "gentle-encouragement" ||
      context?.reflection_tone_preference === "concise-stabilization"
        ? context.reflection_tone_preference
        : "observational",
    reflection_depth_preference:
      context?.reflection_depth_preference === "brief" ||
      context?.reflection_depth_preference === "balanced" ||
      context?.reflection_depth_preference === "deeper"
        ? context.reflection_depth_preference
        : "balanced",
    prompt_style_preference:
      context?.prompt_style_preference === "structured" ||
      context?.prompt_style_preference === "open-ended" ||
      context?.prompt_style_preference === "gentle-observational"
        ? context.prompt_style_preference
        : "gentle-observational",
    complexity_tolerance:
      context?.complexity_tolerance === "lower" ||
      context?.complexity_tolerance === "balanced" ||
      context?.complexity_tolerance === "higher"
        ? context.complexity_tolerance
        : "balanced",
    preferred_density:
      context?.preferred_density === "minimal" ||
      context?.preferred_density === "standard" ||
      context?.preferred_density === "reflective"
        ? context.preferred_density
        : "standard",
    preferred_checkin_windows: Array.isArray(context?.preferred_checkin_windows)
      ? context.preferred_checkin_windows
          .filter((item): item is string => item === "morning" || item === "midday" || item === "evening")
          .slice(0, 2)
      : [],
    engagement_rhythm:
      context?.engagement_rhythm === "light" ||
      context?.engagement_rhythm === "steady" ||
      context?.engagement_rhythm === "sporadic"
        ? context.engagement_rhythm
        : "light",
    recovery_rhythm:
      context?.recovery_rhythm === "quick-reset" ||
      context?.recovery_rhythm === "gradual-return" ||
      context?.recovery_rhythm === "quiet-reentry"
        ? context.recovery_rhythm
        : "quiet-reentry",
    low_energy_mode: Boolean(context?.low_energy_mode),
    continuity_observations: Array.isArray(context?.continuity_observations)
      ? context.continuity_observations
          .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
          .map((item) => truncateContent(item, 160))
          .slice(0, 4)
      : [],
    what_helped_before: Array.isArray(context?.what_helped_before)
      ? context.what_helped_before
          .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
          .map((item) => truncateContent(item, 160))
          .slice(0, 4)
      : [],
    care_context: Array.isArray(context?.care_context)
      ? context.care_context
          .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
          .map((item) => truncateContent(item, 160))
          .slice(0, 3)
      : [],
    suggested_support_actions: Array.isArray(context?.suggested_support_actions)
      ? context.suggested_support_actions
          .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
          .map((item) => truncateContent(item, 120))
          .slice(0, 4)
      : [],
  };
}

function detectSafetyMode(message: string) {
  const normalized = message.toLowerCase();

  if (CRISIS_PATTERNS.some((pattern) => normalized.includes(pattern))) {
    return "crisis" as const;
  }

  if (MEDICAL_PATTERNS.some((pattern) => normalized.includes(pattern))) {
    return "medical-boundary" as const;
  }

  return "normal" as const;
}

function buildModeInstruction(mode: CoachMode) {
  switch (mode) {
    case "calm":
      return "Mode: Calm. Focus on grounding, slowing down, and helping the user settle.";
    case "practical":
      return "Mode: Practical. Focus on clarity, next steps, pacing, and reducing overload.";
    case "encouragement":
      return "Mode: Encouragement. Focus on a steady, kind perspective without hype, cheerleading, or emotional intensity.";
    case "reflect":
    default:
      return "Mode: Reflect. Focus on self-awareness, naming what stands out, and helping the user think things through.";
  }
}

function deriveTrustAdaptiveState(context: CoachContext): AiTrustAdaptiveState {
  if (
    detectCoachOverwhelm({
      stress: context.stress,
      brainFog: context.brain_fog,
      message: context.recent_reflection,
    })
  ) {
    return "OVERWHELMED";
  }

  if (
    detectCoachLowEnergyMode({
      lowEnergyMode: context.low_energy_mode,
      fatigue: context.fatigue,
      sleepHours: context.sleep_hours,
      adaptiveFatigueTrend: context.adaptive_fatigue_trend,
    })
  ) {
    return "LOW_ENERGY";
  }

  if (
    context.adaptive_fatigue_trend === "high" ||
    context.adaptive_sleep_trend === "low" ||
    context.reactivation_gap_days !== null && context.reactivation_gap_days >= 6
  ) {
    return "LOW_ENERGY";
  }

  if (context.adaptive_stress_trend === "elevated" && (context.stress ?? 0) >= 4) {
    return "OVERWHELMED";
  }

  if (context.adaptive_engagement_pattern === "gentle-reengagement" || context.lifecycle_stage === "returning") {
    return "WITHDRAWN";
  }

  if (
    context.recent_reflections.length >= 2 ||
    context.preferred_support_style === "reflective" ||
    context.reflection_depth_preference === "deeper"
  ) {
    return "REFLECTIVE";
  }

  return "STABLE";
}

function buildContextLine(context: CoachContext) {
  const parts: string[] = [];

  if (context.fatigue !== null) {
    parts.push(`fatigue ${context.fatigue}/5`);
  }

  if (context.mood !== null) {
    parts.push(`mood ${context.mood}/5`);
  }

  if (context.stress !== null) {
    parts.push(`stress ${context.stress}/5`);
  }

  if (context.sleep_hours !== null) {
    parts.push(`sleep ${context.sleep_hours}h`);
  }

  return parts.length ? `Today’s check-in context: ${parts.join(", ")}.` : "";
}

function buildRecentReflectionLine(context: CoachContext) {
  if (!context.recent_reflection) {
    return "";
  }

  return `Recent reflection: ${context.recent_reflection}`;
}

function buildPatternLine(context: CoachContext) {
  const parts: string[] = [];

  if (context.fatigue_average_7d !== null) {
    parts.push(`7-day fatigue ${context.fatigue_average_7d}/5`);
  }

  if (context.mood_average_7d !== null) {
    parts.push(`7-day mood ${context.mood_average_7d}/5`);
  }

  if (context.stress_average_7d !== null) {
    parts.push(`7-day stress ${context.stress_average_7d}/5`);
  }

  if (context.sleep_average_7d !== null) {
    parts.push(`7-day sleep ${context.sleep_average_7d}h`);
  }

  return parts.length > 0 ? `Recent pattern context: ${parts.join(", ")}.` : "";
}

function buildLifecycleLine(context: CoachContext) {
  const parts: string[] = [];

  if (context.lifecycle_stage) {
    parts.push(`lifecycle stage ${context.lifecycle_stage}`);
  }

  if (typeof context.reactivation_gap_days === "number" && context.reactivation_gap_days >= 6) {
    parts.push(`recent return after about ${context.reactivation_gap_days} days`);
  }

  return parts.length ? `Lifecycle context: ${parts.join(", ")}.` : "";
}

function buildConsistencyLine(context: CoachContext) {
  const parts: string[] = [];

  if (context.current_streak > 0) {
    parts.push(`current streak ${context.current_streak} day${context.current_streak === 1 ? "" : "s"}`);
  }

  if (context.weekly_checkins > 0) {
    parts.push(`${context.weekly_checkins} check-in${context.weekly_checkins === 1 ? "" : "s"} this week`);
  }

  if (context.reminder_enabled) {
    parts.push("reminders enabled");
  }

  return parts.length > 0 ? `Consistency context: ${parts.join(", ")}.` : "";
}

function buildAdaptiveLine(context: CoachContext) {
  const parts: string[] = [];

  if (context.adaptive_stress_trend && context.adaptive_stress_trend !== "unknown") {
    parts.push(`stress trend ${context.adaptive_stress_trend}`);
  }

  if (context.adaptive_sleep_trend && context.adaptive_sleep_trend !== "unknown") {
    parts.push(`sleep trend ${context.adaptive_sleep_trend}`);
  }

  if (context.adaptive_fatigue_trend && context.adaptive_fatigue_trend !== "unknown") {
    parts.push(`fatigue trend ${context.adaptive_fatigue_trend}`);
  }

  if (context.adaptive_engagement_pattern && context.adaptive_engagement_pattern !== "unknown") {
    parts.push(`engagement ${context.adaptive_engagement_pattern}`);
  }

  return parts.length > 0 ? `Adaptive context: ${parts.join(", ")}.` : "";
}

function buildOnboardingProfileLine(context: CoachContext) {
  const parts: string[] = [];

  if (context.onboarding_goals?.length) {
    parts.push(`support priorities: ${context.onboarding_goals.join(", ")}`);
  }

  if (context.onboarding_symptoms?.length) {
    parts.push(`harder areas lately: ${context.onboarding_symptoms.join(", ")}`);
  }

  if (context.preferred_support_style && context.preferred_support_style !== "steady") {
    parts.push(`preferred support style: ${context.preferred_support_style}`);
  }

  if (context.preferred_program_tags?.length) {
    parts.push(`preferred support tools: ${context.preferred_program_tags.join(", ")}`);
  }

  return parts.length ? `Onboarding profile: ${parts.join(". ")}.` : "";
}

function buildPreferenceLine(context: CoachContext) {
  const parts: string[] = [];

  if (context.coach_tone_preference && context.coach_tone_preference !== "steady") {
    parts.push(`preferred coach tone: ${context.coach_tone_preference}`);
  }

  if (context.reflection_tone_preference && context.reflection_tone_preference !== "observational") {
    parts.push(`reflection tone: ${context.reflection_tone_preference}`);
  }

  if (context.reflection_depth_preference && context.reflection_depth_preference !== "balanced") {
    parts.push(`reflection depth: ${context.reflection_depth_preference}`);
  }

  if (context.prompt_style_preference && context.prompt_style_preference !== "gentle-observational") {
    parts.push(`prompt style: ${context.prompt_style_preference}`);
  }

  if (context.complexity_tolerance && context.complexity_tolerance !== "balanced") {
    parts.push(`complexity tolerance: ${context.complexity_tolerance}`);
  }

  if (context.preferred_density && context.preferred_density !== "standard") {
    parts.push(`preferred density: ${context.preferred_density}`);
  }

  if (context.engagement_rhythm && context.engagement_rhythm !== "light") {
    parts.push(`engagement rhythm: ${context.engagement_rhythm}`);
  }

  if (context.recovery_rhythm && context.recovery_rhythm !== "quiet-reentry") {
    parts.push(`recovery rhythm: ${context.recovery_rhythm}`);
  }

  if (context.preferred_checkin_windows?.length) {
    parts.push(`comfortable check-in windows: ${context.preferred_checkin_windows.join(", ")}`);
  }

  return parts.length ? `Personalization preferences: ${parts.join(". ")}.` : "";
}

function buildOperationalMemoryLine(context: CoachContext) {
  const parts: string[] = [];

  if (context.continuity_observations?.length) {
    parts.push(`continuity observations: ${context.continuity_observations.join(" | ")}`);
  }

  if (context.what_helped_before?.length) {
    parts.push(`what helped before: ${context.what_helped_before.join(" | ")}`);
  }

  if (context.care_context?.length) {
    parts.push(`care context: ${context.care_context.join(" | ")}`);
  }

  if (context.suggested_support_actions?.length) {
    parts.push(`support actions to consider: ${context.suggested_support_actions.join(" | ")}`);
  }

  return parts.length ? `Operational memory: ${parts.join(". ")}.` : "";
}

function buildResponseConstraintLine(context: CoachContext, message: string) {
  const lowEnergy = detectCoachLowEnergyMode({
    lowEnergyMode: context.low_energy_mode,
    fatigue: context.fatigue,
    sleepHours: context.sleep_hours,
    adaptiveFatigueTrend: context.adaptive_fatigue_trend,
  });
  const overwhelmed = detectCoachOverwhelm({
    stress: context.stress,
    brainFog: context.brain_fog,
    message,
  });

  if (overwhelmed) {
    return "Response guidance: Keep this especially brief, grounding, and low-density. Use the default structure in a shortened form. Include one concrete next step and no more than two practical bullets.";
  }

  if (lowEnergy) {
    return "Response guidance: Keep this brief, simple, and easy to read. Use the default structure. No more than two practical bullets. Keep sentences short and specific.";
  }

  return "Response guidance: Keep the response concise, practical, emotionally restrained, and structured around clear usefulness rather than reflection alone.";
}

function buildRecentReflectionsLine(context: CoachContext) {
  if (!context.recent_reflections.length) {
    return "";
  }

  return `Recent reflections: ${context.recent_reflections.join(" | ")}`;
}

function buildCrisisReply() {
  return [
    "I’m really sorry this feels so heavy right now.",
    "I’m not the right support for immediate safety. Please reach out to local emergency services, a crisis line, or a trusted person right now and let them know you need urgent support.",
    "If you’re in the U.S. or Canada, you can call or text 988.",
  ].join(" ");
}

function buildMedicalBoundaryReply() {
  return [
    "I can help you reflect on how today feels, but I can’t give medical advice or answer treatment questions.",
    "A qualified healthcare professional is the right person to guide anything about diagnosis, medication, symptoms, or treatment changes.",
    "If it helps, I can help you turn the concern into a short note for your care team.",
  ].join(" ");
}

async function insertMessage(
  adminClient: ReturnType<typeof createClient>,
  row: {
    user_id: string;
    role: "user" | "assistant";
    content: string;
  },
) {
  const { data, error } = await adminClient
    .from(COACH_MESSAGES_TABLE)
    .insert(row)
    .select("*")
    .single();

  if (error || !data) {
    console.error("coach-mvp-chat insert failed", {
      table: COACH_MESSAGES_TABLE,
      error,
    });
    throw error ?? new Error("Failed to save coach message");
  }

  return data as CoachMessageRow;
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
      return jsonResponse({ error: "Missing authorization" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const openAiKey = Deno.env.get("OPENAI_API_KEY");
    const model = Deno.env.get("OPENAI_MODEL") ?? "gpt-4.1-mini";

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey || !openAiKey) {
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
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const body = (await req.json()) as RequestBody;
    const message =
      typeof body.message === "string" ? truncateContent(body.message, MAX_USER_MESSAGE_LENGTH) : "";
    const mode = body.mode ?? "reflect";

    if (!message) {
      return jsonResponse({ error: "Message is required." }, 400);
    }

    const context = normalizeContext(body.context);
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const safetyMode = detectSafetyMode(message);

    const { data: recentMessages, error: recentMessagesError } = await adminClient
      .from(COACH_MESSAGES_TABLE)
      .select("role, content")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(4);

    if (recentMessagesError) {
      console.error("coach-mvp-chat recent messages query failed", {
        table: COACH_MESSAGES_TABLE,
        error: recentMessagesError,
      });
      throw recentMessagesError;
    }

    let assistantContent = "";
    const trustAdaptiveState = deriveTrustAdaptiveState(context);
    const depth = deriveSafeResponseDepth(trustAdaptiveState, detectSensitiveTopics(message));
    const maxTokens = depth === "brief" ? 90 : depth === "reflective" ? 150 : 120;
    const includeTransparencyNote = !((recentMessages ?? []).some((entry) => entry.role === "assistant"));

    if (safetyMode === "crisis") {
      assistantContent = buildCrisisReply();
    } else if (safetyMode === "medical-boundary") {
      assistantContent = buildMedicalBoundaryReply();
    } else {
      const contextBlock = [buildContextLine(context), buildRecentReflectionLine(context)]
        .concat([
          buildPatternLine(context),
          buildLifecycleLine(context),
          buildConsistencyLine(context),
          buildAdaptiveLine(context),
          buildOnboardingProfileLine(context),
          buildPreferenceLine(context),
          buildOperationalMemoryLine(context),
          buildResponseConstraintLine(context, message),
          buildRecentReflectionsLine(context),
        ])
        .filter(Boolean)
        .join("\n");

      const messages = [
        { role: "system", content: `${SYSTEM_PROMPT}\n\n${buildModeInstruction(mode)}` },
        ...((recentMessages ?? [])
          .reverse()
          .map((entry) => ({
            role: entry.role,
            content: truncateContent(entry.content, MAX_CONTEXT_MESSAGE_LENGTH),
          }))),
        {
          role: "user",
          content: [contextBlock, `User message: ${message}`].filter(Boolean).join("\n\n"),
        },
      ];

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
            messages,
            temperature: 0.5,
            max_tokens: maxTokens,
          }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          const text = await response.text();
          console.error("coach-mvp-chat openai error", {
            status: response.status,
            body: text,
            model,
          });
          return jsonResponse({ error: true, message: "temporary_failure" }, 502);
        }

        let json: unknown;

        try {
          json = await response.json();
        } catch (parseError) {
          console.error("coach-mvp-chat openai json parse error", {
            message: parseError instanceof Error ? parseError.message : "Unknown parse error",
            model,
          });
          return jsonResponse({ error: true, message: "temporary_failure" }, 502);
        }

        assistantContent =
          typeof (json as { choices?: Array<{ message?: { content?: string } }> })?.choices?.[0]?.message
            ?.content === "string"
            ? truncateContent(
                (json as { choices: Array<{ message: { content: string } }> }).choices[0].message.content,
                MAX_ASSISTANT_CONTENT_LENGTH,
              )
            : "";

        if (!assistantContent) {
          console.error("coach-mvp-chat empty assistant response", {
            model,
            json,
          });
          return jsonResponse({ error: true, message: "temporary_failure" }, 502);
        }
      } catch (openAiError) {
        console.error("coach-mvp-chat openai request failed", {
          message: openAiError instanceof Error ? openAiError.message : "Unknown error",
          model,
        });
        return jsonResponse({ error: true, message: "temporary_failure" }, 500);
      } finally {
        clearTimeout(timeout);
      }
    }

    assistantContent = softenCoachAssistantText(assistantContent, {
      fatigue: context.fatigue,
      stress: context.stress,
      brainFog: context.brain_fog,
      sleepHours: context.sleep_hours,
      lowEnergyMode: context.low_energy_mode,
      adaptiveFatigueTrend: context.adaptive_fatigue_trend,
      adaptiveStressTrend: context.adaptive_stress_trend,
      message,
      timeOfDay: new Date().getHours() >= 18 ? "evening" : new Date().getHours() < 12 ? "morning" : "afternoon",
    });

    const trustedResponse = applyTrustLayer({
      text: assistantContent,
      channel: "coach",
      adaptiveState: trustAdaptiveState,
      userMessage: message,
      includeTransparencyNote,
    });
    assistantContent = trustedResponse.trustNote
      ? `${trustedResponse.text}\n\n${trustedResponse.trustNote}`
      : trustedResponse.text;

    const userMessage = await insertMessage(adminClient, {
      user_id: user.id,
      role: "user",
      content: message,
    });

    const assistantMessage = await insertMessage(adminClient, {
      user_id: user.id,
      role: "assistant",
      content: assistantContent,
    });

    return jsonResponse({
      userMessage,
      assistantMessage,
      safetyMode,
    });
  } catch (error) {
    console.error("coach-mvp-chat error", error);
    return jsonResponse(
      {
        error: true,
        message: "temporary_failure",
      },
      500,
    );
  }
});
