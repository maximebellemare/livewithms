import { format, parseISO } from "date-fns";
import type { DailyEntry } from "@/hooks/useEntries";
import type { Profile } from "@/hooks/useProfile";
import type { DbMedication, DbMedicationLog } from "@/hooks/useMedications";
import type { DbAppointment } from "@/hooks/useAppointments";
import type { Relapse } from "@/hooks/useRelapses";
import type { RiskScore } from "@/hooks/useRiskScores";
import { computeRisk } from "@/components/relapse-risk/computeRisk";
import { buildHtmlDocument, escapeHtml, htmlBlob } from "./browser-export";

interface ReportData {
  startDate: string;
  endDate: string;
  includeSymptoms: boolean;
  includeMedications: boolean;
  includeAppointments: boolean;
  includeProfile: boolean;
  includeNotes: boolean;
  includeRelapses?: boolean;
  includeHydration?: boolean;
  includeRiskScore?: boolean;
  includeTrendCharts?: boolean;
  includeMoodTags?: boolean;
  includePeriodComparison?: boolean;
  includeTriggerAnalysis?: boolean;
  aiInsight?: string | null;
  entries: DailyEntry[];
  profile: Profile | null;
  medications: DbMedication[];
  medLogs: DbMedicationLog[];
  appointments: DbAppointment[];
  relapses?: Relapse[];
  riskScores?: RiskScore[];
}

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
    .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`)
    .join("")}</tbody></table>`;
}

function average(values: number[]): string {
  return values.length ? (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1) : "—";
}

export function generateReportFromData(data: ReportData): Blob {
  const sections: Array<{ heading: string; body: string }> = [
    {
      heading: "Report period",
      body: `<p>${escapeHtml(
        `${format(parseISO(data.startDate), "MMM d, yyyy")} – ${format(parseISO(data.endDate), "MMM d, yyyy")}`,
      )}</p><p>${escapeHtml(`Total entries: ${data.entries.length}`)}</p>`,
    },
  ];

  if (data.aiInsight?.trim()) {
    sections.push({
      heading: "Summary",
      body: `<p>${escapeHtml(data.aiInsight.trim())}</p>`,
    });
  }

  if (data.includeProfile && data.profile) {
    const rows: string[][] = [];
    if (data.profile.ms_type) rows.push(["MS Type", data.profile.ms_type]);
    if (data.profile.year_diagnosed) rows.push(["Year Diagnosed", String(data.profile.year_diagnosed)]);
    if (data.profile.age_range) rows.push(["Age Range", data.profile.age_range]);
    if (data.profile.symptoms?.length) rows.push(["Key Symptoms", data.profile.symptoms.join(", ")]);
    if (data.profile.goals?.length) rows.push(["Goals", data.profile.goals.join(", ")]);
    if (rows.length > 0) {
      sections.push({ heading: "MS profile", body: buildKeyValueTable(rows) });
    }
  }

  if (data.includeSymptoms && data.entries.length > 0) {
    const keys = [
      ["fatigue", "Fatigue"],
      ["pain", "Pain"],
      ["brain_fog", "Brain Fog"],
      ["mood", "Mood"],
      ["mobility", "Mobility"],
      ["spasticity", "Spasticity"],
      ["stress", "Stress"],
    ] as const;
    const rows = keys.map(([key, label]) => {
      const values = data.entries.map((entry) => entry[key]).filter((value): value is number => value != null);
      return [
        label,
        average(values),
        values.length ? String(Math.min(...values)) : "—",
        values.length ? String(Math.max(...values)) : "—",
      ];
    });
    sections.push({
      heading: "Symptom summary",
      body: buildMatrixTable(["Symptom", "Average", "Min", "Max"], rows),
    });
  }

  if (data.includeMedications && data.medications.length > 0) {
    const rows = data.medications.map((medication) => {
      const logs = data.medLogs.filter((log) => log.medicationId === medication.id);
      const taken = logs.filter((log) => log.status === "taken").length;
      const total = logs.length;
      const adherence = total > 0 ? `${Math.round((taken / total) * 100)}%` : "—";
      return [
        medication.name,
        medication.dosage || "—",
        medication.schedule_type || "—",
        adherence,
      ];
    });
    sections.push({
      heading: "Medication support",
      body: buildMatrixTable(["Medication", "Dosage", "Schedule", "Adherence"], rows),
    });
  }

  if (data.includeAppointments && data.appointments.length > 0) {
    const rows = data.appointments
      .sort((left, right) => left.date.localeCompare(right.date))
      .map((appointment) => [
        format(parseISO(appointment.date), "MMM d, yyyy"),
        appointment.time || "—",
        appointment.type,
        appointment.title,
        appointment.location || "—",
      ]);
    sections.push({
      heading: "Appointments",
      body: buildMatrixTable(["Date", "Time", "Type", "Title", "Location"], rows),
    });
  }

  if (data.includeRelapses && data.relapses?.length) {
    const rows = data.relapses.map((relapse) => [
      format(parseISO(relapse.start_date), "MMM d, yyyy"),
      relapse.end_date ? format(parseISO(relapse.end_date), "MMM d, yyyy") : "Ongoing",
      relapse.severity,
      relapse.symptoms.join(", ") || "—",
      relapse.is_recovered ? "Recovered" : "Still active",
    ]);
    sections.push({
      heading: "Relapses",
      body: buildMatrixTable(["Start", "End", "Severity", "Symptoms", "Status"], rows),
    });
  }

  if (data.includeRiskScore && data.entries.length >= 4) {
    const recent = data.entries.slice(-7);
    const older = data.entries.slice(-14, -7);
    const risk = computeRisk(recent, older);
    const rows = [
      ["Current score", `${risk.score}/100`],
      ["Risk level", risk.level],
      ["Contributing factors", risk.factors.join(", ") || "None surfaced"],
    ];
    if (data.riskScores?.length) {
      rows.push(["Recent trend", data.riskScores.slice(-6).map((score) => score.score).join(" → ")]);
    }
    sections.push({
      heading: "Risk overview",
      body: buildKeyValueTable(rows),
    });
  }

  if (data.includeNotes) {
    const rows = data.entries
      .filter((entry) => entry.notes?.trim())
      .map((entry) => [
        format(parseISO(entry.date), "MMM d, yyyy"),
        entry.notes!.trim(),
      ]);
    if (rows.length > 0) {
      sections.push({
        heading: "Notes and observations",
        body: buildMatrixTable(["Date", "Notes"], rows),
      });
    }
  }

  const html = buildHtmlDocument("LiveWithMS health report", sections);
  return htmlBlob(html);
}
