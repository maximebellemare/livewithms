export interface Medication {
  id: string;
  name: string;
  dosage: string;
  scheduleType: "daily" | "custom" | "infusion";
  // daily: times per day
  timesPerDay?: number;
  timeSlots?: string[]; // e.g. ["08:00", "20:00"]
  // custom: specific days
  customDays?: number[]; // 0=Sun, 1=Mon, ...
  // infusion: every X months
  infusionIntervalMonths?: number;
  nextInfusionDate?: string; // ISO date
  notes?: string;
  createdAt: string;
}

export interface MedicationLog {
  id: string;
  medicationId: string;
  date: string; // YYYY-MM-DD
  timeSlot?: string;
  status: "taken" | "skipped" | "missed";
  loggedAt: string;
}

const MEDS_KEY = "ms-medications";
const LOGS_KEY = "ms-medication-logs";

export const getMedications = (): Medication[] => {
  return JSON.parse(localStorage.getItem(MEDS_KEY) || "[]");
};

export const saveMedication = (med: Medication) => {
  const meds = getMedications();
  const idx = meds.findIndex((m) => m.id === med.id);
  if (idx >= 0) meds[idx] = med;
  else meds.push(med);
  localStorage.setItem(MEDS_KEY, JSON.stringify(meds));
};

export const deleteMedication = (id: string) => {
  const meds = getMedications().filter((m) => m.id !== id);
  localStorage.setItem(MEDS_KEY, JSON.stringify(meds));
};

export const getMedicationLogs = (): MedicationLog[] => {
  return JSON.parse(localStorage.getItem(LOGS_KEY) || "[]");
};

export const logMedication = (log: MedicationLog) => {
  const logs = getMedicationLogs();
  // Replace existing log for same med/date/timeslot
  const idx = logs.findIndex(
    (l) => l.medicationId === log.medicationId && l.date === log.date && l.timeSlot === log.timeSlot
  );
  if (idx >= 0) logs[idx] = log;
  else logs.push(log);
  localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
};

export const getTodayDateStr = () => new Date().toISOString().split("T")[0];

export const getDayOfWeek = (dateStr: string) => new Date(dateStr + "T12:00:00").getDay();

export const isMedDueToday = (med: Medication, dateStr: string): boolean => {
  if (med.scheduleType === "daily") return true;
  if (med.scheduleType === "custom") {
    const dow = getDayOfWeek(dateStr);
    return med.customDays?.includes(dow) ?? false;
  }
  if (med.scheduleType === "infusion") {
    return med.nextInfusionDate === dateStr;
  }
  return false;
};

export const getAdherenceRate = (medicationId: string, days = 30): number => {
  const logs = getMedicationLogs().filter((l) => l.medicationId === medicationId);
  if (logs.length === 0) return 0;
  const taken = logs.filter((l) => l.status === "taken").length;
  return Math.round((taken / logs.length) * 100);
};
