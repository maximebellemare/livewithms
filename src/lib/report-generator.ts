import { format, parseISO } from "date-fns";
import { getMedications, getMedicationLogs } from "./medications";
import { getAppointments, getAppointmentTypeInfo } from "./appointments";
import { buildHtmlDocument, downloadBlob, htmlBlob, escapeHtml } from "./browser-export";

interface ReportOptions {
  startDate: string;
  endDate: string;
  includeSymptoms: boolean;
  includeMedications: boolean;
  includeAppointments: boolean;
  includeProfile: boolean;
  includeNotes: boolean;
}

type StoredEntry = {
  date: string;
  fatigue?: number | null;
  pain?: number | null;
  brainFog?: number | null;
  mood?: number | null;
  mobility?: number | null;
  spasticity?: number | null;
  stress?: number | null;
  notes?: string | null;
};

type StoredProfile = {
  msType?: string;
  yearDiagnosed?: string | number;
  ageRange?: string;
  symptoms?: string[];
  goals?: string[];
  medications?: string[];
};

const getEntries = (): StoredEntry[] => JSON.parse(localStorage.getItem("ms-entries") || "[]");
const getProfile = (): StoredProfile => JSON.parse(localStorage.getItem("ms-profile") || "{}");

function buildKeyValueTable(rows: string[][]): string {
  return `<table><tbody>${rows
    .map(
      ([label, value]) =>
        `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`,
    )
    .join("")}</tbody></table>`;
}

function buildMatrixTable(headers: string[], rows: string[][]): string {
  return `<table><thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead><tbody>${rows
    .map(
      (row) =>
        `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`,
    )
    .join("")}</tbody></table>`;
}

export function generateReport(options: ReportOptions): void {
  const entries = getEntries().filter(
    (entry) => entry.date >= options.startDate && entry.date <= options.endDate,
  );
  const profile = getProfile();
  const medications = getMedications();
  const medLogs = getMedicationLogs().filter(
    (log) => log.date >= options.startDate && log.date <= options.endDate,
  );
  const appointments = getAppointments().filter(
    (appointment) => appointment.date >= options.startDate && appointment.date <= options.endDate,
  );

  const sections: Array<{ heading: string; body: string }> = [
    {
      heading: "Report period",
      body: `<p>${escapeHtml(
        `${format(parseISO(options.startDate), "MMM d, yyyy")} – ${format(parseISO(options.endDate), "MMM d, yyyy")}`,
      )}</p><p>${escapeHtml(`Total entries: ${entries.length}`)}</p>`,
    },
  ];

  if (options.includeProfile && Object.keys(profile).length > 0) {
    const rows: string[][] = [];
    if (profile.msType) rows.push(["MS Type", profile.msType]);
    if (profile.yearDiagnosed) rows.push(["Year Diagnosed", String(profile.yearDiagnosed)]);
    if (profile.ageRange) rows.push(["Age Range", profile.ageRange]);
    if (profile.symptoms?.length) rows.push(["Key Symptoms", profile.symptoms.join(", ")]);
    if (profile.goals?.length) rows.push(["Goals", profile.goals.join(", ")]);
    if (profile.medications?.length) rows.push(["Onboarding Medications", profile.medications.join(", ")]);
    if (rows.length > 0) sections.push({ heading: "MS profile", body: buildKeyValueTable(rows) });
  }

  if (options.includeSymptoms && entries.length > 0) {
    const keys = [
      ["fatigue", "Fatigue"],
      ["pain", "Pain"],
      ["brainFog", "Brain Fog"],
      ["mood", "Mood"],
      ["mobility", "Mobility"],
      ["spasticity", "Spasticity"],
      ["stress", "Stress"],
    ] as const;
    const rows = keys.map(([key, label]) => {
      const values = entries
        .map((entry) => entry[key])
        .filter((value): value is number => value != null);
      const average = values.length ? (values.reduce((sum: number, value: number) => sum + value, 0) / values.length).toFixed(1) : "—";
      const min = values.length ? String(Math.min(...values)) : "—";
      const max = values.length ? String(Math.max(...values)) : "—";
      return [label, average, min, max];
    });
    sections.push({
      heading: "Symptom summary",
      body: buildMatrixTable(["Symptom", "Average", "Min", "Max"], rows),
    });
  }

  if (options.includeMedications && medications.length > 0) {
    const rows = medications.map((medication) => {
      const logs = medLogs.filter((log) => log.medicationId === medication.id);
      const taken = logs.filter((log) => log.status === "taken").length;
      const total = logs.length;
      const schedule =
        medication.scheduleType === "daily"
          ? `${medication.timesPerDay || 1}× daily`
          : medication.scheduleType === "infusion"
            ? `Every ${medication.infusionIntervalMonths || 6} months`
            : "Custom schedule";
      return [
        medication.name,
        medication.dosage || "—",
        schedule,
        total > 0 ? `${Math.round((taken / total) * 100)}%` : "—",
      ];
    });
    sections.push({
      heading: "Medication support",
      body: buildMatrixTable(["Medication", "Dosage", "Schedule", "Adherence"], rows),
    });
  }

  if (options.includeAppointments && appointments.length > 0) {
    const rows = appointments
      .sort((left, right) => left.date.localeCompare(right.date))
      .map((appointment) => [
        format(parseISO(appointment.date), "MMM d, yyyy"),
        appointment.time || "—",
        getAppointmentTypeInfo(appointment.type).label,
        appointment.title,
        appointment.location || "—",
      ]);
    sections.push({
      heading: "Appointments",
      body: buildMatrixTable(["Date", "Time", "Type", "Title", "Location"], rows),
    });
  }

  if (options.includeNotes) {
    const notesRows = entries
      .filter((entry) => entry.notes?.trim())
      .map((entry) => [
        format(parseISO(entry.date), "MMM d, yyyy"),
        entry.notes?.trim() || "",
      ]);
    if (notesRows.length > 0) {
      sections.push({
        heading: "Notes and observations",
        body: buildMatrixTable(["Date", "Notes"], notesRows),
      });
    }
  }

  const html = buildHtmlDocument("LiveWithMS report", sections);
  downloadBlob(htmlBlob(html), `LiveWithMS-Report-${format(new Date(), "yyyy-MM-dd")}.html`);
}
