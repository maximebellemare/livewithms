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
import type { DailyCheckInInput } from "../../../../features/checkins/types";
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

function buildPromptOptions() {
  return [
    "What felt most manageable today?",
    "When did your body ask for rest?",
    "What helped your stress settle, even a little?",
  ];
}

export default function CoachScreen() {
  const { user } = useAuth();
  const today = getTodayDateString();
  const todayEntryQuery = useTodaysCheckIn(user?.id, today);
  const recentEntriesQuery = useCheckInHistory(user?.id, 7);
  const saveCheckIn = useSaveDailyCheckIn();
  const [reflection, setReflection] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    if (!todayEntryQuery.data) {
      return;
    }

    setReflection(todayEntryQuery.data.notes ?? "");
  }, [todayEntryQuery.data?.updated_at]);

  const promptOptions = useMemo(() => {
    const prompts = buildPromptOptions();
    const averageStress =
      recentEntriesQuery.data
        ?.map((entry) => entry.stress)
        .filter((value): value is number => value !== null)
        .reduce((sum, value, _, values) => sum + value / values.length, 0) ?? null;

    if (averageStress !== null && averageStress >= 4) {
      return [
        "What helped you feel a little safer or calmer today?",
        "What would support a gentler evening tonight?",
        "Where did stress show up most in your day?",
      ];
    }

    return prompts;
  }, [recentEntriesQuery.data]);

  const helperCopy = useMemo(() => {
    const latestEntry = recentEntriesQuery.data?.[0];

    if ((latestEntry?.fatigue ?? 0) >= 4) {
      return "Fatigue has been one of the stronger signals in your recent check-ins. A shorter note about what helped or what drained you can be useful later.";
    }

    if ((latestEntry?.mood ?? 0) >= 4) {
      return "Your recent check-ins suggest a steadier stretch. This can be a good time to note what is helping so you can return to it.";
    }

    return "Use Coach as a quiet place to reflect on your day, notice small patterns, and save a note you can look back on later.";
  }, [recentEntriesQuery.data]);

  const handleSaveReflection = async () => {
    if (!user?.id || saveState === "saving") {
      return;
    }

    setSaveState("saving");

    const currentEntry = todayEntryQuery.data;
    const input: DailyCheckInInput = {
      fatigue: currentEntry?.fatigue ?? null,
      pain: currentEntry?.pain ?? null,
      brain_fog: currentEntry?.brain_fog ?? null,
      mood: currentEntry?.mood ?? null,
      mobility: currentEntry?.mobility ?? null,
      stress: currentEntry?.stress ?? null,
      sleep_hours: currentEntry?.sleep_hours ?? null,
      water_glasses: currentEntry?.water_glasses ?? null,
      notes: reflection.trim() || null,
      mood_tags: currentEntry?.mood_tags ?? [],
    };

    try {
      await saveCheckIn.mutateAsync({
        userId: user.id,
        date: today,
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
      subtitle="Use simple reflection prompts to notice what helped, what felt heavy, and what you may need next."
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <AppText style={styles.title}>Move between sections</AppText>
          <View style={styles.navButtons}>
            <AppButton label="Go to Today" onPress={() => router.push("/today")} variant="secondary" />
            <AppButton label="Go to Programs" onPress={() => router.push("/programs")} variant="secondary" />
          </View>
        </View>

        <View style={styles.card}>
          <AppText style={styles.title}>Reflect on your day</AppText>
          <AppText style={styles.body}>{helperCopy}</AppText>
          <View style={styles.promptList}>
            {promptOptions.map((prompt) => (
              <AppButton
                key={prompt}
                label={prompt}
                onPress={() => setReflection((current) => (current ? `${current}\n\n${prompt}\n` : `${prompt}\n`))}
                variant="secondary"
              />
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <AppText style={styles.title}>Today&apos;s reflection</AppText>
          <TextInput
            multiline
            value={reflection}
            onChangeText={setReflection}
            placeholder="Write a few lines about how today felt, what helped, or what you want to remember."
            placeholderTextColor="#9ca3af"
            textAlignVertical="top"
            style={styles.input}
          />
          <AppButton
            label={saveState === "saving" ? "Saving..." : saveState === "saved" ? "Saved" : "Save reflection"}
            onPress={() => void handleSaveReflection()}
            disabled={saveState === "saving"}
          />
          {saveState === "error" ? (
            <AppText style={styles.errorText}>Unable to save right now. Please try again.</AppText>
          ) : null}
        </View>

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
  promptList: {
    gap: 10,
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
