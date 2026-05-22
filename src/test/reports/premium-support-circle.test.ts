import { describe, expect, it } from "vitest";
import type { Appointment } from "../../../features/appointments/types";
import type { DailyCheckIn } from "../../../features/checkins/types";
import type { Medication } from "../../../features/medications/types";
import {
  buildPremiumSupportCircleShareContent,
  derivePremiumSupportCircleSummaries,
} from "../../../features/reports/premium-support-circle";

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
    notes: null,
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

describe("premium support circle summaries", () => {
  it("builds calm summaries for trusted people without manipulative language", () => {
    const entries = Array.from({ length: 10 }, (_, index) =>
      buildEntry(getDateDaysAgo(index), {
        fatigue: index < 5 ? 4.3 : 3.2,
        stress: index < 5 ? 4.1 : 3,
        sleep_hours: index < 5 ? 5.9 : 7,
      }),
    );

    const summaries = derivePremiumSupportCircleSummaries({
      entries,
      appointments: [buildAppointment()],
      medications: [buildMedication()],
    });

    const combined = [
      summaries.partner.atAGlance,
      ...summaries.partner.whatThisWeekFeltLike,
      ...summaries.partner.communicationShortcuts,
      ...summaries.partner.boundaryGuidance,
      summaries.partner.privacyNote,
    ]
      .join(" ")
      .toLowerCase();

    expect(summaries.partner.hasEnoughData).toBe(true);
    expect(combined).not.toMatch(/ai caregiver assistant|relationship support system|oversight|always here for you|crisis/);
    expect(combined).toContain("manual");
  });

  it("keeps low-energy outputs shorter", () => {
    const entries = Array.from({ length: 7 }, (_, index) =>
      buildEntry(getDateDaysAgo(index), {
        fatigue: 4.5,
        stress: 4.2,
        sleep_hours: 5.8,
      }),
    );

    const summaries = derivePremiumSupportCircleSummaries({
      entries,
      appointments: [buildAppointment()],
      medications: [buildMedication()],
      lowEnergyMode: true,
    });

    expect(summaries["family-member"].whatThisWeekFeltLike.length).toBeLessThanOrEqual(2);
    expect(summaries["family-member"].communicationShortcuts.length).toBeLessThanOrEqual(2);
    expect(summaries["family-member"].boundaryGuidance.length).toBeLessThanOrEqual(2);
  });

  it("builds manual share content with privacy-safe wording", () => {
    const entries = Array.from({ length: 8 }, (_, index) =>
      buildEntry(getDateDaysAgo(index), {
        fatigue: 4,
        stress: 3.8,
        sleep_hours: 6.1,
      }),
    );

    const summaries = derivePremiumSupportCircleSummaries({
      entries,
      appointments: [buildAppointment()],
      medications: [buildMedication()],
    });
    const content = buildPremiumSupportCircleShareContent({
      audience: "caregiver",
      summary: summaries.caregiver,
    });

    expect(content.text.toLowerCase()).toContain("sharing stays manual");
    expect(content.text.toLowerCase()).not.toContain("automatic");
    expect(content.text.toLowerCase()).not.toContain("personal notes");
  });
});
