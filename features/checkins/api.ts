import env from "../../lib/env";
import { supabase } from "../../lib/supabase/client";
import type { DailyCheckIn, DailyCheckInInput } from "./types";

const SELECT_FIELDS =
  "id, user_id, checkin_date, mood, energy, pain, fatigue, mobility, notes, created_at, updated_at";

export const checkinsApi = {
  async getTodaysCheckIn(userId: string, date: string) {
    if (!userId) {
      throw new Error("Missing user id for today's check-in query");
    }

    if (!date) {
      throw new Error("Missing date for today's check-in query");
    }

    if (!env.isSupabaseConfigured) {
      return null;
    }

    const { data, error } = await supabase
      .from("daily_checkins")
      .select(SELECT_FIELDS)
      .eq("user_id", userId)
      .eq("checkin_date", date)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return (data ?? null) as DailyCheckIn | null;
  },
  async upsertDailyCheckIn(userId: string, date: string, input: DailyCheckInInput) {
    if (!userId) {
      throw new Error("Missing user id for check-in save");
    }

    if (!date) {
      throw new Error("Missing date for check-in save");
    }

    if (!env.isSupabaseConfigured) {
      const now = new Date().toISOString();
      return {
        id: "mock-daily-checkin",
        user_id: userId,
        checkin_date: date,
        created_at: now,
        updated_at: now,
        ...input,
      } as DailyCheckIn;
    }

    const { data, error } = await supabase
      .from("daily_checkins")
      .upsert(
        {
          user_id: userId,
          checkin_date: date,
          ...input,
        },
        {
          onConflict: "user_id,checkin_date",
        },
      )
      .select(SELECT_FIELDS)
      .single();

    if (error) {
      throw error;
    }

    return data as DailyCheckIn;
  },
};
