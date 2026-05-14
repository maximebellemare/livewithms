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

export const REMINDER_TIME_OPTIONS: ReminderTimeOption[] = [
  { id: "morning", label: "9:00 AM", hour: 9, minute: 0 },
  { id: "midday", label: "1:00 PM", hour: 13, minute: 0 },
  { id: "evening", label: "7:00 PM", hour: 19, minute: 0 },
];

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
  const [state, setState] = useState<ReminderState>({
    ...DEFAULT_REMINDER_SETTINGS,
    isLoading: true,
    isSaving: false,
    notificationsAvailable: isNotificationsAvailable(),
  });

  const refresh = useCallback(async () => {
    setState((current) => ({ ...current, isLoading: true }));

    const [savedSettings, permissionStatus] = await Promise.all([
      loadReminderSettings(),
      getReminderPermissionStatus(),
    ]);

    setState({
      ...savedSettings,
      permissionStatus,
      isLoading: false,
      isSaving: false,
      notificationsAvailable: isNotificationsAvailable(),
    });
  }, []);

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
        const nextNotificationId = await scheduleDailyReminder(hour, minute);
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
      setState((current) => ({
        ...current,
        isSaving: false,
      }));
      throw error;
    }
  }, [state.enabled, state.notificationId, state.permissionStatus]);

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
      const nextNotificationId = await scheduleDailyReminder(state.hour, state.minute);
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
      setState((current) => ({ ...current, isSaving: false }));
      throw error;
    }
  }, [state]);

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
  };
}
