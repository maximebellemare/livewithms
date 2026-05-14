import env from "../../lib/env";
import { normalizeError } from "../../lib/errors";
import { supabase } from "../../lib/supabase/client";
import type { CheckInOverviewEntry, DailyCheckIn, DailyCheckInInput } from "./types";

const SELECT_FIELDS =
  "id, user_id, date, fatigue, pain, brain_fog, mood, mobility, stress, sleep_hours, water_glasses, notes, mood_tags, created_at, updated_at";

function getNormalizedDate(value: string) {
  if (!value) {
    throw new Error("Missing date for check-in save");
  }

  return value.slice(0, 10);
}

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
      throw normalizeError(error);
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
      throw normalizeError(error);
    }

    return (data ?? []) as DailyCheckIn[];
  },
  async listCheckInOverview(userId: string) {
    if (!userId) {
      throw new Error("Missing user id for check-in overview query");
    }

    if (!env.isSupabaseConfigured) {
      return [] as CheckInOverviewEntry[];
    }

    const { data, error } = await supabase
      .from("daily_entries")
      .select("date, notes")
      .eq("user_id", userId)
      .order("date", { ascending: false });

    if (error) {
      throw normalizeError(error);
    }

    return (data ?? []).map((entry) => ({
      date: String(entry.date),
      hasReflection: typeof entry.notes === "string" && entry.notes.trim().length > 0,
    }));
  },
  async upsertDailyCheckIn(userId: string, date: string, input: DailyCheckInInput) {
    if (!env.isSupabaseConfigured) {
      throw new Error("Supabase is not configured for daily entry saves");
    }

    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError) {
      throw normalizeError(authError);
    }

    const currentUser = authData.user;

    if (!currentUser?.id) {
      throw new Error("Missing authenticated user for check-in save");
    }

    if (userId && currentUser.id !== userId) {
      throw new Error("Authenticated user does not match requested check-in save");
    }

    const normalizedDate = getNormalizedDate(date);
    const payload = {
      user_id: currentUser.id,
      date: normalizedDate,
      fatigue: input.fatigue,
      mood: input.mood,
      stress: input.stress,
      pain: input.pain,
      brain_fog: input.brain_fog,
      mobility: input.mobility,
      sleep_hours: input.sleep_hours,
      water_glasses: input.water_glasses,
      notes: input.notes,
      mood_tags: input.mood_tags ?? [],
      ...(typeof input.spasticity === "number" ? { spasticity: input.spasticity } : {}),
    };

    const { data, error } = await supabase
      .from("daily_entries")
      .upsert(payload, {
        onConflict: "user_id,date",
      })
      .select("*")
      .single();

    if (error) {
      throw normalizeError(error);
    }

    if (!data?.id || !data?.user_id || !data?.date) {
      throw new Error("Daily entry save did not return a valid row");
    }

    return data as DailyCheckIn;
  },
};
