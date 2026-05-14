import env from "../../lib/env";
import { logger } from "../../lib/logger";
import { supabase } from "../../lib/supabase/client";
import type { CoachChatMessage, SendCoachMessageInput, SendCoachMessageResult } from "./types";

const COACH_MESSAGES_TABLE = "coach_messages" as const;

export const coachMessagesApi = {
  async listCoachMessages(userId: string) {
    logger.info("Coach messages query", {
      table: COACH_MESSAGES_TABLE,
      userId,
    });

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

    return (data ?? []) as CoachChatMessage[];
  },

  async sendCoachMessage(input: SendCoachMessageInput) {
    if (!env.isSupabaseConfigured) {
      throw new Error("AI Coach is unavailable in mock mode.");
    }

    const functionName = "coach-mvp-chat" as const;

    logger.info("Coach function invoke", {
      functionName,
      mode: input.mode,
    });

    const { data, error } = await supabase.functions.invoke(functionName, {
      body: input,
    });

    if (error) {
      const details: Record<string, unknown> = {
        functionName,
        errorName: error.name,
        errorMessage: error.message,
      };

      const maybeContext = (error as { context?: unknown }).context;
      if (maybeContext instanceof Response) {
        details.status = maybeContext.status;
        details.statusText = maybeContext.statusText;

        try {
          details.responseBody = await maybeContext.clone().text();
        } catch {
          details.responseBody = "Unable to read response body";
        }
      }

      logger.error("Coach function invoke failed", details);

      throw new Error("AI Coach is temporarily unavailable.");
    }

    if (!data?.userMessage || !data?.assistantMessage) {
      logger.error("Coach function returned unexpected payload", {
        functionName,
        data,
      });
      throw new Error("AI Coach is temporarily unavailable.");
    }

    return data as SendCoachMessageResult;
  },
};
