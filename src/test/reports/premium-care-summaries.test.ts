import { describe, expect, it } from "vitest";
import type { Appointment } from "../../../features/appointments/types";
import type { CareNote } from "../../../features/care-notes/types";
import type { DailyCheckIn } from "../../../features/checkins/types";
import type { Medication } from "../../../features/medications/types";
import {
  buildPremiumCareExportContent,
  canAccessPremiumCareSummaries,
  derivePremiumCareSummaries,
} from "../../../features/reports/premium-care-summaries";

function getDateDaysAgo(daysAgo: number) {
  const date = new Date("2026-05-21T12:00:00.000Z");
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

function buildEntry(date: string, overrides: Partial<DailyCheckIn> = {}): DailyCheckIn {
  return {
    id: date,
    user_id: "user-1",
    date,
    fatigue: 3,
    pain: 2,
    brain_fog: 2,
    mood: 3,
    mobility: 3,
    stress: 3,
    sleep_hours: 7,
    water_glasses: 6,
    notes: null,
    mood_tags: [],
    symptom_tags: [],
    triggers: [],
    wins: [],
    spasticity: null,
    created_at: `${date}T12:00:00.000Z`,
    updated_at: `${date}T12:00:00.000Z`,
    ...overrides,
  };
}

function buildMedication(overrides: Partial<Medication> = {}): Medication {
  return {
    id: "med-1",
    user_id: "user-1",
    name: "Vitamin D",
    dosage: "1000 IU",
    frequency: "Daily",
    notes: "With breakfast",
    active: true,
    created_at: "2026-05-01T12:00:00.000Z",
    updated_at: "2026-05-01T12:00:00.000Z",
    ...overrides,
  };
}

function buildAppointment(overrides: Partial<Appointment> = {}): Appointment {
  return {
    id: "appt-1",
    user_id: "user-1",
    title: "Neurology follow-up",
    appointment_date: "2026-05-30",
    appointment_time: "14:00",
    provider: "Dr. Lee",
    location: "Clinic",
    notes: null,
    created_at: "2026-05-01T12:00:00.000Z",
    updated_at: "2026-05-01T12:00:00.000Z",
    ...overrides,
  };
}

function buildCareNote(overrides: Partial<CareNote> = {}): CareNote {
  return {
    id: "note-1",
    user_id: "user-1",
    title: "A quieter week",
    body: "Felt easier when evenings stayed simpler.",
    category: "Support",
    created_at: "2026-05-01T12:00:00.000Z",
    updated_at: "2026-05-01T12:00:00.000Z",
    ...overrides,
  };
}

describe("premium care summaries", () => {
  it("builds calm weekly and monthly summaries", () => {
    const entries = Array.from({ length: 40 }, (_, index) =>
      buildEntry(getDateDaysAgo(index), {
        fatigue: index < 7 ? 4 + (index % 2) * 0.4 : 3,
        stress: index < 7 ? 4.2 : 3,
        sleep_hours: index < 7 ? 5.8 : 7,
        mood: index < 7 ? 2.7 : 3.2,
        notes: index < 4 ? "Kept the day quieter." : null,
      }),
    );

    const summaries = derivePremiumCareSummaries({
      entries,
      medications: [buildMedication()],
      appointments: [buildAppointment()],
      careNotes: [buildCareNote()],
    });

    expect(summaries.weekly.hasEnoughData).toBe(true);
    expect(summaries.monthly.hasEnoughData).toBe(true);
    expect(summaries.weekly.atAGlance.toLowerCase()).toContain("fatigue");
    expect(summaries.weekly.helpfulContextForAppointments.join(" ").toLowerCase()).toContain("upcoming visit");
    expect(summaries.monthly.symptomContextSummary.join(" ").toLowerCase()).not.toContain("worsening");
  });

  it("uses a calm fallback when there is not enough data", () => {
    const summaries = derivePremiumCareSummaries({
      entries: [buildEntry("2026-05-21"), buildEntry("2026-05-20")],
      medications: [],
      appointments: [],
      careNotes: [],
    });

    expect(summaries.weekly.hasEnoughData).toBe(false);
    expect(summaries.weekly.fallbackMessage).toBe("More gentle patterns may appear over time.");
    expect(summaries.monthly.hasEnoughData).toBe(false);
  });

  it("keeps low-energy output shorter", () => {
    const entries = Array.from({ length: 14 }, (_, index) =>
      buildEntry(getDateDaysAgo(index), {
        fatigue: 4.2,
        stress: 4,
        sleep_hours: 5.7,
        notes: "Needed a simpler evening.",
      }),
    );

    const summaries = derivePremiumCareSummaries({
      entries,
      medications: [buildMedication()],
      appointments: [buildAppointment()],
      careNotes: [buildCareNote()],
      lowEnergyMode: true,
    });

    expect(summaries.weekly.patternsWorthNoticing.length).toBeLessThanOrEqual(1);
    expect(summaries.weekly.whatMayHelpNext.length).toBeLessThanOrEqual(1);
    expect(summaries.weekly.reflectionContextHighlights.length).toBeLessThanOrEqual(1);
  });

  it("builds calmer clinician and caregiver exports", () => {
    const entries = Array.from({ length: 20 }, (_, index) =>
      buildEntry(getDateDaysAgo(index), {
        fatigue: index < 7 ? 4 : 3,
        stress: index < 7 ? 4 : 3,
        sleep_hours: index < 7 ? 6 : 7,
      }),
    );

    const summaries = derivePremiumCareSummaries({
      entries,
      medications: [buildMedication()],
      appointments: [buildAppointment()],
      careNotes: [buildCareNote()],
    });
    const clinician = buildPremiumCareExportContent({
      audience: "clinician",
      summaries,
    });
    const caregiver = buildPremiumCareExportContent({
      audience: "caregiver",
      summaries,
    });

    expect(clinician.sections.some((section) => section.title === "Helpful context for appointments")).toBe(true);
    expect(caregiver.sections.some((section) => section.title === "Helpful context")).toBe(true);
    expect(clinician.text.toLowerCase()).not.toContain("disease progression");
  });

  it("gates access only for active premium users with the export feature enabled", () => {
    expect(canAccessPremiumCareSummaries(true, true, true)).toBe(true);
    expect(canAccessPremiumCareSummaries(true, true, false)).toBe(false);
    expect(canAccessPremiumCareSummaries(true, false, true)).toBe(false);
    expect(canAccessPremiumCareSummaries(false, true, true)).toBe(false);
  });
});
