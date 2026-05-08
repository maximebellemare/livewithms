import { useEffect, useMemo, useState } from "react";
import { router } from "expo-router";
import { Linking, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import AppButton from "../../../../components/ui/AppButton";
import AppScreen from "../../../../components/ui/AppScreen";
import AppText from "../../../../components/ui/AppText";
import ErrorState from "../../../../components/ui/ErrorState";
import LoadingState from "../../../../components/ui/LoadingState";
import { useAuth } from "../../../../features/auth/hooks";
import { useSaveDailyCheckIn, useCheckInHistory, useTodaysCheckIn } from "../../../../features/checkins/hooks";
import type { DailyCheckIn, DailyCheckInInput } from "../../../../features/checkins/types";
import { getErrorMessage } from "../../../../lib/errors";

const NATIONAL_MS_SOCIETY_URL = "https://www.nationalmssociety.org/";
const MAYO_MS_URL = "https://www.mayoclinic.org/diseases-conditions/multiple-sclerosis";
const NHS_MS_URL = "https://www.nhs.uk/conditions/multiple-sclerosis/";

function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatMetricValue(value: number | null, suffix = "") {
  if (value === null) {
    return "—";
  }

  return `${value}${suffix}`;
}

function buildReflection(latestEntry: DailyCheckIn) {
  const fatigue = latestEntry.fatigue ?? 0;
  const mood = latestEntry.mood ?? 0;
  const stress = latestEntry.stress ?? 0;
  const pain = latestEntry.pain ?? 0;
  const brainFog = latestEntry.brain_fog ?? 0;
  const sleepHours = latestEntry.sleep_hours;
  const waterGlasses = latestEntry.water_glasses;
  const noteText = latestEntry.notes?.trim().toLowerCase() ?? "";

  if (fatigue >= 7 && sleepHours !== null && sleepHours < 6) {
    return "Your body may be asking for recovery today. Consider lowering intensity and prioritizing rest.";
  }

  if (fatigue >= 7 && stress >= 7) {
    return "This looks like a high-load day. Choose one priority and give yourself permission to simplify.";
  }

  if (mood !== null && mood <= 3) {
    return "Today may need gentler support. A small grounding activity could help create a little stability.";
  }

  if (pain >= 7 || brainFog >= 7) {
    return "Your signals look heavier today. A slower pace and fewer decisions may help the day feel more manageable.";
  }

  if ((sleepHours ?? 0) >= 7 && fatigue <= 4 && stress <= 4 && mood >= 4) {
    return "This looks like a stronger day. Notice what supported it so you can repeat the pattern.";
  }

  if (waterGlasses !== null && waterGlasses < 4 && fatigue >= 5) {
    return "Energy looks a little stretched today. A small reset with hydration and rest may help you steady things.";
  }

  if (noteText.includes("rest") || noteText.includes("walk") || noteText.includes("calm")) {
    return "You already noticed something supportive today. Hold onto that and see if it helps again tomorrow.";
  }

  return "Your check-in suggests a mixed day. Keep things simple and pay attention to what helps you feel a little steadier.";
}

function buildSuggestedActions(latestEntry: DailyCheckIn) {
  const actions: string[] = [];

  if ((latestEntry.stress ?? 0) >= 7) {
    actions.push("Take a 5-minute reset");
  }

  if ((latestEntry.fatigue ?? 0) >= 7 || (latestEntry.pain ?? 0) >= 7) {
    actions.push("Plan a lower-demand day");
  }

  if ((latestEntry.sleep_hours ?? 0) < 6) {
    actions.push("Protect your wind-down tonight");
  }

  if ((latestEntry.water_glasses ?? 0) < 5) {
    actions.push("Pause for a glass of water");
  }

  if ((latestEntry.mood ?? 0) <= 3) {
    actions.push("Choose one grounding activity");
  }

  actions.push("Write one thing that helped today");

  return Array.from(new Set(actions)).slice(0, 3);
}

function buildCoachSummary(latestEntry: DailyCheckIn) {
  return [
    { label: "Fatigue", value: formatMetricValue(latestEntry.fatigue) },
    { label: "Mood", value: formatMetricValue(latestEntry.mood) },
    { label: "Stress", value: formatMetricValue(latestEntry.stress) },
    { label: "Sleep", value: formatMetricValue(latestEntry.sleep_hours, "h") },
    { label: "Hydration", value: formatMetricValue(latestEntry.water_glasses, " glasses") },
  ];
}

export default function CoachScreen() {
  const { user } = useAuth();
  const today = getTodayDateString();
  const todayEntryQuery = useTodaysCheckIn(user?.id, today);
  const recentEntriesQuery = useCheckInHistory(user?.id, 30);
  const saveCheckIn = useSaveDailyCheckIn();
  const [reflection, setReflection] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const latestEntry = recentEntriesQuery.data?.[0] ?? null;

  useEffect(() => {
    if (!latestEntry) {
      return;
    }

    setReflection(latestEntry.notes ?? "");
    setSaveState("idle");
  }, [latestEntry?.updated_at]);

  const coachSummary = useMemo(() => {
    if (!latestEntry) {
      return [];
    }

    return buildCoachSummary(latestEntry);
  }, [latestEntry]);

  const coachReflection = useMemo(() => {
    if (!latestEntry) {
      return null;
    }

    return buildReflection(latestEntry);
  }, [latestEntry]);

  const suggestedActions = useMemo(() => {
    if (!latestEntry) {
      return [];
    }

    return buildSuggestedActions(latestEntry);
  }, [latestEntry]);

  const handleSaveReflection = async () => {
    if (!user?.id || saveState === "saving") {
      return;
    }

    if (!latestEntry) {
      setSaveState("error");
      return;
    }

    setSaveState("saving");

    const input: DailyCheckInInput = {
      fatigue: latestEntry.fatigue ?? null,
      pain: latestEntry.pain ?? null,
      brain_fog: latestEntry.brain_fog ?? null,
      mood: latestEntry.mood ?? null,
      mobility: latestEntry.mobility ?? null,
      stress: latestEntry.stress ?? null,
      sleep_hours: latestEntry.sleep_hours ?? null,
      water_glasses: latestEntry.water_glasses ?? null,
      notes: reflection.trim() || null,
      mood_tags: latestEntry.mood_tags ?? [],
    };

    try {
      await saveCheckIn.mutateAsync({
        userId: user.id,
        date: latestEntry.date,
        input,
      });
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  };

  if (!user?.id) {
    return <ErrorState message="You need to be signed in to use Coach." />;
  }

  if (todayEntryQuery.isLoading || recentEntriesQuery.isLoading) {
    return <LoadingState message="Loading Coach..." />;
  }

  if (todayEntryQuery.isError) {
    return (
      <ErrorState
        message={getErrorMessage(todayEntryQuery.error)}
        onRetry={() => void todayEntryQuery.refetch()}
      />
    );
  }

  if (recentEntriesQuery.isError) {
    return (
      <ErrorState
        message={getErrorMessage(recentEntriesQuery.error)}
        onRetry={() => void recentEntriesQuery.refetch()}
      />
    );
  }

  return (
    <AppScreen
      title="Coach"
      subtitle="A calm reflection based on your latest check-in, with a few gentle next steps."
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <AppText style={styles.title}>Move between sections</AppText>
          <View style={styles.navButtons}>
            <AppButton label="Go to Today" onPress={() => router.push("/today")} variant="secondary" />
            <AppButton label="Go to Insights" onPress={() => router.push("/insights")} variant="secondary" />
            <AppButton label="Go to Programs" onPress={() => router.push("/programs")} variant="secondary" />
          </View>
        </View>

        {latestEntry ? (
          <>
            <View style={styles.card}>
              <AppText style={styles.title}>Today’s Coach Reflection</AppText>
              <AppText style={styles.body}>
                Based on your latest check-in from {latestEntry.date}, here’s a gentle read on how the day looks.
              </AppText>
            </View>

            <View style={styles.card}>
              <AppText style={styles.title}>Latest check-in summary</AppText>
              <View style={styles.summaryGrid}>
                {coachSummary.map((item) => (
                  <View key={item.label} style={styles.summaryPill}>
                    <AppText style={styles.summaryLabel}>{item.label}</AppText>
                    <AppText style={styles.summaryValue}>{item.value}</AppText>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.reflectionCard}>
              <AppText style={styles.title}>Your reflection</AppText>
              <AppText style={styles.reflectionBody}>{coachReflection}</AppText>
            </View>

            <View style={styles.card}>
              <AppText style={styles.title}>Suggested actions</AppText>
              <View style={styles.actionList}>
                {suggestedActions.map((action) => (
                  <View key={action} style={styles.actionPill}>
                    <AppText style={styles.actionText}>{action}</AppText>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.card}>
              <AppText style={styles.title}>Add your own note</AppText>
              <TextInput
                multiline
                value={reflection}
                onChangeText={(next) => {
                  setReflection(next);
                  if (saveState !== "saving") {
                    setSaveState("idle");
                  }
                }}
                placeholder="Write a few lines about what helped, what felt heavy, or what you want to remember."
                placeholderTextColor="#9ca3af"
                textAlignVertical="top"
                style={styles.input}
              />
              <AppButton
                label={saveState === "saving" ? "Saving..." : saveState === "saved" ? "Saved" : "Save note"}
                onPress={() => void handleSaveReflection()}
                disabled={saveState === "saving"}
              />
              {saveState === "error" ? (
                <AppText style={styles.errorText}>Unable to save right now. Please try again.</AppText>
              ) : null}
            </View>
          </>
        ) : (
          <View style={styles.card}>
            <AppText style={styles.title}>Today’s Coach Reflection</AppText>
            <AppText style={styles.body}>Complete today’s check-in to unlock your reflection.</AppText>
            <AppButton label="Go to Today" onPress={() => router.push("/today")} />
          </View>
        )}

        <View style={styles.card}>
          <AppText style={styles.title}>Sources</AppText>
          <AppText style={styles.body}>
            LiveWithMS offers wellness reflection and self-tracking only. It does not replace care
            from a qualified medical professional.
          </AppText>
          <View style={styles.links}>
            <Pressable onPress={() => void Linking.openURL(NATIONAL_MS_SOCIETY_URL)}>
              <AppText style={styles.link}>National Multiple Sclerosis Society</AppText>
            </Pressable>
            <Pressable onPress={() => void Linking.openURL(MAYO_MS_URL)}>
              <AppText style={styles.link}>Mayo Clinic</AppText>
            </Pressable>
            <Pressable onPress={() => void Linking.openURL(NHS_MS_URL)}>
              <AppText style={styles.link}>NHS</AppText>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 120,
    gap: 12,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f1e1d4",
    padding: 18,
    gap: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
  },
  body: {
    color: "#4b5563",
  },
  navButtons: {
    gap: 10,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  summaryPill: {
    minWidth: 120,
    flexGrow: 1,
    backgroundColor: "#fffaf6",
    borderRadius: 14,
    padding: 12,
    gap: 4,
  },
  summaryLabel: {
    fontSize: 13,
    color: "#6b7280",
  },
  summaryValue: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "700",
    color: "#1f2937",
  },
  reflectionCard: {
    backgroundColor: "#fff4ec",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f2d8c4",
    padding: 18,
    gap: 10,
  },
  reflectionBody: {
    color: "#7c4a1d",
    lineHeight: 24,
    fontSize: 16,
  },
  actionList: {
    gap: 10,
  },
  actionPill: {
    backgroundColor: "#f6f8fb",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  actionText: {
    color: "#374151",
    fontSize: 14,
    lineHeight: 20,
  },
  input: {
    minHeight: 140,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5d6cb",
    backgroundColor: "#fffaf6",
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: "#374151",
  },
  links: {
    gap: 8,
  },
  link: {
    color: "#6b7280",
    textDecorationLine: "underline",
  },
  errorText: {
    color: "#b91c1c",
    fontSize: 14,
  },
});
