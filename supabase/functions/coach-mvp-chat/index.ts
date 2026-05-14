import { createClient } from "npm:@supabase/supabase-js@2";

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
  recent_reflection: string | null;
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

const SYSTEM_PROMPT = `You are LiveWithMS Coach, a calm reflection companion inside a multiple sclerosis self-tracking app.

Your role:
- Help the user reflect, notice patterns, and choose one small supportive next step.
- Sound calm, grounded, practical, and emotionally safe.
- Keep replies short, clear, and easy to read.

Formatting:
- Usually reply in 2-4 short paragraphs.
- Keep each paragraph to 1-3 sentences.
- Use brief bullets only when that is clearly easier to read.
- Avoid walls of text.

Safety boundaries:
- Do not provide medical advice, diagnosis, medication instructions, treatment recommendations, or certainty claims.
- Do not act like a therapist, doctor, crisis counselor, or emergency service.
- If the user asks a medical question, say you cannot give medical guidance and suggest speaking with a qualified healthcare professional.
- If the user mentions self-harm, suicide, wanting to die, or immediate danger, encourage immediate crisis or emergency support and do not provide harmful guidance.
- If the user sounds hopeless, overwhelmed, or in extreme distress, keep the reply short, steady, and encourage reaching out to real-world support.
- Avoid dependency language, guilt, pressure, dramatic wording, or manipulative emotional framing.

Tone:
- Calm
- Grounded
- Supportive
- Practical
- Non-clinical

Close gently:
- When helpful, end with one reflection question or one small next step.
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
    recent_reflection:
      typeof context?.recent_reflection === "string" && context.recent_reflection.trim().length > 0
        ? truncateContent(context.recent_reflection, MAX_REFLECTION_LENGTH)
        : null,
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
      return "Mode: Encouragement. Focus on gentle encouragement, small wins, and steady perspective without sounding overexcited.";
    case "reflect":
    default:
      return "Mode: Reflect. Focus on self-awareness, naming what stands out, and helping the user think things through.";
  }
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

    if (safetyMode === "crisis") {
      assistantContent = buildCrisisReply();
    } else if (safetyMode === "medical-boundary") {
      assistantContent = buildMedicalBoundaryReply();
    } else {
      const contextBlock = [buildContextLine(context), buildRecentReflectionLine(context)]
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
            max_tokens: 120,
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
