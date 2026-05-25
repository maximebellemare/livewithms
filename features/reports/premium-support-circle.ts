import type { Appointment } from "../appointments/types";
import type { DailyCheckIn } from "../checkins/types";
import type { Medication } from "../medications/types";
import { sanitizeInsightSafety } from "../insights/actionable";
import { deriveEnergyCommunication } from "../../lib/support-circle/communication-support/deriveEnergyCommunication";
import { derivePacingExplanation } from "../../lib/support-circle/communication-support/derivePacingExplanation";
import { deriveBoundaryProtection } from "../../lib/support-circle/caregiver-safety/deriveBoundaryProtection";
import { preventCaregiverOverload } from "../../lib/support-circle/caregiver-safety/preventCaregiverOverload";
import { deriveGranularConsent } from "../../lib/support-circle/consent-governance/deriveGranularConsent";
import { validateSharingBoundaries } from "../../lib/support-circle/consent-governance/validateSharingBoundaries";
import { deriveLowPressureSharing } from "../../lib/support-circle/shared-calmness/deriveLowPressureSharing";
import { preventSurveillanceDynamics } from "../../lib/support-circle/shared-calmness/preventSurveillanceDynamics";
import { deriveSafeSharedContext } from "../../lib/support-circle/shared-insights/deriveSafeSharedContext";
import { softenSharedInterpretation } from "../../lib/support-circle/shared-insights/softenSharedInterpretation";
import { deriveRoleBoundaries } from "../../lib/support-circle/support-roles/deriveRoleBoundaries";
import { deriveSupportPermissions } from "../../lib/support-circle/support-roles/deriveSupportPermissions";
import type { SupportRole } from "../../lib/support-circle/types";

export type SupportCircleAudience = "partner" | "family-member" | "caregiver";

export type PremiumSupportCircleSummary = {
  audience: SupportCircleAudience;
  title: string;
  atAGlance: string;
  whatThisWeekFeltLike: string[];
  communicationShortcuts: string[];
  boundaryGuidance: string[];
  privacyNote: string;
  hasEnoughData: boolean;
  fallbackMessage?: string;
};

export type PremiumSupportCircleShareContent = {
  audience: SupportCircleAudience;
  title: string;
  text: string;
};

export type PremiumSupportCircleSummaries = Record<SupportCircleAudience, PremiumSupportCircleSummary>;

const FALLBACK_MESSAGE = "A support summary is available when details are hard to explain in the moment.";
const BANNED_PATTERNS = /\bai caregiver assistant\b|\brelationship support system\b|\bmonitor(?:ing)?\b|\boversight\b|\bworsening\b|\bdecline\b|\bcrisis\b|\balways here for you\b/gi;

function average(values: Array<number | null | undefined>) {
  const valid = values.filter((value): value is number => typeof value === "number");

  if (!valid.length) {
    return null;
  }

  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

function clampLines(lines: string[], limit: number) {
  return lines
    .map((line) => sanitizeInsightSafety(line))
    .map((line) => line.replace(BANNED_PATTERNS, "support").replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .filter((line, index, all) => all.indexOf(line) === index)
    .slice(0, limit);
}

function formatAudienceLabel(audience: SupportCircleAudience) {
  return audience === "family-member"
    ? "Family"
    : audience === "caregiver"
      ? "Caregiver"
      : "Partner";
}

function buildAtAGlance(values: {
  fatigueAverage: number | null;
  stressAverage: number | null;
  sleepAverage: number | null;
  lowEnergyDays: number;
}) {
  const { fatigueAverage, stressAverage, sleepAverage, lowEnergyDays } = values;

  if (fatigueAverage !== null && fatigueAverage >= 4.2) {
    return "This week included several lower-energy days.";
  }

  if (stressAverage !== null && stressAverage >= 4) {
    return "Stress looked higher this week.";
  }

  if (sleepAverage !== null && sleepAverage < 6.5) {
    return "Sleep was lower this week, which may have affected energy and pace.";
  }

  if (lowEnergyDays >= 2) {
    return "Some days looked lower-energy this week, even if others felt more manageable.";
  }

  return "This week included a mix of steadier and harder days.";
}

function buildWhatThisWeekFeltLike(input: {
  audience: SupportCircleAudience;
  permissions: ReturnType<typeof deriveSupportPermissions>;
  fatigueAverage: number | null;
  stressAverage: number | null;
  sleepAverage: number | null;
  activeMedicationsCount: number;
  nextAppointmentLine: string | null;
}) {
  const lines = deriveSafeSharedContext({
    permissions: input.permissions,
    fatigueAverage: input.fatigueAverage,
    stressAverage: input.stressAverage,
    sleepAverage: input.sleepAverage,
    activeMedicationsCount: input.activeMedicationsCount,
    nextAppointmentLine: input.nextAppointmentLine,
    careQuestionCount: input.permissions.canViewCareQuestions ? 1 : 0,
  }).map((line) => softenSharedInterpretation(line));

  if (input.audience === "partner" && lines.length < 3) {
    lines.push("Some days may have needed shorter plans.");
  }

  if (input.audience === "family-member" && lines.length < 3) {
    lines.push("Keeping things simpler may have helped more than adding more.");
  }

  if (input.audience === "caregiver" && lines.length < 3) {
    lines.push("A short practical overview may help more than repeated explanations.");
  }

  return lines;
}

function buildCommunicationShortcuts(input: {
  audience: SupportCircleAudience;
  fatigueAverage: number | null;
  stressAverage: number | null;
  sleepAverage: number | null;
  lowEnergyDays: number;
}) {
  const base = [
    "I may need a quieter pace today.",
    "My energy is lower than usual right now.",
    "I may need to keep today simpler.",
    deriveEnergyCommunication({
      fatigueAverage: input.fatigueAverage,
      stressAverage: input.stressAverage,
    }),
    derivePacingExplanation({
      fatigueAverage: input.fatigueAverage,
      sleepAverage: input.sleepAverage,
    }),
  ];

  if (input.audience === "caregiver") {
    base.push("Short check-ins may help more than a lot of back-and-forth right now.");
  } else if (input.audience === "family-member") {
    base.push("A simpler plan may help if the day already feels full.");
  } else if (input.lowEnergyDays >= 2) {
    base.push("One smaller plan may be enough today.");
  }

  return base;
}

function buildBoundaryGuidance(audience: SupportCircleAudience, hasRecentDifficulty: boolean) {
  return [
    deriveLowPressureSharing({
      role: audience,
      hasRecentDifficulty,
    }),
    preventSurveillanceDynamics(
      preventCaregiverOverload(
        deriveBoundaryProtection(audience),
      ),
    ),
    deriveRoleBoundaries(audience).summary,
  ];
}

function buildNextAppointmentLine(appointments: Appointment[]) {
  const today = new Date().toISOString().slice(0, 10);
  const nextAppointment =
    appointments
      .filter((appointment) => appointment.appointment_date >= today)
      .sort((left, right) => {
        const dateCompare = left.appointment_date.localeCompare(right.appointment_date);

        if (dateCompare !== 0) {
          return dateCompare;
        }

        return (left.appointment_time ?? "").localeCompare(right.appointment_time ?? "");
      })[0] ?? null;

  if (!nextAppointment) {
    return null;
  }

  return `${nextAppointment.title} on ${new Date(`${nextAppointment.appointment_date}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  })}${nextAppointment.appointment_time ? ` at ${nextAppointment.appointment_time}` : ""}`;
}

function buildSummaryForAudience(input: {
  audience: SupportCircleAudience;
  entries: DailyCheckIn[];
  appointments: Appointment[];
  medications: Medication[];
  lowEnergyMode: boolean;
}): PremiumSupportCircleSummary {
  const currentEntries = input.entries
    .slice()
    .sort((left, right) => right.date.localeCompare(left.date))
    .slice(0, 7);
  const fatigueAverage = average(currentEntries.map((entry) => entry.fatigue));
  const stressAverage = average(currentEntries.map((entry) => entry.stress));
  const sleepAverage = average(currentEntries.map((entry) => entry.sleep_hours));
  const lowEnergyDays = currentEntries.filter((entry) => (entry.fatigue ?? 0) >= 4).length;
  const activeMedicationsCount = input.medications.filter((medication) => medication.active).length;
  const nextAppointmentLine = buildNextAppointmentLine(input.appointments);
  const consent = deriveGranularConsent(input.audience, {
    shareHighLevelSummary: true,
    shareEnergyContext: true,
    sharePacingNeeds: true,
    shareAppointments: true,
    shareMedicationSummary: true,
    shareCareQuestions: input.audience === "partner" || input.audience === "caregiver",
  });
  const permissions = deriveSupportPermissions(input.audience, consent);
  const whatThisWeekFeltLike = clampLines(
    buildWhatThisWeekFeltLike({
      audience: input.audience,
      permissions,
      fatigueAverage,
      stressAverage,
      sleepAverage,
      activeMedicationsCount,
      nextAppointmentLine,
    }),
    input.lowEnergyMode ? 2 : 4,
  );
  const communicationShortcuts = clampLines(
    buildCommunicationShortcuts({
      audience: input.audience,
      fatigueAverage,
      stressAverage,
      sleepAverage,
      lowEnergyDays,
    }),
    input.lowEnergyMode ? 2 : 4,
  );
  const boundaryGuidance = clampLines(
    buildBoundaryGuidance(
      input.audience,
      lowEnergyDays >= 2 || (stressAverage ?? 0) >= 4,
    ),
    input.lowEnergyMode ? 2 : 3,
  );

  if (currentEntries.length < 3) {
    return {
      audience: input.audience,
      title: `${formatAudienceLabel(input.audience)} support summary`,
      atAGlance: FALLBACK_MESSAGE,
      whatThisWeekFeltLike: [],
      communicationShortcuts: [],
      boundaryGuidance: [],
      privacyNote: "Sharing stays manual, optional, and revocable anytime.",
      hasEnoughData: false,
      fallbackMessage: FALLBACK_MESSAGE,
    };
  }

  return {
    audience: input.audience,
    title: `${formatAudienceLabel(input.audience)} support summary`,
    atAGlance: buildAtAGlance({
      fatigueAverage,
      stressAverage,
      sleepAverage,
      lowEnergyDays,
    }),
    whatThisWeekFeltLike,
    communicationShortcuts,
    boundaryGuidance,
    privacyNote: "Sharing stays manual, optional, and revocable anytime. Nothing is shared unless you choose it.",
    hasEnoughData: true,
  };
}

export function derivePremiumSupportCircleSummaries(input: {
  entries: DailyCheckIn[];
  appointments: Appointment[];
  medications: Medication[];
  lowEnergyMode?: boolean;
}): PremiumSupportCircleSummaries {
  return {
    partner: buildSummaryForAudience({
      audience: "partner",
      entries: input.entries,
      appointments: input.appointments,
      medications: input.medications,
      lowEnergyMode: input.lowEnergyMode ?? false,
    }),
    "family-member": buildSummaryForAudience({
      audience: "family-member",
      entries: input.entries,
      appointments: input.appointments,
      medications: input.medications,
      lowEnergyMode: input.lowEnergyMode ?? false,
    }),
    caregiver: buildSummaryForAudience({
      audience: "caregiver",
      entries: input.entries,
      appointments: input.appointments,
      medications: input.medications,
      lowEnergyMode: input.lowEnergyMode ?? false,
    }),
  };
}

export function buildPremiumSupportCircleShareContent(input: {
  audience: SupportCircleAudience;
  summary: PremiumSupportCircleSummary;
}): PremiumSupportCircleShareContent {
  const summary = input.summary;
  const whatThisWeekFeltLike = summary.whatThisWeekFeltLike.slice(0, 3);
  const communicationShortcuts = summary.communicationShortcuts.slice(0, 2);
  const boundaryGuidance = summary.boundaryGuidance.slice(0, 2);
  const sharingBoundaries = validateSharingBoundaries({
    consent: deriveGranularConsent(input.audience, {
      shareHighLevelSummary: true,
      shareEnergyContext: true,
      sharePacingNeeds: true,
      shareAppointments: true,
      shareMedicationSummary: true,
      shareCareQuestions: input.audience === "partner" || input.audience === "caregiver",
    }),
    includesPersonalNotes: false,
    includesRealTimeData: false,
    lineCount: whatThisWeekFeltLike.length + communicationShortcuts.length + boundaryGuidance.length,
  });
  const text = [
    summary.title,
    "",
    summary.atAGlance,
    ...(whatThisWeekFeltLike.length
      ? [
          "",
          "What this week felt like",
          ...whatThisWeekFeltLike.map((line) => `• ${line}`),
        ]
      : []),
    ...(communicationShortcuts.length
      ? [
          "",
          "Simple ways to say it",
          ...communicationShortcuts.map((line) => `• ${line}`),
        ]
      : []),
    ...(boundaryGuidance.length
      ? [
          "",
          "Keeping support gentle",
          ...boundaryGuidance.map((line) => `• ${line}`),
        ]
      : []),
    "",
    sharingBoundaries.valid
      ? summary.privacyNote
      : "Sharing stays manual, optional, and easy to keep brief.",
  ].join("\n");

  return {
    audience: input.audience,
    title: summary.title,
    text,
  };
}
