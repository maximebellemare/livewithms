import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppButton from "../../components/ui/AppButton";
import AppText from "../../components/ui/AppText";
import ErrorState from "../../components/ui/ErrorState";
import { useAppointments } from "../../features/appointments/hooks";
import { useAuth } from "../../features/auth/hooks";
import { useCheckInHistory, useTodaysCheckIn } from "../../features/checkins/hooks";
import { getCheckInsInLastDays, getCurrentCheckInStreak } from "../../features/checkins/consistency";
import { mergeCoachMessages, useCoachMessages, useSendCoachMessage } from "../../features/coach-messages/hooks";
import type { CoachChatMessage, CoachContext, CoachMode } from "../../features/coach-messages/types";
import { useGrowthState } from "../../features/growth/hooks";
import { useMedications } from "../../features/medications/hooks";
import { usePremium } from "../../features/premium/hooks";
import { FREE_DAILY_AI_COACH_MESSAGES } from "../../features/premium/config";
import { canAccessPremiumFeature } from "../../features/premium/entitlements";
import { incrementAiCoachUsage, loadAiCoachUsage } from "../../features/premium/usage";
import { useMyProfile } from "../../features/profile/hooks";
import { useReminderSettings } from "../../features/reminders/hooks";
import { getErrorMessage } from "../../lib/errors";

type ChatListItem =
  | {
      id: string;
      role: "assistant" | "user";
      content: string;
      kind: "message";
    }
  | {
      id: "pending-assistant";
      role: "assistant";
      content: string;
      kind: "pending";
    };

function average(values: Array<number | null | undefined>) {
  const valid = values.filter((value): value is number => typeof value === "number");
  if (valid.length === 0) {
    return null;
  }

  return Number((valid.reduce((sum, value) => sum + value, 0) / valid.length).toFixed(1));
}

function getToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildConversationTitle(text: string) {
  const trimmed = text.trim().replace(/\s+/g, " ");
  if (!trimmed) {
    return "Coach conversation";
  }

  const normalized = trimmed.endsWith(".") ? trimmed.slice(0, -1) : trimmed;
  const sentenceCased = normalized.charAt(0).toUpperCase() + normalized.slice(1);
  return sentenceCased.length > 52 ? `${sentenceCased.slice(0, 52).trimEnd()}…` : sentenceCased;
}

function normalizeMode(value: string | string[] | undefined): CoachMode {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === "reflect" || raw === "calm" || raw === "practical" || raw === "encouragement") {
    return raw;
  }
  return "practical";
}

export default function CoachChatScreen() {
  const params = useLocalSearchParams<{
    autostart?: string;
    message?: string;
    messageId?: string;
    mode?: string;
    title?: string;
  }>();
  const { user } = useAuth();
  const reminders = useReminderSettings();
  const premium = usePremium();
  const today = getToday();
  const todayEntryQuery = useTodaysCheckIn(user?.id, today);
  const recentEntriesQuery = useCheckInHistory(user?.id, 14);
  const growth = useGrowthState({
    totalCheckIns: recentEntriesQuery.data?.length ?? 0,
  });
  const profileQuery = useMyProfile(user?.id, Boolean(user?.id));
  const appointmentsQuery = useAppointments(user?.id);
  const medicationsQuery = useMedications(user?.id);
  const coachMessagesQuery = useCoachMessages(user?.id);
  const sendCoachMessage = useSendCoachMessage(user?.id);
  const [chatInput, setChatInput] = useState("");
  const [chatError, setChatError] = useState<string | null>(null);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);
  const [dailyCoachUsage, setDailyCoachUsage] = useState(0);
  const [isLoadingDailyCoachUsage, setIsLoadingDailyCoachUsage] = useState(true);
  const [localConversationMessages, setLocalConversationMessages] = useState<CoachChatMessage[]>([]);
  const listRef = useRef<FlatList<ChatListItem>>(null);
  const hasAutoStartedRef = useRef(false);
  const hasFocusedHistoryRef = useRef(false);

  const routeMessage = typeof params.message === "string" ? params.message : "";
  const routeMessageId = typeof params.messageId === "string" ? params.messageId : "";
  const routeTitle = typeof params.title === "string" ? params.title : "";
  const coachMode = normalizeMode(params.mode);
  const shouldAutostart = params.autostart === "1" && routeMessage.trim().length > 0;
  const isFocusedHistoryConversation = routeMessageId.length > 0 && !shouldAutostart;

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

  const hasUnlimitedAiCoach = canAccessPremiumFeature("unlimited_ai_coach", {
    hasPremiumAccess: premium.hasPremiumAccess,
    premiumFeatureFlags: premium.premiumFeatureFlags,
  });
  const hasReachedFreeCoachLimit =
    !hasUnlimitedAiCoach && dailyCoachUsage >= FREE_DAILY_AI_COACH_MESSAGES;
  const remainingFreeMessages = Math.max(0, FREE_DAILY_AI_COACH_MESSAGES - dailyCoachUsage);

  const todayEntry = todayEntryQuery.data ?? null;
  const recentEntries = useMemo(() => recentEntriesQuery.data ?? [], [recentEntriesQuery.data]);
  const latestEntry = recentEntries[0] ?? null;
  const recentOverviewEntries = useMemo(
    () => recentEntries.map((entry) => ({ date: entry.date, hasReflection: Boolean(entry.notes?.trim()) })),
    [recentEntries],
  );
  const recentAverages = useMemo(
    () => ({
      fatigue: average(recentEntries.slice(0, 7).map((entry) => entry.fatigue)),
      mood: average(recentEntries.slice(0, 7).map((entry) => entry.mood)),
      stress: average(recentEntries.slice(0, 7).map((entry) => entry.stress)),
      sleep: average(recentEntries.slice(0, 7).map((entry) => entry.sleep_hours)),
      brainFog: average(recentEntries.slice(0, 7).map((entry) => entry.brain_fog)),
    }),
    [recentEntries],
  );
  const currentStreak = useMemo(() => getCurrentCheckInStreak(recentOverviewEntries, today), [recentOverviewEntries, today]);
  const weeklyCheckIns = useMemo(() => getCheckInsInLastDays(recentOverviewEntries, today, 7), [recentOverviewEntries, today]);
  const recentReflections = useMemo(
    () =>
      recentEntries
        .map((entry) => entry.notes?.trim() ?? "")
        .filter((note) => note.length > 0)
        .slice(0, 2),
    [recentEntries],
  );
  const nextAppointment = useMemo(
    () =>
      (appointmentsQuery.data ?? [])
        .filter((appointment) => appointment.appointment_date >= today)
        .sort((a, b) => a.appointment_date.localeCompare(b.appointment_date))[0] ?? null,
    [appointmentsQuery.data, today],
  );
  const activeMedicationNames = useMemo(
    () =>
      (medicationsQuery.data ?? [])
        .filter((medication) => medication.active)
        .map((medication) => medication.name)
        .filter((name) => typeof name === "string" && name.trim().length > 0)
        .slice(0, 3),
    [medicationsQuery.data],
  );

  const coachContext = useMemo<CoachContext>(
    () => ({
      fatigue: todayEntry?.fatigue ?? null,
      mood: todayEntry?.mood ?? null,
      stress: todayEntry?.stress ?? null,
      sleep_hours: todayEntry?.sleep_hours ?? null,
      brain_fog: todayEntry?.brain_fog ?? null,
      recent_reflection: todayEntry?.notes ?? latestEntry?.notes ?? null,
      fatigue_average_7d: recentAverages.fatigue,
      mood_average_7d: recentAverages.mood,
      stress_average_7d: recentAverages.stress,
      sleep_average_7d: recentAverages.sleep,
      current_streak: currentStreak,
      weekly_checkins: weeklyCheckIns,
      reminder_enabled: reminders.enabled,
      recent_reflections: recentReflections,
      onboarding_goals: profileQuery.data?.goals ?? [],
      onboarding_symptoms: profileQuery.data?.symptoms ?? [],
      care_context: [
        ...(nextAppointment?.title ? [`Upcoming appointment: ${nextAppointment.title}`] : []),
        ...activeMedicationNames.map((name) => `Medication in care plan: ${name}`),
      ],
    }),
    [
      activeMedicationNames,
      currentStreak,
      latestEntry?.notes,
      nextAppointment?.title,
      profileQuery.data?.goals,
      profileQuery.data?.symptoms,
      recentAverages.fatigue,
      recentAverages.mood,
      recentAverages.sleep,
      recentAverages.stress,
      recentReflections,
      reminders.enabled,
      todayEntry?.brain_fog,
      todayEntry?.fatigue,
      todayEntry?.mood,
      todayEntry?.notes,
      todayEntry?.sleep_hours,
      todayEntry?.stress,
      weeklyCheckIns,
    ],
  );

  const persistedMessages = useMemo(() => coachMessagesQuery.data ?? [], [coachMessagesQuery.data]);
  const displayedMessages = useMemo(
    () => (isFocusedHistoryConversation ? persistedMessages : localConversationMessages),
    [isFocusedHistoryConversation, localConversationMessages, persistedMessages],
  );
  const chatItems = useMemo<ChatListItem[]>(
    () => [
      ...displayedMessages.map((message) => ({
        id: message.id,
        role: message.role,
        content: message.content,
        kind: "message" as const,
      })),
      ...(sendCoachMessage.isPending
        ? [
            {
              id: "pending-assistant" as const,
              role: "assistant" as const,
              content: "",
              kind: "pending" as const,
            },
          ]
        : []),
    ],
    [displayedMessages, sendCoachMessage.isPending],
  );

  const conversationTitle = useMemo(() => {
    if (routeTitle.trim()) {
      return routeTitle.trim();
    }
    if (routeMessage.trim()) {
      return buildConversationTitle(routeMessage);
    }
    if (isFocusedHistoryConversation) {
      const targetIndex = persistedMessages.findIndex((message) => message.id === routeMessageId);
      const targetMessage = targetIndex >= 0 ? persistedMessages[targetIndex] : null;
      if (targetMessage?.role === "user") {
        return buildConversationTitle(targetMessage.content);
      }
      const previousUser = targetIndex >= 0
        ? [...persistedMessages.slice(0, targetIndex)].reverse().find((message) => message.role === "user")
        : null;
      if (previousUser) {
        return buildConversationTitle(previousUser.content);
      }
    }
    return "Coach conversation";
  }, [isFocusedHistoryConversation, persistedMessages, routeMessage, routeMessageId, routeTitle]);

  const scrollToLatest = useCallback(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
  }, []);

  const handleSend = useCallback(async (messageOverride?: string) => {
    const nextMessage = (messageOverride ?? chatInput).trim();

    if (!nextMessage || !user?.id || sendCoachMessage.isPending) {
      return;
    }

    if (hasReachedFreeCoachLimit) {
      setChatError("You’ve used today’s included AI Coach messages. Premium keeps Coach available for deeper reflection.");
      setLastFailedMessage(nextMessage);
      return;
    }

    setChatError(null);
    setLastFailedMessage(null);

    const optimisticMessage: CoachChatMessage = {
      id: `local-user-${Date.now()}`,
      user_id: user.id,
      role: "user",
      content: nextMessage,
      created_at: new Date().toISOString(),
    };

    if (!isFocusedHistoryConversation) {
      setLocalConversationMessages((existing) => mergeCoachMessages(existing, [optimisticMessage]));
    }

    try {
      const result = await sendCoachMessage.mutateAsync({
        message: nextMessage,
        context: coachContext,
        mode: coachMode,
      });

      await growth.recordEvent("ai_coach_message_sent", {
        source: shouldAutostart ? "autostart" : "coach_chat",
        mode: coachMode,
      });
      await growth.recordEvent("ai_coach_response_received", {
        source: shouldAutostart ? "autostart" : "coach_chat",
        mode: coachMode,
      });
      await growth.maybePromptForReview({
        trigger: "coach_conversation_completed",
      });

      if (!hasUnlimitedAiCoach) {
        const nextUsage = await incrementAiCoachUsage();
        setDailyCoachUsage(nextUsage.count);
      }

      if (!isFocusedHistoryConversation) {
        setLocalConversationMessages((existing) =>
          mergeCoachMessages(
            (existing ?? []).filter((message) => message.id !== optimisticMessage.id),
            [result.userMessage, result.assistantMessage],
          ),
        );
      }

      setChatInput("");
      scrollToLatest();
    } catch (error) {
      if (!isFocusedHistoryConversation) {
        setLocalConversationMessages((existing) =>
          (existing ?? []).filter((message) => message.id !== optimisticMessage.id),
        );
      }
      await growth.recordEvent("ai_coach_response_failed", {
        source: shouldAutostart ? "autostart" : "coach_chat",
        mode: coachMode,
      });
      setChatError("Coach had trouble responding. Try again.");
      setLastFailedMessage(nextMessage);
      console.error("[coach-chat] send failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }, [
    chatInput,
    coachContext,
    coachMode,
    growth,
    hasReachedFreeCoachLimit,
    hasUnlimitedAiCoach,
    isFocusedHistoryConversation,
    scrollToLatest,
    sendCoachMessage,
    shouldAutostart,
    user?.id,
  ]);

  useEffect(() => {
    if (!shouldAutostart || hasAutoStartedRef.current || !user?.id) {
      return;
    }

    hasAutoStartedRef.current = true;
    setChatInput(routeMessage);
    void handleSend(routeMessage);
  }, [handleSend, routeMessage, shouldAutostart, user?.id]);

  useEffect(() => {
    if (!shouldAutostart && routeMessage.trim().length > 0) {
      setChatInput((current) => current || routeMessage);
    }
  }, [routeMessage, shouldAutostart]);

  useEffect(() => {
    if (!isFocusedHistoryConversation || hasFocusedHistoryRef.current || persistedMessages.length === 0) {
      return;
    }

    const targetIndex = persistedMessages.findIndex((message) => message.id === routeMessageId);
    if (targetIndex < 0) {
      return;
    }

    hasFocusedHistoryRef.current = true;
    requestAnimationFrame(() => {
      listRef.current?.scrollToIndex({
        index: targetIndex,
        animated: true,
        viewPosition: 0.45,
      });
    });
  }, [isFocusedHistoryConversation, persistedMessages, routeMessageId]);

  useEffect(() => {
    if (chatItems.length === 0) {
      return;
    }

    if (!isFocusedHistoryConversation || sendCoachMessage.isPending) {
      scrollToLatest();
    }
  }, [chatItems.length, isFocusedHistoryConversation, scrollToLatest, sendCoachMessage.isPending]);

  if (!user?.id) {
    return <ErrorState message="Coach is available once you’re signed in." />;
  }

  if (todayEntryQuery.isError || recentEntriesQuery.isError || coachMessagesQuery.isError) {
    return (
      <ErrorState
        message={getErrorMessage(todayEntryQuery.error ?? recentEntriesQuery.error ?? coachMessagesQuery.error)}
        onRetry={() => {
          void todayEntryQuery.refetch();
          void recentEntriesQuery.refetch();
          void coachMessagesQuery.refetch();
        }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.keyboardRoot}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
          >
            <Ionicons name="arrow-back" size={20} color="#9a4a11" />
          </Pressable>
          <View style={styles.headerText}>
            <AppText style={styles.headerLabel}>Coach</AppText>
            <AppText style={styles.headerTitle}>{conversationTitle}</AppText>
          </View>
        </View>

        {!premium.hasPremiumAccess && !hasReachedFreeCoachLimit ? (
          <View style={styles.usageCard}>
            <AppText style={styles.usageTitle}>
              {isLoadingDailyCoachUsage
                ? "Checking your AI Coach access..."
                : `${remainingFreeMessages} of ${FREE_DAILY_AI_COACH_MESSAGES} included messages left today.`}
            </AppText>
          </View>
        ) : null}

        <FlatList
          ref={listRef}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          data={chatItems}
          keyExtractor={(item) => item.id}
          onContentSizeChange={() => {
            if (!isFocusedHistoryConversation || sendCoachMessage.isPending) {
              scrollToLatest();
            }
          }}
          onScrollToIndexFailed={scrollToLatest}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            item.kind === "pending" ? (
              <View style={[styles.messageBubble, styles.coachBubble, styles.pendingBubble]}>
                <AppText style={[styles.roleText, styles.coachRoleText]}>Coach</AppText>
                <View style={styles.pendingDots}>
                  <View style={styles.pendingDot} />
                  <View style={styles.pendingDot} />
                  <View style={styles.pendingDot} />
                </View>
                <AppText style={[styles.messageText, styles.coachMessageText]}>Coach is thinking…</AppText>
              </View>
            ) : (
              <View
                style={[
                  styles.messageBubble,
                  item.role === "assistant" ? styles.coachBubble : styles.userBubble,
                ]}
              >
                <AppText style={[styles.roleText, item.role === "assistant" ? styles.coachRoleText : styles.userRoleText]}>
                  {item.role === "assistant" ? "Coach" : "You"}
                </AppText>
                <AppText style={[styles.messageText, item.role === "assistant" ? styles.coachMessageText : styles.userMessageText]}>
                  {item.content}
                </AppText>
              </View>
            )
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <AppText style={styles.emptyTitle}>Start a new conversation</AppText>
              <AppText style={styles.emptyBody}>
                Talk through fatigue, brain fog, stress, symptoms, planning, or appointments.
              </AppText>
            </View>
          }
        />

        {chatError ? (
          <View style={styles.errorCard}>
            <AppText style={styles.errorText}>{chatError}</AppText>
            {lastFailedMessage ? (
              <AppButton
                label="Try again"
                variant="secondary"
                onPress={() => void handleSend(lastFailedMessage)}
                disabled={sendCoachMessage.isPending}
              />
            ) : null}
          </View>
        ) : null}

        <View style={styles.inputBar}>
          <TextInput
            multiline
            value={chatInput}
            onChangeText={(next) => {
              setChatInput(next);
              if (chatError) {
                setChatError(null);
              }
            }}
            placeholder="Write a few words about fatigue, brain fog, symptoms, stress, or planning."
            placeholderTextColor="#9ca3af"
            style={styles.input}
            textAlignVertical="top"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send message"
            disabled={sendCoachMessage.isPending || chatInput.trim().length === 0}
            onPress={() => void handleSend()}
            style={({ pressed }) => [
              styles.sendButton,
              (pressed || sendCoachMessage.isPending) && styles.sendButtonPressed,
              (sendCoachMessage.isPending || chatInput.trim().length === 0) && styles.sendButtonDisabled,
            ]}
          >
            <Ionicons name="arrow-up" size={18} color="#fff8f1" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fcf8f4",
  },
  keyboardRoot: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#f0dfd2",
    backgroundColor: "#fffaf6",
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonPressed: {
    opacity: 0.8,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  headerLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#c25d10",
    textTransform: "uppercase",
  },
  headerTitle: {
    fontSize: 21,
    lineHeight: 28,
    fontWeight: "700",
    color: "#1f2937",
  },
  usageCard: {
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#f3dfd1",
    backgroundColor: "#fffaf6",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  usageTitle: {
    color: "#6b7280",
    fontSize: 13,
    lineHeight: 18,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
    gap: 12,
  },
  emptyState: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#f3dfd1",
    backgroundColor: "#fffaf6",
    padding: 18,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
  },
  emptyBody: {
    color: "#6b7280",
    lineHeight: 22,
  },
  messageBubble: {
    borderRadius: 18,
    paddingHorizontal: 15,
    paddingVertical: 13,
    gap: 6,
    maxWidth: "90%",
  },
  coachBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#f4eee7",
    borderWidth: 1,
    borderColor: "#dccfc2",
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#c96b1d",
    borderWidth: 1,
    borderColor: "#ad5712",
  },
  pendingBubble: {
    borderStyle: "dashed",
  },
  roleText: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  coachRoleText: {
    color: "#7b4d2a",
  },
  userRoleText: {
    color: "#fef2e8",
  },
  messageText: {
    lineHeight: 22,
  },
  coachMessageText: {
    color: "#2f261f",
  },
  userMessageText: {
    color: "#fff8f1",
  },
  pendingDots: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  pendingDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: "#e3b995",
  },
  errorCard: {
    gap: 10,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  errorText: {
    color: "#b42318",
    lineHeight: 21,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 18,
    borderTopWidth: 1,
    borderTopColor: "#f1e1d4",
    backgroundColor: "#fcf8f4",
  },
  input: {
    flex: 1,
    minHeight: 52,
    maxHeight: 132,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#ead8ca",
    backgroundColor: "#fffaf6",
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#1f2937",
    lineHeight: 21,
  },
  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 999,
    backgroundColor: "#c96b1d",
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonPressed: {
    opacity: 0.86,
  },
  sendButtonDisabled: {
    opacity: 0.55,
  },
});
