import { useEffect, useMemo, useRef, useState } from "react";
import { router } from "expo-router";
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import AppButton from "../../../../components/ui/AppButton";
import AppScreen from "../../../../components/ui/AppScreen";
import AppText from "../../../../components/ui/AppText";
import ErrorState from "../../../../components/ui/ErrorState";
import LoadingState from "../../../../components/ui/LoadingState";
import {
  buildCoachConversationPreview,
  buildCoachFocus,
  buildCoachMessage,
  buildCoachSummary,
  buildReflectionPrompts,
  buildSuggestedActions,
  type CoachActionKey,
} from "../../../../features/coach/logic";
import { useCoachMessages, useSendCoachMessage } from "../../../../features/coach-messages/hooks";
import type { CoachMode } from "../../../../features/coach-messages/types";
import { useCoachPlan, useSaveCoachPlan } from "../../../../features/coach-plans/hooks";
import type { CoachPlanInput } from "../../../../features/coach-plans/types";
import { useGrowthState } from "../../../../features/growth/hooks";
import { usePremium } from "../../../../features/premium/hooks";
import { canAccessPremiumFeature } from "../../../../features/premium/entitlements";
import { FREE_DAILY_AI_COACH_MESSAGES } from "../../../../features/premium/config";
import { incrementAiCoachUsage, loadAiCoachUsage } from "../../../../features/premium/usage";
import { useAuth } from "../../../../features/auth/hooks";
import { useCheckInHistory, useSaveDailyCheckIn, useTodaysCheckIn } from "../../../../features/checkins/hooks";
import type { DailyCheckIn, DailyCheckInInput } from "../../../../features/checkins/types";
import { getErrorMessage } from "../../../../lib/errors";

const NATIONAL_MS_SOCIETY_URL = "https://www.nationalmssociety.org/";
const MAYO_MS_URL = "https://www.mayoclinic.org/diseases-conditions/multiple-sclerosis";
const NHS_MS_URL = "https://www.nhs.uk/conditions/multiple-sclerosis/";
const COACH_MODES: Array<{ key: CoachMode; label: string }> = [
  { key: "reflect", label: "Reflect" },
  { key: "calm", label: "Calm" },
  { key: "practical", label: "Practical" },
  { key: "encouragement", label: "Encouragement" },
];

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
  const coachMessagesQuery = useCoachMessages(user?.id);
  const saveCheckIn = useSaveDailyCheckIn();
  const saveCoachPlan = useSaveCoachPlan();
  const sendCoachMessage = useSendCoachMessage(user?.id);
  const growth = useGrowthState();
  const premium = usePremium();

  const [activeAction, setActiveAction] = useState<CoachActionKey>("reflect");
  const [reflection, setReflection] = useState("");
  const [coachMode, setCoachMode] = useState<CoachMode>("reflect");
  const [chatInput, setChatInput] = useState("");
  const [chatError, setChatError] = useState<string | null>(null);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);
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
  const [dailyCoachUsage, setDailyCoachUsage] = useState(0);
  const [isLoadingDailyCoachUsage, setIsLoadingDailyCoachUsage] = useState(true);
  const chatScrollRef = useRef<ScrollView>(null);

  const todayEntry = todayEntryQuery.data ?? null;
  const latestEntry = recentEntriesQuery.data?.[0] ?? null;
  const coachEntry = todayEntry ?? latestEntry ?? null;
  const coachMessages = coachMessagesQuery.data ?? [];
  const isInitialLoading =
    (todayEntryQuery.isLoading && !todayEntryQuery.data) ||
    (recentEntriesQuery.isLoading && !recentEntriesQuery.data) ||
    (tomorrowPlanQuery.isLoading && !tomorrowPlanQuery.data);
  const isChatInitialLoading = coachMessagesQuery.isLoading && !coachMessagesQuery.data;

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
    let cancelled = false;

    void (async () => {
      const usage = await loadAiCoachUsage();
      if (!cancelled) {
        setDailyCoachUsage(usage.count);
        setIsLoadingDailyCoachUsage(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

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

  useEffect(() => {
    if (!coachMessages.length && !sendCoachMessage.isPending) {
      return;
    }

    const timeout = setTimeout(() => {
      chatScrollRef.current?.scrollToEnd({ animated: true });
    }, 50);

    return () => clearTimeout(timeout);
  }, [coachMessages.length, sendCoachMessage.isPending]);

  const greeting = useMemo(() => getGreeting(), []);
  const coachMessage = useMemo(() => buildCoachMessage(coachEntry), [coachEntry]);
  const coachFocus = useMemo(() => buildCoachFocus(coachEntry), [coachEntry]);
  const coachSummary = useMemo(() => buildCoachSummary(todayEntry), [todayEntry]);
  const reflectionPrompts = useMemo(() => buildReflectionPrompts(coachEntry), [coachEntry]);
  const suggestedActions = useMemo(() => buildSuggestedActions(coachEntry), [coachEntry]);
  const conversationPreview = useMemo(() => buildCoachConversationPreview(coachEntry), [coachEntry]);
  const chatLoadingLabel = useMemo(() => {
    switch (coachMode) {
      case "calm":
        return "Settling...";
      case "practical":
        return "Organizing...";
      case "encouragement":
        return "Encouraging...";
      case "reflect":
      default:
        return "Reflecting...";
    }
  }, [coachMode]);

  const hasUnlimitedAiCoach = canAccessPremiumFeature("unlimited_ai_coach", {
    subscriptionsEnabled: premium.subscriptionsEnabled,
    hasPremiumAccess: premium.hasPremiumAccess,
    premiumFeatureFlags: premium.premiumFeatureFlags,
  });
  const remainingFreeMessages = Math.max(0, FREE_DAILY_AI_COACH_MESSAGES - dailyCoachUsage);
  const hasReachedFreeCoachLimit =
    !hasUnlimitedAiCoach && dailyCoachUsage >= FREE_DAILY_AI_COACH_MESSAGES;

  const coachContext = useMemo(
    () => ({
      fatigue: todayEntry?.fatigue ?? null,
      mood: todayEntry?.mood ?? null,
      stress: todayEntry?.stress ?? null,
      sleep_hours: todayEntry?.sleep_hours ?? null,
      recent_reflection: todayEntry?.notes ?? latestEntry?.notes ?? null,
    }),
    [latestEntry?.notes, todayEntry?.fatigue, todayEntry?.mood, todayEntry?.notes, todayEntry?.sleep_hours, todayEntry?.stress],
  );

  const handleSendCoachMessage = async (messageOverride?: string) => {
    const nextMessage = (messageOverride ?? chatInput).trim();

    if (!nextMessage || !user?.id || sendCoachMessage.isPending) {
      return;
    }

    if (hasReachedFreeCoachLimit) {
      setChatError(
        "You’ve used today’s included AI Coach messages. Premium keeps Coach available whenever you want more space to reflect.",
      );
      setLastFailedMessage(nextMessage);
      return;
    }

    setChatError(null);
    setLastFailedMessage(null);

    try {
      await sendCoachMessage.mutateAsync({
        message: nextMessage,
        context: coachContext,
        mode: coachMode,
      });
      await growth.recordEvent("ai_coach_message_sent", {
        mode: coachMode,
      });
      if (!hasUnlimitedAiCoach) {
        const nextUsage = await incrementAiCoachUsage();
        setDailyCoachUsage(nextUsage.count);
      }
      setChatInput("");
    } catch (error) {
      const messageText = getErrorMessage(error);
      setChatError(
        messageText === "AI Coach is temporarily unavailable."
          ? "AI Coach is taking a pause right now. You can try again, or use a reset or reflection instead."
          : messageText,
      );
      setLastFailedMessage(nextMessage);
    }
  };

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

  if (isInitialLoading) {
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
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.sectionIntro}>
            <AppText style={styles.sectionKicker}>Daily Coach</AppText>
            <AppText style={styles.sectionBody}>
              A calm place to notice what today feels like and choose one small next step.
            </AppText>
          </View>

          <View style={styles.heroCard}>
            <AppText style={styles.greeting}>{greeting}</AppText>
            <AppText style={styles.heroTitle}>How can Coach support you today?</AppText>
            <AppText style={styles.heroBody}>{coachMessage.body}</AppText>
          </View>

          <View style={styles.card}>
            <AppText style={styles.contextLabel}>Conversation preview</AppText>
            <View style={styles.messageList}>
              {conversationPreview.map((message, index) => (
                <View
                  key={`${message.role}-${index}`}
                  style={[
                    styles.messageBubble,
                    message.role === "coach" ? styles.coachBubble : styles.userBubble,
                  ]}
                >
                  <AppText
                    style={[
                      styles.messageRole,
                      message.role === "coach" ? styles.coachRole : styles.userRole,
                    ]}
                  >
                    {message.role === "coach" ? "Coach" : "You"}
                  </AppText>
                  <AppText style={styles.messageText}>{message.content}</AppText>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.card}>
            <AppText style={styles.contextLabel}>AI Coach</AppText>
            <AppText style={styles.title}>Talk it through</AppText>
            <AppText style={styles.body}>
              Share a thought, a hard moment, or what you want help noticing. Coach will keep the response short, calm, and practical.
            </AppText>
            <AppText style={styles.supportNote}>Your messages stay private and Coach is here for reflection, not medical advice.</AppText>
            <View style={styles.usageCard}>
              <AppText style={styles.usageTitle}>
                {hasUnlimitedAiCoach
                  ? "Premium gives you unlimited AI Coach conversations."
                  : isLoadingDailyCoachUsage
                    ? "Checking your AI Coach access..."
                    : `${remainingFreeMessages} of ${FREE_DAILY_AI_COACH_MESSAGES} AI Coach messages left today.`}
              </AppText>
              <AppText style={styles.usageBody}>
                {hasUnlimitedAiCoach
                  ? "Thank you for supporting continued development."
                  : "Daily check-ins, tracking, reminders, Programs, Care, and basic insights stay free."}
              </AppText>
            </View>
            {growth.getCelebrationAvailable("first_coach_conversation") ? (
              <View style={styles.celebrationCard}>
                <View style={styles.celebrationHeader}>
                  <AppText style={styles.celebrationTitle}>A new kind of support</AppText>
                  <Pressable
                    onPress={() => {
                      void growth.markCelebrationSeen("first_coach_conversation");
                    }}
                    style={({ pressed }) => [styles.dismissChip, pressed && styles.actionCardPressed]}
                  >
                    <AppText style={styles.dismissChipText}>Dismiss</AppText>
                  </Pressable>
                </View>
                <AppText style={styles.body}>
                  You’ve started your first AI Coach conversation. Come back whenever a little reflection would help.
                </AppText>
              </View>
            ) : null}
            <View style={styles.modeRow}>
              {COACH_MODES.map((mode) => (
                <Pressable
                  key={mode.key}
                  onPress={() => setCoachMode(mode.key)}
                  style={({ pressed }) => [
                    styles.modeChip,
                    coachMode === mode.key && styles.modeChipActive,
                    pressed && styles.actionCardPressed,
                  ]}
                >
                  <AppText style={[styles.modeChipText, coachMode === mode.key && styles.modeChipTextActive]}>
                    {mode.label}
                  </AppText>
                </Pressable>
              ))}
            </View>

            {isChatInitialLoading ? (
              <View style={styles.inlineState}>
                <AppText style={styles.body}>Loading your recent Coach messages…</AppText>
              </View>
            ) : coachMessagesQuery.isError ? (
              <View style={styles.inlineState}>
                <AppText style={styles.errorText}>
                  Coach is having trouble loading right now. You can still reflect, reset, or plan ahead.
                </AppText>
                <AppButton label="Retry" variant="secondary" onPress={() => void coachMessagesQuery.refetch()} />
              </View>
            ) : coachMessages.length ? (
              <View style={styles.chatShell}>
                <ScrollView
                  ref={chatScrollRef}
                  style={styles.chatScrollView}
                  contentContainerStyle={styles.chatContent}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  nestedScrollEnabled
                  onContentSizeChange={() => {
                    chatScrollRef.current?.scrollToEnd({ animated: true });
                  }}
                >
                  <View style={styles.messageList}>
                    {coachMessages.map((message) => (
                      <View
                        key={message.id}
                        style={[
                          styles.messageBubble,
                          message.role === "assistant" ? styles.coachBubble : styles.userBubble,
                        ]}
                      >
                        <AppText
                          style={[
                            styles.messageRole,
                            message.role === "assistant" ? styles.coachRole : styles.userRole,
                          ]}
                        >
                          {message.role === "assistant" ? "Coach" : "You"}
                        </AppText>
                        <AppText style={styles.messageText}>{message.content}</AppText>
                      </View>
                    ))}
                    {sendCoachMessage.isPending ? (
                      <View style={[styles.messageBubble, styles.coachBubble]}>
                        <AppText style={[styles.messageRole, styles.coachRole]}>Coach</AppText>
                        <AppText style={styles.messageText}>{chatLoadingLabel}</AppText>
                      </View>
                    ) : null}
                  </View>
                </ScrollView>
              </View>
            ) : (
              <View style={styles.emptyChatCard}>
                <AppText style={styles.emptyChatTitle}>Start gently</AppText>
                <AppText style={styles.body}>
                  You can ask Coach to help you reflect, make sense of today, or find one calmer next step.
                </AppText>
              </View>
            )}

            <View style={styles.fieldGroup}>
              <AppText style={styles.fieldLabel}>Message Coach</AppText>
              <TextInput
                multiline
                value={chatInput}
                onChangeText={(next) => {
                  setChatInput(next);
                  if (chatError) {
                    setChatError(null);
                  }
                }}
                onFocus={() => {
                  chatScrollRef.current?.scrollToEnd({ animated: true });
                }}
                placeholder="What feels most important right now?"
                placeholderTextColor="#9ca3af"
                textAlignVertical="top"
                style={styles.notesInput}
                editable={!hasReachedFreeCoachLimit}
              />
            </View>
            <AppButton
              label={
                hasReachedFreeCoachLimit
                  ? "See Premium"
                  : sendCoachMessage.isPending
                    ? "Sending..."
                    : "Send message"
              }
              onPress={() =>
                hasReachedFreeCoachLimit
                  ? router.push("/premium?source=coach-limit")
                  : void handleSendCoachMessage()
              }
              disabled={sendCoachMessage.isPending || (!hasReachedFreeCoachLimit && chatInput.trim().length === 0)}
            />
            {hasReachedFreeCoachLimit ? (
              <AppText style={styles.limitNote}>
                Free AI Coach access refreshes daily. Premium keeps Coach available whenever you need it.
              </AppText>
            ) : null}
            {chatError ? (
              <View style={styles.inlineState}>
                <AppText style={styles.errorText}>{chatError}</AppText>
                <View style={styles.fallbackActions}>
                  <AppButton label="Open Calm Reset" variant="secondary" onPress={() => setActiveAction("reset")} />
                  <AppButton label="Save a reflection" variant="secondary" onPress={() => setActiveAction("reflect")} />
                </View>
                {lastFailedMessage && !hasReachedFreeCoachLimit ? (
                  <AppButton
                    label="Try again"
                    variant="secondary"
                    onPress={() => void handleSendCoachMessage(lastFailedMessage)}
                    disabled={sendCoachMessage.isPending}
                  />
                ) : null}
                {hasReachedFreeCoachLimit ? (
                  <AppButton label="See Premium" onPress={() => router.push("/premium?source=coach-limit")} />
                ) : null}
              </View>
            ) : null}
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
            <AppText style={styles.contextLabel}>Reflections</AppText>
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
                  Your reflection is saved. You can come back whenever it helps.
                </AppText>
              </View>
            ) : null}
            {reflectionError ? <AppText style={styles.errorText}>{reflectionError}</AppText> : null}
            </View>
          ) : null}

          {activeAction === "reset" ? (
            <View style={styles.card}>
            <AppText style={styles.contextLabel}>Calm Reset</AppText>
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
            <AppText style={styles.contextLabel}>Plan Tomorrow</AppText>
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

          <View style={styles.safetyCard}>
            <AppText style={styles.safetyText}>
              LiveWithMS can support reflection and self-awareness, but it does not replace medical or mental health care.
            </AppText>
          </View>

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
      </KeyboardAvoidingView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 120,
    gap: 14,
  },
  sectionIntro: {
    gap: 4,
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
  safetyCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e7ddd5",
    backgroundColor: "#fffaf6",
    padding: 16,
  },
  greeting: {
    fontSize: 15,
    fontWeight: "600",
    color: "#c25d10",
  },
  sectionKicker: {
    fontSize: 13,
    fontWeight: "700",
    color: "#c25d10",
    textTransform: "uppercase",
  },
  sectionBody: {
    color: "#6b7280",
    lineHeight: 21,
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
  messageList: {
    gap: 10,
  },
  messageBubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  coachBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#fff4ec",
    borderWidth: 1,
    borderColor: "#f2d8c4",
    maxWidth: "92%",
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#fffaf6",
    borderWidth: 1,
    borderColor: "#f1e1d4",
    maxWidth: "88%",
  },
  messageRole: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  coachRole: {
    color: "#c25d10",
  },
  userRole: {
    color: "#6b7280",
  },
  messageText: {
    color: "#374151",
    lineHeight: 20,
  },
  inlineState: {
    gap: 10,
  },
  supportNote: {
    color: "#8b6a4f",
    lineHeight: 20,
    fontSize: 13,
  },
  usageCard: {
    backgroundColor: "#fffaf6",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f3dfd1",
    padding: 14,
    gap: 6,
  },
  usageTitle: {
    color: "#1f2937",
    fontWeight: "700",
    fontSize: 14,
    lineHeight: 20,
  },
  usageBody: {
    color: "#6b7280",
    fontSize: 13,
    lineHeight: 19,
  },
  limitNote: {
    color: "#6b7280",
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },
  fallbackActions: {
    gap: 10,
  },
  modeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  celebrationCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#d8ead9",
    backgroundColor: "#f7fbf7",
    padding: 14,
    gap: 8,
  },
  celebrationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  celebrationTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: "#166534",
  },
  dismissChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#cfe3d4",
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  dismissChipText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#3f5f46",
  },
  modeChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#ead8ca",
    backgroundColor: "#fffaf6",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  modeChipActive: {
    borderColor: "#e8751a",
    backgroundColor: "#fff4ec",
  },
  modeChipText: {
    color: "#6b7280",
    fontSize: 13,
    fontWeight: "600",
  },
  modeChipTextActive: {
    color: "#9a4a11",
  },
  chatShell: {
    maxHeight: 320,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#f3dfd1",
    backgroundColor: "#fffaf6",
    overflow: "hidden",
  },
  chatScrollView: {
    maxHeight: 320,
  },
  chatContent: {
    padding: 12,
    paddingBottom: 18,
  },
  emptyChatCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f3dfd1",
    backgroundColor: "#fffaf6",
    padding: 14,
    gap: 6,
  },
  emptyChatTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1f2937",
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
    minHeight: 140,
    paddingTop: 28,
    paddingBottom: 24,
    paddingHorizontal: 16,
    gap: 6,
  },
  timerValue: {
    fontSize: 36,
    lineHeight: 48,
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
  safetyText: {
    color: "#4b5563",
    lineHeight: 21,
  },
});
