import type { ReminderContentTone, ReminderPermissionStatus } from "./types";
import { REMINDER_PLANS } from "./plans";
import { appSecureStore } from "../../lib/secure-store";
import { loadReminderSettings } from "./storage";

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
      categoryIdentifier?: string;
      data?: Record<string, unknown>;
    };
    trigger:
      | {
          hour: number;
          minute: number;
          repeats: boolean;
        }
      | Date;
  }) => Promise<string>;
  cancelScheduledNotificationAsync: (identifier: string) => Promise<void>;
  addNotificationResponseReceivedListener?: (listener: (response: NotificationResponse) => void) => {
    remove: () => void;
  };
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
    }
  | {
      type: "medication-skipped";
      medicationId: string;
    }
  | {
      type: "medication-later";
      medicationId: string;
    }
  | {
      type: "appointment-prepare";
      appointmentId: string;
    };

const CARE_REMINDER_IDS_KEY = "livewithms.care-reminder-ids";
const MEDICATION_REMINDER_CATEGORY = "medication-reminder";
const APPOINTMENT_REMINDER_CATEGORY = "appointment-reminder";

function loadNotificationsModule(): NotificationsModule | null {
  try {
    const dynamicRequire = Function("return require")();
    return dynamicRequire("expo-notifications") as NotificationsModule;
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

export function isNotificationsAvailable() {
  return loadNotificationsModule() !== null;
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
    },
    trigger: new Date(Date.now() + 10 * 1000),
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

async function getMedicationReminderTime(frequency: string) {
  const settings = await loadReminderSettings();

  if (settings.hour !== undefined && settings.minute !== undefined) {
    return { hour: settings.hour, minute: settings.minute };
  }

  const normalized = frequency.toLowerCase();

  if (normalized.includes("evening")) {
    return { hour: 19, minute: 0 };
  }

  if (normalized.includes("twice")) {
    return { hour: 9, minute: 0 };
  }

  if (normalized.includes("three")) {
    return { hour: 9, minute: 0 };
  }

  return { hour: 9, minute: 0 };
}

export async function scheduleMedicationReminder(input: {
  medicationId: string;
  name: string;
  frequency: string;
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
  const timing = await getMedicationReminderTime(input.frequency);
  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: `Time to take ${input.name}.`,
      body: "Mark it taken when you can.",
      sound: !settings.quietReminders,
      categoryIdentifier: MEDICATION_REMINDER_CATEGORY,
      data: {
        type: "medication",
        medicationId: input.medicationId,
        medicationName: input.name,
      },
    },
    trigger: {
      hour: timing.hour,
      minute: timing.minute,
      repeats: true,
    },
  });
  const ids = await loadCareReminderIds();
  await saveCareReminderIds({
    ...ids,
    [key]: [identifier],
  });

  return identifier;
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
      if (actionIdentifier === "skip") {
        listener({ type: "medication-skipped", medicationId: data.medicationId });
        return;
      }

      if (actionIdentifier === "later") {
        listener({ type: "medication-later", medicationId: data.medicationId });
        const medicationName = typeof data.medicationName === "string" ? data.medicationName : "your medication";
        const remindLaterAt = new Date(Date.now() + 30 * 60 * 1000);
        void Notifications.scheduleNotificationAsync({
          content: {
            title: `Time to take ${medicationName}.`,
            body: "A later reminder from your medication schedule.",
            sound: false,
            categoryIdentifier: MEDICATION_REMINDER_CATEGORY,
            data,
          },
          trigger: remindLaterAt,
        });
        return;
      }

      listener({ type: "medication-taken", medicationId: data.medicationId });
      return;
    }

    if (type === "appointment" && typeof data.appointmentId === "string") {
      listener({ type: "appointment-prepare", appointmentId: data.appointmentId });
    }
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
