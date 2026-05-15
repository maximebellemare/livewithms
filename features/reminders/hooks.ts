import { useCallback, useEffect, useMemo, useState } from "react";
import {
  cancelScheduledReminder,
  getReminderPermissionStatus,
  isNotificationsAvailable,
  requestReminderPermission,
  scheduleDailyReminder,
} from "./notifications";
import { DEFAULT_REMINDER_SETTINGS, loadReminderSettings, saveReminderSettings } from "./storage";
import type { ReminderEnableResult, ReminderSettings, ReminderTimeOption } from "./types";
import { buildAdaptiveProfile } from "../adaptive/logic";
import { useCheckInOverview } from "../checkins/hooks";
import { useAuth } from "../auth/hooks";
import { getCheckInsInLastDays } from "../checkins/consistency";
import { loadGrowthState } from "../growth/storage";
import { loadPersonalizationMemory } from "../personalization-memory/storage";
import { categorizeError } from "../../lib/errors";
import { trackDiagnosticEvent } from "../../lib/events";
import { buildLifecycleProfile } from "../lifecycle/logic";
import { APP_CONFIG } from "../../lib/app-config";
import { deriveNotificationCadence } from "../../lib/energy-aware/notification-softening/deriveNotificationCadence";
import { deriveNotificationTone } from "../../lib/energy-aware/notification-softening/deriveNotificationTone";
import { deriveAdaptiveFlow } from "../../lib/energy-aware/adaptive-flow/deriveAdaptiveFlow";
import type { AdaptiveState } from "../../lib/longitudinal/types";
import { deriveAttentionLoad } from "../../lib/attention-respect/attention-budgeting/deriveAttentionLoad";
import { deriveNotificationNecessity } from "../../lib/attention-respect/low-interruption/deriveNotificationNecessity";
import { deriveInterruptionSafety } from "../../lib/attention-respect/low-interruption/deriveInterruptionSafety";
import { deriveNotificationSoftness } from "../../lib/attention-respect/quiet-notification-intelligence/deriveNotificationSoftness";
import { deriveNotificationSilence } from "../../lib/attention-respect/quiet-notification-intelligence/deriveNotificationSilence";

export const REMINDER_TIME_OPTIONS: ReminderTimeOption[] = [...APP_CONFIG.reminders.timeOptions];

type ReminderState = ReminderSettings & {
  isLoading: boolean;
  isSaving: boolean;
  notificationsAvailable: boolean;
};

async function persistSettings(nextSettings: ReminderSettings) {
  await saveReminderSettings(nextSettings);
  return nextSettings;
}

function toReminderSettings(state: ReminderState): ReminderSettings {
  return {
    enabled: state.enabled,
    hour: state.hour,
    minute: state.minute,
    permissionStatus: state.permissionStatus,
    notificationId: state.notificationId,
  };
}

export function useReminderSettings() {
  const { user } = useAuth();
  const overviewQuery = useCheckInOverview(user?.id);
  const [state, setState] = useState<ReminderState>({
    ...DEFAULT_REMINDER_SETTINGS,
    isLoading: true,
    isSaving: false,
    notificationsAvailable: isNotificationsAvailable(),
  });
  const [memorySupportStyle, setMemorySupportStyle] = useState<"calm" | "practical" | "reflective" | "steady">("steady");
  const [growthFirstOpenedAt, setGrowthFirstOpenedAt] = useState<string | null>(null);
  const [growthActiveDates, setGrowthActiveDates] = useState<string[]>([]);
  const adaptiveProfile = useMemo(() => {
    const overviewEntries = overviewQuery.data ?? [];
    const daysActiveThisWeek = getCheckInsInLastDays(overviewEntries, new Date().toISOString().slice(0, 10), 7);
    return buildAdaptiveProfile(overviewEntries, daysActiveThisWeek);
  }, [overviewQuery.data]);
  const energyAdaptiveState = useMemo<AdaptiveState>(() => {
    const primary =
      adaptiveProfile.lowEnergyMode
        ? "LOW_ENERGY"
        : adaptiveProfile.engagementPattern === "gentle-reengagement"
          ? "WITHDRAWN"
          : adaptiveProfile.reflectionPattern === "active"
            ? "REFLECTIVE"
            : "STABLE";

    return {
      primary,
      signals: [primary],
      reduceUiDensity: primary === "LOW_ENERGY" || primary === "WITHDRAWN",
      shortenPrompts: primary === "LOW_ENERGY",
      softenCoachTone: primary !== "STABLE",
      lowerNotificationPressure: primary === "LOW_ENERGY" || primary === "WITHDRAWN",
    };
  }, [adaptiveProfile.engagementPattern, adaptiveProfile.lowEnergyMode, adaptiveProfile.reflectionPattern]);
  const lifecycleStage = useMemo(() => {
    const overviewEntries = overviewQuery.data ?? [];
    const daysActiveThisWeek = getCheckInsInLastDays(overviewEntries, new Date().toISOString().slice(0, 10), 7);
    return buildLifecycleProfile({
      firstOpenedAt: growthFirstOpenedAt,
      activeDates: growthActiveDates,
      totalCheckIns: overviewEntries.length,
      weeklyCheckIns: daysActiveThisWeek,
    }).stage;
  }, [growthActiveDates, growthFirstOpenedAt, overviewQuery.data]);
  const adaptiveFlow = useMemo(
    () =>
      deriveAdaptiveFlow({
        adaptiveState: energyAdaptiveState,
        lifecycleStage,
        fatigueLevel: adaptiveProfile.fatigueTrend === "high" ? 4 : adaptiveProfile.fatigueTrend === "lighter" ? 2 : null,
        skippedCheckIns: Math.max(0, 7 - getCheckInsInLastDays(overviewQuery.data ?? [], new Date().toISOString().slice(0, 10), 7)),
        sessionLengthSeconds: 0,
        interactionFrequency: (overviewQuery.data ?? []).slice(0, 7).length,
      }),
    [adaptiveProfile.fatigueTrend, energyAdaptiveState, lifecycleStage, overviewQuery.data],
  );
  const attentionLoad = useMemo(
    () =>
      deriveAttentionLoad({
        visibleSurfaceCount: 2,
        actionCount: 1,
        hasAiSummary: false,
        hasReflectionCards: false,
      }),
    [],
  );
  const notificationNecessity = useMemo(
    () =>
      deriveNotificationNecessity({
        adaptiveStatePrimary: energyAdaptiveState.primary,
        attentionLoad,
        reminderEnabled: state.enabled,
      }),
    [attentionLoad, energyAdaptiveState.primary, state.enabled],
  );
  const interruptionSafety = useMemo(
    () =>
      deriveInterruptionSafety({
        necessity: notificationNecessity,
        emotionalSurfacesVisible: adaptiveProfile.reflectionPattern === "active" ? 1 : 0,
        sessionLengthSeconds: 0,
      }),
    [adaptiveProfile.reflectionPattern, notificationNecessity],
  );
  const attentionReminderSilenced = useMemo(
    () =>
      deriveNotificationSilence({
        necessity: notificationNecessity,
        interruptionSafety,
      }),
    [interruptionSafety, notificationNecessity],
  );

  const refresh = useCallback(async () => {
    setState((current) => ({ ...current, isLoading: true }));

    const [savedSettings, permissionStatus, personalizationMemory, growthState] = await Promise.all([
      loadReminderSettings(),
      getReminderPermissionStatus(),
      loadPersonalizationMemory(),
      loadGrowthState(),
    ]);

    setMemorySupportStyle(personalizationMemory.preferredSupportStyle);
    setGrowthFirstOpenedAt(growthState.firstOpenedAt);
    setGrowthActiveDates(growthState.activeDates);
    setState({
      ...savedSettings,
      permissionStatus,
      isLoading: false,
      isSaving: false,
      notificationsAvailable: isNotificationsAvailable(),
    });
  }, []);

  const resolvedReminderTone = useMemo(() => {
    if (attentionReminderSilenced) {
      return deriveNotificationSoftness({
        adaptiveStatePrimary: energyAdaptiveState.primary,
        necessity: notificationNecessity,
      });
    }

    const derivedTone = deriveNotificationTone({
      adaptiveState: energyAdaptiveState,
      lifecycleStage,
      fatigueLevel: adaptiveProfile.fatigueTrend === "high" ? 4 : adaptiveProfile.fatigueTrend === "lighter" ? 2 : null,
      skippedCheckIns: Math.max(0, 7 - getCheckInsInLastDays(overviewQuery.data ?? [], new Date().toISOString().slice(0, 10), 7)),
      sessionLengthSeconds: 0,
      interactionFrequency: (overviewQuery.data ?? []).slice(0, 7).length,
    });

    if (memorySupportStyle === "calm" || memorySupportStyle === "reflective") {
      return "gentle-nudge" as const;
    }

    return derivedTone ?? adaptiveProfile.reminderTone;
  }, [
    adaptiveProfile.fatigueTrend,
    adaptiveProfile.reminderTone,
    attentionReminderSilenced,
    energyAdaptiveState,
    lifecycleStage,
    memorySupportStyle,
    notificationNecessity,
    overviewQuery.data,
  ]);
  const resolvedReminderCadence = useMemo(
    () =>
      deriveNotificationCadence({
        adaptiveState: energyAdaptiveState,
        lifecycleStage,
        fatigueLevel: adaptiveProfile.fatigueTrend === "high" ? 4 : adaptiveProfile.fatigueTrend === "lighter" ? 2 : null,
        skippedCheckIns: Math.max(0, 7 - getCheckInsInLastDays(overviewQuery.data ?? [], new Date().toISOString().slice(0, 10), 7)),
        sessionLengthSeconds: 0,
        interactionFrequency: (overviewQuery.data ?? []).slice(0, 7).length,
      }),
    [adaptiveProfile.fatigueTrend, energyAdaptiveState, lifecycleStage, overviewQuery.data],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const updateTime = useCallback(async (hour: number, minute: number) => {
    setState((current) => ({ ...current, isSaving: true }));

    const nextBaseSettings: ReminderSettings = {
      ...toReminderSettings(state),
      hour,
      minute,
    };

    try {
      let nextSettings = nextBaseSettings;

      if (state.enabled && state.permissionStatus === "granted") {
        await cancelScheduledReminder(state.notificationId);
        const nextNotificationId = attentionReminderSilenced
          ? null
          : await scheduleDailyReminder(hour, minute, resolvedReminderTone);
        nextSettings = {
          ...nextBaseSettings,
          notificationId: nextNotificationId,
        };
      }

      await persistSettings(nextSettings);
      setState((current) => ({
        ...current,
        ...nextSettings,
        isSaving: false,
      }));
    } catch (error) {
      await trackDiagnosticEvent("reminder_schedule_failed", {
        category: categorizeError(error),
        context: "update-time",
      });
      setState((current) => ({
        ...current,
        isSaving: false,
      }));
      throw error;
    }
  }, [attentionReminderSilenced, resolvedReminderTone, state.enabled, state.notificationId, state.permissionStatus]);

  const disableReminders = useCallback(async () => {
    setState((current) => ({ ...current, isSaving: true }));

    try {
      await cancelScheduledReminder(state.notificationId);

      const nextSettings: ReminderSettings = {
        ...toReminderSettings(state),
        enabled: false,
        notificationId: null,
      };

      await persistSettings(nextSettings);
      setState((current) => ({
        ...current,
        ...nextSettings,
        isSaving: false,
      }));
    } catch (error) {
      await trackDiagnosticEvent("reminder_schedule_failed", {
        category: categorizeError(error),
        context: "disable",
      });
      setState((current) => ({ ...current, isSaving: false }));
      throw error;
    }
  }, [state]);

  const enableReminders = useCallback(async (): Promise<ReminderEnableResult> => {
    setState((current) => ({ ...current, isSaving: true }));

    try {
      const permissionStatus = await requestReminderPermission();

      if (permissionStatus !== "granted") {
        const nextSettings: ReminderSettings = {
          ...toReminderSettings(state),
          enabled: false,
          permissionStatus,
          notificationId: null,
        };

        await persistSettings(nextSettings);
        setState((current) => ({
          ...current,
          ...nextSettings,
          isSaving: false,
        }));

        return {
          ok: false,
          status: permissionStatus,
        };
      }

      await cancelScheduledReminder(state.notificationId);
      const nextNotificationId = attentionReminderSilenced
        ? null
        : await scheduleDailyReminder(state.hour, state.minute, resolvedReminderTone);
      const nextSettings: ReminderSettings = {
        ...toReminderSettings(state),
        enabled: true,
        permissionStatus,
        notificationId: nextNotificationId,
      };

      await persistSettings(nextSettings);
      setState((current) => ({
        ...current,
        ...nextSettings,
        isSaving: false,
      }));

      return { ok: true };
    } catch (error) {
      await trackDiagnosticEvent("reminder_enable_failed", {
        category: categorizeError(error),
      });
      setState((current) => ({ ...current, isSaving: false }));
      throw error;
    }
  }, [attentionReminderSilenced, resolvedReminderTone, state]);

  const selectedTimeLabel = useMemo(() => {
    const matchingOption = REMINDER_TIME_OPTIONS.find(
      (option) => option.hour === state.hour && option.minute === state.minute,
    );

    return matchingOption?.label ?? `${String(state.hour).padStart(2, "0")}:${String(state.minute).padStart(2, "0")}`;
  }, [state.hour, state.minute]);

  return {
    ...state,
    selectedTimeLabel,
    timeOptions: REMINDER_TIME_OPTIONS,
    enableReminders,
    disableReminders,
    updateTime,
    refresh,
    adaptiveReminderTone: resolvedReminderTone,
    adaptiveReminderCadence: resolvedReminderCadence,
    adaptiveReminderFlow: adaptiveFlow,
    attentionReminderSilenced,
    attentionReminderNecessity: notificationNecessity,
  };
}
