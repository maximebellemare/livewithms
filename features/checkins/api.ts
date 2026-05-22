import env from "../../lib/env";
import { getCachedJson, setCachedJson } from "../../lib/local-cache";
import { normalizeError } from "../../lib/errors";
import { isNetworkLikeError } from "../../lib/errors";
import { supabase } from "../../lib/supabase/client";
import { buildOptimisticDailyCheckIn, loadQueuedCheckIns, queueDailyCheckInSave, removeQueuedCheckIn } from "./offline";
import type { CheckInOverviewEntry, DailyCheckIn, DailyCheckInInput } from "./types";

const SELECT_FIELDS = "*";

function getNormalizedDate(value: string) {
  if (!value) {
    throw new Error("Missing date for check-in save");
  }

  return value.slice(0, 10);
}

function getDailyCheckInCacheKey(userId: string, date: string) {
  return `cache.daily-checkin.${userId}.${date}`;
}

function getDailyCheckInHistoryCacheKey(userId: string, limit: number) {
  return `cache.daily-checkin-history.${userId}.${limit}`;
}

function getDailyCheckInOverviewCacheKey(userId: string) {
  return `cache.daily-checkin-overview.${userId}`;
}

async function performDailyCheckInUpsert(userId: string, date: string, input: DailyCheckInInput) {
  const payload: Record<string, unknown> = {
    user_id: userId,
    date,
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
    triggers: input.triggers ?? [],
    ...(typeof input.spasticity === "number" ? { spasticity: input.spasticity } : {}),
  };

  const { data, error } = await supabase
    .from("daily_entries")
    .upsert(payload as never, {
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
}

export async function updateCheckInCaches(userId: string, row: DailyCheckIn) {
  await setCachedJson(getDailyCheckInCacheKey(userId, row.date), row);

  const cachedHistory30 = (await getCachedJson<DailyCheckIn[]>(getDailyCheckInHistoryCacheKey(userId, 30))) ?? [];
  const nextHistory30 = cachedHistory30.filter((item) => item.date !== row.date);
  nextHistory30.push(row);
  nextHistory30.sort((left, right) => right.date.localeCompare(left.date));
  await setCachedJson(getDailyCheckInHistoryCacheKey(userId, 30), nextHistory30.slice(0, 30));

  const cachedHistory7 = (await getCachedJson<DailyCheckIn[]>(getDailyCheckInHistoryCacheKey(userId, 7))) ?? [];
  const nextHistory7 = cachedHistory7.filter((item) => item.date !== row.date);
  nextHistory7.push(row);
  nextHistory7.sort((left, right) => right.date.localeCompare(left.date));
  await setCachedJson(getDailyCheckInHistoryCacheKey(userId, 7), nextHistory7.slice(0, 7));

  const cachedOverview = (await getCachedJson<CheckInOverviewEntry[]>(getDailyCheckInOverviewCacheKey(userId))) ?? [];
  const nextOverview = cachedOverview.filter((entry) => entry.date !== row.date);
  nextOverview.push({
    date: row.date,
    hasReflection: typeof row.notes === "string" && row.notes.trim().length > 0,
  });
  nextOverview.sort((left, right) => right.date.localeCompare(left.date));
  await setCachedJson(getDailyCheckInOverviewCacheKey(userId), nextOverview);
}

export async function flushQueuedCheckInSaves() {
  if (!env.isSupabaseConfigured) {
    return 0;
  }

  const queue = await loadQueuedCheckIns();
  let flushedCount = 0;

  for (const item of queue) {
    try {
      const savedRow = await performDailyCheckInUpsert(item.userId, item.date, item.input);
      await updateCheckInCaches(item.userId, savedRow);
      await removeQueuedCheckIn(item);
      flushedCount += 1;
    } catch (error) {
      if (!isNetworkLikeError(error)) {
        await removeQueuedCheckIn(item);
      }
    }
  }

  return flushedCount;
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

    try {
      const { data, error } = await supabase
        .from("daily_entries")
        .select(SELECT_FIELDS)
        .eq("user_id", userId)
        .eq("date", date)
        .maybeSingle();

      if (error) {
        throw normalizeError(error);
      }

      const row = (data ?? null) as DailyCheckIn | null;
      if (row) {
        await setCachedJson(getDailyCheckInCacheKey(userId, date), row);
      }
      return row;
    } catch (error) {
      const cached = await getCachedJson<DailyCheckIn>(getDailyCheckInCacheKey(userId, date));
      if (cached) {
        return cached;
      }
      throw error;
    }
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

    try {
      const { data, error } = await supabase
        .from("daily_entries")
        .select(SELECT_FIELDS)
        .eq("user_id", userId)
        .order("date", { ascending: false })
        .limit(limit);

      if (error) {
        throw normalizeError(error);
      }

      const rows = (data ?? []) as DailyCheckIn[];
      await setCachedJson(getDailyCheckInHistoryCacheKey(userId, limit), rows);
      return rows;
    } catch (error) {
      const cached = await getCachedJson<DailyCheckIn[]>(getDailyCheckInHistoryCacheKey(userId, limit));
      if (cached) {
        return cached;
      }
      throw error;
    }
  },
  async listCheckInOverview(userId: string) {
    if (!userId) {
      throw new Error("Missing user id for check-in overview query");
    }

    if (!env.isSupabaseConfigured) {
      return [] as CheckInOverviewEntry[];
    }

    try {
      const { data, error } = await supabase
        .from("daily_entries")
        .select("date, notes")
        .eq("user_id", userId)
        .order("date", { ascending: false });

      if (error) {
        throw normalizeError(error);
      }

      const rows = (data ?? []).map((entry) => ({
        date: String(entry.date),
        hasReflection: typeof entry.notes === "string" && entry.notes.trim().length > 0,
      }));
      await setCachedJson(getDailyCheckInOverviewCacheKey(userId), rows);
      return rows;
    } catch (error) {
      const cached = await getCachedJson<CheckInOverviewEntry[]>(getDailyCheckInOverviewCacheKey(userId));
      if (cached) {
        return cached;
      }
      throw error;
    }
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

    try {
      return await performDailyCheckInUpsert(currentUser.id, normalizedDate, input);
    } catch (error) {
      if (!isNetworkLikeError(error)) {
        throw error;
      }

      await queueDailyCheckInSave({
        userId: currentUser.id,
        date: normalizedDate,
        input,
        queuedAt: new Date().toISOString(),
      });

      return buildOptimisticDailyCheckIn(currentUser.id, normalizedDate, input);
    }
  },
};
