import env from "../../lib/env";
import { trackDiagnosticEvent } from "../../lib/events";
import { getCachedJson, setCachedJson } from "../../lib/local-cache";
import { logger } from "../../lib/logger";
import { deriveCollaborativeTone } from "../../lib/self-trust/agency-language/deriveCollaborativeTone";
import { softenAuthorityLanguage } from "../../lib/self-trust/agency-language/softenAuthorityLanguage";
import { injectInterpretiveOpenness } from "../../lib/self-trust/agency-preserving-insights/injectInterpretiveOpenness";
import { preserveUserPerspective } from "../../lib/self-trust/agency-preserving-insights/preserveUserPerspective";
import { deriveIncompleteContextAwareness } from "../../lib/self-trust/interpretation-humility/deriveIncompleteContextAwareness";
import { injectInterpretiveHumility } from "../../lib/self-trust/interpretation-humility/injectInterpretiveHumility";
import { preventForcedPositivity } from "../../lib/existential-safety/grounded-perspective/preventForcedPositivity";
import { preserveNonIllnessIdentity } from "../../lib/existential-safety/identity-preservation/preserveNonIllnessIdentity";
import { reduceIllnessCentrality } from "../../lib/existential-safety/identity-preservation/reduceIllnessCentrality";
import { reduceFearFraming } from "../../lib/existential-safety/language-softening/reduceFearFraming";
import { softenExistentialLanguage } from "../../lib/existential-safety/language-softening/softenExistentialLanguage";
import { preventReductionToPatterns } from "../../lib/ethical-governance/dignity-preservation/preventReductionToPatterns";
import { preventEmotionalHooking } from "../../lib/ethical-governance/manipulation-resistance/preventEmotionalHooking";
import { invokeAiFunction } from "../ai/invoke";
import type { DailyCheckIn } from "../checkins/types";
import type { AiInsightsSummary, PatternSummary } from "./types";

function average(values: Array<number | null>) {
  const validValues = values.filter((value): value is number => value !== null);
  if (!validValues.length) {
    return null;
  }

  return validValues.reduce((sum, value) => sum + value, 0) / validValues.length;
}

function getAiInsightsCacheKey(range: 7 | 30) {
  return `cache.ai-insights-summary.${range}`;
}

function moderateInsightCopy(text: string, includePerspectiveNote = true) {
  const tone = deriveCollaborativeTone({
    adaptiveStatePrimary: "STABLE",
    channel: "insight-summary",
  });

  return preserveUserPerspective(
    injectInterpretiveOpenness(
      preventForcedPositivity(
        preserveNonIllnessIdentity(
          preventReductionToPatterns(
            preventEmotionalHooking(
              reduceIllnessCentrality(
                reduceFearFraming(
                  softenExistentialLanguage(
                    injectInterpretiveHumility(softenAuthorityLanguage(text)),
                  ),
                ),
              ),
            ),
          ),
          false,
        ),
      ),
      tone,
    ),
    includePerspectiveNote,
  );
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
      insight: moderateInsightCopy(
        "Fatigue has been one of the stronger signals in your recent check-ins. Shorter to-do lists and steadier rest breaks may help keep your days more manageable.",
      ),
    };
  }

  if (averageStress !== null && averageStress >= 4) {
    return {
      source: "fallback",
      insight: moderateInsightCopy(
        "Stress has been showing up more often in your recent check-ins. A short reset, slower pacing, or a quiet moment to breathe may help you settle back into the day.",
      ),
    };
  }

  if (averageSleep !== null && averageSleep < 7) {
    return {
      source: "fallback",
      insight: moderateInsightCopy(
        "Sleep has looked a little lighter this week. A calmer wind-down routine and a more consistent bedtime may help support steadier energy.",
      ),
    };
  }

  if (averageHydration !== null && averageHydration < 6) {
    return {
      source: "fallback",
      insight: moderateInsightCopy(
        "Hydration looks a bit lower than usual this week. Keeping water nearby and aiming for a few more glasses may help support how you feel day to day.",
      ),
    };
  }

  if (averageMood !== null && averageMood >= 4) {
    return {
      source: "fallback",
      insight: moderateInsightCopy(
        "Your recent check-ins suggest a steadier stretch overall. Keep noticing what is helping on the better days so you can return to it when things feel harder.",
      ),
    };
  }

  return {
    source: "fallback",
    insight: moderateInsightCopy(
      "Your recent check-ins are building a clearer picture of how you feel across the week. Keep logging mood, fatigue, stress, sleep, and habits so patterns become easier to spot.",
    ),
  };
}

export const insightsApi = {
  async getPatternSummary(entries: DailyCheckIn[], range = 7): Promise<PatternSummary> {
    if (!entries.length) {
      return {
        source: "fallback",
        insight: moderateInsightCopy(
          "Start checking in regularly to unlock a clearer picture of your symptom patterns, routines, and recovery rhythms.",
        ),
      };
    }

    if (!env.isSupabaseConfigured || entries.length < 3) {
      return buildFallbackInsight(entries);
    }

    try {
      const startedAt = Date.now();
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

      const data = await invokeAiFunction<{ insight: string }>(
        "weekly-insight",
        {
          entries: payload,
          range,
        },
        {
          unavailableMessage: "Weekly insight is temporarily unavailable.",
          logContext: { range, entryCount: payload.length },
        },
      );

      if (!data?.insight) {
        throw new Error("Missing weekly insight");
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
        suggestions: [],
        disclaimer: deriveIncompleteContextAwareness("insight-summary"),
        source: "fallback",
      };
    }

    if (!env.isSupabaseConfigured) {
      return {
        summary:
          "Your recent check-ins are starting to show a clearer picture of how this stretch has felt.",
        helping: ["Consistent check-ins are making these patterns easier to spot."],
        suggestions: [],
        source: "fallback",
      };
    }

    try {
      const startedAt = Date.now();
      const payload = entries.slice(0, range).map((entry) => ({
        date: entry.date,
        fatigue: entry.fatigue,
        mood: entry.mood,
        stress: entry.stress,
        sleep_hours: entry.sleep_hours,
        notes: entry.notes,
      }));

      const data = await invokeAiFunction<{
        summary?: string;
        helping?: string[];
        suggestions?: string[];
        disclaimer?: string;
        source?: string;
      }>(
        "ai-insights-summary",
        {
          entries: payload,
          range,
        },
        {
          unavailableMessage: "AI insights are temporarily unavailable.",
          logContext: { range, entryCount: payload.length },
        },
      );

      if (!data?.summary) {
        throw new Error("Missing AI insights summary");
      }

      const result: AiInsightsSummary = {
        summary: data.summary as string,
        helping: Array.isArray(data.helping) ? (data.helping as string[]) : [],
        suggestions: Array.isArray(data.suggestions) ? (data.suggestions as string[]) : [],
        disclaimer: typeof data.disclaimer === "string" ? data.disclaimer : undefined,
        source: data.source === "ai" ? "ai" : "fallback",
      };
      logger.info("AI insights summary generated", {
        range,
        durationMs: Date.now() - startedAt,
        source: result.source,
      });
      await setCachedJson(getAiInsightsCacheKey(range), result);
      return result;
    } catch (error) {
      await trackDiagnosticEvent("ai_insight_request_failed", {
        range,
      });
      logger.warn("AI insights summary fallback", {
        message: error instanceof Error ? error.message : "Unknown error",
      });
      const cached = await getCachedJson<AiInsightsSummary>(getAiInsightsCacheKey(range));
      if (cached) {
        return cached;
      }
      return {
        summary:
          "Your recent check-ins are starting to show a clearer picture of how this stretch has felt.",
        helping: ["Check in consistently to unlock clearer insights."],
        suggestions: [],
        source: "fallback",
      };
    }
  },
};
