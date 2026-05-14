import { useCallback, useEffect, useMemo, useState } from "react";
import * as StoreReview from "expo-store-review";
import type { AppEventName } from "../../lib/events";
import { trackEvent } from "../../lib/events";
import {
  getRetentionMetrics,
  incrementEventCount,
  isCelebrationAvailable,
  loadGrowthState,
  markCelebrationSeen as markCelebrationSeenInState,
  markReviewPrompted,
  saveGrowthState,
  shouldPromptForReview,
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
    await persistState((current) => incrementEventCount(current, eventName));
  }, [persistState]);

  const maybePromptForReview = useCallback(async (
    overrides?: Partial<{
      totalCheckIns: number;
      reminderEnabled: boolean;
    }>,
  ) => {
    const baseState = state ?? (await loadGrowthState());
    const reviewTotalCheckIns = overrides?.totalCheckIns ?? totalCheckIns;
    const reviewReminderEnabled = overrides?.reminderEnabled ?? reminderEnabled;

    if (!shouldPromptForReview(baseState, { totalCheckIns: reviewTotalCheckIns, reminderEnabled: reviewReminderEnabled })) {
      return false;
    }

    const isAvailable = await StoreReview.isAvailableAsync();
    if (!isAvailable) {
      return false;
    }

    await StoreReview.requestReview();
    const nextState = markReviewPrompted(baseState);
    setState(nextState);
    await saveGrowthState(nextState);
    await trackEvent("review_prompt_shown", {
      totalCheckIns: reviewTotalCheckIns,
      reminderEnabled: reviewReminderEnabled,
    });
    return true;
  }, [reminderEnabled, state, totalCheckIns]);

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
