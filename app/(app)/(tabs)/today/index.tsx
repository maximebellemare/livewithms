import { useEffect, useMemo, useRef, useState } from "react";
import { router } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";
import PatternSummaryCard from "../../../../components/insights/PatternSummaryCard";
import DailyCheckInCard, {
  getEmptyCheckInDraft,
  normalizeCheckInInput,
  type DailyCheckInDraft,
} from "../../../../components/today/DailyCheckInCard";
import AppButton from "../../../../components/ui/AppButton";
import ErrorState from "../../../../components/ui/ErrorState";
import AppScreen from "../../../../components/ui/AppScreen";
import AppText from "../../../../components/ui/AppText";
import LoadingState from "../../../../components/ui/LoadingState";
import { useAuth } from "../../../../features/auth/hooks";
import { useSaveDailyCheckIn, useCheckInHistory, useTodaysCheckIn } from "../../../../features/checkins/hooks";
import type { DailyCheckIn } from "../../../../features/checkins/types";
import { usePatternSummary } from "../../../../features/insights/hooks";
import { getErrorMessage } from "../../../../lib/errors";

function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDraftFromCheckIn(checkIn: DailyCheckIn | null): DailyCheckInDraft {
  return {
    fatigue: checkIn?.fatigue ?? null,
    pain: checkIn?.pain ?? null,
    brain_fog: checkIn?.brain_fog ?? null,
    mood: checkIn?.mood ?? null,
    mobility: checkIn?.mobility ?? null,
    stress: checkIn?.stress ?? null,
    sleep_hours: checkIn?.sleep_hours != null ? String(checkIn.sleep_hours) : "",
    water_glasses: checkIn?.water_glasses != null ? String(checkIn.water_glasses) : "",
    notes: checkIn?.notes ?? "",
  };
}

function getDraftSnapshot(draft: DailyCheckInDraft) {
  return JSON.stringify(normalizeCheckInInput(draft));
}

export default function TodayScreen() {
  const { user } = useAuth();
  const today = getTodayDateString();
  const checkInQuery = useTodaysCheckIn(user?.id, today);
  const historyQuery = useCheckInHistory(user?.id, 7);
  const patternSummaryQuery = usePatternSummary(historyQuery.data ?? [], 7);
  const saveCheckIn = useSaveDailyCheckIn();
  const [draft, setDraft] = useState<DailyCheckInDraft>(getEmptyCheckInDraft());
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const hydratedRef = useRef(false);
  const lastSavedSnapshotRef = useRef(getDraftSnapshot(getEmptyCheckInDraft()));

  const weeklySnapshot = useMemo(() => {
    const recentEntries = historyQuery.data ?? [];
    if (!recentEntries.length) {
      return "Start logging each day to build a clearer picture of your routines and symptom patterns.";
    }

    const daysLogged = recentEntries.length;
    const averageMood =
      recentEntries
        .map((entry) => entry.mood)
        .filter((value): value is number => value !== null)
        .reduce((sum, value, _, values) => sum + value / values.length, 0) || null;

    if (averageMood !== null && averageMood >= 4) {
      return `You logged ${daysLogged} recent day${daysLogged === 1 ? "" : "s"}. Mood has looked steadier overall, which is a good sign to keep noticing what helps.`;
    }

    return `You logged ${daysLogged} recent day${daysLogged === 1 ? "" : "s"}. Keep checking in with fatigue, stress, sleep, and hydration so patterns stay easy to spot.`;
  }, [historyQuery.data]);

  useEffect(() => {
    if (!checkInQuery.isSuccess) {
      return;
    }

    const nextDraft = getDraftFromCheckIn(checkInQuery.data);
    hydratedRef.current = true;
    lastSavedSnapshotRef.current = getDraftSnapshot(nextDraft);
    setDraft(nextDraft);
    setSaveState("idle");
  }, [checkInQuery.data, checkInQuery.isSuccess]);

  useEffect(() => {
    if (!hydratedRef.current || !user?.id) {
      return;
    }

    const nextSnapshot = getDraftSnapshot(draft);
    if (nextSnapshot === lastSavedSnapshotRef.current) {
      return;
    }

    setSaveState("saving");

    const timeoutId = setTimeout(() => {
      void saveCheckIn
        .mutateAsync({
          userId: user.id,
          date: today,
          input: normalizeCheckInInput(draft),
        })
        .then(() => {
          lastSavedSnapshotRef.current = nextSnapshot;
          setSaveState("saved");
        })
        .catch(() => {
          setSaveState("error");
        });
    }, 800);

    return () => clearTimeout(timeoutId);
  }, [draft, saveCheckIn, today, user?.id]);

  if (!user?.id) {
    return <ErrorState message="You need to be signed in to view today's check-in." />;
  }

  if (checkInQuery.isLoading) {
    return <LoadingState message="Loading today..." />;
  }

  if (checkInQuery.isError) {
    return (
      <ErrorState
        message={getErrorMessage(checkInQuery.error)}
        onRetry={() => void checkInQuery.refetch()}
      />
    );
  }

  return (
    <AppScreen
      title="Today"
      subtitle="Track how you feel, notice patterns, and build a steadier picture of daily wellness."
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.overviewCard}>
          <AppText style={styles.overviewTitle}>Your daily wellness overview</AppText>
          <AppText style={styles.overviewBody}>
            Log fatigue, mood, stress, sleep, hydration, and a few symptom signals so you can
            follow what changes over time.
          </AppText>
        </View>

        <PatternSummaryCard
          title="This week at a glance"
          summary={patternSummaryQuery.data?.insight ?? weeklySnapshot}
        />

        <View style={styles.navCard}>
          <AppText style={styles.navTitle}>Explore the app</AppText>
          <View style={styles.navButtons}>
            <AppButton label="Go to Track" onPress={() => router.push("/track")} variant="secondary" />
            <AppButton label="Go to Coach" onPress={() => router.push("/coach")} variant="secondary" />
            <AppButton label="Go to Programs" onPress={() => router.push("/programs")} variant="secondary" />
          </View>
        </View>

        <View style={styles.header}>
          <AppText style={styles.kicker}>Today&apos;s check-in</AppText>
          <AppText style={styles.date}>{today}</AppText>
        </View>

        <DailyCheckInCard draft={draft} onChange={setDraft} saveState={saveState} />
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
  header: {
    gap: 4,
  },
  kicker: {
    fontSize: 14,
    fontWeight: "600",
    color: "#e8751a",
  },
  date: {
    fontSize: 14,
    color: "#6b7280",
  },
  overviewCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f1e1d4",
    padding: 18,
    gap: 8,
  },
  overviewTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
  },
  overviewBody: {
    color: "#4b5563",
  },
  navCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f1e1d4",
    padding: 18,
    gap: 12,
  },
  navTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
  },
  navButtons: {
    gap: 10,
  },
});
