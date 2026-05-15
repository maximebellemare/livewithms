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
  },
};
