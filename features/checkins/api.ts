import env from "../../lib/env";
import { supabase } from "../../lib/supabase/client";
import type { DailyCheckIn, DailyCheckInInput } from "./types";

const SELECT_FIELDS =
  "id, user_id, date, fatigue, pain, brain_fog, mood, mobility, stress, sleep_hours, water_glasses, notes, mood_tags, created_at, updated_at";

export const checkinsApi = {
  async getDailyCheckInByDate(userId: string, date: string) {
    if (!userId) {
      throw new Error("Missing user id for daily entry query");
    }

    if (!date) {
      throw new Error("Missing date for daily entry query");
    }

    if (!env.isSupabaseConfigured) {
      return null;
    }

    const { data, error } = await supabase
      .from("daily_entries")
      .select(SELECT_FIELDS)
      .eq("user_id", userId)
      .eq("date", date)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return (data ?? null) as DailyCheckIn | null;
  },
  async getTodaysCheckIn(userId: string, date: string) {
    return checkinsApi.getDailyCheckInByDate(userId, date);
  },
  async listDailyCheckIns(userId: string, limit = 30) {
    if (!userId) {
      throw new Error("Missing user id for check-in history query");
    }

    if (!env.isSupabaseConfigured) {
      return [] as DailyCheckIn[];
    }

    const { data, error } = await supabase
      .from("daily_entries")
      .select(SELECT_FIELDS)
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return (data ?? []) as DailyCheckIn[];
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
        id: "mock-daily-entry",
        user_id: userId,
        date,
        created_at: now,
        updated_at: now,
        ...input,
      } as DailyCheckIn;
    }

    const { data, error } = await supabase
      .from("daily_entries")
      .upsert(
        {
          user_id: userId,
          date,
          ...input,
        },
        {
          onConflict: "user_id,date",
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
