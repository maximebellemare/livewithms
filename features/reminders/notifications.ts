import type { ReminderContentTone, ReminderPermissionStatus } from "./types";
import type { CommunityActivityItem } from "../community/types";
import { REMINDER_PLANS } from "./plans";
import { appSecureStore } from "../../lib/secure-store";
import { loadReminderSettings } from "./storage";
import { Platform } from "react-native";
import type { MedicationDay, MedicationDoseTime, MedicationScheduleType } from "../medications/schedule";
import { MEDICATION_DAY_OPTIONS } from "../medications/schedule";

type NotificationsModule = {
  getPermissionsAsync: () => Promise<{ status?: string; granted?: boolean; ios?: { status?: number } }>;
  requestPermissionsAsync: () => Promise<{ status?: string; granted?: boolean; ios?: { status?: number } }>;
  setNotificationCategoryAsync?: (
    identifier: string,
    actions: Array<{
      identifier: string;
      buttonTitle: string;
      options?: {
        opensAppToForeground?: boolean;
      };
    }>,
  ) => Promise<void>;
  scheduleNotificationAsync: (input: {
    content: {
      title: string;
      body: string;
      sound?: boolean;
      channelId?: string;
      categoryIdentifier?: string;
      data?: Record<string, unknown>;
    };
    trigger:
      | {
          hour: number;
          minute: number;
          repeats: boolean;
          weekday?: number;
        }
      | Date;
  }) => Promise<string>;
  cancelScheduledNotificationAsync: (identifier: string) => Promise<void>;
  addNotificationResponseReceivedListener?: (listener: (response: NotificationResponse) => void) => {
    remove: () => void;
  };
  getExpoPushTokenAsync?: (input?: { projectId?: string }) => Promise<{ data: string }>;
  setNotificationChannelAsync?: (
    channelId: string,
    channel: {
      name: string;
      importance?: number;
      vibrationPattern?: number[];
      lightColor?: string;
      sound?: "default" | null;
    },
  ) => Promise<void>;
};

type NotificationResponse = {
  actionIdentifier?: string;
  notification?: {
    request?: {
      content?: {
        data?: Record<string, unknown>;
      };
    };
  };
};

export type CareNotificationAction =
  | {
      type: "medication-taken";
      medicationId: string;
      scheduledTime?: string | null;
    }
  | {
      type: "medication-skipped";
      medicationId: string;
      scheduledTime?: string | null;
    }
  | {
      type: "medication-later";
      medicationId: string;
      scheduledTime?: string | null;
    }
  | {
      type: "appointment-prepare";
      appointmentId: string;
    };

const CARE_REMINDER_IDS_KEY = "livewithms.care-reminder-ids";
const MEDICATION_REMINDER_CATEGORY = "medication-reminder";
const APPOINTMENT_REMINDER_CATEGORY = "appointment-reminder";
const DEFAULT_NOTIFICATION_CHANNEL = "livewithms-default";

function loadNotificationsModule(): NotificationsModule | null {
  try {
    const dynamicRequire = Function("return require")();
    return dynamicRequire("expo-notifications") as NotificationsModule;
  } catch {
    return null;
  }
}

function loadConstantsModule() {
  try {
    const dynamicRequire = Function("return require")();
    return dynamicRequire("expo-constants") as {
      default?: {
        expoConfig?: {
          extra?: {
            eas?: {
              projectId?: string;
            };
          };
        };
      };
    };
  } catch {
    return null;
  }
}

function normalizePermissionStatus(result: {
  status?: string;
  granted?: boolean;
  ios?: { status?: number };
}): ReminderPermissionStatus {
  if (result?.granted || result?.status === "granted" || result?.ios?.status === 2) {
    return "granted";
  }

  if (result?.status === "denied" || result?.ios?.status === 1) {
    return "denied";
  }

  return "unknown";
}

async function ensureAndroidNotificationChannel(Notifications: NotificationsModule) {
  if (Platform.OS !== "android" || !Notifications.setNotificationChannelAsync) {
    return;
  }

  await Notifications.setNotificationChannelAsync(DEFAULT_NOTIFICATION_CHANNEL, {
    name: "LiveWithMS notifications",
    importance: 4,
    vibrationPattern: [0, 200, 120, 200],
    lightColor: "#d97706",
    sound: "default",
  });
}

export function isNotificationsAvailable() {
  return loadNotificationsModule() !== null;
}

export async function getExpoPushToken() {
  const Notifications = loadNotificationsModule();

  if (!Notifications?.getExpoPushTokenAsync) {
    return null;
  }

  const permissionStatus = await getReminderPermissionStatus();
  if (permissionStatus !== "granted") {
    return null;
  }

  try {
    await ensureAndroidNotificationChannel(Notifications);
    const Constants = loadConstantsModule();
    const projectId = Constants?.default?.expoConfig?.extra?.eas?.projectId;
    const token = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    return {
      token: token.data,
      platform: Platform.OS,
    };
  } catch {
    return null;
  }
}

export async function getReminderPermissionStatus(): Promise<ReminderPermissionStatus> {
  const Notifications = loadNotificationsModule();

  if (!Notifications) {
    return "unavailable";
  }

  try {
    const permissions = await Notifications.getPermissionsAsync();
    return normalizePermissionStatus(permissions);
  } catch {
    return "unknown";
  }
}

export async function requestReminderPermission(): Promise<ReminderPermissionStatus> {
  const Notifications = loadNotificationsModule();

  if (!Notifications) {
    return "unavailable";
  }

  try {
    const permissions = await Notifications.requestPermissionsAsync();
    await ensureAndroidNotificationChannel(Notifications);
    return normalizePermissionStatus(permissions);
  } catch {
    return "unknown";
  }
}

export async function scheduleDailyReminder(
  hour: number,
  minute: number,
  tone: ReminderContentTone = "daily-checkin",
) {
  const Notifications = loadNotificationsModule();
  const defaultPlan = REMINDER_PLANS.find((plan) => plan.key === tone) ?? REMINDER_PLANS.find((plan) => plan.key === "daily-checkin");

  if (!Notifications) {
    return null;
  }

  return Notifications.scheduleNotificationAsync({
    content: {
      title: defaultPlan?.title ?? "How are you feeling today?",
      body: defaultPlan?.body ?? "A quick check-in can help you notice patterns.",
      sound: false,
      channelId: Platform.OS === "android" ? DEFAULT_NOTIFICATION_CHANNEL : undefined,
    },
    trigger: {
      hour,
      minute,
      repeats: true,
    },
  });
}

export async function cancelScheduledReminder(identifier: string | null | undefined) {
  const Notifications = loadNotificationsModule();

  if (!Notifications || !identifier) {
    return;
  }

  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch {
    // Keep cancellation failures silent so reminders never block the rest of the app.
  }
}

export async function scheduleTestNotification() {
  const Notifications = loadNotificationsModule();

  if (!Notifications) {
    return null;
  }

  const permissionStatus = await getReminderPermissionStatus();
  const finalPermissionStatus = permissionStatus === "granted" ? permissionStatus : await requestReminderPermission();

  if (finalPermissionStatus !== "granted") {
    return null;
  }

  const settings = await loadReminderSettings();

  return Notifications.scheduleNotificationAsync({
    content: {
      title: "LiveWithMS notification test",
      body: "Notifications are working.",
      sound: !settings.quietReminders,
      channelId: Platform.OS === "android" ? DEFAULT_NOTIFICATION_CHANNEL : undefined,
    },
    trigger: new Date(Date.now() + 10 * 1000),
  });
}

export async function scheduleCommunityActivityNotification(input: {
  item: CommunityActivityItem;
  quiet: boolean;
}) {
  const Notifications = loadNotificationsModule();

  if (!Notifications) {
    return null;
  }

  const permissionStatus = await getReminderPermissionStatus();
  if (permissionStatus !== "granted") {
    return null;
  }

  const title =
    input.item.type === "reply"
      ? "New reply in Community"
      : input.item.type === "reaction"
        ? "New reaction in Community"
        : "New post in Community";
  const body =
    input.item.type === "reply"
      ? `${input.item.actorDisplayName} replied to “${input.item.postTitle}”.`
      : input.item.type === "reaction"
        ? `${input.item.actorDisplayName} interacted with “${input.item.postTitle}”.`
        : `${input.item.actorDisplayName} posted in ${input.item.category.replace(/-/g, " ")}.`;

  return Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: !input.quiet,
      channelId: Platform.OS === "android" ? DEFAULT_NOTIFICATION_CHANNEL : undefined,
      data: {
        type: "community-activity",
        postId: input.item.postId,
        communityActivityId: input.item.id,
        communityActivityType: input.item.type,
      },
    },
    trigger: new Date(Date.now() + 1200),
  });
}

async function loadCareReminderIds(): Promise<Record<string, string[]>> {
  const raw = await appSecureStore.getItem(CARE_REMINDER_IDS_KEY);

  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw) as Record<string, string[]>;
  } catch {
    return {};
  }
}

async function saveCareReminderIds(ids: Record<string, string[]>) {
  await appSecureStore.setItem(CARE_REMINDER_IDS_KEY, JSON.stringify(ids));
}

async function ensureCareNotificationCategories(Notifications: NotificationsModule) {
  await ensureAndroidNotificationChannel(Notifications);
  await Notifications.setNotificationCategoryAsync?.(MEDICATION_REMINDER_CATEGORY, [
    { identifier: "taken", buttonTitle: "Taken", options: { opensAppToForeground: true } },
    { identifier: "skip", buttonTitle: "Skip", options: { opensAppToForeground: true } },
    { identifier: "later", buttonTitle: "Remind me later", options: { opensAppToForeground: true } },
  ]);
  await Notifications.setNotificationCategoryAsync?.(APPOINTMENT_REMINDER_CATEGORY, [
    { identifier: "prepare", buttonTitle: "Prepare summary", options: { opensAppToForeground: true } },
  ]);
}

export async function cancelCareReminders(key: string) {
  const Notifications = loadNotificationsModule();
  const ids = await loadCareReminderIds();
  const existingIds = ids[key] ?? [];

  if (Notifications) {
    await Promise.all(existingIds.map((identifier) => cancelScheduledReminder(identifier)));
  }

  if (existingIds.length) {
    const nextIds = { ...ids };
    delete nextIds[key];
    await saveCareReminderIds(nextIds);
  }
}

export async function cancelCareRemindersByPrefix(prefix: string) {
  const Notifications = loadNotificationsModule();
  const ids = await loadCareReminderIds();
  const matchingKeys = Object.keys(ids).filter((key) => key.startsWith(prefix));

  if (Notifications) {
    await Promise.all(
      matchingKeys.flatMap((key) => ids[key] ?? []).map((identifier) => cancelScheduledReminder(identifier)),
    );
  }

  if (matchingKeys.length) {
    const nextIds = { ...ids };
    matchingKeys.forEach((key) => {
      delete nextIds[key];
    });
    await saveCareReminderIds(nextIds);
  }
}

function parseDoseClock(time: string) {
  const [hour, minute] = time.split(":").map((part) => Number(part));
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) {
    return null;
  }

  return { hour, minute };
}

function getExpoWeekday(day: MedicationDay) {
  return MEDICATION_DAY_OPTIONS.indexOf(day) + 1;
}

function buildMedicationReminderTriggers(input: {
  scheduleType: MedicationScheduleType;
  doseTimes: MedicationDoseTime[];
  selectedDays: MedicationDay[];
}) {
  if (input.scheduleType === "as_needed") {
    return [] as Array<{
      scheduledTime: string;
      trigger: {
        hour: number;
        minute: number;
        repeats: boolean;
        weekday?: number;
      };
    }>;
  }

  const normalizedTimes = input.doseTimes
    .map((doseTime) => {
      const parsed = parseDoseClock(doseTime.time);
      if (!parsed) {
        return null;
      }

      return {
        scheduledTime: doseTime.time,
        hour: parsed.hour,
        minute: parsed.minute,
      };
    })
    .filter((item): item is { scheduledTime: string; hour: number; minute: number } => Boolean(item));

  if (normalizedTimes.length === 0) {
    return [];
  }

  if (input.scheduleType === "daily") {
    return normalizedTimes.map((item) => ({
      scheduledTime: item.scheduledTime,
      trigger: {
        hour: item.hour,
        minute: item.minute,
        repeats: true,
      },
    }));
  }

  return input.selectedDays.flatMap((day) => {
    const weekday = getExpoWeekday(day);
    return normalizedTimes.map((item) => ({
      scheduledTime: item.scheduledTime,
      trigger: {
        weekday,
        hour: item.hour,
        minute: item.minute,
        repeats: true,
      },
    }));
  });
}

export async function scheduleMedicationReminder(input: {
  medicationId: string;
  name: string;
  scheduleType: MedicationScheduleType;
  doseTimes: MedicationDoseTime[];
  selectedDays: MedicationDay[];
}) {
  const Notifications = loadNotificationsModule();

  if (!Notifications) {
    return null;
  }

  const settings = await loadReminderSettings();

  if (!settings.medicationRemindersEnabled) {
    return null;
  }

  const permissionStatus = await getReminderPermissionStatus();
  const finalPermissionStatus = permissionStatus === "granted" ? permissionStatus : await requestReminderPermission();

  if (finalPermissionStatus !== "granted") {
    return null;
  }

  await ensureCareNotificationCategories(Notifications);
  const key = `medication.${input.medicationId}`;
  await cancelCareReminders(key);
  const triggers = buildMedicationReminderTriggers({
    scheduleType: input.scheduleType,
    doseTimes: input.doseTimes,
    selectedDays: input.selectedDays,
  });

  if (triggers.length === 0) {
    return [];
  }

  const identifiers = await Promise.all(
    triggers.map((item) =>
      Notifications.scheduleNotificationAsync({
        content: {
          title: `Time to take ${input.name}.`,
          body: "Mark it taken when you can.",
          sound: !settings.quietReminders,
          channelId: Platform.OS === "android" ? DEFAULT_NOTIFICATION_CHANNEL : undefined,
          categoryIdentifier: MEDICATION_REMINDER_CATEGORY,
          data: {
            type: "medication",
            medicationId: input.medicationId,
            medicationName: input.name,
            scheduledTime: item.scheduledTime,
          },
        },
        trigger: item.trigger,
      }),
    ),
  );
  const ids = await loadCareReminderIds();
  await saveCareReminderIds({
    ...ids,
    [key]: identifiers,
  });

  return identifiers;
}

export function addCareNotificationResponseListener(
  listener: (action: CareNotificationAction) => void,
) {
  const Notifications = loadNotificationsModule();

  if (!Notifications?.addNotificationResponseReceivedListener) {
    return () => undefined;
  }

  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const actionIdentifier = response.actionIdentifier ?? "";
    const data = response.notification?.request?.content?.data ?? {};
    const type = typeof data.type === "string" ? data.type : null;

    if (type === "medication" && typeof data.medicationId === "string") {
      const scheduledTime = typeof data.scheduledTime === "string" ? data.scheduledTime : null;
      if (actionIdentifier === "skip") {
        listener({ type: "medication-skipped", medicationId: data.medicationId, scheduledTime });
        return;
      }

      if (actionIdentifier === "later") {
        listener({ type: "medication-later", medicationId: data.medicationId, scheduledTime });
        const medicationName = typeof data.medicationName === "string" ? data.medicationName : "your medication";
        const remindLaterAt = new Date(Date.now() + 30 * 60 * 1000);
        void Notifications.scheduleNotificationAsync({
          content: {
            title: `Time to take ${medicationName}.`,
            body: "A later reminder from your medication schedule.",
            sound: false,
            channelId: Platform.OS === "android" ? DEFAULT_NOTIFICATION_CHANNEL : undefined,
            categoryIdentifier: MEDICATION_REMINDER_CATEGORY,
            data,
          },
          trigger: remindLaterAt,
        });
        return;
      }

      listener({ type: "medication-taken", medicationId: data.medicationId, scheduledTime });
      return;
    }

    if (type === "appointment" && typeof data.appointmentId === "string") {
      listener({ type: "appointment-prepare", appointmentId: data.appointmentId });
    }
  });

  return () => subscription.remove();
}

export function addAppNotificationResponseListener(
  listener: (response: NotificationResponse) => void,
) {
  const Notifications = loadNotificationsModule();

  if (!Notifications?.addNotificationResponseReceivedListener) {
    return () => undefined;
  }

  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    listener(response);
  });

  return () => subscription.remove();
}

function buildAppointmentDate(input: {
  appointmentDate: string;
  appointmentTime: string | null;
}) {
  const time = input.appointmentTime || "09:00";
  const date = new Date(`${input.appointmentDate}T${time}:00`);

  return Number.isNaN(date.getTime()) ? null : date;
}

function formatAppointmentTimeLabel(date: Date) {
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export async function scheduleAppointmentReminders(input: {
  appointmentId: string;
  title: string;
  appointmentDate: string;
  appointmentTime: string | null;
}) {
  const Notifications = loadNotificationsModule();

  if (!Notifications) {
    return [];
  }

  const appointmentDate = buildAppointmentDate(input);

  if (!appointmentDate) {
    return [];
  }

  const settings = await loadReminderSettings();

  if (!settings.appointmentRemindersEnabled) {
    return [];
  }

  const permissionStatus = await getReminderPermissionStatus();
  const finalPermissionStatus = permissionStatus === "granted" ? permissionStatus : await requestReminderPermission();

  if (finalPermissionStatus !== "granted") {
    return [];
  }

  await ensureCareNotificationCategories(Notifications);
  const key = `appointment.${input.appointmentId}`;
  await cancelCareReminders(key);
  const now = Date.now();
  const oneDayBefore = new Date(appointmentDate.getTime() - 24 * 60 * 60 * 1000);
  const oneHourBefore = new Date(appointmentDate.getTime() - 60 * 60 * 1000);
  const scheduledDates = [
    settings.appointmentReminderOneDay ? oneDayBefore : null,
    settings.appointmentReminderOneHour ? oneHourBefore : null,
  ].filter((date): date is Date => Boolean(date) && date.getTime() > now);
  const appointmentTimeLabel = formatAppointmentTimeLabel(appointmentDate);
  const identifiers = await Promise.all(
    scheduledDates.map((triggerDate) =>
      Notifications.scheduleNotificationAsync({
        content: {
          title:
            triggerDate.getTime() === oneDayBefore.getTime()
              ? `You have ${input.title} tomorrow at ${appointmentTimeLabel}.`
              : `${input.title} is coming up at ${appointmentTimeLabel}.`,
          body: "Open Care if you want to prepare a short summary.",
          sound: !settings.quietReminders,
          channelId: Platform.OS === "android" ? DEFAULT_NOTIFICATION_CHANNEL : undefined,
          categoryIdentifier: APPOINTMENT_REMINDER_CATEGORY,
          data: {
            type: "appointment",
            appointmentId: input.appointmentId,
          },
        },
        trigger: triggerDate,
      }),
    ),
  );
  const ids = await loadCareReminderIds();
  await saveCareReminderIds({
    ...ids,
    [key]: identifiers,
  });

  return identifiers;
}
