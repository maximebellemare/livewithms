import env from "../../lib/env";
import { getMockProfile } from "../../lib/dev-auth";
import { normalizeError } from "../../lib/errors";
import { logger } from "../../lib/logger";
import { supabase } from "../../lib/supabase/client";
import type { Profile } from "./types";

const PROFILE_SELECT =
  "user_id, onboarding_completed, display_name, ms_type, year_diagnosed, symptoms, goals, country, age_range";

export type ProfileUpdateInput = Partial<
  Pick<
    Profile,
    | "display_name"
    | "ms_type"
    | "year_diagnosed"
    | "symptoms"
    | "goals"
    | "country"
    | "age_range"
    | "onboarding_completed"
  >
>;

export const profileApi = {
  async getMyProfile(userId: string) {
    if (!userId) {
      throw new Error("Missing user id for profile query");
    }

    if (!env.isSupabaseConfigured) {
      return getMockProfile();
    }

    const { data, error } = await supabase
      .from("profiles")
      .select(PROFILE_SELECT)
      .eq("user_id", userId)
      .single();

    if (error) {
      const normalizedError = normalizeError(error);
      logger.error("Profile lookup failed", {
        userId,
        message: normalizedError.message,
        code: normalizedError.code,
        details: normalizedError.details,
        hint: normalizedError.hint,
      });
      throw error;
    }

    return data as Profile;
  },
  async updateMyProfile(userId: string, input: ProfileUpdateInput) {
    if (!userId) {
      throw new Error("Missing user id for profile update");
    }

    if (!env.isSupabaseConfigured) {
      return {
        ...getMockProfile(),
        ...input,
      } as Profile;
    }

    logger.info("Profile update starting", {
      userId,
      input,
      query: "profiles.update",
    });

    const { data, error } = await supabase
      .from("profiles")
      .update(input)
      .eq("user_id", userId)
      .select(PROFILE_SELECT)
      .single();

    if (error) {
      const normalizedError = normalizeError(error);
      logger.error("Profile update failed", {
        userId,
        input,
        query: "profiles.update",
        code: normalizedError.code,
        details: normalizedError.details,
        hint: normalizedError.hint,
        message: normalizedError.message,
        error,
      });

      logger.info("Profile upsert fallback starting", {
        userId,
        input,
        query: "profiles.upsert",
      });

      const { data: upsertedData, error: upsertError } = await supabase
        .from("profiles")
        .upsert(
          {
            user_id: userId,
            ...input,
          },
          {
            onConflict: "user_id",
          },
        )
        .select(PROFILE_SELECT)
        .single();

      if (upsertError) {
        const normalizedUpsertError = normalizeError(upsertError);
        logger.error("Profile upsert fallback failed", {
          userId,
          input,
          query: "profiles.upsert",
          code: normalizedUpsertError.code,
          details: normalizedUpsertError.details,
          hint: normalizedUpsertError.hint,
          message: normalizedUpsertError.message,
          error: upsertError,
        });
        throw upsertError;
      }

      logger.info("Profile upsert fallback succeeded", {
        userId,
        payload: upsertedData,
      });

      return upsertedData as Profile;
    }

    logger.info("Profile update succeeded", {
      userId,
      payload: data,
    });

    return data as Profile;
  },
};
