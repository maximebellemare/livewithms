import env from "../../lib/env";
import { logger } from "../../lib/logger";
import { supabase } from "../../lib/supabase/client";
import type { DailyCheckIn } from "../checkins/types";
import type { AiInsightsSummary, PatternSummary } from "./types";

function average(values: Array<number | null>) {
  const validValues = values.filter((value): value is number => value !== null);
  if (!validValues.length) {
    return null;
  }

  return validValues.reduce((sum, value) => sum + value, 0) / validValues.length;
}

function buildFallbackInsight(entries: DailyCheckIn[]): PatternSummary {
  const recentEntries = entries.slice(0, 7);
  const averageFatigue = average(recentEntries.map((entry) => entry.fatigue));
  const averageMood = average(recentEntries.map((entry) => entry.mood));
  const averageStress = average(recentEntries.map((entry) => entry.stress));
  const averageSleep = average(recentEntries.map((entry) => entry.sleep_hours));
  const averageHydration = average(recentEntries.map((entry) => entry.water_glasses));

  if (averageFatigue !== null && averageFatigue >= 4) {
    return {
      source: "fallback",
      insight:
        "Fatigue has been one of the stronger signals in your recent check-ins. Shorter to-do lists and steadier rest breaks may help keep your days more manageable.",
    };
  }

  if (averageStress !== null && averageStress >= 4) {
    return {
      source: "fallback",
      insight:
        "Stress has been showing up more often in your recent check-ins. A short reset, slower pacing, or a quiet moment to breathe may help you settle back into the day.",
    };
  }

  if (averageSleep !== null && averageSleep < 7) {
    return {
      source: "fallback",
      insight:
        "Sleep has looked a little lighter this week. A calmer wind-down routine and a more consistent bedtime may help support steadier energy.",
    };
  }

  if (averageHydration !== null && averageHydration < 6) {
    return {
      source: "fallback",
      insight:
        "Hydration looks a bit lower than usual this week. Keeping water nearby and aiming for a few more glasses may help support how you feel day to day.",
    };
  }

  if (averageMood !== null && averageMood >= 4) {
    return {
      source: "fallback",
      insight:
        "Your recent check-ins suggest a steadier stretch overall. Keep noticing what is helping on the better days so you can return to it when things feel harder.",
    };
  }

  return {
    source: "fallback",
    insight:
      "Your recent check-ins are building a clearer picture of how you feel across the week. Keep logging mood, fatigue, stress, sleep, and habits so patterns become easier to spot.",
  };
}

export const insightsApi = {
  async getPatternSummary(entries: DailyCheckIn[], range = 7): Promise<PatternSummary> {
    if (!entries.length) {
      return {
        source: "fallback",
        insight:
          "Start checking in regularly to unlock a clearer picture of your symptom patterns, routines, and recovery rhythms.",
      };
    }

    if (!env.isSupabaseConfigured || entries.length < 3) {
      return buildFallbackInsight(entries);
    }

    try {
      const payload = entries.slice(0, range).map((entry) => ({
        date: entry.date,
        fatigue: entry.fatigue,
        pain: entry.pain,
        brain_fog: entry.brain_fog,
        mood: entry.mood,
        mobility: entry.mobility,
        sleep_hours: entry.sleep_hours,
        water_glasses: entry.water_glasses,
      }));

      const { data, error } = await supabase.functions.invoke("weekly-insight", {
        body: {
          entries: payload,
          range,
        },
      });

      if (error || !data?.insight) {
        throw error ?? new Error("Missing weekly insight");
      }

      return {
        source: "ai",
        insight: data.insight as string,
      };
    } catch (error) {
      logger.warn("Weekly insight fallback", {
        message: error instanceof Error ? error.message : "Unknown error",
      });
      return buildFallbackInsight(entries);
    }
  },

  async getAiInsightsSummary(entries: DailyCheckIn[], range: 7 | 30): Promise<AiInsightsSummary> {
    if (entries.length < 3) {
      return {
        summary: "Check in consistently to unlock clearer insights.",
        helping: ["Check in consistently to unlock clearer insights."],
        source: "fallback",
      };
    }

    if (!env.isSupabaseConfigured) {
      return {
        summary:
          "Your recent check-ins are starting to show a clearer picture of how this stretch has felt.",
        helping: ["Consistent check-ins are making these patterns easier to spot."],
        source: "fallback",
      };
    }

    try {
      const payload = entries.slice(0, range).map((entry) => ({
        date: entry.date,
        fatigue: entry.fatigue,
        mood: entry.mood,
        stress: entry.stress,
        sleep_hours: entry.sleep_hours,
        notes: entry.notes,
      }));

      const { data, error } = await supabase.functions.invoke("ai-insights-summary", {
        body: {
          entries: payload,
          range,
        },
      });

      if (error || !data?.summary) {
        throw error ?? new Error("Missing AI insights summary");
      }

      return {
        summary: data.summary as string,
        helping: Array.isArray(data.helping) ? (data.helping as string[]) : [],
        source: data.source === "ai" ? "ai" : "fallback",
      };
    } catch (error) {
      logger.warn("AI insights summary fallback", {
        message: error instanceof Error ? error.message : "Unknown error",
      });
      return {
        summary:
          "Your recent check-ins are starting to show a clearer picture of how this stretch has felt.",
        helping: ["Check in consistently to unlock clearer insights."],
        source: "fallback",
      };
    }
  },
};
