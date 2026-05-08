import { useEffect, useMemo, useRef, useState } from "react";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 18) {
    return "Good afternoon";
  }

  return "Good evening";
}

function getPreviousDateString(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  const previous = new Date(year, month - 1, day);
  previous.setDate(previous.getDate() - 1);

  const nextYear = previous.getFullYear();
  const nextMonth = String(previous.getMonth() + 1).padStart(2, "0");
  const nextDay = String(previous.getDate()).padStart(2, "0");

  return `${nextYear}-${nextMonth}-${nextDay}`;
}

function getCurrentStreak(entries: DailyCheckIn[], today: string) {
  const loggedDates = new Set(entries.map((entry) => entry.date));

  if (!loggedDates.has(today)) {
    return 0;
  }

  let streak = 0;
  let currentDate = today;

  while (loggedDates.has(currentDate)) {
    streak += 1;
    currentDate = getPreviousDateString(currentDate);
  }

  return streak;
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

function formatPreviousMetric(label: string, value: number | null) {
  return `${label} ${value ?? "—"}`;
}

export default function TodayScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const today = getTodayDateString();
  const checkInQuery = useTodaysCheckIn(user?.id, today);
  const historyQuery = useCheckInHistory(user?.id, 30);
  const patternSummaryQuery = usePatternSummary(historyQuery.data ?? [], 7);
  const saveCheckIn = useSaveDailyCheckIn();
  const [draft, setDraft] = useState<DailyCheckInDraft>(getEmptyCheckInDraft());
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
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
  const greeting = useMemo(() => getGreeting(), []);
  const streak = useMemo(() => getCurrentStreak(historyQuery.data ?? [], today), [historyQuery.data, today]);
  const previousEntry = useMemo(() => {
    const entries = historyQuery.data ?? [];
    return entries.find((entry) => entry.date < today) ?? null;
  }, [historyQuery.data, today]);
  const postSaveInsight = useMemo(() => {
    const entries = historyQuery.data ?? [];
    if (entries.length < 3) {
      return "Track a few days to unlock your insights";
    }

    return patternSummaryQuery.data?.insight ?? weeklySnapshot;
  }, [historyQuery.data, patternSummaryQuery.data?.insight, weeklySnapshot]);

  useEffect(() => {
    if (!checkInQuery.isSuccess) {
      return;
    }

    const nextDraft = getDraftFromCheckIn(checkInQuery.data);
    lastSavedSnapshotRef.current = getDraftSnapshot(nextDraft);
    setDraft(nextDraft);
    setSaveState("idle");
  }, [checkInQuery.data, checkInQuery.isSuccess]);

  useEffect(() => {
    if (saveState === "saving") {
      return;
    }

    if (getDraftSnapshot(draft) !== lastSavedSnapshotRef.current) {
      setSaveState("idle");
    }
  }, [draft, saveState]);

  const handleSaveCheckIn = async () => {
    if (!user?.id || saveState === "saving") {
      return;
    }

    setSaveState("saving");

    try {
      const savedRow = await saveCheckIn.mutateAsync({
        userId: user.id,
        date: today,
        input: normalizeCheckInInput(draft),
      });

      if (!savedRow?.id || !savedRow?.user_id || !savedRow?.date) {
        throw new Error("Daily entry save did not return a valid row");
      }

      lastSavedSnapshotRef.current = getDraftSnapshot(draft);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  };

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
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: Math.max(120, insets.bottom + 96),
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.overviewCard}>
          <AppText style={styles.greeting}>{greeting}</AppText>
          <AppText style={styles.overviewTitle}>How are you feeling today?</AppText>
          <AppText style={styles.overviewBody}>
            Start with fatigue, mood, and stress. You can add more details if you want.
          </AppText>
        </View>

        {streak > 0 ? (
          <View style={styles.streakCard}>
            <AppText style={styles.streakTitle}>🔥 {streak} day streak</AppText>
            <AppText style={styles.streakBody}>Keep it going</AppText>
          </View>
        ) : null}

        <View style={styles.welcomeCard}>
          <AppText style={styles.welcomeTitle}>
            {previousEntry ? "Welcome back" : "Let’s start your first check-in"}
          </AppText>
          {previousEntry ? (
            <>
              <AppText style={styles.welcomeBody}>Yesterday you tracked:</AppText>
              <View style={styles.previousMetrics}>
                <View style={styles.previousMetricPill}>
                  <AppText style={styles.previousMetricText}>
                    {formatPreviousMetric("Fatigue", previousEntry.fatigue)}
                  </AppText>
                </View>
                <View style={styles.previousMetricPill}>
                  <AppText style={styles.previousMetricText}>
                    {formatPreviousMetric("Mood", previousEntry.mood)}
                  </AppText>
                </View>
                <View style={styles.previousMetricPill}>
                  <AppText style={styles.previousMetricText}>
                    {formatPreviousMetric("Stress", previousEntry.stress)}
                  </AppText>
                </View>
              </View>
              <AppText style={styles.welcomeBody}>
                Let&apos;s add today so your patterns get smarter.
              </AppText>
            </>
          ) : (
            <AppText style={styles.welcomeBody}>Takes less than 30 seconds.</AppText>
          )}
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
            <AppButton label="Go to Insights" onPress={() => router.push("/insights")} variant="secondary" />
            <AppButton label="Go to Programs" onPress={() => router.push("/programs")} variant="secondary" />
          </View>
        </View>

        <View style={styles.header}>
          <AppText style={styles.kicker}>Today&apos;s check-in</AppText>
          <AppText style={styles.date}>{today}</AppText>
        </View>

        <DailyCheckInCard
          draft={draft}
          onChange={setDraft}
          saveState={saveState}
          onSave={() => void handleSaveCheckIn()}
          postSaveInsight={postSaveInsight}
          onViewInsights={() => router.push("/insights")}
        />
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 24,
    paddingHorizontal: 20,
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
  greeting: {
    fontSize: 14,
    fontWeight: "700",
    color: "#c25d10",
    textTransform: "uppercase",
  },
  overviewTitle: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "700",
    color: "#1f2937",
  },
  overviewBody: {
    color: "#4b5563",
    lineHeight: 22,
  },
  navCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f1e1d4",
    padding: 18,
    gap: 12,
  },
  welcomeCard: {
    backgroundColor: "#fffaf6",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f2dfcf",
    padding: 18,
    gap: 10,
  },
  streakCard: {
    backgroundColor: "#fff4e8",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#f2d3bd",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 2,
  },
  streakTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#9a3412",
  },
  streakBody: {
    fontSize: 13,
    color: "#b45309",
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
  },
  welcomeBody: {
    color: "#6b7280",
    lineHeight: 22,
  },
  previousMetrics: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  previousMetricPill: {
    borderRadius: 999,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#ead9cb",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  previousMetricText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#8b6a4f",
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
