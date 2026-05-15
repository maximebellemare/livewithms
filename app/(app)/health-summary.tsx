import { useMemo, useState } from "react";
import { router } from "expo-router";
import { Pressable, ScrollView, Share, StyleSheet, View } from "react-native";
import { useAppointments } from "../../features/appointments/hooks";
import { useAuth } from "../../features/auth/hooks";
import { useCheckInHistory, useCheckInOverview } from "../../features/checkins/hooks";
import { useCareNotes } from "../../features/care-notes/hooks";
import { useMedications } from "../../features/medications/hooks";
import { useGrowthState } from "../../features/growth/hooks";
import AppButton from "../../components/ui/AppButton";
import AppScreen from "../../components/ui/AppScreen";
import AppText from "../../components/ui/AppText";
import ErrorState from "../../components/ui/ErrorState";
import LoadingState from "../../components/ui/LoadingState";
import { getErrorMessage } from "../../lib/errors";
import { buildJourneySnapshot } from "../../lib/journey-design/buildJourneySnapshot";
import type { LongitudinalEntry } from "../../lib/longitudinal/types";
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
import { deriveAppointmentPreparation } from "../../lib/professional-support/appointment-support/deriveAppointmentPreparation";
import { deriveConversationSupport } from "../../lib/professional-support/appointment-support/deriveConversationSupport";
import { deriveEmotionallySafeReports } from "../../lib/professional-support/calm-summaries/deriveEmotionallySafeReports";
import { deriveHealthSummaries } from "../../lib/professional-support/calm-summaries/deriveHealthSummaries";
import { deriveProfessionalConsent } from "../../lib/professional-support/consent-sharing/deriveProfessionalConsent";
import { validateSharingControls } from "../../lib/professional-support/consent-sharing/validateSharingControls";
import { preventFearBasedSummaries } from "../../lib/professional-support/emotional-clinical-safety/preventFearBasedSummaries";
import { softenClinicalInterpretation } from "../../lib/professional-support/emotional-clinical-safety/softenClinicalInterpretation";
import { deriveDignityPreservingExports } from "../../lib/professional-support/human-centered-exports/deriveDignityPreservingExports";
import { preventReductionistScoring } from "../../lib/professional-support/human-centered-exports/preventReductionistScoring";
import { preserveTherapyBoundaries } from "../../lib/professional-support/therapy-boundaries/preserveTherapyBoundaries";
import { preventTherapeuticReplacement } from "../../lib/professional-support/therapy-boundaries/preventTherapeuticReplacement";
import { deriveMeaningfulExports } from "../../lib/legacy-integrity/human-centered-exports/deriveMeaningfulExports";
import { preserveReflectionOwnership } from "../../lib/legacy-integrity/human-centered-exports/preserveReflectionOwnership";
import { derivePauseSupport } from "../../lib/legacy-integrity/graceful-pauses/derivePauseSupport";
import { preserveCalmDisengagement } from "../../lib/legacy-integrity/graceful-pauses/preserveCalmDisengagement";
import { deriveHealthyDistance } from "../../lib/legacy-integrity/healthy-completion/deriveHealthyDistance";
import { preventRetentionClinginess } from "../../lib/legacy-integrity/healthy-completion/preventRetentionClinginess";
import { deriveLongTermArchives } from "../../lib/legacy-integrity/legacy-preservation/deriveLongTermArchives";
import { preserveContinuitySnapshots } from "../../lib/legacy-integrity/legacy-preservation/preserveContinuitySnapshots";
import { validateOwnershipTransparency } from "../../lib/legacy-integrity/data-ownership/validateOwnershipTransparency";
import { deriveDeletionClarity } from "../../lib/legacy-integrity/data-ownership/deriveDeletionClarity";
import { deriveGentleReturnFlows } from "../../lib/legacy-integrity/calm-reentry/deriveGentleReturnFlows";
import { preventGuiltReactivation } from "../../lib/legacy-integrity/calm-reentry/preventGuiltReactivation";

function getCutoffDate(days: number) {
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(now.getDate() - (days - 1));
  return cutoff.toISOString().slice(0, 10);
}

function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function roundToOneDecimal(value: number | null) {
  if (value === null) {
    return null;
  }

  return Math.round(value * 10) / 10;
}

function average(values: Array<number | null>) {
  const validValues = values.filter((value): value is number => value !== null);

  if (!validValues.length) {
    return null;
  }

  return roundToOneDecimal(validValues.reduce((sum, value) => sum + value, 0) / validValues.length);
}

function buildTrendCopy(
  earlier: number | null,
  later: number | null,
  config: {
    label: string;
    higherIsBetter: boolean;
    positive: string;
    negative: string;
    stable: string;
  },
) {
  if (later === null) {
    return `There is not enough recent ${config.label.toLowerCase()} data yet.`;
  }

  if (earlier === null || Math.abs(later - earlier) < 0.35) {
    return config.stable;
  }

  const improving = config.higherIsBetter ? later > earlier : later < earlier;
  return improving ? config.positive : config.negative;
}

function formatAverage(value: number | null, suffix = "/5") {
  if (value === null) {
    return "—";
  }

  return `${value}${suffix}`;
}

function getNotableChangeLabel(earlier: number | null, later: number | null, higherIsBetter: boolean) {
  if (earlier === null || later === null) {
    return "Still taking shape";
  }

  const difference = later - earlier;
  if (Math.abs(difference) < 0.35) {
    return "Mostly steady";
  }

  const improving = higherIsBetter ? difference > 0 : difference < 0;
  return improving ? "A little steadier" : "A little heavier";
}

function getConsistencyLabel(entryCount: number, range: 7 | 30) {
  const ratio = entryCount / range;

  if (ratio >= 0.75) {
    return "Quite consistent";
  }

  if (ratio >= 0.4) {
    return "Building consistency";
  }

  return "Just getting started";
}

function formatMedicationLine(name: string, dosage: string | null, frequency: string) {
  const details = [dosage, frequency].filter(Boolean).join(" • ");
  return details ? `${name} (${details})` : name;
}

function getReflectionPreview(note: string | null | undefined, maxLength = 120) {
  const trimmed = note?.trim() ?? "";

  if (!trimmed) {
    return null;
  }

  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxLength).trimEnd()}…`;
}

function mapCheckInsToLongitudinalEntries(
  entries: Array<{
    date: string;
    fatigue: number | null;
    stress: number | null;
    brain_fog: number | null;
    mood: number | null;
    sleep_hours: number | null;
    water_glasses: number | null;
    notes: string | null;
    updated_at: string;
    created_at: string;
  }>,
): LongitudinalEntry[] {
  return entries.map((entry) => {
    const timestamp = entry.updated_at || entry.created_at;
    const parsedHour = Number.isNaN(new Date(timestamp).getHours()) ? null : new Date(timestamp).getHours();

    return {
      date: entry.date,
      fatigue: entry.fatigue,
      stress: entry.stress,
      brain_fog: entry.brain_fog,
      mood: entry.mood,
      sleep_hours: entry.sleep_hours,
      water_glasses: entry.water_glasses,
      notes: entry.notes,
      reflection_text: entry.notes,
      interaction_count: entry.notes?.trim() ? 2 : 1,
      hour_of_day: parsedHour,
    };
  });
}

function buildShareText(input: {
  range: 7 | 30;
  totalCheckIns: number;
  rangeCheckIns: number;
  fatigueAverage: number | null;
  moodAverage: number | null;
  stressAverage: number | null;
  sleepAverage: number | null;
  symptomSummaryLines: string[];
  trendLines: string[];
  supportCircleLines: string[];
  sharedContextLines: string[];
  professionalLines: string[];
  legacyLines: string[];
  nextAppointmentLine: string | null;
  medicationLines: string[];
  appointmentQuestionLines: string[];
  activeMedicationsCount: number;
  upcomingAppointmentsCount: number;
}) {
  return [
    `LiveWithMS wellness summary (${input.range} days)`,
    "",
    "Overview",
    `• ${input.rangeCheckIns} ${input.rangeCheckIns === 1 ? "check-in" : "check-ins"} in this range`,
    `• ${input.totalCheckIns} total ${input.totalCheckIns === 1 ? "check-in" : "check-ins"} completed`,
    `• Fatigue average: ${formatAverage(input.fatigueAverage)}`,
    `• Mood average: ${formatAverage(input.moodAverage)}`,
    `• Stress average: ${formatAverage(input.stressAverage)}`,
    `• Sleep average: ${formatAverage(input.sleepAverage, "h")}`,
    "",
    "Symptom summary",
    ...input.symptomSummaryLines,
    "",
    "Care snapshot",
    `• Active medications: ${input.activeMedicationsCount}`,
    `• Upcoming appointments: ${input.upcomingAppointmentsCount}`,
    ...(input.nextAppointmentLine ? [`• Next appointment: ${input.nextAppointmentLine}`] : []),
    ...input.medicationLines.map((line) => `• ${line}`),
    "",
    "Recent trends",
    ...input.trendLines,
    ...(input.sharedContextLines.length
      ? [
          "",
          "Support circle context",
          ...input.sharedContextLines.map((line) => `• ${line}`),
        ]
      : []),
    ...(input.supportCircleLines.length
      ? [
          "",
          "Communication support",
          ...input.supportCircleLines.map((line) => `• ${line}`),
        ]
      : []),
    ...(input.professionalLines.length
      ? [
          "",
          "Professional support",
          ...input.professionalLines.map((line) => `• ${line}`),
        ]
      : []),
    ...(input.legacyLines.length
      ? [
          "",
          "Ownership and archives",
          ...input.legacyLines.map((line) => `• ${line}`),
        ]
      : []),
    ...(input.appointmentQuestionLines.length
      ? [
          "",
          "Questions to bring",
          ...input.appointmentQuestionLines,
        ]
      : []),
    "",
    "Sharing stays in your control and can remain brief, occasional, and revocable.",
  ].join("\n");
}

export default function HealthSummaryScreen() {
  const { user } = useAuth();
  const [range, setRange] = useState<7 | 30>(7);
  const historyQuery = useCheckInHistory(user?.id, 60);
  const overviewQuery = useCheckInOverview(user?.id);
  const medicationsQuery = useMedications(user?.id);
  const appointmentsQuery = useAppointments(user?.id);
  const careNotesQuery = useCareNotes(user?.id);
  const growth = useGrowthState({
    totalCheckIns: overviewQuery.data?.length ?? 0,
  });

  const rangeEntries = useMemo(() => {
    const entries = historyQuery.data ?? [];
    const cutoff = getCutoffDate(range);
    return entries.filter((entry) => entry.date >= cutoff);
  }, [historyQuery.data, range]);
  const longitudinalEntries = useMemo(
    () => mapCheckInsToLongitudinalEntries(historyQuery.data ?? []),
    [historyQuery.data],
  );
  const journeySnapshot = useMemo(
    () => buildJourneySnapshot(longitudinalEntries),
    [longitudinalEntries],
  );

  const sortedRangeEntries = useMemo(
    () => rangeEntries.slice().sort((left, right) => left.date.localeCompare(right.date)),
    [rangeEntries],
  );
  const midpoint = Math.ceil(sortedRangeEntries.length / 2);
  const earlierRangeEntries = sortedRangeEntries.slice(0, midpoint);
  const laterRangeEntries = sortedRangeEntries.slice(midpoint);

  const today = getTodayDateString();
  const totalCheckIns = overviewQuery.data?.length ?? 0;
  const consistencyLabel = getConsistencyLabel(rangeEntries.length, range);
  const activeMedicationsCount = useMemo(
    () => (medicationsQuery.data ?? []).filter((medication) => medication.active).length,
    [medicationsQuery.data],
  );
  const activeMedications = useMemo(
    () => (medicationsQuery.data ?? []).filter((medication) => medication.active).slice(0, 3),
    [medicationsQuery.data],
  );
  const upcomingAppointmentsCount = useMemo(
    () => (appointmentsQuery.data ?? []).filter((appointment) => appointment.appointment_date >= today).length,
    [appointmentsQuery.data, today],
  );
  const nextAppointment = useMemo(
    () =>
      (appointmentsQuery.data ?? [])
        .filter((appointment) => appointment.appointment_date >= today)
        .sort((left, right) => {
          const dateCompare = left.appointment_date.localeCompare(right.appointment_date);
          if (dateCompare !== 0) {
            return dateCompare;
          }

          return (left.appointment_time ?? "").localeCompare(right.appointment_time ?? "");
        })[0] ?? null,
    [appointmentsQuery.data, today],
  );
  const recentReflections = useMemo(
    () =>
      rangeEntries
        .filter((entry) => Boolean(entry.notes?.trim()))
        .slice(0, 2)
        .map((entry) => ({
          date: entry.date,
          preview: getReflectionPreview(entry.notes),
        }))
        .filter((entry): entry is { date: string; preview: string } => Boolean(entry.preview)),
    [rangeEntries],
  );
  const recentCareNotes = useMemo(
    () => (careNotesQuery.data ?? []).slice(0, 2),
    [careNotesQuery.data],
  );
  const supportCircleConsent = useMemo(
    () =>
      deriveGranularConsent("trusted-friend", {
        shareHighLevelSummary: true,
        shareEnergyContext: true,
        sharePacingNeeds: true,
        shareAppointments: true,
        shareMedicationSummary: true,
        shareCareQuestions: true,
      }),
    [],
  );
  const supportCirclePermissions = useMemo(
    () => deriveSupportPermissions("trusted-friend", supportCircleConsent),
    [supportCircleConsent],
  );
  const supportRoleBoundary = useMemo(() => deriveRoleBoundaries("trusted-friend"), []);
  const professionalConsent = useMemo(
    () => deriveProfessionalConsent("neurologist"),
    [],
  );

  const fatigueAverage = average(rangeEntries.map((entry) => entry.fatigue));
  const moodAverage = average(rangeEntries.map((entry) => entry.mood));
  const stressAverage = average(rangeEntries.map((entry) => entry.stress));
  const sleepAverage = average(rangeEntries.map((entry) => entry.sleep_hours));
  const fatigueEarlierAverage = average(earlierRangeEntries.map((entry) => entry.fatigue));
  const moodEarlierAverage = average(earlierRangeEntries.map((entry) => entry.mood));
  const stressEarlierAverage = average(earlierRangeEntries.map((entry) => entry.stress));
  const sleepEarlierAverage = average(earlierRangeEntries.map((entry) => entry.sleep_hours));
  const fatigueLaterAverage = average(laterRangeEntries.map((entry) => entry.fatigue));
  const moodLaterAverage = average(laterRangeEntries.map((entry) => entry.mood));
  const stressLaterAverage = average(laterRangeEntries.map((entry) => entry.stress));
  const sleepLaterAverage = average(laterRangeEntries.map((entry) => entry.sleep_hours));

  const trendLines = useMemo(
    () => [
      buildTrendCopy(fatigueEarlierAverage, fatigueLaterAverage, {
        label: "Fatigue",
        higherIsBetter: false,
        positive: "Fatigue has felt a little lighter recently.",
        negative: "Fatigue has been more elevated recently.",
        stable: "Fatigue has been relatively steady lately.",
      }),
      buildTrendCopy(moodEarlierAverage, moodLaterAverage, {
        label: "Mood",
        higherIsBetter: true,
        positive: "Mood has been trending upward.",
        negative: "Mood has felt a little lower recently.",
        stable: "Mood has been relatively stable.",
      }),
      buildTrendCopy(stressEarlierAverage, stressLaterAverage, {
        label: "Stress",
        higherIsBetter: false,
        positive: "Stress has felt a little lighter recently.",
        negative: "Stress has been more noticeable recently.",
        stable: "Stress has been fairly steady lately.",
      }),
      buildTrendCopy(sleepEarlierAverage, sleepLaterAverage, {
        label: "Sleep",
        higherIsBetter: true,
        positive: "Sleep has been a little steadier recently.",
        negative: "Sleep has been lighter recently.",
        stable: "Sleep has been fairly steady lately.",
      }),
    ],
    [
      fatigueEarlierAverage,
      fatigueLaterAverage,
      moodEarlierAverage,
      moodLaterAverage,
      sleepEarlierAverage,
      sleepLaterAverage,
      stressEarlierAverage,
      stressLaterAverage,
    ],
  );
  const symptomSummaryLines = useMemo(
    () => [
      `• Fatigue: ${formatAverage(fatigueAverage)} (${getNotableChangeLabel(fatigueEarlierAverage, fatigueLaterAverage, false)})`,
      `• Mood: ${formatAverage(moodAverage)} (${getNotableChangeLabel(moodEarlierAverage, moodLaterAverage, true)})`,
      `• Stress: ${formatAverage(stressAverage)} (${getNotableChangeLabel(stressEarlierAverage, stressLaterAverage, false)})`,
      `• Sleep: ${formatAverage(sleepAverage, "h")} (${getNotableChangeLabel(sleepEarlierAverage, sleepLaterAverage, true)})`,
      `• Check-in consistency: ${consistencyLabel}`,
    ],
    [
      consistencyLabel,
      fatigueAverage,
      fatigueEarlierAverage,
      fatigueLaterAverage,
      moodAverage,
      moodEarlierAverage,
      moodLaterAverage,
      sleepAverage,
      sleepEarlierAverage,
      sleepLaterAverage,
      stressAverage,
      stressEarlierAverage,
      stressLaterAverage,
    ],
  );
  const appointmentQuestionLines = useMemo(() => {
    const suggestions: string[] = [];

    if (fatigueLaterAverage !== null && fatigueLaterAverage >= 4) {
      suggestions.push("• Fatigue has felt heavier lately. Is there anything worth watching or simplifying?");
    }

    if (sleepLaterAverage !== null && sleepLaterAverage < 6.5) {
      suggestions.push("• Sleep has been lighter recently. Are there patterns or habits worth paying attention to?");
    }

    if (stressLaterAverage !== null && stressLaterAverage >= 4) {
      suggestions.push("• Stress has been more noticeable recently. What supports tend to matter most when stress is high?");
    }

    return suggestions.slice(0, 3);
  }, [fatigueLaterAverage, sleepLaterAverage, stressLaterAverage]);
  const nextAppointmentLine = useMemo(
    () =>
      nextAppointment
        ? `${nextAppointment.title} on ${new Date(`${nextAppointment.appointment_date}T12:00:00`).toLocaleDateString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
          })}${nextAppointment.appointment_time ? ` at ${nextAppointment.appointment_time}` : ""}`
        : null,
    [nextAppointment],
  );
  const supportContextLines = useMemo(
    () =>
      deriveSafeSharedContext({
        permissions: supportCirclePermissions,
        fatigueAverage,
        stressAverage,
        sleepAverage,
        activeMedicationsCount,
        nextAppointmentLine,
        careQuestionCount: appointmentQuestionLines.length,
      }).map((line) => softenSharedInterpretation(line)),
    [
      activeMedicationsCount,
      appointmentQuestionLines.length,
      fatigueAverage,
      nextAppointmentLine,
      sleepAverage,
      stressAverage,
      supportCirclePermissions,
    ],
  );
  const supportCommunicationLines = useMemo(
    () =>
      [
        deriveEnergyCommunication({
          fatigueAverage,
          stressAverage,
        }),
        derivePacingExplanation({
          fatigueAverage,
          sleepAverage,
        }),
        deriveLowPressureSharing({
          role: "trusted-friend",
          hasRecentDifficulty: (fatigueAverage ?? 0) >= 4 || (stressAverage ?? 0) >= 4,
        }),
        deriveBoundaryProtection("trusted-friend"),
      ].map((line) => preventSurveillanceDynamics(preventCaregiverOverload(line))),
    [fatigueAverage, sleepAverage, stressAverage],
  );
  const supportCircleSharingValid = useMemo(
    () =>
      validateSharingBoundaries({
        consent: supportCircleConsent,
        includesPersonalNotes: false,
        includesRealTimeData: false,
        lineCount: supportContextLines.length + supportCommunicationLines.length,
      }).valid,
    [supportCircleConsent, supportCommunicationLines.length, supportContextLines.length],
  );
  const professionalSummary = useMemo(
    () =>
      deriveHealthSummaries({
        fatigueAverage,
        stressAverage,
        sleepAverage,
        symptomSummaryLines,
        trendLines,
      }),
    [fatigueAverage, sleepAverage, stressAverage, symptomSummaryLines, trendLines],
  );
  const professionalAppointmentPrep = useMemo(
    () =>
      deriveAppointmentPreparation({
        fatigueAverage: fatigueLaterAverage,
        stressAverage: stressLaterAverage,
        sleepAverage: sleepLaterAverage,
      }),
    [fatigueLaterAverage, sleepLaterAverage, stressLaterAverage],
  );
  const professionalConversationSupport = useMemo(
    () =>
      deriveConversationSupport({
        fatigueAverage: fatigueAverage,
        brainFogAverage: average(rangeEntries.map((entry) => entry.brain_fog)),
      }),
    [fatigueAverage, rangeEntries],
  );
  const professionalLines = useMemo(() => {
    const rawLines = [
      ...professionalSummary.lines,
      ...deriveEmotionallySafeReports({
        trendLines,
        questionLines: appointmentQuestionLines.map((line) => line.replace(/^•\s*/, "")),
      }),
      ...professionalAppointmentPrep,
      professionalConversationSupport,
      preserveTherapyBoundaries(
        preventTherapeuticReplacement(
          "This can support therapy preparation without becoming a therapist in your pocket.",
        ),
      ),
    ];

    return deriveDignityPreservingExports(
      rawLines.map((line) =>
        preventFearBasedSummaries(
          softenClinicalInterpretation(
            preventReductionistScoring(line),
          ),
        ),
      ),
    ).slice(0, 6);
  }, [
    appointmentQuestionLines,
    professionalAppointmentPrep,
    professionalConversationSupport,
    professionalSummary.lines,
    trendLines,
  ]);
  const professionalSharingValid = useMemo(
    () =>
      validateSharingControls({
        consent: professionalConsent,
        includesPersonalNotes: false,
        includesEmotionalContext: false,
        lineCount: professionalLines.length,
      }).valid,
    [professionalConsent, professionalLines.length],
  );
  const legacyExport = useMemo(
    () =>
      deriveMeaningfulExports({
        hasReflections: recentReflections.length > 0,
        hasLongTermHistory: Boolean(journeySnapshot?.seasonalSummary || journeySnapshot?.continuitySignals.length),
        includeSupportContext: supportCircleSharingValid,
      }),
    [journeySnapshot, recentReflections.length, supportCircleSharingValid],
  );
  const legacyArchive = useMemo(
    () =>
      deriveLongTermArchives({
        hasJourneySnapshot: Boolean(journeySnapshot),
        hasReflections: recentReflections.length > 0,
      }),
    [journeySnapshot, recentReflections.length],
  );
  const legacyPause = useMemo(
    () =>
      derivePauseSupport({
        lowEngagement: rangeEntries.length < 4,
        wantsDistance: false,
      }),
    [rangeEntries.length],
  );
  const legacyLines = useMemo(() => {
    const lines = [
      ...legacyExport.lines,
      ...legacyArchive.lines,
      deriveHealthyDistance({
        totalCheckIns,
        wantsLessIllnessCentrality: true,
      }),
      deriveGentleReturnFlows({
        hasHistory: totalCheckIns > 0,
      }),
      legacyPause.body,
      deriveDeletionClarity(),
    ].map((line) =>
      preventGuiltReactivation(
        preventRetentionClinginess(
          preserveCalmDisengagement(
            preserveContinuitySnapshots(
              preserveReflectionOwnership(line),
            ),
          ),
        ),
      ),
    );

    return validateOwnershipTransparency(lines).valid ? lines.slice(0, 5) : [deriveDeletionClarity()];
  }, [legacyArchive.lines, legacyExport.lines, legacyPause.body, totalCheckIns]);

  const handleShare = async () => {
    try {
      await Share.share({
        message: buildShareText({
          range,
          totalCheckIns,
          rangeCheckIns: rangeEntries.length,
          fatigueAverage,
          moodAverage,
          stressAverage,
          sleepAverage,
          symptomSummaryLines,
          trendLines,
          supportCircleLines: supportCircleSharingValid ? supportCommunicationLines : [],
          sharedContextLines: supportCircleSharingValid ? supportContextLines : [],
          professionalLines: professionalSharingValid ? professionalLines : [],
          legacyLines,
          nextAppointmentLine,
          medicationLines: activeMedications.map((medication) =>
            formatMedicationLine(medication.name, medication.dosage, medication.frequency),
          ),
          appointmentQuestionLines,
          activeMedicationsCount,
          upcomingAppointmentsCount,
        }),
      });
      await growth.recordEvent("export_used", {
        range,
        source: "health_summary",
      });
    } catch {
      // Keep sharing failures quiet so this never disrupts the summary itself.
    }
  };

  if (!user?.id) {
    return <ErrorState message="You need to be signed in to view your health summary." />;
  }

  if (historyQuery.isLoading || overviewQuery.isLoading || medicationsQuery.isLoading || appointmentsQuery.isLoading || careNotesQuery.isLoading) {
    return <LoadingState message="Loading your summary..." />;
  }

  if (historyQuery.isError) {
    return <ErrorState message={getErrorMessage(historyQuery.error)} onRetry={() => void historyQuery.refetch()} />;
  }

  if (medicationsQuery.isError) {
    return <ErrorState message={getErrorMessage(medicationsQuery.error)} onRetry={() => void medicationsQuery.refetch()} />;
  }

  if (overviewQuery.isError) {
    return <ErrorState message={getErrorMessage(overviewQuery.error)} onRetry={() => void overviewQuery.refetch()} />;
  }

  if (appointmentsQuery.isError) {
    return <ErrorState message={getErrorMessage(appointmentsQuery.error)} onRetry={() => void appointmentsQuery.refetch()} />;
  }

  if (careNotesQuery.isError) {
    return <ErrorState message={getErrorMessage(careNotesQuery.error)} onRetry={() => void careNotesQuery.refetch()} />;
  }

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/profile");
  };

  return (
    <AppScreen
      title="Health Summary"
      subtitle="A calm overview of your recent check-ins, care details, and trends."
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
        >
          <AppText style={styles.backButtonText}>‹ Back</AppText>
        </Pressable>

        <View style={styles.heroCard}>
          <AppText style={styles.heroTitle}>Your recent summary</AppText>
          <AppText style={styles.heroBody}>
            See the patterns you&apos;ve been logging and share them only if you want to.
          </AppText>
          <View style={styles.rangeToggle}>
            {[7, 30].map((option) => (
              <Pressable
                key={option}
                onPress={() => setRange(option as 7 | 30)}
                style={({ pressed }) => [
                  styles.rangeOption,
                  range === option && styles.rangeOptionActive,
                  pressed && styles.rangeOptionPressed,
                ]}
              >
                <AppText style={[styles.rangeOptionText, range === option && styles.rangeOptionTextActive]}>
                  {option} days
                </AppText>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.privacyCard}>
          <AppText style={styles.privacyText}>Your summaries are private and controlled by you.</AppText>
        </View>

        {rangeEntries.length < 2 ? (
          <View style={styles.emptyCard}>
            <AppText style={styles.emptyTitle}>Your summary is just getting started</AppText>
            <AppText style={styles.emptyBody}>
              Summaries become more helpful with regular check-ins. A few more entries will make the picture clearer.
            </AppText>
            <AppButton label="Go to Today" onPress={() => router.push("/today")} />
          </View>
        ) : (
          <>
            <View style={styles.summaryCard}>
              <AppText style={styles.sectionTitle}>Overview</AppText>
              <AppText style={styles.sectionSubtitle}>A calm snapshot of what this recent stretch has looked like.</AppText>
              <View style={styles.metricGrid}>
                <View style={styles.metricPill}>
                  <AppText style={styles.metricLabel}>Check-ins</AppText>
                  <AppText style={styles.metricValue}>{rangeEntries.length}</AppText>
                </View>
                <View style={styles.metricPill}>
                  <AppText style={styles.metricLabel}>Consistency</AppText>
                  <AppText style={styles.metricValueSmall}>{consistencyLabel}</AppText>
                </View>
                <View style={styles.metricPill}>
                  <AppText style={styles.metricLabel}>Fatigue</AppText>
                  <AppText style={styles.metricValue}>{formatAverage(fatigueAverage)}</AppText>
                </View>
                <View style={styles.metricPill}>
                  <AppText style={styles.metricLabel}>Mood</AppText>
                  <AppText style={styles.metricValue}>{formatAverage(moodAverage)}</AppText>
                </View>
                <View style={styles.metricPill}>
                  <AppText style={styles.metricLabel}>Stress</AppText>
                  <AppText style={styles.metricValue}>{formatAverage(stressAverage)}</AppText>
                </View>
                <View style={styles.metricPill}>
                  <AppText style={styles.metricLabel}>Sleep</AppText>
                  <AppText style={styles.metricValue}>{formatAverage(sleepAverage, "h")}</AppText>
                </View>
              </View>
            </View>

            <View style={styles.summaryCard}>
              <AppText style={styles.sectionTitle}>Symptom summary</AppText>
              <AppText style={styles.sectionSubtitle}>A more structured read on what has felt steadier, lighter, or heavier.</AppText>
              <View style={styles.trendList}>
                {symptomSummaryLines.map((line) => (
                  <View key={line} style={styles.trendRow}>
                    <AppText style={styles.trendBullet}>•</AppText>
                    <AppText style={styles.trendText}>{line.replace(/^•\s*/, "")}</AppText>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.summaryCard}>
              <AppText style={styles.sectionTitle}>Care snapshot</AppText>
              <AppText style={styles.sectionSubtitle}>The practical details you may want close by.</AppText>
              <View style={styles.metricGrid}>
                <View style={styles.metricPill}>
                  <AppText style={styles.metricLabel}>Active meds</AppText>
                  <AppText style={styles.metricValue}>{activeMedicationsCount}</AppText>
                </View>
                <View style={styles.metricPill}>
                  <AppText style={styles.metricLabel}>Upcoming visits</AppText>
                  <AppText style={styles.metricValue}>{upcomingAppointmentsCount}</AppText>
                </View>
              </View>
              {nextAppointment ? (
                <View style={styles.prepCard}>
                  <AppText style={styles.prepTitle}>Next appointment</AppText>
                  <AppText style={styles.prepBody}>
                    {nextAppointment.title} on {new Date(`${nextAppointment.appointment_date}T12:00:00`).toLocaleDateString(undefined, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                    {nextAppointment.appointment_time ? ` at ${nextAppointment.appointment_time}` : ""}
                  </AppText>
                  {nextAppointment.provider ? (
                    <AppText style={styles.prepDetail}>Provider: {nextAppointment.provider}</AppText>
                  ) : null}
                  {nextAppointment.location ? (
                    <AppText style={styles.prepDetail}>Location: {nextAppointment.location}</AppText>
                  ) : null}
                </View>
              ) : null}
            </View>

            <View style={styles.summaryCard}>
              <AppText style={styles.sectionTitle}>Recent trends</AppText>
              <AppText style={styles.sectionSubtitle}>A quick read on what may have felt steadier or heavier recently.</AppText>
              <View style={styles.trendList}>
                {trendLines.map((line) => (
                  <View key={line} style={styles.trendRow}>
                    <AppText style={styles.trendBullet}>•</AppText>
                    <AppText style={styles.trendText}>{line}</AppText>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.summaryCard}>
              <AppText style={styles.sectionTitle}>Support circle</AppText>
              <AppText style={styles.sectionSubtitle}>
                If explaining takes extra energy, you can share a calmer high-level summary without giving away everything.
              </AppText>
              <View style={styles.trendList}>
                {supportCommunicationLines.slice(0, 3).map((line) => (
                  <View key={line} style={styles.trendRow}>
                    <AppText style={styles.trendBullet}>•</AppText>
                    <AppText style={styles.trendText}>{line}</AppText>
                  </View>
                ))}
              </View>
              <View style={styles.prepCard}>
                <AppText style={styles.prepBody}>{supportRoleBoundary.summary}</AppText>
              </View>
            </View>

            <View style={styles.summaryCard}>
              <AppText style={styles.sectionTitle}>Professional support</AppText>
              <AppText style={styles.sectionSubtitle}>
                A calmer way to bring context into appointments or therapy conversations without turning your experience into a clinical profile.
              </AppText>
              <View style={styles.trendList}>
                {professionalLines.slice(0, 4).map((line) => (
                  <View key={line} style={styles.trendRow}>
                    <AppText style={styles.trendBullet}>•</AppText>
                    <AppText style={styles.trendText}>{line}</AppText>
                  </View>
                ))}
              </View>
              <View style={styles.prepCard}>
                <AppText style={styles.prepBody}>
                  Sharing with professionals stays manual, limited, and fully under your control.
                </AppText>
              </View>
            </View>

            <View style={styles.summaryCard}>
              <AppText style={styles.sectionTitle}>Ownership and archives</AppText>
              <AppText style={styles.sectionSubtitle}>
                Keep what matters, step away when needed, and stay fully in control of what belongs to you.
              </AppText>
              <View style={styles.trendList}>
                {legacyLines.map((line) => (
                  <View key={line} style={styles.trendRow}>
                    <AppText style={styles.trendBullet}>•</AppText>
                    <AppText style={styles.trendText}>{line}</AppText>
                  </View>
                ))}
              </View>
            </View>

            {journeySnapshot?.seasonalSummary || journeySnapshot?.memoryResurfacing || journeySnapshot?.continuitySignals.length ? (
              <View style={styles.summaryCard}>
                <AppText style={styles.sectionTitle}>Longer view</AppText>
                <AppText style={styles.sectionSubtitle}>
                  A quieter sense of continuity across longer stretches, without turning your experience into a single story.
                </AppText>
                {journeySnapshot.seasonalSummary ? (
                  <View style={styles.prepCard}>
                    <AppText style={styles.prepTitle}>{journeySnapshot.seasonalSummary.title}</AppText>
                    <AppText style={styles.prepBody}>{journeySnapshot.seasonalSummary.body}</AppText>
                  </View>
                ) : null}
                {journeySnapshot.continuitySignals.slice(0, 2).map((signal) => (
                  <View key={`${signal.kind}-${signal.title}`} style={styles.trendRow}>
                    <AppText style={styles.trendBullet}>•</AppText>
                    <AppText style={styles.trendText}>{signal.body}</AppText>
                  </View>
                ))}
                {journeySnapshot.memoryResurfacing?.shouldResurface && journeySnapshot.memoryResurfacing.reflection ? (
                  <View style={styles.prepNote}>
                    <AppText style={styles.prepNoteDate}>A grounding note from {journeySnapshot.memoryResurfacing.reflection.date}</AppText>
                    <AppText style={styles.prepNoteBody}>
                      {getReflectionPreview(journeySnapshot.memoryResurfacing.reflection.text, 160)}
                    </AppText>
                  </View>
                ) : null}
              </View>
            ) : null}

            <View style={styles.summaryCard}>
              <AppText style={styles.sectionTitle}>Appointment preparation</AppText>
              <AppText style={styles.sectionSubtitle}>A quiet place to gather what may be useful before a visit.</AppText>
              <View style={styles.prepGroup}>
                <AppText style={styles.prepTitle}>Recent symptom highlights</AppText>
                {trendLines.map((line) => (
                  <View key={`prep-${line}`} style={styles.trendRow}>
                    <AppText style={styles.trendBullet}>•</AppText>
                    <AppText style={styles.trendText}>{line}</AppText>
                  </View>
                ))}
              </View>
              <View style={styles.prepGroup}>
                <AppText style={styles.prepTitle}>Recent reflections</AppText>
                {recentReflections.length ? (
                  recentReflections.map((reflection) => (
                    <View key={`${reflection.date}-${reflection.preview}`} style={styles.prepNote}>
                      <AppText style={styles.prepNoteDate}>{reflection.date}</AppText>
                      <AppText style={styles.prepNoteBody}>{reflection.preview}</AppText>
                    </View>
                  ))
                ) : recentCareNotes.length ? (
                  recentCareNotes.map((note) => (
                    <View key={note.id} style={styles.prepNote}>
                      <AppText style={styles.prepNoteDate}>{note.category ?? "Care note"}</AppText>
                      <AppText style={styles.prepNoteBody}>{getReflectionPreview(note.body, 140)}</AppText>
                    </View>
                  ))
                ) : (
                  <AppText style={styles.prepEmpty}>A few short notes here can make appointment prep feel easier later.</AppText>
                )}
              </View>
              <View style={styles.prepGroup}>
                <AppText style={styles.prepTitle}>Medication notes</AppText>
                {activeMedications.length ? (
                  activeMedications.map((medication) => (
                    <View key={medication.id} style={styles.trendRow}>
                      <AppText style={styles.trendBullet}>•</AppText>
                      <AppText style={styles.trendText}>
                        {formatMedicationLine(medication.name, medication.dosage, medication.frequency)}
                      </AppText>
                    </View>
                  ))
                ) : (
                  <AppText style={styles.prepEmpty}>No active medications are listed right now.</AppText>
                )}
              </View>
              <View style={styles.prepGroup}>
                <AppText style={styles.prepTitle}>Questions to bring</AppText>
                {appointmentQuestionLines.length ? (
                  appointmentQuestionLines.map((question) => (
                    <View key={question} style={styles.trendRow}>
                      <AppText style={styles.trendBullet}>•</AppText>
                      <AppText style={styles.trendText}>{question.replace(/^•\s*/, "")}</AppText>
                    </View>
                  ))
                ) : (
                  <AppText style={styles.prepEmpty}>You can add your own questions in Care notes when something feels worth bringing up.</AppText>
                )}
              </View>
            </View>

            <AppButton label="Share summary" onPress={() => void handleShare()} />
          </>
        )}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 120,
    gap: 16,
  },
  backButton: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#ead9cb",
    backgroundColor: "#ffffff",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  backButtonPressed: {
    opacity: 0.82,
  },
  backButtonText: {
    color: "#8b6a4f",
    fontSize: 15,
    fontWeight: "700",
  },
  heroCard: {
    backgroundColor: "#fff4ec",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f2d8c4",
    padding: 18,
    gap: 12,
  },
  heroTitle: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "700",
    color: "#1f2937",
  },
  heroBody: {
    color: "#4b5563",
    lineHeight: 22,
  },
  rangeToggle: {
    flexDirection: "row",
    gap: 10,
  },
  rangeOption: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ead9cb",
    backgroundColor: "#ffffff",
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  rangeOptionActive: {
    borderColor: "#e8751a",
    backgroundColor: "#fff0e2",
  },
  rangeOptionPressed: {
    opacity: 0.82,
  },
  rangeOptionText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#6b7280",
  },
  rangeOptionTextActive: {
    color: "#c25d10",
  },
  privacyCard: {
    backgroundColor: "#fffaf6",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#f3dfd1",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  privacyText: {
    color: "#8b6a4f",
    fontWeight: "600",
  },
  emptyCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f1e1d4",
    padding: 18,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
  },
  emptyBody: {
    color: "#4b5563",
    lineHeight: 22,
  },
  summaryCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f1e1d4",
    padding: 18,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#1f2937",
  },
  sectionSubtitle: {
    color: "#6b7280",
    lineHeight: 20,
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  metricPill: {
    minWidth: "30%",
    backgroundColor: "#fffaf6",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f3dfd1",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 4,
  },
  metricLabel: {
    fontSize: 13,
    color: "#6b7280",
  },
  metricValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
  },
  metricValueSmall: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "700",
    color: "#1f2937",
  },
  trendList: {
    gap: 10,
  },
  trendRow: {
    flexDirection: "row",
    gap: 8,
  },
  trendBullet: {
    color: "#c25d10",
    fontWeight: "700",
  },
  trendText: {
    flex: 1,
    color: "#4b5563",
    lineHeight: 21,
  },
  prepCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f3dfd1",
    backgroundColor: "#fffaf6",
    padding: 14,
    gap: 6,
  },
  prepGroup: {
    gap: 10,
  },
  prepTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1f2937",
  },
  prepBody: {
    color: "#4b5563",
    lineHeight: 21,
  },
  prepDetail: {
    color: "#6b7280",
    lineHeight: 20,
  },
  prepNote: {
    gap: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#f3dfd1",
    backgroundColor: "#fffaf6",
    padding: 12,
  },
  prepNoteDate: {
    fontSize: 12,
    fontWeight: "700",
    color: "#8b6a4f",
  },
  prepNoteBody: {
    color: "#4b5563",
    lineHeight: 20,
  },
  prepEmpty: {
    color: "#6b7280",
    lineHeight: 20,
  },
});
