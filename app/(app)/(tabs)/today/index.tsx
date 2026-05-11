import { useEffect, useMemo, useRef, useState } from "react";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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

function formatLongDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
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

function getSummaryItems(checkIn: DailyCheckIn) {
  return [
    { label: "Fatigue", value: checkIn.fatigue },
    { label: "Mood", value: checkIn.mood },
    { label: "Stress", value: checkIn.stress },
    ...(checkIn.pain !== null ? [{ label: "Pain", value: checkIn.pain }] : []),
    ...(checkIn.brain_fog !== null ? [{ label: "Brain fog", value: checkIn.brain_fog }] : []),
    ...(checkIn.sleep_hours !== null ? [{ label: "Sleep", value: `${checkIn.sleep_hours}h` }] : []),
  ];
}

function getGentleFocus(checkIn: DailyCheckIn | null) {
  if (!checkIn) {
    return {
      title: "Start with a quick check-in",
      body: "A short check-in helps Coach feel more personal and gives Insights more to work with.",
    };
  }

  if ((checkIn.fatigue ?? 0) >= 4) {
    return {
      title: "Protect your energy",
      body: "Keep the day simple and save your energy for what matters most.",
    };
  }

  if ((checkIn.stress ?? 0) >= 4) {
    return {
      title: "Calm your nervous system",
      body: "A short reset or a quieter pace could help the day feel less loaded.",
    };
  }

  if ((checkIn.mood ?? 5) <= 2) {
    return {
      title: "One small win",
      body: "Try to look for one gentle thing that helps you feel a little steadier.",
    };
  }

  if ((checkIn.sleep_hours ?? 99) < 6) {
    return {
      title: "Lower the pressure today",
      body: "Poor sleep can change the whole feel of a day, so lighter expectations may help.",
    };
  }

  return {
    title: "Notice what helped",
    body: "If today has more room in it, pay attention to what supported that feeling.",
  };
}

export default function TodayScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const today = getTodayDateString();
  const checkInQuery = useTodaysCheckIn(user?.id, today);
  const historyQuery = useCheckInHistory(user?.id, 30);
  const saveCheckIn = useSaveDailyCheckIn();
  const [draft, setDraft] = useState<DailyCheckInDraft>(getEmptyCheckInDraft());
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const lastSavedSnapshotRef = useRef(getDraftSnapshot(getEmptyCheckInDraft()));
  const greeting = useMemo(() => getGreeting(), []);
  const streak = useMemo(() => getCurrentStreak(historyQuery.data ?? [], today), [historyQuery.data, today]);
  const todayEntry = checkInQuery.data ?? null;
  const previousEntry = useMemo(() => {
    const entries = historyQuery.data ?? [];
    return entries.find((entry) => entry.date < today) ?? null;
  }, [historyQuery.data, today]);
  const summaryItems = useMemo(() => (todayEntry ? getSummaryItems(todayEntry) : []), [todayEntry]);
  const gentleFocus = useMemo(() => getGentleFocus(todayEntry), [todayEntry]);
  const postSaveInsight = useMemo(() => {
    const entries = historyQuery.data ?? [];
    if (entries.length < 3) {
      return "Track a few days to unlock your insights";
    }

    if ((todayEntry?.fatigue ?? 0) >= 4 && (todayEntry?.sleep_hours ?? 0) < 6) {
      return "Low sleep and heavier fatigue can start to form a pattern. Keep checking in so Insights can connect the dots.";
    }

    if ((todayEntry?.stress ?? 0) >= 4) {
      return "Stress can shape the whole feel of a day. A few more check-ins will help surface clearer patterns.";
    }

    return "Your check-ins help Coach and Insights become more useful over time.";
  }, [historyQuery.data, todayEntry?.fatigue, todayEntry?.sleep_hours, todayEntry?.stress]);

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
          <AppText style={styles.todayDate}>{formatLongDate(today)}</AppText>
          <AppText style={styles.overviewTitle}>How are you feeling today?</AppText>
          <AppText style={styles.overviewBody}>
            {todayEntry
              ? "You checked in today. You can update it anytime if things change."
              : "A quick check-in helps Coach feel more personal and gives Insights more to work with."}
          </AppText>
        </View>

        {streak > 0 ? (
          <View style={styles.streakCard}>
            <AppText style={styles.streakTitle}>🔥 {streak} day streak</AppText>
            <AppText style={styles.streakBody}>Keep it going</AppText>
          </View>
        ) : null}

        {!todayEntry ? (
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
                  Add today’s check-in so Coach and Insights can stay helpful.
                </AppText>
              </>
            ) : (
              <AppText style={styles.welcomeBody}>
                Takes less than 30 seconds and helps build more useful Insights and Coach support.
              </AppText>
            )}
          </View>
        ) : (
          <View style={styles.confirmationCard}>
            <AppText style={styles.confirmationTitle}>You checked in today</AppText>
            <AppText style={styles.confirmationBody}>
              Nice work. Your daily picture is saved and ready to support Coach and Insights.
            </AppText>
          </View>
        )}

        {todayEntry ? (
          <View style={styles.summaryCard}>
            <AppText style={styles.navTitle}>Daily summary</AppText>
            <View style={styles.summaryGrid}>
              {summaryItems.map((item) => (
                <View key={item.label} style={styles.summaryPill}>
                  <AppText style={styles.summaryLabel}>{item.label}</AppText>
                  <AppText style={styles.summaryValue}>{item.value}</AppText>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.focusCard}>
          <AppText style={styles.focusKicker}>Today&apos;s gentle focus</AppText>
          <AppText style={styles.focusTitle}>{gentleFocus.title}</AppText>
          <AppText style={styles.focusBody}>{gentleFocus.body}</AppText>
        </View>

        <View style={styles.navCard}>
          <AppText style={styles.navTitle}>Quick links</AppText>
          <View style={styles.quickLinks}>
            <Pressable onPress={() => router.push("/coach")} style={({ pressed }) => [styles.quickLinkCard, pressed && styles.quickLinkPressed]}>
              <AppText style={styles.quickLinkTitle}>Coach</AppText>
              <AppText style={styles.quickLinkBody}>Reflect, reset, or plan tomorrow.</AppText>
            </Pressable>
            <Pressable onPress={() => router.push("/insights")} style={({ pressed }) => [styles.quickLinkCard, pressed && styles.quickLinkPressed]}>
              <AppText style={styles.quickLinkTitle}>Insights</AppText>
              <AppText style={styles.quickLinkBody}>See trends and gentle patterns.</AppText>
            </Pressable>
            <Pressable onPress={() => router.push("/care")} style={({ pressed }) => [styles.quickLinkCard, pressed && styles.quickLinkPressed]}>
              <AppText style={styles.quickLinkTitle}>Care</AppText>
              <AppText style={styles.quickLinkBody}>Keep notes, meds, and appointments together.</AppText>
            </Pressable>
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
  todayDate: {
    fontSize: 14,
    color: "#6b7280",
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
  confirmationCard: {
    backgroundColor: "#eef8f0",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#d6eadc",
    padding: 18,
    gap: 6,
  },
  confirmationTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#166534",
  },
  confirmationBody: {
    color: "#2f5f3c",
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
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  summaryPill: {
    minWidth: "30%",
    backgroundColor: "#fffaf6",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f3dfd1",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 4,
  },
  summaryLabel: {
    fontSize: 13,
    color: "#6b7280",
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
  },
  focusCard: {
    backgroundColor: "#fff4ec",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f2d8c4",
    padding: 18,
    gap: 8,
  },
  focusKicker: {
    fontSize: 13,
    fontWeight: "700",
    color: "#c25d10",
    textTransform: "uppercase",
  },
  focusTitle: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: "700",
    color: "#1f2937",
  },
  focusBody: {
    color: "#4b5563",
    lineHeight: 22,
  },
  navTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
  },
  quickLinks: {
    gap: 10,
  },
  quickLinkCard: {
    backgroundColor: "#fffaf6",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f3dfd1",
    padding: 14,
    gap: 4,
  },
  quickLinkPressed: {
    opacity: 0.84,
  },
  quickLinkTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
  },
  quickLinkBody: {
    color: "#6b7280",
    lineHeight: 20,
  },
});
