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
import { sanitizeInsightSafety } from "./actionable";
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

function normalizeWhitespace(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function shortenInsightText(text: string, maxLength = 170) {
  const normalized = normalizeWhitespace(text);

  if (normalized.length <= maxLength) {
    return normalized;
  }

  const firstSentenceMatch = normalized.match(/^[^.!?]+[.!?]/);
  if (firstSentenceMatch && firstSentenceMatch[0].length <= maxLength) {
    return firstSentenceMatch[0].trim();
  }

  const trimmed = normalized.slice(0, maxLength);
  const lastSpace = trimmed.lastIndexOf(" ");
  return `${trimmed.slice(0, lastSpace > 0 ? lastSpace : maxLength).trim()}…`;
}

function reduceGenericWellnessLanguage(text: string) {
  return normalizeWhitespace(
    text
      .replace(/unlock clearer insights/gi, "make this view clearer")
      .replace(/clearer picture/gi, "clearer pattern")
      .replace(/connect the dots/gi, "show a pattern")
      .replace(/keep checking in/gi, "more check-ins may")
      .replace(/check in consistently/gi, "a little more history can")
      .replace(/patterns become easier to spot/gi, "patterns feel easier to notice")
      .replace(/more useful over time/gi, "clearer over time"),
  );
}

function moderateShortInsight(text: string) {
  return shortenInsightText(
    sanitizeInsightSafety(moderateInsightCopy(reduceGenericWellnessLanguage(text))),
    170,
  );
}

function sanitizeInsightList(items: string[] | undefined, maxItems = 2) {
  return (items ?? [])
    .map((item) => moderateShortInsight(item))
    .filter(Boolean)
    .filter((item, index, all) => all.indexOf(item) === index)
    .slice(0, maxItems);
}

function buildFallbackAiInsights(entries: DailyCheckIn[]): AiInsightsSummary {
  const recentEntries = entries.slice(0, 7);
  const averageFatigue = average(recentEntries.map((entry) => entry.fatigue));
  const averageMood = average(recentEntries.map((entry) => entry.mood));
  const averageStress = average(recentEntries.map((entry) => entry.stress));
  const averageSleep = average(recentEntries.map((entry) => entry.sleep_hours));

  if (averageFatigue !== null && averageFatigue >= 4 && averageSleep !== null && averageSleep < 6.5) {
    return {
      summary: moderateShortInsight("Fatigue looked heavier alongside lighter sleep in this stretch."),
      helping: sanitizeInsightList(["Sleep has been on the lighter side lately."]),
      suggestions: sanitizeInsightList(["A simpler evening routine may help if sleep has been short."]),
      disclaimer: deriveIncompleteContextAwareness("insight-summary"),
      source: "fallback",
    };
  }

  if (averageStress !== null && averageStress >= 4) {
    return {
      summary: moderateShortInsight("Stress has been one of the stronger signals lately."),
      helping: sanitizeInsightList(["The more demanding days may be shaping the rest of the picture."]),
      suggestions: sanitizeInsightList(["If today feels full, pick one next step."]),
      disclaimer: deriveIncompleteContextAwareness("insight-summary"),
      source: "fallback",
    };
  }

  if (averageMood !== null && averageMood <= 2) {
    return {
      summary: moderateShortInsight("Mood is lower across recent check-ins."),
      helping: sanitizeInsightList(["Lower-mood days are more common in this range."]),
      suggestions: sanitizeInsightList(["Look for what changed on lower-mood days."]),
      disclaimer: deriveIncompleteContextAwareness("insight-summary"),
      source: "fallback",
    };
  }

  if (averageFatigue !== null && averageFatigue <= 2 && averageStress !== null && averageStress <= 2) {
    return {
      summary: moderateShortInsight("Fatigue and stress are both lower in this range."),
      helping: sanitizeInsightList(["Energy and stress have both been lower recently."]),
      suggestions: sanitizeInsightList(["Compare these days with higher-fatigue periods."]),
      disclaimer: deriveIncompleteContextAwareness("insight-summary"),
      source: "fallback",
    };
  }

  return {
    summary: moderateShortInsight("This pattern is still early."),
    helping: sanitizeInsightList(["There is not enough information yet to identify a reliable pattern."]),
    suggestions: sanitizeInsightList(["A few more check-ins may help reveal clearer patterns."]),
    disclaimer: deriveIncompleteContextAwareness("insight-summary"),
    source: "fallback",
  };
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
        "Fatigue is higher across recent check-ins. Lower-decision days may reduce extra load during higher-fatigue periods.",
      ),
    };
  }

  if (averageStress !== null && averageStress >= 4) {
    return {
      source: "fallback",
      insight: moderateInsightCopy(
        "Stress has been showing up more often in your recent check-ins. A shorter plan or a slower pace may help on fuller days.",
      ),
    };
  }

  if (averageSleep !== null && averageSleep < 7) {
    return {
      source: "fallback",
      insight: moderateInsightCopy(
        "Sleep has been lower this week. A more consistent wind-down or bedtime may help support energy.",
      ),
    };
  }

  if (averageHydration !== null && averageHydration < 6) {
    return {
      source: "fallback",
      insight: moderateInsightCopy(
        "Hydration is lower across recent check-ins. Track whether lower-hydration days line up with higher fatigue.",
      ),
    };
  }

  if (averageMood !== null && averageMood >= 4) {
    return {
      source: "fallback",
      insight: moderateInsightCopy(
        "Mood is higher across recent check-ins. Compare these days with lower-mood periods to spot possible differences.",
      ),
    };
  }

  return {
    source: "fallback",
    insight: moderateInsightCopy(
      "Your recent check-ins are starting to show how this week has been going. A few more check-ins may help reveal clearer patterns.",
    ),
  };
}

export const insightsApi = {
  async getPatternSummary(entries: DailyCheckIn[], range = 7): Promise<PatternSummary> {
    if (!entries.length) {
      return {
        source: "fallback",
        insight: moderateInsightCopy(
          "Start checking in to build a clearer picture of symptoms, routines, and recovery patterns.",
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
        ...buildFallbackAiInsights(entries),
        summary: moderateShortInsight("There is not enough information yet to identify a reliable pattern."),
        helping: [],
        suggestions: sanitizeInsightList(["A few more check-ins may help reveal clearer patterns."]),
      };
    }

    if (!env.isSupabaseConfigured) {
      return buildFallbackAiInsights(entries);
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
        summary: moderateShortInsight(data.summary as string),
        helping: sanitizeInsightList(Array.isArray(data.helping) ? (data.helping as string[]) : []),
        suggestions: sanitizeInsightList(Array.isArray(data.suggestions) ? (data.suggestions as string[]) : []),
        disclaimer: typeof data.disclaimer === "string" ? data.disclaimer : undefined,
        source: data.source === "ai" ? "ai" : "fallback",
      };
      if (!result.suggestions.length) {
        result.suggestions = buildFallbackAiInsights(entries).suggestions;
      }
      logger.info("AI insights summary generated", {
        range,
        durationMs: Date.now() - startedAt,
        source: result.source,
      });
      await setCachedJson(getAiInsightsCacheKey(range), result);
      return result;
    } catch (error) {
      // TODO: If this continues to return 404 in production, verify the deployed Supabase Edge Function
      // name still matches `ai-insights-summary`, since the source file exists in-repo.
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
      return buildFallbackAiInsights(entries);
    }
  },
};
