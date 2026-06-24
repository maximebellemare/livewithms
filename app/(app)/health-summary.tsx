import { startTransition, useEffect, useMemo, useState } from "react";
import { router } from "expo-router";
import { InteractionManager, Pressable, ScrollView, Share, StyleSheet, View } from "react-native";
import { useAppointments } from "../../features/appointments/hooks";
import { useAuth } from "../../features/auth/hooks";
import { useCheckInHistory, useCheckInOverview } from "../../features/checkins/hooks";
import { useMedications } from "../../features/medications/hooks";
import { useGrowthState } from "../../features/growth/hooks";
import AppButton from "../../components/ui/AppButton";
import AppScreen from "../../components/ui/AppScreen";
import AppText from "../../components/ui/AppText";
import CalmSkeleton from "../../components/ui/CalmSkeleton";
import ErrorState from "../../components/ui/ErrorState";
import { exportHealthSummary } from "../../lib/exportHealthSummary";
import { getErrorMessage } from "../../lib/errors";
import { useLowEnergyMode } from "../../features/low-energy-mode/hooks";

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

function formatAverage(value: number | null, suffix = "/5") {
  if (value === null) {
    return "—";
  }

  return `${value}${suffix}`;
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

function describeAverageChange(
  label: string,
  current: number | null,
  previous: number | null,
  options: { higherIsBetter?: boolean; unit?: string } = {},
) {
  if (current === null) {
    return `${label}: no recent data.`;
  }

  if (previous === null) {
    return `${label}: ${formatAverage(current, options.unit ?? "/5")} average this period.`;
  }

  const difference = roundToOneDecimal(current - previous) ?? 0;
  if (Math.abs(difference) < 0.35) {
    return `${label} remained similar to the previous period.`;
  }

  const direction = difference > 0 ? "increased" : "decreased";
  return `${label} ${direction} compared with the previous period.`;
}

function describeHalfChange(
  label: string,
  earlier: number | null,
  later: number | null,
) {
  if (earlier === null || later === null) {
    return null;
  }

  const difference = later - earlier;
  if (Math.abs(difference) < 0.35) {
    return `${label} stayed relatively stable during this period.`;
  }

  return `${label} ${difference > 0 ? "increased" : "decreased"} during the second half of the period.`;
}

function standardDeviation(values: Array<number | null>) {
  const validValues = values.filter((value): value is number => value !== null);

  if (validValues.length < 3) {
    return null;
  }

  const mean = validValues.reduce((sum, value) => sum + value, 0) / validValues.length;
  const variance = validValues.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / validValues.length;
  return Math.sqrt(variance);
}

function countRelationship<T>(
  entries: T[],
  predicate: (entry: T) => boolean,
) {
  return entries.reduce((count, entry) => count + (predicate(entry) ? 1 : 0), 0);
}

function formatMedicationLine(name: string, dosage: string | null, frequency: string) {
  const details = [dosage, frequency].filter(Boolean).join(" • ");
  return details ? `${name} (${details})` : name;
}

function buildShareText(input: {
  range: 7 | 30;
  rangeCheckIns: number;
  mainChangeLines: string[];
  comparedLines: string[];
  patternConnectionLines: string[];
  stabilityLines: string[];
  monitoringLines: string[];
  appointmentTopicLines: string[];
  nextAppointmentLine: string | null;
  medicationLines: string[];
  activeMedicationsCount: number;
  upcomingAppointmentsCount: number;
}) {
  return [
    `LiveWithMS health summary (${input.range} days)`,
    "",
    "Summary period",
    `• ${input.rangeCheckIns} ${input.rangeCheckIns === 1 ? "check-in" : "check-ins"} in this range`,
    "",
    "Main changes",
    ...input.mainChangeLines.map((line) => `• ${line}`),
    "",
    `Compared to the previous ${input.range} days`,
    ...input.comparedLines.map((line) => `• ${line}`),
    "",
    "Pattern connections",
    ...input.patternConnectionLines.map((line) => `• ${line}`),
    "",
    "Stability",
    ...input.stabilityLines.map((line) => `• ${line}`),
    "",
    "Worth monitoring",
    ...input.monitoringLines.map((line) => `• ${line}`),
    "",
    ...(input.appointmentTopicLines.length
      ? [
          "Possible appointment topics",
          ...input.appointmentTopicLines.map((line) => `• ${line}`),
          "",
        ]
      : []),
    "",
    "Care details",
    `• Active medications: ${input.activeMedicationsCount}`,
    `• Upcoming appointments: ${input.upcomingAppointmentsCount}`,
    ...(input.nextAppointmentLine ? [`• Next appointment: ${input.nextAppointmentLine}`] : []),
    ...input.medicationLines.map((line) => `• ${line}`),
    "",
    "This summary does not replace professional medical care.",
  ].join("\n");
}

export default function HealthSummaryScreen() {
  const { user } = useAuth();
  const lowEnergyMode = useLowEnergyMode();
  const [range, setRange] = useState<7 | 30>(7);
  const [isExportingPrintableSummary, setIsExportingPrintableSummary] = useState(false);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);
  const [deferredSummaryReady, setDeferredSummaryReady] = useState(false);
  const historyQuery = useCheckInHistory(user?.id, 60);
  const overviewQuery = useCheckInOverview(user?.id);
  const medicationsQuery = useMedications(user?.id);
  const appointmentsQuery = useAppointments(user?.id);
  const growth = useGrowthState({
    totalCheckIns: overviewQuery.data?.length ?? 0,
  });

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      startTransition(() => {
        setDeferredSummaryReady(true);
      });
    });

    return () => {
      task.cancel?.();
    };
  }, []);

  const historyData = useMemo(
    () => (deferredSummaryReady ? historyQuery.data ?? [] : []),
    [deferredSummaryReady, historyQuery.data],
  );
  const medicationsData = useMemo(
    () => (deferredSummaryReady ? medicationsQuery.data ?? [] : []),
    [deferredSummaryReady, medicationsQuery.data],
  );
  const appointmentsData = useMemo(
    () => (deferredSummaryReady ? appointmentsQuery.data ?? [] : []),
    [appointmentsQuery.data, deferredSummaryReady],
  );
  const rangeEntries = useMemo(() => {
    const entries = historyData;
    const cutoff = getCutoffDate(range);
    return entries.filter((entry) => entry.date >= cutoff);
  }, [historyData, range]);
  const previousRangeEntries = useMemo(() => {
    const entries = historyData;
    const currentCutoff = getCutoffDate(range);
    const previousCutoff = getCutoffDate(range * 2);
    return entries.filter((entry) => entry.date >= previousCutoff && entry.date < currentCutoff);
  }, [historyData, range]);
  const sortedRangeEntries = useMemo(
    () => rangeEntries.slice().sort((left, right) => left.date.localeCompare(right.date)),
    [rangeEntries],
  );
  const midpoint = Math.ceil(sortedRangeEntries.length / 2);
  const earlierRangeEntries = sortedRangeEntries.slice(0, midpoint);
  const laterRangeEntries = sortedRangeEntries.slice(midpoint);

  const today = getTodayDateString();
  const consistencyLabel = getConsistencyLabel(rangeEntries.length, range);
  const activeMedicationsCount = useMemo(
    () => medicationsData.filter((medication) => medication.active).length,
    [medicationsData],
  );
  const activeMedications = useMemo(
    () => medicationsData.filter((medication) => medication.active).slice(0, 3),
    [medicationsData],
  );
  const upcomingAppointmentsCount = useMemo(
    () => appointmentsData.filter((appointment) => appointment.appointment_date >= today).length,
    [appointmentsData, today],
  );
  const nextAppointment = useMemo(
    () =>
      appointmentsData
        .filter((appointment) => appointment.appointment_date >= today)
        .sort((left, right) => {
          const dateCompare = left.appointment_date.localeCompare(right.appointment_date);
          if (dateCompare !== 0) {
            return dateCompare;
          }

          return (left.appointment_time ?? "").localeCompare(right.appointment_time ?? "");
        })[0] ?? null,
    [appointmentsData, today],
  );
  const fatigueAverage = average(rangeEntries.map((entry) => entry.fatigue));
  const moodAverage = average(rangeEntries.map((entry) => entry.mood));
  const stressAverage = average(rangeEntries.map((entry) => entry.stress));
  const sleepAverage = average(rangeEntries.map((entry) => entry.sleep_hours));
  const brainFogAverage = average(rangeEntries.map((entry) => entry.brain_fog));
  const previousFatigueAverage = average(previousRangeEntries.map((entry) => entry.fatigue));
  const previousMoodAverage = average(previousRangeEntries.map((entry) => entry.mood));
  const previousStressAverage = average(previousRangeEntries.map((entry) => entry.stress));
  const previousSleepAverage = average(previousRangeEntries.map((entry) => entry.sleep_hours));
  const previousBrainFogAverage = average(previousRangeEntries.map((entry) => entry.brain_fog));
  const fatigueEarlierAverage = average(earlierRangeEntries.map((entry) => entry.fatigue));
  const moodEarlierAverage = average(earlierRangeEntries.map((entry) => entry.mood));
  const stressEarlierAverage = average(earlierRangeEntries.map((entry) => entry.stress));
  const sleepEarlierAverage = average(earlierRangeEntries.map((entry) => entry.sleep_hours));
  const fatigueLaterAverage = average(laterRangeEntries.map((entry) => entry.fatigue));
  const moodLaterAverage = average(laterRangeEntries.map((entry) => entry.mood));
  const stressLaterAverage = average(laterRangeEntries.map((entry) => entry.stress));
  const sleepLaterAverage = average(laterRangeEntries.map((entry) => entry.sleep_hours));

  const mainChangeLines = useMemo(() => {
    const lines = [
      describeHalfChange("Stress", stressEarlierAverage, stressLaterAverage),
      describeHalfChange("Sleep", sleepEarlierAverage, sleepLaterAverage),
      describeHalfChange("Mood", moodEarlierAverage, moodLaterAverage),
      describeHalfChange("Fatigue", fatigueEarlierAverage, fatigueLaterAverage),
      describeHalfChange("Brain fog", average(earlierRangeEntries.map((entry) => entry.brain_fog)), average(laterRangeEntries.map((entry) => entry.brain_fog))),
    ].filter((line): line is string => Boolean(line));

    if (lines.length) {
      return lines.slice(0, lowEnergyMode.enabled ? 3 : 4);
    }

    return rangeEntries.length
      ? [`${rangeEntries.length} ${rangeEntries.length === 1 ? "check-in" : "check-ins"} logged in this period.`]
      : ["No check-ins in this period yet."];
  }, [
    earlierRangeEntries,
    fatigueEarlierAverage,
    fatigueLaterAverage,
    laterRangeEntries,
    lowEnergyMode.enabled,
    moodEarlierAverage,
    moodLaterAverage,
    rangeEntries.length,
    sleepEarlierAverage,
    sleepLaterAverage,
    stressEarlierAverage,
    stressLaterAverage,
  ]);
  const comparedLines = useMemo(
    () => [
      describeAverageChange("Stress", stressAverage, previousStressAverage),
      describeAverageChange("Sleep", sleepAverage, previousSleepAverage, { unit: "h", higherIsBetter: true }),
      describeAverageChange("Fatigue", fatigueAverage, previousFatigueAverage),
      describeAverageChange("Mood", moodAverage, previousMoodAverage, { higherIsBetter: true }),
      describeAverageChange("Brain fog", brainFogAverage, previousBrainFogAverage),
    ].slice(0, lowEnergyMode.enabled ? 3 : 5),
    [
      brainFogAverage,
      fatigueAverage,
      lowEnergyMode.enabled,
      moodAverage,
      previousBrainFogAverage,
      previousFatigueAverage,
      previousMoodAverage,
      previousSleepAverage,
      previousStressAverage,
      sleepAverage,
      stressAverage,
    ],
  );
  const patternConnectionLines = useMemo(() => {
    const highStressFatigueMatches = countRelationship(
      rangeEntries,
      (entry) => (entry.stress ?? 0) >= 4 && (entry.fatigue ?? 0) >= 4,
    );
    const lowSleepBrainFogMatches = countRelationship(
      rangeEntries,
      (entry) => entry.sleep_hours !== null && entry.sleep_hours < 6.5 && (entry.brain_fog ?? 0) >= 3,
    );
    const lowSleepFatigueMatches = countRelationship(
      rangeEntries,
      (entry) => entry.sleep_hours !== null && entry.sleep_hours < 6.5 && (entry.fatigue ?? 0) >= 4,
    );
    const highStressMoodMatches = countRelationship(
      rangeEntries,
      (entry) => (entry.stress ?? 0) >= 4 && entry.mood !== null && entry.mood <= 2,
    );
    const lines: string[] = [];

    if (highStressFatigueMatches > 0) {
      lines.push(`Higher stress matched higher fatigue on ${highStressFatigueMatches} ${highStressFatigueMatches === 1 ? "day" : "days"}.`);
    }

    if (lowSleepBrainFogMatches > 0) {
      lines.push(`Brain fog appeared more often after shorter sleep on ${lowSleepBrainFogMatches} ${lowSleepBrainFogMatches === 1 ? "day" : "days"}.`);
    }

    if (lowSleepFatigueMatches > 0) {
      lines.push(`Fatigue was higher after shorter sleep on ${lowSleepFatigueMatches} ${lowSleepFatigueMatches === 1 ? "day" : "days"}.`);
    }

    if (highStressMoodMatches > 0) {
      lines.push(`Lower mood appeared on higher-stress days ${highStressMoodMatches} ${highStressMoodMatches === 1 ? "time" : "times"}.`);
    }

    return lines.length ? lines.slice(0, 3) : ["No strong pattern connections stood out in this period."];
  }, [rangeEntries]);
  const stabilityLines = useMemo(() => {
    const lines = [
      Math.abs((moodLaterAverage ?? moodAverage ?? 0) - (moodEarlierAverage ?? moodAverage ?? 0)) < 0.35 && moodAverage !== null
        ? "Mood stayed relatively stable."
        : null,
      Math.abs((sleepLaterAverage ?? sleepAverage ?? 0) - (sleepEarlierAverage ?? sleepAverage ?? 0)) < 0.35 && sleepAverage !== null
        ? "Sleep stayed relatively stable."
        : null,
      Math.abs((stressLaterAverage ?? stressAverage ?? 0) - (stressEarlierAverage ?? stressAverage ?? 0)) < 0.35 && stressAverage !== null
        ? "Stress stayed relatively stable."
        : null,
      consistencyLabel ? `Check-in consistency: ${consistencyLabel}.` : null,
    ].filter((line): line is string => Boolean(line));

    return lines.length ? lines.slice(0, 3) : ["Stability is still hard to assess from this range."];
  }, [
    consistencyLabel,
    moodAverage,
    moodEarlierAverage,
    moodLaterAverage,
    sleepAverage,
    sleepEarlierAverage,
    sleepLaterAverage,
    stressAverage,
    stressEarlierAverage,
    stressLaterAverage,
  ]);
  const monitoringLines = useMemo(() => {
    const fatigueVariability = standardDeviation(rangeEntries.map((entry) => entry.fatigue));
    const stressVariability = standardDeviation(rangeEntries.map((entry) => entry.stress));
    const lines: string[] = [];

    if (fatigueVariability !== null && fatigueVariability >= 1.1) {
      lines.push("Fatigue varied more during this period.");
    }

    if (stressLaterAverage !== null && stressEarlierAverage !== null && stressLaterAverage - stressEarlierAverage >= 0.35) {
      lines.push("Stress increased during the second half of the period.");
    }

    if (stressVariability !== null && stressVariability >= 1.1) {
      lines.push("Stress levels were more variable.");
    }

    if (brainFogAverage !== null && brainFogAverage >= 3.5) {
      lines.push("Brain fog was elevated in this period.");
    }

    return lines.length ? lines.slice(0, 3) : ["No major monitoring flags stood out in this period."];
  }, [brainFogAverage, rangeEntries, stressEarlierAverage, stressLaterAverage]);
  const appointmentQuestionLines = useMemo(() => {
    const suggestions: string[] = [];
    const hasLowerSleepFatiguePattern = patternConnectionLines.some(
      (line) => line.includes("Fatigue was higher after shorter sleep"),
    );
    const hasLowerSleepBrainFogPattern = patternConnectionLines.some(
      (line) => line.includes("Brain fog appeared more often after shorter sleep"),
    );
    const hasStressFatiguePattern = patternConnectionLines.some(
      (line) => line.includes("Higher stress matched higher fatigue"),
    );
    const stressIncreased = monitoringLines.some(
      (line) => line.includes("Stress increased"),
    );
    const fatigueVaried = monitoringLines.some(
      (line) => line.includes("Fatigue varied more"),
    );
    const brainFogElevated = monitoringLines.some(
      (line) => line.includes("Brain fog was elevated"),
    );

    if (hasLowerSleepFatiguePattern) {
      suggestions.push("Fatigue after shorter sleep");
    }

    if (hasLowerSleepBrainFogPattern) {
      suggestions.push("Brain fog after shorter sleep");
    }

    if (hasStressFatiguePattern) {
      suggestions.push("Fatigue during higher-stress periods");
    }

    if (stressIncreased) {
      suggestions.push("Stress increased during this period");
    }

    if (fatigueVaried) {
      suggestions.push("Fatigue has become more variable recently");
    }

    if (brainFogElevated) {
      suggestions.push("Brain fog was elevated in this period");
    }

    return Array.from(new Set(suggestions)).slice(0, 3);
  }, [monitoringLines, patternConnectionLines]);
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
  const practicalExportSections = useMemo(
    () => [
      {
        title: "Summary period",
        lines: [
          `${rangeEntries.length} ${rangeEntries.length === 1 ? "check-in" : "check-ins"} in the last ${range} days.`,
        ],
      },
      { title: "Main changes", lines: mainChangeLines },
      { title: `Compared to previous ${range} days`, lines: comparedLines },
      { title: "Pattern connections", lines: patternConnectionLines },
      { title: "Stability", lines: stabilityLines },
      { title: "Worth monitoring", lines: monitoringLines },
      ...(appointmentQuestionLines.length
        ? [{ title: "Possible appointment topics", lines: appointmentQuestionLines }]
        : []),
      {
        title: "Care details",
        lines: [
          `Active medications: ${activeMedicationsCount}`,
          `Upcoming appointments: ${upcomingAppointmentsCount}`,
          ...(nextAppointmentLine ? [`Next appointment: ${nextAppointmentLine}`] : []),
          ...activeMedications.map((medication) =>
            formatMedicationLine(medication.name, medication.dosage, medication.frequency),
          ),
        ],
      },
    ],
    [
      activeMedications,
      activeMedicationsCount,
      appointmentQuestionLines,
      comparedLines,
      mainChangeLines,
      monitoringLines,
      nextAppointmentLine,
      patternConnectionLines,
      range,
      rangeEntries.length,
      stabilityLines,
      upcomingAppointmentsCount,
    ],
  );
  const handleShare = async () => {
    try {
      setExportFeedback(null);
      await Share.share({
        message: buildShareText({
          range,
          rangeCheckIns: rangeEntries.length,
          mainChangeLines,
          comparedLines,
          patternConnectionLines,
          stabilityLines,
          monitoringLines,
          appointmentTopicLines: appointmentQuestionLines,
          nextAppointmentLine,
          medicationLines: activeMedications.map((medication) =>
            formatMedicationLine(medication.name, medication.dosage, medication.frequency),
          ),
          activeMedicationsCount,
          upcomingAppointmentsCount,
        }),
      });
      await growth.recordEvent("export_used", {
        range,
        source: "health_summary",
      });
    } catch {
      // Sharing failures should not disrupt the summary screen.
    }
  };

  const handleExportPrintableSummary = async () => {
    try {
      setIsExportingPrintableSummary(true);
      setExportFeedback(null);
      const result = await exportHealthSummary({
        title: `LiveWithMS health summary: last ${range} days`,
        subtitle: "A practical briefing of recent check-ins, pattern connections, care details, and appointment topics.",
        text: buildShareText({
          range,
          rangeCheckIns: rangeEntries.length,
          mainChangeLines,
          comparedLines,
          patternConnectionLines,
          stabilityLines,
          monitoringLines,
          appointmentTopicLines: appointmentQuestionLines,
          nextAppointmentLine,
          medicationLines: activeMedications.map((medication) =>
            formatMedicationLine(medication.name, medication.dosage, medication.frequency),
          ),
          activeMedicationsCount,
          upcomingAppointmentsCount,
        }),
        sections: practicalExportSections,
      });
      await growth.recordEvent("export_used", {
        range,
        source: "health_summary_pdf",
      });
      setExportFeedback(
        result.ok
          ? "Your summary is ready to share."
          : "Export was not available on this device. The summary is still visible in the app.",
      );
    } catch {
      setExportFeedback("Export was not available on this device. The summary is still visible in the app.");
    } finally {
      setIsExportingPrintableSummary(false);
    }
  };

  if (!user?.id) {
    return <ErrorState message="Your health summary is available once you’re signed in." />;
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

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/profile");
  };

  const isInitialLoading =
    !deferredSummaryReady ||
    historyQuery.isLoading ||
    overviewQuery.isLoading ||
    medicationsQuery.isLoading ||
    appointmentsQuery.isLoading;

  return (
    <AppScreen
      title="Health Summary"
      subtitle="A practical briefing of recent patterns, changes, and appointment topics."
    >
      <ScrollView
        contentContainerStyle={[styles.content, lowEnergyMode.enabled && styles.contentLowEnergy]}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
        >
          <AppText style={styles.backButtonText}>‹ Back</AppText>
        </Pressable>

        <View style={styles.heroCard}>
          <AppText style={styles.heroTitle}>Recent health briefing</AppText>
          <AppText style={styles.heroBody}>
            Review what changed, what stayed stable, and what may be useful to discuss.
          </AppText>
          {lowEnergyMode.enabled ? (
            <View style={styles.lowEnergyBanner}>
              <AppText style={styles.lowEnergyBannerText}>
                Low Energy Mode is showing fewer sections.
              </AppText>
            </View>
          ) : null}
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
          <AppText style={styles.privacyText}>Exports are created only when you choose to share them.</AppText>
        </View>

        {isInitialLoading ? (
          <>
            <View style={styles.summaryCard}>
              <AppText style={styles.sectionTitle}>Summary period</AppText>
              <View style={styles.placeholderStack}>
                <CalmSkeleton height={16} width="38%" />
                <CalmSkeleton height={14} width="92%" />
                <CalmSkeleton height={14} width="78%" />
              </View>
            </View>
            <View style={styles.summaryCard}>
              <AppText style={styles.sectionTitle}>Recent changes</AppText>
              <View style={styles.placeholderStack}>
                <CalmSkeleton height={14} width="90%" />
                <CalmSkeleton height={14} width="84%" />
                <CalmSkeleton height={14} width="72%" />
              </View>
            </View>
            <View style={styles.summaryCard}>
              <AppText style={styles.sectionTitle}>Pattern connections</AppText>
              <View style={styles.placeholderStack}>
                <CalmSkeleton height={14} width="88%" />
                <CalmSkeleton height={14} width="81%" />
              </View>
            </View>
          </>
        ) : rangeEntries.length < 2 ? (
          <View style={styles.emptyCard}>
            <AppText style={styles.emptyTitle}>Add another check-in to compare changes</AppText>
            <AppText style={styles.emptyBody}>
              Health Summary starts showing comparisons after at least two check-ins in the selected period.
            </AppText>
            <AppButton label="Go to Today" onPress={() => router.push("/today")} />
          </View>
        ) : (
          <>
            <View style={styles.summaryCard}>
              <AppText style={styles.sectionTitle}>Summary period</AppText>
              <AppText style={styles.sectionSubtitle}>Average values from the last {range} days.</AppText>
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
              <AppText style={styles.sectionTitle}>Main changes</AppText>
              <AppText style={styles.sectionSubtitle}>What shifted during this period.</AppText>
              <View style={styles.trendList}>
                {mainChangeLines.map((line) => (
                  <View key={line} style={styles.trendRow}>
                    <AppText style={styles.trendBullet}>•</AppText>
                    <AppText style={styles.trendText}>{line.replace(/^•\s*/, "")}</AppText>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.summaryCard}>
              <AppText style={styles.sectionTitle}>Compared to previous {range} days</AppText>
              <View style={styles.trendList}>
                {comparedLines.map((line) => (
                  <View key={line} style={styles.trendRow}>
                    <AppText style={styles.trendBullet}>•</AppText>
                    <AppText style={styles.trendText}>{line}</AppText>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.summaryCard}>
              <AppText style={styles.sectionTitle}>Pattern connections</AppText>
              <View style={styles.trendList}>
                {patternConnectionLines.map((line) => (
                  <View key={line} style={styles.trendRow}>
                    <AppText style={styles.trendBullet}>•</AppText>
                    <AppText style={styles.trendText}>{line}</AppText>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.summaryCard}>
              <AppText style={styles.sectionTitle}>Stability</AppText>
              <View style={styles.trendList}>
                {stabilityLines.map((line) => (
                  <View key={line} style={styles.trendRow}>
                    <AppText style={styles.trendBullet}>•</AppText>
                    <AppText style={styles.trendText}>{line}</AppText>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.summaryCard}>
              <AppText style={styles.sectionTitle}>Worth monitoring</AppText>
              <View style={styles.trendList}>
                {monitoringLines.map((line) => (
                  <View key={line} style={styles.trendRow}>
                    <AppText style={styles.trendBullet}>•</AppText>
                    <AppText style={styles.trendText}>{line}</AppText>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.summaryCard}>
              <AppText style={styles.sectionTitle}>Care snapshot</AppText>
              <AppText style={styles.sectionSubtitle}>Care details that may help during appointments.</AppText>
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
                    {nextAppointment.appointment_time ? ` at ${new Date(`2000-01-01T${nextAppointment.appointment_time}:00`).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}` : ""}
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

            {appointmentQuestionLines.length ? (
              <View style={styles.summaryCard}>
                <AppText style={styles.sectionTitle}>Possible appointment topics</AppText>
                <View style={styles.trendList}>
                  {appointmentQuestionLines.map((topic) => (
                    <View key={topic} style={styles.trendRow}>
                      <AppText style={styles.trendBullet}>•</AppText>
                      <AppText style={styles.trendText}>{topic}</AppText>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            <View style={styles.summaryCard}>
              <AppText style={styles.sectionTitle}>Export</AppText>
              <AppText style={styles.sectionSubtitle}>Create a concise summary for care conversations.</AppText>
              <View style={styles.actionGroup}>
                <AppButton label="Share summary" onPress={() => void handleShare()} />
                <AppButton
                  label={isExportingPrintableSummary ? "Building PDF..." : "Export PDF"}
                  onPress={() => void handleExportPrintableSummary()}
                  variant="secondary"
                  disabled={isExportingPrintableSummary}
                />
              </View>
              {exportFeedback ? (
                <View style={styles.feedbackCard}>
                  <AppText style={styles.feedbackText}>{exportFeedback}</AppText>
                </View>
              ) : null}
            </View>


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
    gap: 18,
  },
  contentLowEnergy: {
    gap: 20,
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
    lineHeight: 23,
  },
  lowEnergyBanner: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#eadfd6",
    backgroundColor: "#fffaf6",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  lowEnergyBannerText: {
    color: "#6b7280",
    fontSize: 13,
    lineHeight: 19,
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
    gap: 12,
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
    gap: 14,
  },
  placeholderStack: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#1f2937",
  },
  sectionSubtitle: {
    color: "#6b7280",
    lineHeight: 21,
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
    lineHeight: 24,
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
  premiumLockCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#eadfd6",
    backgroundColor: "#fffaf6",
    padding: 16,
    gap: 12,
  },
  premiumLockTitle: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: "700",
    color: "#1f2937",
  },
  premiumLockBody: {
    color: "#4b5563",
    lineHeight: 21,
  },
  actionGroup: {
    gap: 10,
  },
  feedbackCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f3dfd1",
    backgroundColor: "#fffaf6",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  feedbackText: {
    color: "#6b7280",
    lineHeight: 20,
  },
});
