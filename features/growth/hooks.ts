import { Alert } from "react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import * as StoreReview from "expo-store-review";
import type { AppEventName } from "../../lib/events";
import { trackEvent } from "../../lib/events";
import {
  addRecentAction,
  canShowReviewPromptThisSession,
  getRetentionMetrics,
  incrementEventCount,
  isCelebrationAvailable,
  loadGrowthState,
  markCelebrationSeen as markCelebrationSeenInState,
  markReviewPrompted,
  markReviewPromptShownInSession,
  markReviewRequested,
  markReviewSessionAsNegativeExperience,
  saveGrowthState,
  shouldBlockReviewPromptForEvent,
  shouldPromptForReview,
  type ReviewPromptTrigger,
} from "./storage";
import type { CelebrationKey, GrowthState } from "./types";

export function useGrowthState(options: { totalCheckIns?: number; reminderEnabled?: boolean } = {}) {
  const [state, setState] = useState<GrowthState | null>(null);

  const totalCheckIns = options.totalCheckIns ?? 0;
  const reminderEnabled = options.reminderEnabled ?? false;

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const nextState = await loadGrowthState();
      if (!cancelled) {
        setState(nextState);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const persistState = useCallback(async (updater: (current: GrowthState) => GrowthState) => {
    const baseState = state ?? (await loadGrowthState());
    const nextState = updater(baseState);

    setState(nextState);
    await saveGrowthState(nextState);

    return nextState;
  }, [state]);

  const recordEvent = useCallback(async (eventName: AppEventName, metadata?: Record<string, unknown>) => {
    trackEvent(eventName, metadata);
    if (shouldBlockReviewPromptForEvent(eventName)) {
      markReviewSessionAsNegativeExperience();
    }
    await persistState((current) => addRecentAction(incrementEventCount(current, eventName), eventName));
  }, [persistState]);

  const maybePromptForReview = useCallback(async (
    overrides?: Partial<{
      trigger: ReviewPromptTrigger;
      totalCheckIns: number;
      reminderEnabled: boolean;
      streak: number;
    }>,
  ) => {
    const baseState = await loadGrowthState();
    const trigger = overrides?.trigger ?? "helpful_feature_completed";
    const reviewTotalCheckIns = overrides?.totalCheckIns ?? totalCheckIns;
    const reviewReminderEnabled = overrides?.reminderEnabled ?? reminderEnabled;
    const streak = overrides?.streak;

    if (!canShowReviewPromptThisSession()) {
      return false;
    }

    if (!shouldPromptForReview(baseState, {
      trigger,
      totalCheckIns: reviewTotalCheckIns,
      reminderEnabled: reviewReminderEnabled,
      streak,
    })) {
      return false;
    }

    const nextState = markReviewPrompted(baseState);
    setState(nextState);
    await saveGrowthState(nextState);
    markReviewPromptShownInSession();
    await trackEvent("review_prompt_shown", {
      trigger,
      totalCheckIns: reviewTotalCheckIns,
      reminderEnabled: reviewReminderEnabled,
    });

    return new Promise<boolean>((resolve) => {
      let settled = false;
      const finish = (value: boolean) => {
        if (settled) {
          return;
        }
        settled = true;
        resolve(value);
      };

      Alert.alert(
        "Enjoying LiveWithMS?",
        "If the app has been genuinely helpful, a quick rating would mean a lot.",
        [
          {
            text: "Not now",
            style: "cancel",
            onPress: () => finish(false),
          },
          {
            text: "Rate App",
            onPress: () => {
              void (async () => {
                try {
                  const isAvailable = await StoreReview.isAvailableAsync();
                  if (!isAvailable) {
                    finish(false);
                    return;
                  }

                  await StoreReview.requestReview();
                  const requestedState = markReviewRequested(await loadGrowthState());
                  setState(requestedState);
                  await saveGrowthState(requestedState);
                  finish(true);
                } catch {
                  finish(false);
                }
              })();
            },
          },
        ],
        {
          cancelable: true,
          onDismiss: () => finish(false),
        },
      );
    });
  }, [reminderEnabled, totalCheckIns]);

  const markCelebrationSeen = useCallback(async (key: CelebrationKey) => {
    await persistState((current) => markCelebrationSeenInState(current, key));
  }, [persistState]);

  const metrics = useMemo(() => {
    if (!state) {
      return {
        lastActiveAt: null,
        daysActive: 0,
        checkInFrequency: 0,
        reminderEnabled,
        firstWeekEngaged: false,
      };
    }

    return getRetentionMetrics(state, {
      totalCheckIns,
      reminderEnabled,
    });
  }, [reminderEnabled, state, totalCheckIns]);

  const getCelebrationAvailable = useCallback((key: CelebrationKey) => {
    if (!state) {
      return false;
    }

    return isCelebrationAvailable(state, key, { totalCheckIns });
  }, [state, totalCheckIns]);

  return {
    state,
    isLoading: state === null,
    metrics,
    recordEvent,
    maybePromptForReview,
    markCelebrationSeen,
    getCelebrationAvailable,
  };
}
