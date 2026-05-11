import { useEffect, useMemo, useState } from "react";
import { router } from "expo-router";
import { Linking, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import AppButton from "../../../../components/ui/AppButton";
import AppScreen from "../../../../components/ui/AppScreen";
import AppText from "../../../../components/ui/AppText";
import ErrorState from "../../../../components/ui/ErrorState";
import LoadingState from "../../../../components/ui/LoadingState";
import {
  buildCoachFocus,
  buildCoachMessage,
  buildCoachSummary,
  buildReflectionPrompts,
  buildSuggestedActions,
  type CoachActionKey,
} from "../../../../features/coach/logic";
import { useCoachPlan, useSaveCoachPlan } from "../../../../features/coach-plans/hooks";
import type { CoachPlanInput } from "../../../../features/coach-plans/types";
import { useAuth } from "../../../../features/auth/hooks";
import { useCheckInHistory, useSaveDailyCheckIn, useTodaysCheckIn } from "../../../../features/checkins/hooks";
import type { DailyCheckIn, DailyCheckInInput } from "../../../../features/checkins/types";
import { getErrorMessage } from "../../../../lib/errors";

const NATIONAL_MS_SOCIETY_URL = "https://www.nationalmssociety.org/";
const MAYO_MS_URL = "https://www.mayoclinic.org/diseases-conditions/multiple-sclerosis";
const NHS_MS_URL = "https://www.nhs.uk/conditions/multiple-sclerosis/";

function getDateString(offsetDays = 0) {
  const now = new Date();
  now.setDate(now.getDate() + offsetDays);

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

function formatPlanDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function buildCheckInInputForReflection(
  existingEntry: DailyCheckIn | null,
  reflection: string,
): DailyCheckInInput {
  return {
    fatigue: existingEntry?.fatigue ?? null,
    pain: existingEntry?.pain ?? null,
    brain_fog: existingEntry?.brain_fog ?? null,
    mood: existingEntry?.mood ?? null,
    mobility: existingEntry?.mobility ?? null,
    stress: existingEntry?.stress ?? null,
    sleep_hours: existingEntry?.sleep_hours ?? null,
    water_glasses: existingEntry?.water_glasses ?? null,
    notes: reflection.trim() || null,
    mood_tags: existingEntry?.mood_tags ?? [],
    symptom_tags: existingEntry?.symptom_tags ?? [],
    triggers: existingEntry?.triggers ?? [],
    wins: existingEntry?.wins ?? [],
    spasticity: existingEntry?.spasticity ?? null,
  };
}

export default function CoachScreen() {
  const { user } = useAuth();
  const today = getDateString();
  const tomorrow = getDateString(1);
  const todayEntryQuery = useTodaysCheckIn(user?.id, today);
  const recentEntriesQuery = useCheckInHistory(user?.id, 14);
  const tomorrowPlanQuery = useCoachPlan(user?.id, tomorrow);
  const saveCheckIn = useSaveDailyCheckIn();
  const saveCoachPlan = useSaveCoachPlan();

  const [activeAction, setActiveAction] = useState<CoachActionKey>("reflect");
  const [reflection, setReflection] = useState("");
  const [reflectionState, setReflectionState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [planState, setPlanState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [resetRunning, setResetRunning] = useState(false);
  const [resetSecondsLeft, setResetSecondsLeft] = useState(60);
  const [resetCompleted, setResetCompleted] = useState(false);
  const [reflectionError, setReflectionError] = useState<string | null>(null);
  const [planError, setPlanError] = useState<string | null>(null);
  const [priority, setPriority] = useState("");
  const [avoid, setAvoid] = useState("");
  const [supportAction, setSupportAction] = useState("");

  const todayEntry = todayEntryQuery.data ?? null;
  const latestEntry = recentEntriesQuery.data?.[0] ?? null;
  const coachEntry = todayEntry ?? latestEntry ?? null;

  useEffect(() => {
    setReflection(todayEntry?.notes ?? "");
    setReflectionState("idle");
    setReflectionError(null);
  }, [todayEntry?.updated_at]);

  useEffect(() => {
    setPriority(tomorrowPlanQuery.data?.priority ?? "");
    setAvoid(tomorrowPlanQuery.data?.avoid ?? "");
    setSupportAction(tomorrowPlanQuery.data?.support_action ?? "");
    setPlanState("idle");
    setPlanError(null);
  }, [tomorrowPlanQuery.data?.updated_at]);

  useEffect(() => {
    if (!resetRunning) {
      return;
    }

    const timeout = setTimeout(() => {
      setResetSecondsLeft((current) => {
        if (current <= 1) {
          setResetRunning(false);
          setResetCompleted(true);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => clearTimeout(timeout);
  }, [resetRunning, resetSecondsLeft]);

  const greeting = useMemo(() => getGreeting(), []);
  const coachMessage = useMemo(() => buildCoachMessage(coachEntry), [coachEntry]);
  const coachFocus = useMemo(() => buildCoachFocus(coachEntry), [coachEntry]);
  const coachSummary = useMemo(() => buildCoachSummary(todayEntry), [todayEntry]);
  const reflectionPrompts = useMemo(() => buildReflectionPrompts(coachEntry), [coachEntry]);
  const suggestedActions = useMemo(() => buildSuggestedActions(coachEntry), [coachEntry]);

  const handleSaveReflection = async () => {
    if (!user?.id || reflectionState === "saving") {
      return;
    }

    setReflectionError(null);
    setReflectionState("saving");

    try {
      await saveCheckIn.mutateAsync({
        userId: user.id,
        date: today,
        input: buildCheckInInputForReflection(todayEntry, reflection),
      });
      setReflectionState("saved");
    } catch (error) {
      setReflectionError(getErrorMessage(error));
      setReflectionState("error");
    }
  };

  const handleSavePlan = async () => {
    if (!user?.id || planState === "saving") {
      return;
    }

    setPlanError(null);
    setPlanState("saving");

    const input: CoachPlanInput = {
      priority: priority || null,
      avoid: avoid || null,
      support_action: supportAction || null,
    };

    try {
      await saveCoachPlan.mutateAsync({
        userId: user.id,
        date: tomorrow,
        input,
      });
      setPlanState("saved");
    } catch (error) {
      setPlanError(getErrorMessage(error));
      setPlanState("error");
    }
  };

  const handleResetStart = () => {
    setResetCompleted(false);
    setResetSecondsLeft((current) => (current === 0 ? 60 : current));
    setResetRunning(true);
  };

  const handleResetPause = () => {
    setResetRunning(false);
  };

  const handleResetReset = () => {
    setResetRunning(false);
    setResetCompleted(false);
    setResetSecondsLeft(60);
  };

  if (!user?.id) {
    return <ErrorState message="You need to be signed in to use Coach." />;
  }

  if (todayEntryQuery.isLoading || recentEntriesQuery.isLoading || tomorrowPlanQuery.isLoading) {
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

  if (tomorrowPlanQuery.isError) {
    return (
      <ErrorState
        message={getErrorMessage(tomorrowPlanQuery.error)}
        onRetry={() => void tomorrowPlanQuery.refetch()}
      />
    );
  }

  return (
    <AppScreen
      title="Coach"
      subtitle="A supportive space for daily reflection, a short reset, and one gentle plan for tomorrow."
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <AppText style={styles.greeting}>{greeting}</AppText>
          <AppText style={styles.heroTitle}>How can Coach support you today?</AppText>
          <AppText style={styles.heroBody}>{coachMessage.body}</AppText>
        </View>

        <View style={styles.focusCard}>
          <AppText style={styles.contextLabel}>Today’s focus</AppText>
          <AppText style={styles.focusTitle}>{coachFocus.title}</AppText>
          <AppText style={styles.body}>{coachFocus.body}</AppText>
          <View style={styles.suggestedList}>
            {suggestedActions.map((action) => (
              <View key={action} style={styles.suggestedPill}>
                <AppText style={styles.suggestedText}>{action}</AppText>
              </View>
            ))}
          </View>
        </View>

        {todayEntry ? (
          <View style={styles.card}>
            <AppText style={styles.title}>Today’s check-in summary</AppText>
            <View style={styles.summaryGrid}>
              {coachSummary.map((item) => (
                <View key={item.label} style={styles.summaryPill}>
                  <AppText style={styles.summaryLabel}>{item.label}</AppText>
                  <AppText style={styles.summaryValue}>{item.value}</AppText>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.card}>
            <AppText style={styles.title}>Let’s start gently</AppText>
            <AppText style={styles.body}>
              You have not checked in yet today. You can still reset or plan ahead, or head to Today when you are ready.
            </AppText>
            <AppButton label="Go to Today" onPress={() => router.push("/today")} />
          </View>
        )}

        <View style={styles.card}>
          <AppText style={styles.title}>Quick actions</AppText>
          <View style={styles.quickActions}>
            {[
              { key: "reflect", label: "Reflect", description: "Write down what this day felt like." },
              { key: "reset", label: "Calm Reset", description: "Take one minute to settle your system." },
              { key: "plan", label: "Plan Tomorrow", description: "Make tomorrow feel a little lighter." },
            ].map((action) => (
              <Pressable
                key={action.key}
                onPress={() => setActiveAction(action.key as CoachActionKey)}
                style={({ pressed }) => [
                  styles.actionCard,
                  activeAction === action.key && styles.actionCardActive,
                  pressed && styles.actionCardPressed,
                ]}
              >
                <AppText style={styles.actionTitle}>{action.label}</AppText>
                <AppText style={styles.actionBody}>{action.description}</AppText>
              </Pressable>
            ))}
          </View>
        </View>

        {activeAction === "reflect" ? (
          <View style={styles.card}>
            <AppText style={styles.title}>{reflectionPrompts.title}</AppText>
            <View style={styles.promptList}>
              {reflectionPrompts.prompts.map((prompt) => (
                <View key={prompt} style={styles.promptRow}>
                  <AppText style={styles.promptBullet}>•</AppText>
                  <AppText style={styles.promptText}>{prompt}</AppText>
                </View>
              ))}
            </View>
            <TextInput
              multiline
              value={reflection}
              onChangeText={(next) => {
                setReflection(next);
                if (reflectionState !== "saving") {
                  setReflectionState("idle");
                }
              }}
              placeholder="Write a few lines about today, what helped, or what you want to carry forward."
              placeholderTextColor="#9ca3af"
              textAlignVertical="top"
              style={styles.notesInput}
            />
            <AppButton
              label={
                reflectionState === "saving"
                  ? "Saving..."
                  : reflectionState === "saved"
                    ? "Saved"
                    : "Save reflection"
              }
              onPress={() => void handleSaveReflection()}
              disabled={reflectionState === "saving"}
            />
            {reflectionState === "saved" ? (
              <View style={styles.successCard}>
                <AppText style={styles.successTitle}>You showed up today</AppText>
                <AppText style={styles.successBody}>
                  Your reflection is saved. Come back tomorrow and keep building your baseline.
                </AppText>
              </View>
            ) : null}
            {reflectionError ? <AppText style={styles.errorText}>{reflectionError}</AppText> : null}
          </View>
        ) : null}

        {activeAction === "reset" ? (
          <View style={styles.card}>
            <AppText style={styles.title}>60-second calm reset</AppText>
            <AppText style={styles.body}>
              Let your shoulders soften. Breathe in slowly for 4, out slowly for 6, and let the next minute be enough.
            </AppText>
            <View style={styles.timerCard}>
              <AppText style={styles.timerValue}>{resetSecondsLeft}s</AppText>
              <AppText style={styles.timerBody}>
                {resetCompleted
                  ? "Nice work. You gave yourself a small reset."
                  : "Keep the breath easy and steady."}
              </AppText>
            </View>
            <View style={styles.timerButtons}>
              <AppButton
                label={resetRunning ? "Pause" : resetSecondsLeft === 60 || resetSecondsLeft === 0 ? "Start" : "Resume"}
                onPress={resetRunning ? handleResetPause : handleResetStart}
              />
              <AppButton label="Reset" onPress={handleResetReset} variant="secondary" />
            </View>
            {resetCompleted ? (
              <View style={styles.successCard}>
                <AppText style={styles.successTitle}>You showed up today</AppText>
                <AppText style={styles.successBody}>
                  Even one quiet minute can help the day feel more manageable.
                </AppText>
              </View>
            ) : null}
          </View>
        ) : null}

        {activeAction === "plan" ? (
          <View style={styles.card}>
            <AppText style={styles.title}>Plan tomorrow</AppText>
            <AppText style={styles.body}>
              Save one gentle plan for {formatPlanDate(tomorrow)} so tomorrow starts with less friction.
            </AppText>
            <View style={styles.fieldGroup}>
              <AppText style={styles.fieldLabel}>One priority</AppText>
              <TextInput
                value={priority}
                onChangeText={(next) => {
                  setPriority(next);
                  if (planState !== "saving") {
                    setPlanState("idle");
                  }
                }}
                placeholder="The one thing that matters most"
                placeholderTextColor="#9ca3af"
                style={styles.input}
              />
            </View>
            <View style={styles.fieldGroup}>
              <AppText style={styles.fieldLabel}>One thing to avoid</AppText>
              <TextInput
                value={avoid}
                onChangeText={(next) => {
                  setAvoid(next);
                  if (planState !== "saving") {
                    setPlanState("idle");
                  }
                }}
                placeholder="What would make tomorrow feel heavier?"
                placeholderTextColor="#9ca3af"
                style={styles.input}
              />
            </View>
            <View style={styles.fieldGroup}>
              <AppText style={styles.fieldLabel}>One support action</AppText>
              <TextInput
                value={supportAction}
                onChangeText={(next) => {
                  setSupportAction(next);
                  if (planState !== "saving") {
                    setPlanState("idle");
                  }
                }}
                placeholder="A small support you want to give yourself"
                placeholderTextColor="#9ca3af"
                style={styles.input}
              />
            </View>
            <AppButton
              label={planState === "saving" ? "Saving..." : planState === "saved" ? "Saved" : "Save tomorrow plan"}
              onPress={() => void handleSavePlan()}
              disabled={planState === "saving"}
            />
            {planState === "saved" ? (
              <View style={styles.successCard}>
                <AppText style={styles.successTitle}>You showed up today</AppText>
                <AppText style={styles.successBody}>
                  Tomorrow now has a softer landing. Come back and adjust it anytime.
                </AppText>
              </View>
            ) : null}
            {planError ? <AppText style={styles.errorText}>{planError}</AppText> : null}
          </View>
        ) : null}

        <View style={styles.sourcesCard}>
          <AppText style={styles.title}>Sources</AppText>
          <AppText style={styles.body}>
            Coach offers wellness reflection and self-tracking only. It does not replace care from a qualified medical professional.
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
    gap: 14,
  },
  heroCard: {
    backgroundColor: "#fff4ec",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#f2d8c4",
    padding: 20,
    gap: 8,
  },
  focusCard: {
    backgroundColor: "#fffaf6",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#f1e1d4",
    padding: 18,
    gap: 10,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f1e1d4",
    padding: 18,
    gap: 12,
  },
  sourcesCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f1e1d4",
    padding: 18,
    gap: 10,
  },
  greeting: {
    fontSize: 15,
    fontWeight: "600",
    color: "#c25d10",
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
  contextLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#c25d10",
    textTransform: "uppercase",
  },
  focusTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "700",
    color: "#1f2937",
  },
  title: {
    fontSize: 19,
    fontWeight: "700",
    color: "#1f2937",
  },
  body: {
    color: "#4b5563",
    lineHeight: 22,
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
  suggestedList: {
    gap: 8,
  },
  suggestedPill: {
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: "#fff0e2",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  suggestedText: {
    color: "#9a4a11",
    fontSize: 13,
    fontWeight: "600",
  },
  quickActions: {
    gap: 10,
  },
  actionCard: {
    backgroundColor: "#fffaf6",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#f3dfd1",
    padding: 16,
    gap: 4,
  },
  actionCardActive: {
    borderColor: "#e8751a",
    backgroundColor: "#fff4ec",
  },
  actionCardPressed: {
    opacity: 0.9,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
  },
  actionBody: {
    color: "#4b5563",
    lineHeight: 20,
  },
  promptList: {
    gap: 8,
  },
  promptRow: {
    flexDirection: "row",
    gap: 8,
  },
  promptBullet: {
    color: "#c25d10",
    fontWeight: "700",
  },
  promptText: {
    flex: 1,
    color: "#4b5563",
    lineHeight: 20,
  },
  notesInput: {
    minHeight: 120,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5d6cb",
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1f2937",
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5d6cb",
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1f2937",
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 14,
    color: "#374151",
  },
  timerCard: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "#fffaf6",
    borderWidth: 1,
    borderColor: "#f3dfd1",
    paddingVertical: 22,
    paddingHorizontal: 16,
    gap: 6,
  },
  timerValue: {
    fontSize: 36,
    fontWeight: "700",
    color: "#1f2937",
  },
  timerBody: {
    color: "#4b5563",
    textAlign: "center",
  },
  timerButtons: {
    gap: 10,
  },
  successCard: {
    borderRadius: 16,
    backgroundColor: "#eef8f0",
    borderWidth: 1,
    borderColor: "#cde7d1",
    padding: 14,
    gap: 4,
  },
  successTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#166534",
  },
  successBody: {
    color: "#2f5f3c",
    lineHeight: 20,
  },
  errorText: {
    color: "#b91c1c",
    lineHeight: 20,
  },
  links: {
    gap: 8,
  },
  link: {
    color: "#c25d10",
    fontWeight: "600",
  },
});
