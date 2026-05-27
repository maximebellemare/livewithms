import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import {
  KeyboardAvoidingView,
  LayoutChangeEvent,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AppButton from "../../../../components/ui/AppButton";
import AppScreen from "../../../../components/ui/AppScreen";
import AppText from "../../../../components/ui/AppText";
import ErrorState from "../../../../components/ui/ErrorState";
import LoadingState from "../../../../components/ui/LoadingState";
import {
  buildReflectionStarter,
  buildReflectionPrompts,
  getRecurringReflectionThemes,
  type CoachActionKey,
} from "../../../../features/coach/logic";
import {
  detectCoachLowEnergyMode,
  detectCoachOverwhelm,
  deriveCoachFallbackState,
} from "../../../../features/coach/refinement";
import { useCoachMessages, useSendCoachMessage } from "../../../../features/coach-messages/hooks";
import type { CoachMode } from "../../../../features/coach-messages/types";
import { useCoachPlan, useSaveCoachPlan } from "../../../../features/coach-plans/hooks";
import type { CoachPlanInput } from "../../../../features/coach-plans/types";
import { useGrowthState } from "../../../../features/growth/hooks";
import { usePersonalizationMemory } from "../../../../features/personalization-memory/hooks";
import { usePremium } from "../../../../features/premium/hooks";
import { canAccessPremiumFeature } from "../../../../features/premium/entitlements";
import { FREE_DAILY_AI_COACH_MESSAGES } from "../../../../features/premium/config";
import { deriveLowEnergyAssist } from "../../../../features/premium/low-energy-assist";
import { incrementAiCoachUsage, loadAiCoachUsage } from "../../../../features/premium/usage";
import { getProgramToolById } from "../../../../features/programs/catalog";
import { useProgramProgress } from "../../../../features/programs/hooks";
import type { ProgramTool } from "../../../../features/programs/types";
import { useAuth } from "../../../../features/auth/hooks";
import { useCheckInHistory, useSaveDailyCheckIn, useTodaysCheckIn } from "../../../../features/checkins/hooks";
import type { DailyCheckIn, DailyCheckInInput } from "../../../../features/checkins/types";
import { getCheckInsInLastDays, getCurrentCheckInStreak } from "../../../../features/checkins/consistency";
import { useAppointments } from "../../../../features/appointments/hooks";
import { useMedications } from "../../../../features/medications/hooks";
import { useMyProfile } from "../../../../features/profile/hooks";
import { useReminderSettings } from "../../../../features/reminders/hooks";
import { getErrorMessage } from "../../../../lib/errors";
import { buildAdaptiveProfile } from "../../../../features/adaptive/logic";
import { categorizeError } from "../../../../lib/errors";
import { trackRetrySucceeded, trackRetryTriggered } from "../../../../lib/events";
import { useSlowScreenDiagnostics } from "../../../../lib/observability";
import { buildLifecycleProfile } from "../../../../features/lifecycle/logic";
import {
  clearPendingReflection,
  loadPendingReflection,
  preservePendingReflection,
} from "../../../../lib/operational-calm/continuity-preservation/preservePendingReflection";
import { generateCalmWaitingCopy } from "../../../../lib/operational-calm/latency-softening/generateCalmWaitingCopy";
import { useLowEnergyMode } from "../../../../features/low-energy-mode/hooks";
import { startCoachVoiceInput, stopCoachVoiceInput } from "../../../../features/coach/voice-input";
import { deriveCoachOperationalMemory } from "../../../../features/coach/operational-memory";
import { loadRecentTodayPlans, type TodayPlan } from "../../../../features/today-plan/storage";

const COACH_RETRY_COOLDOWN_MS = 8000;
const RELATED_SUPPORT_COPY: Record<string, { title?: string; description: string }> = {
  "one-priority-planner": {
    description: "Simplify today’s focus and reduce overload.",
  },
  "reduce-overwhelm": {
    description: "Sort competing pressure into one focus and one next step.",
  },
  "brain-fog-basics": {
    description: "Narrow mental load into one clear next action.",
  },
  "difficult-day-pacing-checklist": {
    title: "Fatigue pacing planner",
    description: "Protect energy and make today’s demands smaller.",
  },
  "low-energy-checklist": {
    description: "Make a lower-energy day easier to move through.",
  },
  "breathing-reset": {
    description: "Use a short reset when stress feels high.",
  },
  "hard-moment-reflection": {
    description: "Capture what matters without turning it into a long reflection.",
  },
};

function getRelatedSupportRecommendation(input: {
  stress: number | null;
  fatigue: number | null;
  brainFog: number | null;
  adaptiveStressTrend: "elevated" | "steady" | "lighter" | "unknown";
  adaptiveFatigueTrend: "high" | "steady" | "lighter" | "unknown";
  adaptiveBrainFogTrend: "high" | "steady" | "lighter" | "unknown";
  fallbackTool: ProgramTool | null;
}) {
  const recommendedToolId =
    (input.stress ?? 0) >= 4 || input.adaptiveStressTrend === "elevated"
      ? "reduce-overwhelm"
      : (input.fatigue ?? 0) >= 4 || input.adaptiveFatigueTrend === "high"
        ? "difficult-day-pacing-checklist"
        : (input.brainFog ?? 0) >= 4 || input.adaptiveBrainFogTrend === "high"
          ? "brain-fog-basics"
          : input.fallbackTool?.id ?? "one-priority-planner";
  const tool = getProgramToolById(recommendedToolId) ?? input.fallbackTool ?? getProgramToolById("one-priority-planner");

  if (!tool) {
    return null;
  }

  const copy = RELATED_SUPPORT_COPY[tool.id];

  return {
    tool,
    title: copy?.title ?? tool.title,
    description: copy?.description ?? tool.description,
  };
}

const COACH_QUICK_STARTS: Array<{
  id: string;
  title: string;
  body: string;
  prompt: string;
  mode: CoachMode;
}> = [
  {
    id: "reduce-overwhelm",
    title: "Reduce overwhelm",
    body: "Narrow the next decision and reduce mental load.",
    prompt: "Help me reduce overwhelm and simplify today.",
    mode: "practical",
  },
  {
    id: "brain-fog-support",
    title: "Brain fog support",
    body: "Turn scattered thoughts into a shorter next step.",
    prompt: "Help me work around brain fog right now.",
    mode: "practical",
  },
  {
    id: "organize-thoughts",
    title: "Organize thoughts",
    body: "Separate what matters now from what can wait.",
    prompt: "Help me organize my thoughts.",
    mode: "practical",
  },
  {
    id: "stress-support",
    title: "Stress support",
    body: "Identify what is adding pressure and what can be simplified.",
    prompt: "Help me think through what’s stressing me.",
    mode: "practical",
  },
  {
    id: "prepare-appointment",
    title: "Prepare for an appointment",
    body: "List symptoms, questions, and topics to bring up.",
    prompt: "Help me prepare for an appointment.",
    mode: "practical",
  },
];

const COACH_PROMPT_CHIPS = [
  "Help me sort out what’s stressing me",
  "Help me reduce overwhelm and simplify today",
  "Help me work around brain fog",
  "Help me organize my thoughts",
  "Help me prepare for an appointment",
] as const;

type CoachToolKey = CoachActionKey | "plan-today";
type GuidedPlanToolKey = "plan-today" | "plan";

function getDateString(offsetDays = 0) {
  const now = new Date();
  now.setDate(now.getDate() + offsetDays);

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getTimeOfDay() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "morning" as const;
  }

  if (hour < 18) {
    return "afternoon" as const;
  }

  return "evening" as const;
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

function average(values: Array<number | null>) {
  const valid = values.filter((value): value is number => typeof value === "number");
  if (!valid.length) {
    return null;
  }

  return Math.round((valid.reduce((sum, value) => sum + value, 0) / valid.length) * 10) / 10;
}

function sortUpcomingAppointments<T extends { appointment_date: string; appointment_time: string | null }>(items: T[]) {
  return items.slice().sort((left, right) => {
    const dateCompare = left.appointment_date.localeCompare(right.appointment_date);
    if (dateCompare !== 0) {
      return dateCompare;
    }

    return (left.appointment_time ?? "").localeCompare(right.appointment_time ?? "");
  });
}

export default function CoachScreen() {
  const { user } = useAuth();
  const today = getDateString();
  const tomorrow = getDateString(1);
  const profileQuery = useMyProfile(user?.id);
  const todayEntryQuery = useTodaysCheckIn(user?.id, today);
  const recentEntriesQuery = useCheckInHistory(user?.id, 14);
  const appointmentsQuery = useAppointments(user?.id);
  const medicationsQuery = useMedications(user?.id);
  const tomorrowPlanQuery = useCoachPlan(user?.id, tomorrow);
  const coachMessagesQuery = useCoachMessages(user?.id);
  const saveCheckIn = useSaveDailyCheckIn();
  const saveCoachPlan = useSaveCoachPlan();
  const sendCoachMessage = useSendCoachMessage(user?.id);
  const growth = useGrowthState();
  const reminders = useReminderSettings();
  const premium = usePremium();
  const programProgress = useProgramProgress();
  const lowEnergyMode = useLowEnergyMode();

  const [activeAction, setActiveAction] = useState<CoachToolKey | null>(null);
  const [reflection, setReflection] = useState("");
  const [coachMode, setCoachMode] = useState<CoachMode>("practical");
  const [chatInput, setChatInput] = useState("");
  const [voiceState, setVoiceState] = useState<"idle" | "listening" | "processing" | "error">("idle");
  const [voiceMessage, setVoiceMessage] = useState<string | null>(null);
  const [activeQuickActionId, setActiveQuickActionId] = useState<string | null>(null);
  const [selectedQuickActionId, setSelectedQuickActionId] = useState<string | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);
  const [reflectionState, setReflectionState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [planState, setPlanState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [resetRunning, setResetRunning] = useState(false);
  const [resetSecondsLeft, setResetSecondsLeft] = useState(60);
  const [resetCompleted, setResetCompleted] = useState(false);
  const [reflectionError, setReflectionError] = useState<string | null>(null);
  const [planError, setPlanError] = useState<string | null>(null);
  const [todayPriority, setTodayPriority] = useState("");
  const [todayEnergy, setTodayEnergy] = useState("");
  const [todaySimplify, setTodaySimplify] = useState("");
  const [todayPlanState, setTodayPlanState] = useState<"idle" | "complete">("idle");
  const [priority, setPriority] = useState("");
  const [avoid, setAvoid] = useState("");
  const [supportAction, setSupportAction] = useState("");
  const [recentTodayPlans, setRecentTodayPlans] = useState<TodayPlan[]>([]);
  const [dailyCoachUsage, setDailyCoachUsage] = useState(0);
  const [isLoadingDailyCoachUsage, setIsLoadingDailyCoachUsage] = useState(true);
  const [retryCooldownUntil, setRetryCooldownUntil] = useState<number | null>(null);
  const [retryCooldownSeconds, setRetryCooldownSeconds] = useState(0);
  const [pendingToolScroll, setPendingToolScroll] = useState<GuidedPlanToolKey | null>(null);
  const screenScrollRef = useRef<ScrollView>(null);
  const chatScrollRef = useRef<ScrollView>(null);
  const messageLayoutYRef = useRef<Record<string, number>>({});
  const pendingCoachMessageYRef = useRef<number | null>(null);
  const toolLayoutYRef = useRef<Partial<Record<GuidedPlanToolKey, number>>>({});
  const draftInputRef = useRef("");
  const voiceBaseInputRef = useRef("");
  const voiceTranscriptRef = useRef("");
  const coachRequestInFlightRef = useRef(false);
  const sendPendingRef = useRef(false);
  const hasTrackedAbandonRef = useRef(false);
  const lastTrackedAbandonedDraftRef = useRef<string | null>(null);
  const recordGrowthEventRef = useRef(growth.recordEvent);
  const timeOfDay = getTimeOfDay();

  const todayEntry = todayEntryQuery.data ?? null;
  const latestEntry = recentEntriesQuery.data?.[0] ?? null;
  const coachEntry = todayEntry ?? latestEntry ?? null;
  const coachMessages = useMemo(() => coachMessagesQuery.data ?? [], [coachMessagesQuery.data]);
  const latestAssistantIndex = useMemo(
    () => {
      for (let index = coachMessages.length - 1; index >= 0; index -= 1) {
        if (coachMessages[index]?.role === "assistant") {
          return index;
        }
      }

      return -1;
    },
    [coachMessages],
  );
  const latestAssistantMessageId = latestAssistantIndex >= 0 ? coachMessages[latestAssistantIndex]?.id ?? null : null;
  const recentEntries = useMemo(() => recentEntriesQuery.data ?? [], [recentEntriesQuery.data]);
  const activeMedications = useMemo(
    () => (medicationsQuery.data ?? []).filter((medication) => medication.active),
    [medicationsQuery.data],
  );
  const nextAppointment = useMemo(
    () =>
      sortUpcomingAppointments(
        (appointmentsQuery.data ?? []).filter((appointment) => appointment.appointment_date >= today),
      )[0] ?? null,
    [appointmentsQuery.data, today],
  );
  const isInitialLoading =
    (todayEntryQuery.isLoading && !todayEntryQuery.data) ||
    (recentEntriesQuery.isLoading && !recentEntriesQuery.data) ||
    (tomorrowPlanQuery.isLoading && !tomorrowPlanQuery.data);
  const isChatInitialLoading = coachMessagesQuery.isLoading && !coachMessagesQuery.data;
  useSlowScreenDiagnostics("coach", isInitialLoading || isChatInitialLoading);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const localDraft = user?.id ? await loadPendingReflection(user.id, "coach-reflection") : null;
      if (cancelled) {
        return;
      }

      setReflection(localDraft?.text ?? todayEntry?.notes ?? "");
      setReflectionState("idle");
      setReflectionError(null);
    })();

    return () => {
      cancelled = true;
    };
  }, [todayEntry?.updated_at, todayEntry?.notes, user?.id]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const localDraft = user?.id ? await loadPendingReflection(user.id, "coach-chat") : null;
      if (!cancelled && localDraft?.text) {
        setChatInput((current) => current || localDraft.text);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    setPriority(tomorrowPlanQuery.data?.priority ?? "");
    setAvoid(tomorrowPlanQuery.data?.avoid ?? "");
    setSupportAction(tomorrowPlanQuery.data?.support_action ?? "");
    setPlanState("idle");
    setPlanError(null);
  }, [
    tomorrowPlanQuery.data?.avoid,
    tomorrowPlanQuery.data?.priority,
    tomorrowPlanQuery.data?.support_action,
    tomorrowPlanQuery.data?.updated_at,
  ]);

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

  const scrollChatToMessageY = useCallback((messageY: number | null | undefined, delay = 80) => {
    if (typeof messageY !== "number") {
      if (__DEV__) {
        console.log("[coach-scroll]", {
          latestAssistantIndex,
          latestAssistantId: latestAssistantMessageId,
          targetY: null,
          usingRef: "chatScrollView",
        });
      }

      return undefined;
    }

    const timeout = setTimeout(() => {
      const targetY = Math.max(0, messageY - 16);

      if (__DEV__) {
        console.log("[coach-scroll]", {
          latestAssistantIndex,
          latestAssistantId: latestAssistantMessageId,
          targetY,
          usingRef: "chatScrollView",
        });
      }

      chatScrollRef.current?.scrollTo({
        y: targetY,
        animated: true,
      });
    }, delay);

    return () => clearTimeout(timeout);
  }, [latestAssistantIndex, latestAssistantMessageId]);

  const scrollToLatestAssistantMessage = useCallback((delay = 80) => {
    if (!latestAssistantMessageId) {
      return undefined;
    }

    return scrollChatToMessageY(messageLayoutYRef.current[latestAssistantMessageId], delay);
  }, [latestAssistantMessageId, scrollChatToMessageY]);

  const scrollToPendingCoachMessage = useCallback((delay = 80) => {
    return scrollChatToMessageY(pendingCoachMessageYRef.current, delay);
  }, [scrollChatToMessageY]);

  const handleMessageLayout = useCallback((messageId: string, y: number) => {
    messageLayoutYRef.current[messageId] = y;
  }, []);

  const handlePendingMessageLayout = useCallback((y: number) => {
    pendingCoachMessageYRef.current = y;
    if (sendCoachMessage.isPending) {
      scrollChatToMessageY(y, 40);
    }
  }, [scrollChatToMessageY, sendCoachMessage.isPending]);

  useEffect(() => {
    if (!coachMessages.length && !sendCoachMessage.isPending) {
      return;
    }

    if (sendCoachMessage.isPending) {
      return scrollToPendingCoachMessage(80);
    }

    return scrollToLatestAssistantMessage(100);
  }, [
    coachMessages.length,
    latestAssistantMessageId,
    scrollToLatestAssistantMessage,
    scrollToPendingCoachMessage,
    sendCoachMessage.isPending,
  ]);

  useEffect(() => {
    if (!retryCooldownUntil) {
      setRetryCooldownSeconds(0);
      return;
    }

    const syncCooldown = () => {
      const remaining = Math.max(0, Math.ceil((retryCooldownUntil - Date.now()) / 1000));
      setRetryCooldownSeconds(remaining);
      if (remaining === 0) {
        setRetryCooldownUntil(null);
      }
    };

    syncCooldown();
    const interval = setInterval(syncCooldown, 1000);

    return () => clearInterval(interval);
  }, [retryCooldownUntil]);

  const hasUnlimitedAiCoach = canAccessPremiumFeature("unlimited_ai_coach", {
    subscriptionsEnabled: premium.subscriptionsEnabled,
    hasPremiumAccess: premium.hasPremiumAccess,
    premiumFeatureFlags: premium.premiumFeatureFlags,
  });
  const hasLowEnergyAssist = canAccessPremiumFeature("low_energy_assist", {
    subscriptionsEnabled: premium.subscriptionsEnabled,
    hasPremiumAccess: premium.hasPremiumAccess,
    premiumFeatureFlags: premium.premiumFeatureFlags,
  });
  const remainingFreeMessages = Math.max(0, FREE_DAILY_AI_COACH_MESSAGES - dailyCoachUsage);
  const hasReachedFreeCoachLimit =
    !hasUnlimitedAiCoach && dailyCoachUsage >= FREE_DAILY_AI_COACH_MESSAGES;
  const recentOverviewEntries = useMemo(
    () => recentEntries.map((entry) => ({ date: entry.date, hasReflection: Boolean(entry.notes?.trim()) })),
    [recentEntries],
  );
  const currentStreak = useMemo(() => getCurrentCheckInStreak(recentOverviewEntries, today), [recentOverviewEntries, today]);
  const weeklyCheckIns = useMemo(() => getCheckInsInLastDays(recentOverviewEntries, today, 7), [recentOverviewEntries, today]);
  const baseAdaptiveProfile = useMemo(
    () => buildAdaptiveProfile(recentEntries, weeklyCheckIns),
    [recentEntries, weeklyCheckIns],
  );
  const personalizationMemory = usePersonalizationMemory({
    onboardingGoals: profileQuery.data?.goals ?? [],
    onboardingSymptoms: profileQuery.data?.symptoms ?? [],
    recentEntries,
    adaptiveProfile: baseAdaptiveProfile,
    reminderSettings: {
      enabled: reminders.enabled,
      hour: reminders.hour,
      minute: reminders.minute,
      permissionStatus: reminders.permissionStatus,
      notificationId: reminders.notificationId,
      medicationRemindersEnabled: reminders.medicationRemindersEnabled,
      appointmentRemindersEnabled: reminders.appointmentRemindersEnabled,
      appointmentReminderOneDay: reminders.appointmentReminderOneDay,
      appointmentReminderOneHour: reminders.appointmentReminderOneHour,
      quietReminders: reminders.quietReminders,
    },
    growthState: growth.state,
    programProgress: programProgress.progress,
  });
  const adaptiveProfile = useMemo(
    () => buildAdaptiveProfile(recentEntries, weeklyCheckIns, personalizationMemory.memory),
    [personalizationMemory.memory, recentEntries, weeklyCheckIns],
  );
  useEffect(() => {
    if (!user?.id) {
      setRecentTodayPlans([]);
      return;
    }

    let cancelled = false;

    void (async () => {
      const plans = await loadRecentTodayPlans(user.id, today, 14);

      if (!cancelled) {
        setRecentTodayPlans(plans);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [today, user?.id]);
  const operationalMemory = useMemo(
    () =>
      deriveCoachOperationalMemory({
        recentEntries,
        latestEntry: coachEntry,
        adaptiveProfile,
        programProgress: programProgress.progress,
        activeMedications,
        nextAppointment,
        recentRecoveryStrategies: recentTodayPlans.map((plan) => plan.whatHelped),
      }),
    [activeMedications, adaptiveProfile, coachEntry, nextAppointment, programProgress.progress, recentEntries, recentTodayPlans],
  );
  const lifecycleProfile = useMemo(
    () =>
      buildLifecycleProfile({
        firstOpenedAt: growth.state?.firstOpenedAt ?? null,
        activeDates: growth.state?.activeDates ?? [],
        totalCheckIns: recentEntries.length,
        weeklyCheckIns,
      }),
    [growth.state?.activeDates, growth.state?.firstOpenedAt, recentEntries.length, weeklyCheckIns],
  );
  const reflectionPrompts = useMemo(
    () =>
      buildReflectionPrompts(coachEntry, adaptiveProfile, {
        reflectionDepthPreference: personalizationMemory.memory.reflectionDepthPreference,
        promptStylePreference: personalizationMemory.memory.promptStylePreference,
        reflectionTonePreference: personalizationMemory.memory.reflectionTonePreference,
        complexityTolerance: personalizationMemory.memory.complexityTolerance,
      }),
    [
      adaptiveProfile,
      coachEntry,
      personalizationMemory.memory.complexityTolerance,
      personalizationMemory.memory.promptStylePreference,
      personalizationMemory.memory.reflectionDepthPreference,
      personalizationMemory.memory.reflectionTonePreference,
    ],
  );
  const recentReflections = useMemo(
    () =>
      recentEntries
        .map((entry) => entry.notes?.trim() ?? "")
        .filter((note) => note.length > 0)
        .slice(0, 2),
    [recentEntries],
  );
  const recentAverages = useMemo(
    () => ({
      fatigue: average(recentEntries.slice(0, 7).map((entry) => entry.fatigue)),
      mood: average(recentEntries.slice(0, 7).map((entry) => entry.mood)),
      stress: average(recentEntries.slice(0, 7).map((entry) => entry.stress)),
      sleep: average(recentEntries.slice(0, 7).map((entry) => entry.sleep_hours)),
    }),
    [recentEntries],
  );
  const isLowEnergyConversationMode = useMemo(
    () =>
      detectCoachLowEnergyMode({
        lowEnergyMode: lowEnergyMode.enabled,
        fatigue: coachEntry?.fatigue ?? recentAverages.fatigue,
        sleepHours: coachEntry?.sleep_hours ?? recentAverages.sleep,
        adaptiveFatigueTrend: adaptiveProfile.fatigueTrend,
      }),
    [
      adaptiveProfile.fatigueTrend,
      coachEntry?.fatigue,
      coachEntry?.sleep_hours,
      lowEnergyMode.enabled,
      recentAverages.fatigue,
      recentAverages.sleep,
    ],
  );
  const coachLowEnergyAssist = useMemo(
    () =>
      deriveLowEnergyAssist({
        hasPremiumAccess: premium.hasPremiumAccess,
        featureEnabled: premium.premiumFeatureFlags.low_energy_assist,
        lowEnergyModeEnabled: lowEnergyMode.enabled,
        recentFatigueAverage: coachEntry?.fatigue ?? recentAverages.fatigue,
        recentStressAverage: coachEntry?.stress ?? recentAverages.stress,
        recentSleepAverage: coachEntry?.sleep_hours ?? recentAverages.sleep,
        fatigueTrend: adaptiveProfile.fatigueTrend,
        stressTrend: adaptiveProfile.stressTrend,
        abandonedFlowCount: Number(Boolean(chatInput.trim())) + Number(Boolean(lastFailedMessage)),
        interactionTolerance: chatInput.trim().length > 0 || Boolean(lastFailedMessage) ? "reduced" : "steady",
      }),
    [
      adaptiveProfile.fatigueTrend,
      adaptiveProfile.stressTrend,
      chatInput,
      coachEntry?.fatigue,
      coachEntry?.sleep_hours,
      coachEntry?.stress,
      lastFailedMessage,
      lowEnergyMode.enabled,
      premium.hasPremiumAccess,
      premium.premiumFeatureFlags.low_energy_assist,
      recentAverages.fatigue,
      recentAverages.sleep,
      recentAverages.stress,
    ],
  );
  const effectiveLowEnergyConversationMode = isLowEnergyConversationMode || coachLowEnergyAssist.active;
  const isOverwhelmedConversation = useMemo(
    () =>
      detectCoachOverwhelm({
        stress: coachEntry?.stress ?? recentAverages.stress,
        brainFog: coachEntry?.brain_fog,
        message: chatInput || todayEntry?.notes || latestEntry?.notes || "",
      }),
    [
      chatInput,
      coachEntry?.brain_fog,
      coachEntry?.stress,
      latestEntry?.notes,
      recentAverages.stress,
      todayEntry?.notes,
    ],
  );
  const fallbackState = useMemo(
    () =>
      deriveCoachFallbackState({
        timeOfDay,
        lowEnergyMode: effectiveLowEnergyConversationMode,
        fatigue: coachEntry?.fatigue ?? recentAverages.fatigue,
        stress: coachEntry?.stress ?? recentAverages.stress,
        brainFog: coachEntry?.brain_fog,
        sleepHours: coachEntry?.sleep_hours ?? recentAverages.sleep,
        message: lastFailedMessage ?? chatInput,
      }),
    [
      chatInput,
      coachEntry?.brain_fog,
      coachEntry?.fatigue,
      coachEntry?.sleep_hours,
      coachEntry?.stress,
      effectiveLowEnergyConversationMode,
      lastFailedMessage,
      recentAverages.fatigue,
      recentAverages.sleep,
      recentAverages.stress,
      timeOfDay,
    ],
  );
  const chatLoadingLabel = useMemo(() => {
    const calmCopy = generateCalmWaitingCopy("steady");
    if (effectiveLowEnergyConversationMode || isOverwhelmedConversation) {
      return "Taking a moment...";
    }
    switch (coachMode) {
      case "calm":
        return "Settling gently...";
      case "practical":
        return "Keeping it simple...";
      case "encouragement":
        return "Finding a practical next step...";
      case "reflect":
      default:
        return calmCopy;
    }
  }, [coachMode, effectiveLowEnergyConversationMode, isOverwhelmedConversation]);
  const reflectionThemes = useMemo(
    () => getRecurringReflectionThemes(recentReflections),
    [recentReflections],
  );
  const visibleReflectionPrompts = useMemo(
    () =>
      reflectionPrompts.prompts.slice(
        0,
        isOverwhelmedConversation
          ? Math.min(2, coachLowEnergyAssist.cognitiveLoad.maxVisiblePrompts)
          : coachLowEnergyAssist.cognitiveLoad.maxVisiblePrompts,
      ),
    [coachLowEnergyAssist.cognitiveLoad.maxVisiblePrompts, isOverwhelmedConversation, reflectionPrompts.prompts],
  );
  const visibleQuickStarts = useMemo(
    () =>
      effectiveLowEnergyConversationMode
        ? COACH_QUICK_STARTS.slice(0, 4)
        : COACH_QUICK_STARTS,
    [effectiveLowEnergyConversationMode],
  );
  const selectedQuickStart = useMemo(
    () => visibleQuickStarts.find((item) => item.id === selectedQuickActionId) ?? null,
    [selectedQuickActionId, visibleQuickStarts],
  );
  const reflectionHistory = useMemo(
    () =>
      recentEntries
        .filter((entry) => typeof entry.notes === "string" && entry.notes.trim().length > 0)
        .slice(0, 3)
        .map((entry) => ({
          date: entry.date,
          preview: entry.notes?.trim().length > 120 ? `${entry.notes.trim().slice(0, 120).trimEnd()}…` : entry.notes?.trim() ?? "",
        })),
    [recentEntries],
  );
  const suggestedProgramTool = useMemo(
    () => getProgramToolById(adaptiveProfile.suggestedProgram),
    [adaptiveProfile.suggestedProgram],
  );
  const relatedSupportRecommendation = useMemo(
    () =>
      getRelatedSupportRecommendation({
        stress: coachEntry?.stress ?? recentAverages.stress,
        fatigue: coachEntry?.fatigue ?? recentAverages.fatigue,
        brainFog: coachEntry?.brain_fog ?? null,
        adaptiveStressTrend: adaptiveProfile.stressTrend,
        adaptiveFatigueTrend: adaptiveProfile.fatigueTrend,
        adaptiveBrainFogTrend: adaptiveProfile.brainFogTrend,
        fallbackTool: suggestedProgramTool,
      }),
    [
      adaptiveProfile.brainFogTrend,
      adaptiveProfile.fatigueTrend,
      adaptiveProfile.stressTrend,
      coachEntry?.brain_fog,
      coachEntry?.fatigue,
      coachEntry?.stress,
      recentAverages.fatigue,
      recentAverages.stress,
      suggestedProgramTool,
    ],
  );
  const visibleOperationalContext = useMemo(
    () =>
      [
        ...operationalMemory.continuityObservations,
        ...operationalMemory.whatHelpedBefore,
        ...operationalMemory.careContext,
      ].slice(0, effectiveLowEnergyConversationMode ? 2 : 4),
    [effectiveLowEnergyConversationMode, operationalMemory.careContext, operationalMemory.continuityObservations, operationalMemory.whatHelpedBefore],
  );

  const coachContext = useMemo(
    () => ({
      fatigue: todayEntry?.fatigue ?? null,
      mood: todayEntry?.mood ?? null,
      stress: todayEntry?.stress ?? null,
      sleep_hours: todayEntry?.sleep_hours ?? null,
      recent_reflection: todayEntry?.notes ?? latestEntry?.notes ?? null,
      fatigue_average_7d: recentAverages.fatigue,
      mood_average_7d: recentAverages.mood,
      stress_average_7d: recentAverages.stress,
      sleep_average_7d: recentAverages.sleep,
      current_streak: currentStreak,
      weekly_checkins: weeklyCheckIns,
      reminder_enabled: reminders.enabled,
      recent_reflections: recentReflections,
      adaptive_stress_trend: adaptiveProfile.stressTrend,
      adaptive_sleep_trend: adaptiveProfile.sleepTrend,
      adaptive_fatigue_trend: adaptiveProfile.fatigueTrend,
      adaptive_engagement_pattern: adaptiveProfile.engagementPattern,
      lifecycle_stage: lifecycleProfile.stage,
      reactivation_gap_days: lifecycleProfile.previousActiveGapDays,
      onboarding_goals: profileQuery.data?.goals ?? [],
      onboarding_symptoms: profileQuery.data?.symptoms ?? [],
      preferred_support_style: personalizationMemory.memory.preferredSupportStyle,
      preferred_program_tags: personalizationMemory.memory.preferredProgramTags ?? [],
      coach_tone_preference: personalizationMemory.memory.coachTonePreference,
      reflection_tone_preference: personalizationMemory.memory.reflectionTonePreference,
      reflection_depth_preference: personalizationMemory.memory.reflectionDepthPreference,
      prompt_style_preference: personalizationMemory.memory.promptStylePreference,
      complexity_tolerance: personalizationMemory.memory.complexityTolerance,
      preferred_density: personalizationMemory.memory.preferredDensity,
      preferred_checkin_windows: personalizationMemory.memory.preferredCheckinWindows ?? [],
      engagement_rhythm: personalizationMemory.memory.engagementRhythm,
      recovery_rhythm: personalizationMemory.memory.recoveryRhythm,
      brain_fog: todayEntry?.brain_fog ?? null,
      low_energy_mode: effectiveLowEnergyConversationMode,
      continuity_observations: operationalMemory.continuityObservations,
      what_helped_before: operationalMemory.whatHelpedBefore,
      care_context: operationalMemory.careContext,
      suggested_support_actions: operationalMemory.suggestedSupportActions,
    }),
    [
      effectiveLowEnergyConversationMode,
      currentStreak,
      latestEntry?.notes,
      lifecycleProfile.previousActiveGapDays,
      lifecycleProfile.stage,
      operationalMemory.careContext,
      operationalMemory.continuityObservations,
      operationalMemory.suggestedSupportActions,
      operationalMemory.whatHelpedBefore,
      personalizationMemory.memory.coachTonePreference,
      personalizationMemory.memory.complexityTolerance,
      personalizationMemory.memory.engagementRhythm,
      personalizationMemory.memory.preferredCheckinWindows,
      personalizationMemory.memory.preferredDensity,
      recentAverages.fatigue,
      recentAverages.mood,
      recentAverages.sleep,
      recentAverages.stress,
      recentReflections,
      reminders.enabled,
      adaptiveProfile.engagementPattern,
      adaptiveProfile.fatigueTrend,
      adaptiveProfile.sleepTrend,
      adaptiveProfile.stressTrend,
      profileQuery.data?.goals,
      profileQuery.data?.symptoms,
      personalizationMemory.memory.preferredProgramTags,
      personalizationMemory.memory.preferredSupportStyle,
      personalizationMemory.memory.promptStylePreference,
      personalizationMemory.memory.recoveryRhythm,
      personalizationMemory.memory.reflectionDepthPreference,
      personalizationMemory.memory.reflectionTonePreference,
      todayEntry?.brain_fog,
      todayEntry?.fatigue,
      todayEntry?.mood,
      todayEntry?.notes,
      todayEntry?.sleep_hours,
      todayEntry?.stress,
      weeklyCheckIns,
    ],
  );

  useEffect(() => {
    draftInputRef.current = chatInput;
    if (!chatInput.trim()) {
      hasTrackedAbandonRef.current = false;
      lastTrackedAbandonedDraftRef.current = null;
      return;
    }

    if (lastTrackedAbandonedDraftRef.current !== chatInput.trim()) {
      hasTrackedAbandonRef.current = false;
    }
  }, [chatInput]);

  useEffect(() => {
    sendPendingRef.current = sendCoachMessage.isPending;
  }, [sendCoachMessage.isPending]);

  useEffect(() => {
    recordGrowthEventRef.current = growth.recordEvent;
  }, [growth.recordEvent]);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    void preservePendingReflection(user.id, reflection, "coach-reflection");
  }, [reflection, user?.id]);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    void preservePendingReflection(user.id, chatInput, "coach-chat");
  }, [chatInput, user?.id]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        const pendingDraft = draftInputRef.current.trim();

        if (!pendingDraft) {
          return;
        }

        if (sendPendingRef.current || coachRequestInFlightRef.current) {
          return;
        }

        if (
          hasTrackedAbandonRef.current ||
          lastTrackedAbandonedDraftRef.current === pendingDraft
        ) {
          return;
        }

        hasTrackedAbandonRef.current = true;
        lastTrackedAbandonedDraftRef.current = pendingDraft;
        void recordGrowthEventRef.current("ai_coach_conversation_abandoned", {
          hasDraft: true,
          draftLength: pendingDraft.length,
        });
      };
    }, []),
  );

  const handleSendCoachMessage = useCallback(async (
    messageOverride?: string,
    options?: { mode?: CoachMode; isRetry?: boolean },
  ) => {
    const nextMessage = (messageOverride ?? chatInput).trim();
    const selectedMode = options?.mode ?? coachMode;

    if (
      !nextMessage ||
      !user?.id ||
      sendCoachMessage.isPending ||
      coachRequestInFlightRef.current ||
      retryCooldownSeconds > 0
    ) {
      return;
    }

    if (hasReachedFreeCoachLimit) {
      setChatError(
        "You’ve used today’s included AI Coach messages. Premium keeps Coach available for deeper reflection.",
      );
      setLastFailedMessage(nextMessage);
      return;
    }

    setChatError(null);
    setLastFailedMessage(null);
    const startedAt = Date.now();
    const isRetry = options?.isRetry === true;
    coachRequestInFlightRef.current = true;
    scrollToPendingCoachMessage(40);

    if (isRetry) {
      await trackRetryTriggered("ai-coach-send", {
        mode: selectedMode,
      });
    }

    try {
      await sendCoachMessage.mutateAsync({
        message: nextMessage,
        context: coachContext,
        mode: selectedMode,
      });
      await growth.recordEvent("ai_coach_message_sent", {
        mode: selectedMode,
      });
      await growth.recordEvent("ai_coach_response_received", {
        mode: selectedMode,
        durationMs: Date.now() - startedAt,
      });
      if (Date.now() - startedAt > 7000) {
        await growth.recordEvent("ai_coach_response_slow", {
          mode: selectedMode,
          durationMs: Date.now() - startedAt,
        });
      }
      if (isRetry) {
        await trackRetrySucceeded("ai-coach-send", {
          mode: selectedMode,
        });
      }
      if (!hasUnlimitedAiCoach) {
        const nextUsage = await incrementAiCoachUsage();
        setDailyCoachUsage(nextUsage.count);
      }
      await clearPendingReflection(user.id, "coach-chat");
      setChatInput("");
      hasTrackedAbandonRef.current = false;
      lastTrackedAbandonedDraftRef.current = null;
      setRetryCooldownUntil(null);
      scrollToLatestAssistantMessage(100);
    } catch (error) {
      await growth.recordEvent("ai_coach_response_failed", {
        mode: selectedMode,
        category: categorizeError(error),
      });
      const messageText = getErrorMessage(error);
      setChatError(
        messageText === "AI Coach is temporarily unavailable."
          ? "Coach could not respond right now. Please try again."
          : messageText,
      );
      setLastFailedMessage(nextMessage);
      setRetryCooldownUntil(Date.now() + COACH_RETRY_COOLDOWN_MS);
    } finally {
      coachRequestInFlightRef.current = false;
    }
  }, [
    chatInput,
    coachContext,
    coachMode,
    growth,
    hasReachedFreeCoachLimit,
    hasUnlimitedAiCoach,
    retryCooldownSeconds,
    scrollToLatestAssistantMessage,
    scrollToPendingCoachMessage,
    sendCoachMessage,
    user?.id,
  ]);

  const handleVoiceInput = useCallback(async () => {
    if (hasReachedFreeCoachLimit || voiceState === "processing") {
      return;
    }

    if (voiceState === "listening") {
      setVoiceState("processing");
      setVoiceMessage("Processing...");
      stopCoachVoiceInput();
      return;
    }

    voiceBaseInputRef.current = chatInput.trim();
    voiceTranscriptRef.current = "";
    setVoiceState("listening");
    setVoiceMessage("Listening...");
    setChatError(null);

    const result = await startCoachVoiceInput({
      onTranscript: (transcript) => {
        voiceTranscriptRef.current = transcript;
        setChatInput(() => {
          const prefix = voiceBaseInputRef.current ? `${voiceBaseInputRef.current} ` : "";
          return `${prefix}${transcript}`.trim();
        });
      },
    });

    if (result.ok === true) {
      setChatInput(() => {
        const prefix = voiceBaseInputRef.current ? `${voiceBaseInputRef.current} ` : "";
        return `${prefix}${result.transcript}`.trim();
      });
      setVoiceMessage("Transcript added. Edit before sending.");
      setVoiceState("idle");
      return;
    }

    setVoiceMessage(result.message);
    setVoiceState("error");
  }, [chatInput, hasReachedFreeCoachLimit, voiceState]);

  const openVoiceSettings = useCallback(() => {
    void Linking.openSettings().catch(() => undefined);
  }, []);

  const handleQuickStart = useCallback(async (id: string, prompt: string, mode: CoachMode) => {
    if (sendCoachMessage.isPending || coachRequestInFlightRef.current || retryCooldownSeconds > 0) {
      return;
    }

    setSelectedQuickActionId(id);
    setActiveQuickActionId(id);
    setCoachMode(mode);
    setChatInput(prompt);
    setChatError(null);
    setTimeout(() => {
      scrollToPendingCoachMessage(40);
    }, 80);

    try {
      await handleSendCoachMessage(prompt, { mode });
    } finally {
      setActiveQuickActionId(null);
    }
  }, [handleSendCoachMessage, retryCooldownSeconds, scrollToPendingCoachMessage, sendCoachMessage.isPending]);

  const scrollToGuidedTool = useCallback((tool: GuidedPlanToolKey) => {
    const y = toolLayoutYRef.current[tool];
    if (typeof y !== "number") {
      return false;
    }

    screenScrollRef.current?.scrollTo({
      y: Math.max(0, y - 18),
      animated: true,
    });

    return true;
  }, []);

  const handleToolSelect = useCallback((tool: CoachToolKey) => {
    setActiveAction(tool);

    if (tool === "plan-today" || tool === "plan") {
      setPendingToolScroll(tool);
    }
  }, []);

  const handleToolLayout = useCallback((tool: GuidedPlanToolKey, event: LayoutChangeEvent) => {
    toolLayoutYRef.current[tool] = event.nativeEvent.layout.y;

    if (pendingToolScroll === tool && scrollToGuidedTool(tool)) {
      setPendingToolScroll(null);
    }
  }, [pendingToolScroll, scrollToGuidedTool]);

  useEffect(() => {
    if (!pendingToolScroll) {
      return;
    }

    const timeout = setTimeout(() => {
      if (scrollToGuidedTool(pendingToolScroll)) {
        setPendingToolScroll(null);
      }
    }, 80);

    return () => clearTimeout(timeout);
  }, [pendingToolScroll, scrollToGuidedTool]);

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
      await growth.recordEvent("reflection_saved", {
        source: "coach",
      });
      await clearPendingReflection(user.id, "coach-reflection");
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
    return <ErrorState message="Coach is available once you’re signed in." />;
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
      eyebrow="Coach"
      title="Coach"
      subtitle="Use Coach to organize thoughts, reduce overwhelm, and plan around difficult days."
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          ref={screenScrollRef}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View style={styles.card}>
            <AppText style={styles.contextLabel}>Start a conversation</AppText>
            <AppText style={styles.title}>
              {selectedQuickStart ? "Conversation started" : "Start here"}
            </AppText>
            {selectedQuickStart ? (
              <View style={styles.selectedQuickStartCard}>
                <AppText style={styles.quickStartTitle}>{selectedQuickStart.title}</AppText>
                <AppText style={styles.quickStartPrompt}>{selectedQuickStart.prompt}</AppText>
                <AppText style={styles.quickStartAction}>
                  {activeQuickActionId === selectedQuickStart.id ? "Starting..." : "Conversation in progress"}
                </AppText>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setSelectedQuickActionId(null);
                    setActiveQuickActionId(null);
                  }}
                  style={({ pressed }) => [styles.changeQuickActionButton, pressed && styles.actionCardPressed]}
                >
                  <AppText style={styles.changeQuickActionText}>Show all actions</AppText>
                </Pressable>
              </View>
            ) : (
              <View style={styles.quickStartGrid}>
                {visibleQuickStarts.map((item) => {
                  const isActive = activeQuickActionId === item.id;
                  const isSendingFromAnotherAction = Boolean(activeQuickActionId && activeQuickActionId !== item.id);

                  return (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Start Coach conversation: ${item.title}`}
                  disabled={sendCoachMessage.isPending || retryCooldownSeconds > 0}
                  onPress={() => void handleQuickStart(item.id, item.prompt, item.mode)}
                  style={({ pressed }) => [
                    styles.quickStartCard,
                    isActive && styles.quickStartCardActive,
                    pressed && styles.actionCardPressed,
                    isSendingFromAnotherAction && styles.quickStartCardMuted,
                  ]}
                >
                  <AppText style={styles.quickStartTitle}>{item.title}</AppText>
                  <AppText style={styles.quickStartBody}>{item.body}</AppText>
                  <AppText style={styles.quickStartPrompt}>{item.prompt}</AppText>
                  <AppText style={styles.quickStartAction}>
                    {isActive ? "Starting..." : "Start conversation"}
                  </AppText>
                </Pressable>
                  );
                })}
              </View>
            )}
          </View>

          <View style={styles.card}>
            <AppText style={styles.contextLabel}>Message Coach</AppText>
            <AppText style={styles.title}>Start a conversation</AppText>
            <AppText style={styles.supportNote}>
              Coach does not replace professional medical care.
            </AppText>
            {effectiveLowEnergyConversationMode ? (
              <View style={styles.lowEnergyBanner}>
                <AppText style={styles.lowEnergyBannerText}>
                  {hasLowEnergyAssist && coachLowEnergyAssist.active
                    ? "Low Energy Assist is using shorter prompts."
                    : "Shorter prompts are shown today."}
                </AppText>
              </View>
            ) : null}
            {!premium.hasPremiumAccess && !hasReachedFreeCoachLimit ? (
              <View style={styles.usageCard}>
                <AppText style={styles.usageTitle}>
                  {isLoadingDailyCoachUsage
                    ? "Checking your AI Coach access..."
                    : `${remainingFreeMessages} of ${FREE_DAILY_AI_COACH_MESSAGES} included messages left today.`}
                </AppText>
                <AppText style={styles.usageBody}>
                  Unlimited Coach conversations are included with Premium.
                </AppText>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push("/premium?source=coach-context")}
                  style={({ pressed }) => [styles.premiumCtaButton, pressed && styles.actionCardPressed]}
                >
                  <AppText style={styles.premiumCtaText}>View Premium</AppText>
                </Pressable>
              </View>
            ) : null}
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
                  Your first Coach conversation is saved here for later reference.
                </AppText>
              </View>
            ) : null}
            {isChatInitialLoading ? (
              <View style={styles.inlineState}>
                <AppText style={styles.body}>Loading your recent Coach messages…</AppText>
              </View>
            ) : coachMessagesQuery.isError ? (
              <View style={styles.inlineState}>
                <AppText style={styles.errorText}>
                  Coach is having trouble loading right now. You can still reflect, reset, or plan ahead while things settle.
                </AppText>
                <AppButton
                  label="Retry"
                  variant="secondary"
                  onPress={() => {
                    void trackRetryTriggered("coach-messages-query");
                    void coachMessagesQuery.refetch();
                  }}
                />
              </View>
            ) : coachMessages.length || sendCoachMessage.isPending ? (
              <View style={styles.chatShell}>
                <ScrollView
                  ref={chatScrollRef}
                  style={styles.chatScrollView}
                  contentContainerStyle={styles.chatContent}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  nestedScrollEnabled
                  onContentSizeChange={() => {
                    if (sendCoachMessage.isPending) {
                      scrollToPendingCoachMessage(40);
                    } else {
                      scrollToLatestAssistantMessage(60);
                    }
                  }}
                >
                  <View style={styles.messageList}>
                    {coachMessages.map((message) => (
                      <View
                        key={message.id}
                        onLayout={(event) => {
                          handleMessageLayout(message.id, event.nativeEvent.layout.y);
                          if (message.id === latestAssistantMessageId) {
                            scrollChatToMessageY(event.nativeEvent.layout.y, 60);
                          }
                        }}
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
                      <View
                        onLayout={(event) => {
                          handlePendingMessageLayout(event.nativeEvent.layout.y);
                        }}
                        style={[styles.messageBubble, styles.coachBubble]}
                      >
                        <AppText style={[styles.messageRole, styles.coachRole]}>Coach</AppText>
                        <AppText style={styles.messageText}>{chatLoadingLabel}</AppText>
                      </View>
                    ) : null}
                  </View>
                </ScrollView>
              </View>
            ) : (
              <View style={styles.emptyChatCard}>
                <AppText style={styles.emptyChatTitle}>A clear place to begin</AppText>
                <AppText style={styles.body}>
                  Choose a quick action or write a short message.
                </AppText>
              </View>
            )}

            <View style={styles.fieldGroup}>
              <AppText style={styles.fieldLabel}>Try asking</AppText>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.promptRail}
                keyboardShouldPersistTaps="handled"
              >
                {COACH_PROMPT_CHIPS.map((suggestion) => (
                  <Pressable
                    key={suggestion}
                    onPress={() => {
                      setChatInput(suggestion);
                      setChatError(null);
                    }}
                    style={({ pressed }) => [styles.starterChip, pressed && styles.actionCardPressed]}
                  >
                    <AppText style={styles.starterChipText}>{suggestion}</AppText>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            <View style={styles.fieldGroup}>
              <AppText style={styles.fieldLabel}>Message Coach</AppText>
              <View style={styles.voiceInputRow}>
                <TextInput
                  multiline
                  value={chatInput}
                  onChangeText={(next) => {
                    setChatInput(next);
                    if (chatError) {
                      setChatError(null);
                    }
                    if (voiceMessage) {
                      setVoiceMessage(null);
                      setVoiceState("idle");
                    }
                  }}
                  onFocus={() => {
                    if (sendCoachMessage.isPending) {
                      scrollToPendingCoachMessage(40);
                    } else {
                      scrollToLatestAssistantMessage(60);
                    }
                  }}
                  placeholder={
                    effectiveLowEnergyConversationMode
                      ? "Describe what feels difficult today..."
                      : "What would you like help thinking through?"
                  }
                  placeholderTextColor="#9ca3af"
                  textAlignVertical="top"
                  style={[styles.chatInput, styles.voiceTextInput]}
                  editable={!hasReachedFreeCoachLimit}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={voiceState === "listening" ? "Stop voice input" : "Start voice input"}
                  onPress={() => void handleVoiceInput()}
                  disabled={voiceState === "processing" || hasReachedFreeCoachLimit}
                  style={({ pressed }) => [
                    styles.micButton,
                    voiceState === "listening" && styles.micButtonActive,
                    (pressed || voiceState === "listening") && styles.actionCardPressed,
                  ]}
                >
                  <Ionicons
                    name={voiceState === "listening" ? "stop" : "mic-outline"}
                    size={21}
                    color={voiceState === "listening" ? "#c25d10" : "#8b6a4f"}
                  />
                </Pressable>
              </View>
              {voiceMessage ? (
                <View style={styles.voiceStateRow}>
                  <AppText style={voiceState === "error" ? styles.errorText : styles.helperText}>{voiceMessage}</AppText>
                  {voiceState === "error" ? (
                    <Pressable onPress={openVoiceSettings} style={({ pressed }) => [styles.inlineLink, pressed && styles.actionCardPressed]}>
                      <AppText style={styles.inlineLinkText}>Open Settings</AppText>
                    </Pressable>
                  ) : null}
                </View>
              ) : null}
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
                Free AI Coach access refreshes daily. Premium keeps Coach available for deeper reflection.
              </AppText>
            ) : null}
            {chatError ? (
              <View style={styles.inlineState}>
                <AppText style={styles.errorText}>{chatError}</AppText>
                <AppText style={styles.body}>
                  {fallbackState.body}
                </AppText>
                <View style={styles.suggestedList}>
                  {fallbackState.suggestions.map((suggestion) => (
                    <View key={suggestion} style={styles.suggestedPill}>
                      <AppText style={styles.suggestedText}>{suggestion}</AppText>
                    </View>
                  ))}
                </View>
                <View style={styles.fallbackActions}>
                  <AppButton label="Open Calm Reset" variant="secondary" onPress={() => setActiveAction("reset")} />
                  <AppButton label="Save a reflection" variant="secondary" onPress={() => setActiveAction("reflect")} />
                </View>
                {lastFailedMessage && !hasReachedFreeCoachLimit ? (
                  <AppButton
                    label={retryCooldownSeconds > 0 ? `Try again in ${retryCooldownSeconds}s` : "Try again"}
                    variant="secondary"
                    onPress={() => void handleSendCoachMessage(lastFailedMessage, { isRetry: true })}
                    disabled={sendCoachMessage.isPending || retryCooldownSeconds > 0}
                  />
                ) : null}
                {hasReachedFreeCoachLimit ? (
                  <AppButton label="See Premium" onPress={() => router.push("/premium?source=coach-limit")} />
                ) : null}
              </View>
            ) : null}
          </View>

          {visibleOperationalContext.length > 0 ? (
            <View style={styles.card}>
              <AppText style={styles.contextLabel}>Context Coach can use</AppText>
              <AppText style={styles.title}>Useful context</AppText>
              <View style={styles.contextMemoryList}>
                {visibleOperationalContext.map((line) => (
                  <View key={line} style={styles.contextMemoryRow}>
                    <View style={styles.contextMemoryDot} />
                    <AppText style={styles.contextMemoryText}>{line}</AppText>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {relatedSupportRecommendation ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Open ${relatedSupportRecommendation.title}`}
              onPress={() =>
                router.push({
                  pathname: "/(app)/(tabs)/programs",
                  params: { tool: relatedSupportRecommendation.tool.id },
                })
              }
              style={({ pressed }) => [styles.card, styles.relatedSupportCard, pressed && styles.actionCardPressed]}
            >
              <AppText style={styles.title}>Related support</AppText>
              <AppText style={styles.relatedToolTitle}>{relatedSupportRecommendation.title}</AppText>
              <AppText style={styles.body}>{relatedSupportRecommendation.description}</AppText>
              <AppText style={styles.relatedOpenLabel}>Open tool</AppText>
            </Pressable>
          ) : null}

          <View style={styles.card}>
          <AppText style={styles.title}>Tools</AppText>
          <View style={styles.quickActions}>
            {[
              {
                key: "plan-today",
                label: "Plan today",
                description: "Answer three short questions for a focused plan.",
              },
              {
                key: "plan",
                label: "Plan tomorrow",
                description: "Prepare one priority, one friction point, and one support action.",
              },
              { key: "reflect", label: "Save a note", description: "Add a short reflection to today’s check-in." },
              { key: "reset", label: "Breathing reset", description: "Use a one-minute breathing timer." },
            ].map((action) => (
              <Pressable
                key={action.key}
                accessibilityRole="button"
                onPress={() => {
                  handleToolSelect(action.key as CoachToolKey);
                }}
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
            <AppText style={styles.reflectionIntro}>
              Save a short note for today.
            </AppText>
            <View style={styles.promptList}>
              {visibleReflectionPrompts.map((prompt) => (
                <Pressable
                  key={prompt}
                  onPress={() => {
                    setReflection((current) => `${current}${current.trim().length ? "\n" : ""}${buildReflectionStarter(prompt)}`);
                    if (reflectionState !== "saving") {
                      setReflectionState("idle");
                    }
                  }}
                  style={({ pressed }) => [styles.promptChip, pressed && styles.promptChipPressed]}
                >
                  <AppText style={styles.promptChipText}>{prompt}</AppText>
                </Pressable>
              ))}
            </View>
            {reflectionThemes.length && !effectiveLowEnergyConversationMode ? (
              <View style={styles.reflectionThemesCard}>
                <AppText style={styles.reflectionThemesTitle}>Themes you&apos;ve been naming lately</AppText>
                <View style={styles.reflectionThemesList}>
                  {reflectionThemes.map((theme) => (
                    <View key={theme.label} style={styles.reflectionThemePill}>
                      <AppText style={styles.reflectionThemeText}>{theme.label}</AppText>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
            <TextInput
              multiline
              value={reflection}
              onChangeText={(next) => {
                setReflection(next);
                if (reflectionState !== "saving") {
                  setReflectionState("idle");
                }
              }}
              placeholder="Write a short note about today."
              placeholderTextColor="#9ca3af"
              textAlignVertical="top"
              style={styles.notesInput}
            />
            {reflectionHistory.length && !effectiveLowEnergyConversationMode ? (
              <View style={styles.reflectionHistoryCard}>
                <AppText style={styles.reflectionThemesTitle}>Recent reflections</AppText>
                {reflectionHistory.map((item) => (
                  <View key={`${item.date}-${item.preview}`} style={styles.reflectionHistoryRow}>
                    <AppText style={styles.reflectionHistoryDate}>{item.date}</AppText>
                    <AppText style={styles.reflectionHistoryText}>{item.preview}</AppText>
                  </View>
                ))}
              </View>
            ) : null}
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
                <AppText style={styles.successTitle}>Reflection saved</AppText>
                <AppText style={styles.successBody}>
                  Your note was added to today’s check-in.
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
              Breathe in for 4 seconds, then out for 6 seconds.
            </AppText>
              <View style={styles.timerCard}>
              <AppText style={styles.timerValue}>{resetSecondsLeft}s</AppText>
              <AppText style={styles.timerBody}>
                {resetCompleted
                  ? "Reset complete."
                  : "Follow the timer."}
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
                <AppText style={styles.successTitle}>Reset complete</AppText>
                <AppText style={styles.successBody}>
                  The timer has finished.
                </AppText>
              </View>
            ) : null}
            </View>
          ) : null}

          {activeAction === "plan-today" ? (
            <View
              style={styles.card}
              onLayout={(event) => handleToolLayout("plan-today", event)}
            >
            <AppText style={styles.contextLabel}>Plan Today</AppText>
            <AppText style={styles.title}>Plan today</AppText>
            <AppText style={styles.body}>
              Answer three short questions to create a focused plan for today.
            </AppText>
            <View style={styles.fieldGroup}>
              <AppText style={styles.fieldLabel}>What is the most important thing to handle today?</AppText>
              <TextInput
                value={todayPriority}
                onChangeText={(next) => {
                  setTodayPriority(next);
                  setTodayPlanState("idle");
                }}
                placeholder="Today’s main priority"
                placeholderTextColor="#9ca3af"
                style={styles.input}
              />
            </View>
            <View style={styles.fieldGroup}>
              <AppText style={styles.fieldLabel}>What is your current energy level?</AppText>
              <TextInput
                value={todayEnergy}
                onChangeText={(next) => {
                  setTodayEnergy(next);
                  setTodayPlanState("idle");
                }}
                placeholder="Low, medium, high, or a short note"
                placeholderTextColor="#9ca3af"
                style={styles.input}
              />
            </View>
            <View style={styles.fieldGroup}>
              <AppText style={styles.fieldLabel}>What can be simplified or postponed?</AppText>
              <TextInput
                value={todaySimplify}
                onChangeText={(next) => {
                  setTodaySimplify(next);
                  setTodayPlanState("idle");
                }}
                placeholder="One thing to reduce"
                placeholderTextColor="#9ca3af"
                style={styles.input}
              />
            </View>
            <AppButton
              label={todayPlanState === "complete" ? "Plan ready" : "Create today plan"}
              onPress={() => setTodayPlanState("complete")}
              disabled={!todayPriority.trim() && !todayEnergy.trim() && !todaySimplify.trim()}
            />
            {todayPlanState === "complete" ? (
              <View style={styles.successCard}>
                <AppText style={styles.successTitle}>Today’s plan</AppText>
                <AppText style={styles.successBody}>
                  Priority: {todayPriority.trim() || "Not set"}
                </AppText>
                <AppText style={styles.successBody}>
                  Energy-aware plan: {todayEnergy.trim() || "Not set"}
                </AppText>
                <AppText style={styles.successBody}>
                  Reduce: {todaySimplify.trim() || "Not set"}
                </AppText>
              </View>
            ) : null}
            </View>
          ) : null}

          {activeAction === "plan" ? (
            <View
              style={styles.card}
              onLayout={(event) => handleToolLayout("plan", event)}
            >
            <AppText style={styles.contextLabel}>Plan Tomorrow</AppText>
            <AppText style={styles.title}>Plan tomorrow</AppText>
            <AppText style={styles.body}>
              Save one priority, one friction point, and one preparation step for {formatPlanDate(tomorrow)}.
            </AppText>
            <View style={styles.fieldGroup}>
              <AppText style={styles.fieldLabel}>What needs attention tomorrow?</AppText>
              <TextInput
                value={priority}
                onChangeText={(next) => {
                  setPriority(next);
                  if (planState !== "saving") {
                    setPlanState("idle");
                  }
                }}
                placeholder="Tomorrow’s main priority"
                placeholderTextColor="#9ca3af"
                style={styles.input}
              />
            </View>
            <View style={styles.fieldGroup}>
              <AppText style={styles.fieldLabel}>What might drain energy?</AppText>
              <TextInput
                value={avoid}
                onChangeText={(next) => {
                  setAvoid(next);
                  if (planState !== "saving") {
                    setPlanState("idle");
                  }
                }}
                placeholder="Possible friction point"
                placeholderTextColor="#9ca3af"
                style={styles.input}
              />
            </View>
            <View style={styles.fieldGroup}>
              <AppText style={styles.fieldLabel}>What would make tomorrow easier?</AppText>
              <TextInput
                value={supportAction}
                onChangeText={(next) => {
                  setSupportAction(next);
                  if (planState !== "saving") {
                    setPlanState("idle");
                  }
                }}
                placeholder="One preparation step"
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
                <AppText style={styles.successTitle}>Plan saved</AppText>
                <AppText style={styles.successBody}>
                  Your plan for tomorrow was saved.
                </AppText>
              </View>
            ) : null}
            {planError ? <AppText style={styles.errorText}>{planError}</AppText> : null}
            </View>
          ) : null}

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
    gap: 16,
  },
  sectionIntro: {
    gap: 6,
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
    gap: 14,
  },
  relatedSupportCard: {
    borderColor: "#edd1bb",
    backgroundColor: "#fffaf6",
  },
  contextMemoryList: {
    gap: 10,
  },
  contextMemoryRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  contextMemoryDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: "#d98641",
    marginTop: 8,
  },
  contextMemoryText: {
    flex: 1,
    color: "#4b5563",
    lineHeight: 21,
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
  heroSupportNote: {
    color: "#6b7280",
    lineHeight: 20,
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
    lineHeight: 23,
  },
  relatedToolTitle: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: "700",
    color: "#1f2937",
  },
  relatedOpenLabel: {
    alignSelf: "flex-start",
    color: "#c25d10",
    fontWeight: "700",
  },
  messageList: {
    gap: 12,
  },
  messageBubble: {
    borderRadius: 18,
    paddingHorizontal: 15,
    paddingVertical: 13,
    gap: 6,
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
    lineHeight: 22,
  },
  inlineState: {
    gap: 10,
  },
  supportNote: {
    color: "#8b6a4f",
    lineHeight: 20,
    fontSize: 13,
  },
  lowEnergyBanner: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e8dfd6",
    backgroundColor: "#fffaf6",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  lowEnergyBannerText: {
    color: "#6b7280",
    fontSize: 13,
    lineHeight: 19,
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
  premiumCtaButton: {
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: "#e8751a",
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginTop: 4,
  },
  premiumCtaText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  quickStartGrid: {
    gap: 12,
  },
  quickStartCard: {
    backgroundColor: "#fffaf6",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#f3dfd1",
    padding: 16,
    gap: 8,
  },
  quickStartCardActive: {
    borderColor: "#e8751a",
    backgroundColor: "#fff4ec",
  },
  quickStartCardMuted: {
    opacity: 0.72,
  },
  selectedQuickStartCard: {
    backgroundColor: "#fff4ec",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#f2d8c4",
    padding: 16,
    gap: 8,
  },
  quickStartTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
  },
  quickStartBody: {
    color: "#4b5563",
    lineHeight: 20,
  },
  quickStartPrompt: {
    color: "#8b6a4f",
    lineHeight: 19,
    fontSize: 13,
    fontWeight: "600",
  },
  quickStartAction: {
    alignSelf: "flex-start",
    color: "#c25d10",
    fontSize: 13,
    fontWeight: "700",
    paddingTop: 2,
  },
  changeQuickActionButton: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#ead8ca",
    backgroundColor: "#fffaf6",
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 2,
  },
  changeQuickActionText: {
    color: "#8b6a4f",
    fontSize: 13,
    fontWeight: "700",
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
    padding: 16,
    gap: 8,
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
    gap: 12,
  },
  actionCard: {
    backgroundColor: "#fffaf6",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#f3dfd1",
    padding: 16,
    gap: 6,
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
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  promptChip: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f3dfd1",
    backgroundColor: "#fffaf6",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  promptChipPressed: {
    opacity: 0.86,
  },
  promptChipText: {
    color: "#8b6a4f",
    lineHeight: 20,
    fontSize: 14,
    fontWeight: "600",
  },
  reflectionIntro: {
    color: "#6b7280",
    lineHeight: 21,
  },
  reflectionThemesCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f3dfd1",
    backgroundColor: "#fffaf6",
    padding: 14,
    gap: 10,
  },
  reflectionThemesTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1f2937",
  },
  reflectionThemesList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  reflectionThemePill: {
    borderRadius: 999,
    backgroundColor: "#fff0e2",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  reflectionThemeText: {
    color: "#9a4a11",
    fontSize: 13,
    fontWeight: "600",
  },
  reflectionHistoryCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f3dfd1",
    backgroundColor: "#fffaf6",
    padding: 14,
    gap: 10,
  },
  reflectionHistoryRow: {
    gap: 4,
  },
  reflectionHistoryDate: {
    fontSize: 12,
    fontWeight: "700",
    color: "#8b6a4f",
  },
  reflectionHistoryText: {
    color: "#4b5563",
    lineHeight: 20,
  },
  notesInput: {
    minHeight: 140,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5d6cb",
    backgroundColor: "#ffffff",
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    lineHeight: 23,
    color: "#1f2937",
  },
  chatInput: {
    minHeight: 112,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5d6cb",
    backgroundColor: "#ffffff",
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    lineHeight: 23,
    color: "#1f2937",
  },
  voiceInputRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 10,
  },
  voiceTextInput: {
    flex: 1,
  },
  micButton: {
    minWidth: 58,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5d6cb",
    backgroundColor: "#fffaf6",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  micButtonActive: {
    borderColor: "#e8751a",
    backgroundColor: "#fff4ec",
  },
  micButtonText: {
    color: "#8b6a4f",
    fontWeight: "700",
  },
  micButtonTextActive: {
    color: "#c25d10",
  },
  voiceStateRow: {
    gap: 8,
  },
  helperText: {
    color: "#6b7280",
    lineHeight: 20,
  },
  inlineLink: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#f3dfd1",
    backgroundColor: "#fffaf6",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inlineLinkText: {
    color: "#9a4a11",
    fontWeight: "700",
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
    gap: 8,
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
  starterSuggestions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  promptRail: {
    gap: 8,
    paddingRight: 8,
  },
  starterChip: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ead8ca",
    backgroundColor: "#fffaf6",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  starterChipText: {
    color: "#6b7280",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
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
