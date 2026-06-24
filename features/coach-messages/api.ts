import env from "../../lib/env";
import { getCachedJson, setCachedJson } from "../../lib/local-cache";
import { logger } from "../../lib/logger";
import { supabase } from "../../lib/supabase/client";
import { invokeAiFunction } from "../ai/invoke";
import type { CoachChatMessage, SendCoachMessageInput, SendCoachMessageResult } from "./types";

const COACH_MESSAGES_TABLE = "coach_messages" as const;

function getCoachMessagesCacheKey(userId: string) {
  return `cache.coach-messages.${userId}`;
}

function buildFallbackCoachReply(input: SendCoachMessageInput) {
  const fatigue = input.context.fatigue ?? input.context.fatigue_average_7d;
  const stress = input.context.stress ?? input.context.stress_average_7d;
  const brainFog = input.context.brain_fog ?? null;
  const sleepHours = input.context.sleep_hours ?? input.context.sleep_average_7d;
  const lines: string[] = [];

  if (typeof fatigue === "number" && fatigue >= 4) {
    lines.push("Keep today smaller than usual and choose one necessary thing to protect energy.");
  } else if (typeof stress === "number" && stress >= 4) {
    lines.push("Name the one pressure that matters most right now and let the rest wait for a moment.");
  } else if (typeof brainFog === "number" && brainFog >= 3) {
    lines.push("Write down one next step in very plain language so you do not have to hold it all in your head.");
  } else if (typeof sleepHours === "number" && sleepHours > 0 && sleepHours < 6.5) {
    lines.push("Treat today like a lower-capacity day and lower expectations where you can.");
  } else {
    lines.push("Start with one thing that would make the next hour feel easier.");
  }

  if (input.context.current_streak > 0) {
    lines.push("You have already been showing up for yourself, so this does not need to be perfect to count.");
  }

  if (input.context.suggested_support_actions?.length) {
    lines.push(`A gentle next support step could be: ${input.context.suggested_support_actions[0]}.`);
  } else if (input.context.care_context?.length) {
    lines.push(`If helpful, keep this simple and plan around: ${input.context.care_context[0]}.`);
  }

  return [
    "Coach could not reach the live AI service just now, but we can still keep this practical.",
    ...lines.slice(0, 3).map((line) => `• ${line}`),
    "If you want, try sending your message again in a moment for a fuller response.",
  ].join("\n");
}

async function insertCoachMessage(message: Omit<CoachChatMessage, "id" | "created_at">) {
  const { data, error } = await supabase
    .from(COACH_MESSAGES_TABLE)
    .insert(message)
    .select("*")
    .single();

  if (error) {
    logger.error("Coach fallback insert failed", {
      table: COACH_MESSAGES_TABLE,
      error,
      role: message.role,
      userId: message.user_id,
    });
    throw error;
  }

  return data as CoachChatMessage;
}

export const coachMessagesApi = {
  async listCoachMessages(userId: string) {
    logger.info("Coach messages query", {
      table: COACH_MESSAGES_TABLE,
      userId,
    });

    try {
      const { data, error } = await supabase
        .from(COACH_MESSAGES_TABLE)
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

      if (error) {
        logger.error("Coach messages query failed", {
          table: COACH_MESSAGES_TABLE,
          error,
        });
        throw error;
      }

      const rows = (data ?? []) as CoachChatMessage[];
      await setCachedJson(getCoachMessagesCacheKey(userId), rows.slice(-24));
      return rows;
    } catch (error) {
      const cached = await getCachedJson<CoachChatMessage[]>(getCoachMessagesCacheKey(userId));
      if (cached) {
        return cached;
      }
      throw error;
    }
  },

  async sendCoachMessage(input: SendCoachMessageInput) {
    if (!env.isSupabaseConfigured) {
      throw new Error("AI Coach is unavailable in mock mode.");
    }

    try {
      const data = await invokeAiFunction<SendCoachMessageResult>("coach-mvp-chat", input, {
        unavailableMessage: "AI Coach is temporarily unavailable.",
        logContext: {
          mode: input.mode,
        },
      });

      if (!data?.userMessage || !data?.assistantMessage) {
        logger.error("Coach function returned unexpected payload", {
          functionName: "coach-mvp-chat",
          data,
        });
        throw new Error("AI Coach is temporarily unavailable.");
      }

      return data as SendCoachMessageResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const normalizedError = errorMessage.toLowerCase();
      const canUseFallback =
        normalizedError.includes("temporarily unavailable") ||
        normalizedError.includes("taking a pause") ||
        normalizedError.includes("network");

      logger.error("Coach live response failed", {
        error: errorMessage,
        mode: input.mode,
        fallbackAttempted: canUseFallback,
      });
      console.error("[coach] send failed", {
        error: errorMessage,
        mode: input.mode,
        canUseFallback,
      });

      if (!canUseFallback) {
        throw error;
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user?.id) {
        logger.error("Coach fallback could not resolve current user", {
          error: userError,
        });
        throw error;
      }

      const fallbackReply = buildFallbackCoachReply(input);
      const userMessage = await insertCoachMessage({
        user_id: user.id,
        role: "user",
        content: input.message,
      });
      const assistantMessage = await insertCoachMessage({
        user_id: userMessage.user_id,
        role: "assistant",
        content: fallbackReply,
      });

      return {
        userMessage,
        assistantMessage,
        safetyMode: "normal",
      } satisfies SendCoachMessageResult;
    }
  },
};
