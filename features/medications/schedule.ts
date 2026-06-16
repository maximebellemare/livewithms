import type { Medication } from "./types";

export const MEDICATION_DAY_OPTIONS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export type MedicationDay = (typeof MEDICATION_DAY_OPTIONS)[number];
export type MedicationScheduleType = "daily" | "weekly" | "as_needed";
export type MedicationDoseTime = {
  time: string;
  dose: string | null;
};

export type MedicationDoseEntry = {
  key: string;
  time: string;
  label: string;
  dose: string | null;
};

const DEFAULT_DAILY_TIME = "09:00";
const DEFAULT_WEEKLY_DAY: MedicationDay = "Sunday";

function isValidTime(value: string | null | undefined) {
  return typeof value === "string" && /^\d{2}:\d{2}$/.test(value.trim());
}

function normalizeTime(value: string | null | undefined) {
  if (!isValidTime(value)) {
    return null;
  }

  return value!.trim().slice(0, 5);
}

function normalizeDose(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function uniqueDoseTimes(items: MedicationDoseTime[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.time}::${item.dose ?? ""}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function sortDoseTimes(items: MedicationDoseTime[]) {
  return [...items].sort((left, right) => left.time.localeCompare(right.time));
}

export function normalizeMedicationScheduleType(value: string | null | undefined): MedicationScheduleType {
  const normalized = (value ?? "").trim().toLowerCase();

  if (normalized === "daily" || normalized === "weekly" || normalized === "as_needed") {
    return normalized;
  }

  if (normalized.includes("as needed") || normalized.includes("prn")) {
    return "as_needed";
  }

  if (normalized.includes("weekly")) {
    return "weekly";
  }

  if (normalized.includes("custom")) {
    return "weekly";
  }

  return "daily";
}

function buildLegacyDoseTimes(input: {
  scheduleType: MedicationScheduleType;
  scheduleLabel: string | null | undefined;
  reminderTime?: string | null;
  dosage?: string | null;
}) {
  if (input.scheduleType === "as_needed") {
    return [] as MedicationDoseTime[];
  }

  const explicitTime = normalizeTime(input.reminderTime);
  if (explicitTime) {
    return [{ time: explicitTime, dose: normalizeDose(input.dosage) }];
  }

  const normalizedLabel = (input.scheduleLabel ?? "").trim().toLowerCase();

  if (normalizedLabel.includes("twice")) {
    return [
      { time: "08:00", dose: normalizeDose(input.dosage) },
      { time: "20:00", dose: normalizeDose(input.dosage) },
    ];
  }

  if (normalizedLabel.includes("three")) {
    return [
      { time: "08:00", dose: normalizeDose(input.dosage) },
      { time: "14:00", dose: normalizeDose(input.dosage) },
      { time: "20:00", dose: normalizeDose(input.dosage) },
    ];
  }

  if (normalizedLabel.includes("evening")) {
    return [{ time: "20:00", dose: normalizeDose(input.dosage) }];
  }

  return [{ time: DEFAULT_DAILY_TIME, dose: normalizeDose(input.dosage) }];
}

export function normalizeMedicationDoseTimes(input: {
  raw: unknown;
  scheduleType: MedicationScheduleType;
  scheduleLabel?: string | null;
  reminderTime?: string | null;
  dosage?: string | null;
}) {
  const rawArray = Array.isArray(input.raw) ? input.raw : [];
  const normalized = rawArray
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const maybeTime = normalizeTime((item as { time?: string | null }).time);
      if (!maybeTime) {
        return null;
      }

      return {
        time: maybeTime,
        dose: normalizeDose((item as { dose?: string | null }).dose) ?? normalizeDose(input.dosage),
      } satisfies MedicationDoseTime;
    })
    .filter((item): item is MedicationDoseTime => Boolean(item));

  if (normalized.length > 0) {
    return sortDoseTimes(uniqueDoseTimes(normalized));
  }

  return sortDoseTimes(uniqueDoseTimes(buildLegacyDoseTimes(input)));
}

export function normalizeMedicationSelectedDays(input: {
  raw: unknown;
  scheduleType: MedicationScheduleType;
}) {
  const validDays = new Set<MedicationDay>(MEDICATION_DAY_OPTIONS);
  const rawArray = Array.isArray(input.raw) ? input.raw : [];
  const normalized = rawArray
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item): item is MedicationDay => validDays.has(item as MedicationDay));

  if (normalized.length > 0) {
    return MEDICATION_DAY_OPTIONS.filter((day) => normalized.includes(day));
  }

  if (input.scheduleType === "weekly") {
    return [DEFAULT_WEEKLY_DAY];
  }

  return MEDICATION_DAY_OPTIONS.filter(() => input.scheduleType === "daily");
}

export function formatMedicationReminderTime(reminderTime: string | null | undefined) {
  const normalized = normalizeTime(reminderTime);
  if (!normalized) {
    return null;
  }

  const [hour, minute] = normalized.split(":");
  const date = new Date();
  date.setHours(Number(hour), Number(minute), 0, 0);

  if (Number.isNaN(date.getTime())) {
    return normalized;
  }

  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function buildMedicationScheduleSummary(input: {
  scheduleType: MedicationScheduleType;
  doseTimes: MedicationDoseTime[];
  selectedDays: MedicationDay[];
}) {
  if (input.scheduleType === "as_needed") {
    return "As needed";
  }

  const timesLabel = input.doseTimes
    .map((item) => formatMedicationReminderTime(item.time) ?? item.time)
    .join(", ");

  if (input.scheduleType === "daily") {
    return timesLabel ? `Daily • ${timesLabel}` : "Daily";
  }

  if (input.scheduleType === "weekly") {
    const daysLabel = input.selectedDays.length > 0 ? input.selectedDays.join(", ") : DEFAULT_WEEKLY_DAY;
    return timesLabel ? `Weekly • ${daysLabel} • ${timesLabel}` : `Weekly • ${daysLabel}`;
  }

  const daysLabel = input.selectedDays.length > 0 ? input.selectedDays.join(", ") : DEFAULT_WEEKLY_DAY;
  return timesLabel ? `Weekly • ${daysLabel} • ${timesLabel}` : `Weekly • ${daysLabel}`;
}

export function buildMedicationTakenKey(medicationId: string, scheduledTime?: string | null) {
  const normalizedTime = normalizeTime(scheduledTime);
  return normalizedTime ? `${medicationId}::${normalizedTime}` : medicationId;
}

export function isMedicationDueOnDate(medication: Pick<Medication, "schedule_type" | "selected_days">, date: string) {
  const scheduleType = normalizeMedicationScheduleType(medication.schedule_type);

  if (scheduleType === "as_needed") {
    return false;
  }

  if (scheduleType === "daily") {
    return true;
  }

  const dateValue = new Date(`${date}T12:00:00`);
  const dayName = MEDICATION_DAY_OPTIONS[dateValue.getDay()] ?? DEFAULT_WEEKLY_DAY;
  return medication.selected_days.includes(dayName);
}

export function getMedicationDoseEntriesForDate(medication: Medication, date: string): MedicationDoseEntry[] {
  if (!isMedicationDueOnDate(medication, date)) {
    return [];
  }

  return medication.dose_times.map((doseTime) => ({
    key: buildMedicationTakenKey(medication.id, doseTime.time),
    time: doseTime.time,
    label: formatMedicationReminderTime(doseTime.time) ?? doseTime.time,
    dose: doseTime.dose,
  }));
}
