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
  buildReflectionStarter,
  buildCoachSummary,
  buildReflectionPrompts,
  getRecurringReflectionThemes,
  type CoachActionKey,
} from "../../../../features/coach/logic";
import {
  detectCoachLowEnergyMode,
  detectCoachOverwhelm,
  deriveCoachFallbackState,
  deriveCoachStarterSuggestions,
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
import { derivePremiumAdaptiveSupport } from "../../../../features/premium/adaptive-support";
import { deriveLowEnergyAssist } from "../../../../features/premium/low-energy-assist";
import { incrementAiCoachUsage, loadAiCoachUsage } from "../../../../features/premium/usage";
import { getProgramToolById } from "../../../../features/programs/catalog";
import { useProgramProgress } from "../../../../features/programs/hooks";
import { useAuth } from "../../../../features/auth/hooks";
import { useCheckInHistory, useSaveDailyCheckIn, useTodaysCheckIn } from "../../../../features/checkins/hooks";
import type { DailyCheckIn, DailyCheckInInput } from "../../../../features/checkins/types";
import { getCheckInsInLastDays, getCurrentCheckInStreak } from "../../../../features/checkins/consistency";
import { useMyProfile } from "../../../../features/profile/hooks";
import { useReminderSettings } from "../../../../features/reminders/hooks";
import { getErrorMessage } from "../../../../lib/errors";
import { trackCoachFeedback } from "../../../../lib/events";
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

const NATIONAL_MS_SOCIETY_URL = "https://www.nationalmssociety.org/";
const MAYO_MS_URL = "https://www.mayoclinic.org/diseases-conditions/multiple-sclerosis";
const NHS_MS_URL = "https://www.nhs.uk/conditions/multiple-sclerosis/";
const COACH_MODES: Array<{ key: CoachMode; label: string }> = [
  { key: "reflect", label: "Reflect" },
  { key: "calm", label: "Calm" },
  { key: "practical", label: "Practical" },
  { key: "encouragement", label: "Steady" },
];
const COACH_RETRY_COOLDOWN_MS = 8000;
const COACH_QUICK_STARTS: Array<{
  id: string;
  title: string;
  body: string;
  prompt: string;
  mode: CoachMode;
}> = [
  {
    id: "mental-overload",
    title: "Mental overload",
    body: "Untangle a crowded mind and narrow the next useful step.",
    prompt: "I'm overwhelmed today.",
    mode: "calm",
  },
  {
    id: "low-energy-planning",
    title: "Low-energy planning",
    body: "Shrink the day so it asks less from you.",
    prompt: "Help me plan a lower-energy day.",
    mode: "practical",
  },
  {
    id: "emotional-processing",
    title: "Emotional processing",
    body: "Sort through a hard feeling without making it bigger.",
    prompt: "Help me think through what’s stressing me.",
    mode: "reflect",
  },
  {
    id: "symptom-reflection",
    title: "Symptom reflection",
    body: "Talk through how fatigue, stress, sleep, or brain fog are showing up.",
    prompt: "Help me reflect on how my symptoms are affecting today.",
    mode: "reflect",
  },
  {
    id: "thought-organization",
    title: "Thought organization",
    body: "Turn scattered thoughts into something clearer and easier to hold.",
    prompt: "I'm struggling to organize my thoughts.",
    mode: "practical",
  },
  {
    id: "stress-and-pacing",
    title: "Stress and pacing",
    body: "Look for a steadier pace when the day already feels too full.",
    prompt: "Help me slow things down and pace today better.",
    mode: "calm",
  },
];

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

export default function CoachScreen() {
  const { user } = useAuth();
  const today = getDateString();
  const tomorrow = getDateString(1);
  const profileQuery = useMyProfile(user?.id);
  const todayEntryQuery = useTodaysCheckIn(user?.id, today);
  const recentEntriesQuery = useCheckInHistory(user?.id, 14);
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

  const [activeAction, setActiveAction] = useState<CoachActionKey>("reflect");
  const [reflection, setReflection] = useState("");
  const [coachMode, setCoachMode] = useState<CoachMode>("reflect");
  const [chatInput, setChatInput] = useState("");
  const [chatError, setChatError] = useState<string | null>(null);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);
  const [ratedCoachMessageIds, setRatedCoachMessageIds] = useState<string[]>([]);
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
  const [retryCooldownUntil, setRetryCooldownUntil] = useState<number | null>(null);
  const [retryCooldownSeconds, setRetryCooldownSeconds] = useState(0);
  const chatScrollRef = useRef<ScrollView>(null);
  const draftInputRef = useRef("");
  const timeOfDay = getTimeOfDay();

  const todayEntry = todayEntryQuery.data ?? null;
  const latestEntry = recentEntriesQuery.data?.[0] ?? null;
  const coachEntry = todayEntry ?? latestEntry ?? null;
  const coachMessages = coachMessagesQuery.data ?? [];
  const recentEntries = recentEntriesQuery.data ?? [];
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

  const coachSummary = useMemo(() => buildCoachSummary(todayEntry), [todayEntry]);

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
  const hasAdaptiveSupport = canAccessPremiumFeature("adaptive_support", {
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
    },
    growthState: growth.state,
    programProgress: programProgress.progress,
  });
  const adaptiveProfile = useMemo(
    () => buildAdaptiveProfile(recentEntries, weeklyCheckIns, personalizationMemory.memory),
    [personalizationMemory.memory, recentEntries, weeklyCheckIns],
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
  const premiumAdaptiveSupport = useMemo(
    () =>
      derivePremiumAdaptiveSupport({
        hasPremiumAccess: premium.hasPremiumAccess,
        featureEnabled: premium.premiumFeatureFlags.adaptive_support,
        lowEnergyModeEnabled: lowEnergyMode.enabled,
        recentFatigueAverage: coachEntry?.fatigue ?? recentAverages.fatigue,
        recentStressAverage: coachEntry?.stress ?? recentAverages.stress,
        recentSleepAverage: coachEntry?.sleep_hours ?? recentAverages.sleep,
        fatigueTrend: adaptiveProfile.fatigueTrend,
        stressTrend: adaptiveProfile.stressTrend,
        interactionTolerance: chatInput.trim().length > 0 || Boolean(lastFailedMessage) ? "reduced" : "steady",
        preferredSupportStyle: personalizationMemory.memory.preferredSupportStyle,
        preferredDensity: personalizationMemory.memory.preferredDensity,
        timeOfDay,
        abandonedFlowCount: Number(Boolean(chatInput.trim())) + Number(Boolean(lastFailedMessage)),
        engagementRhythm: personalizationMemory.memory.engagementRhythm,
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
      personalizationMemory.memory.engagementRhythm,
      personalizationMemory.memory.preferredDensity,
      personalizationMemory.memory.preferredSupportStyle,
      premium.hasPremiumAccess,
      premium.premiumFeatureFlags.adaptive_support,
      recentAverages.fatigue,
      recentAverages.sleep,
      recentAverages.stress,
      timeOfDay,
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
  const starterSuggestions = useMemo(
    () =>
      deriveCoachStarterSuggestions({
        timeOfDay,
        lowEnergyMode: effectiveLowEnergyConversationMode,
        fatigue: coachEntry?.fatigue ?? recentAverages.fatigue,
        stress: coachEntry?.stress ?? recentAverages.stress,
        brainFog: coachEntry?.brain_fog,
        sleepHours: coachEntry?.sleep_hours ?? recentAverages.sleep,
        message: chatInput || todayEntry?.notes || "",
      }),
    [
      chatInput,
      coachEntry?.brain_fog,
      coachEntry?.fatigue,
      coachEntry?.sleep_hours,
      coachEntry?.stress,
      effectiveLowEnergyConversationMode,
      recentAverages.fatigue,
      recentAverages.sleep,
      recentAverages.stress,
      timeOfDay,
      todayEntry?.notes,
    ],
  );
  const visibleStarterSuggestions = useMemo(
    () =>
      hasAdaptiveSupport && premiumAdaptiveSupport.active
        ? starterSuggestions.slice(0, premiumAdaptiveSupport.density.maxSuggestions)
        : starterSuggestions,
    [hasAdaptiveSupport, premiumAdaptiveSupport.active, premiumAdaptiveSupport.density.maxSuggestions, starterSuggestions],
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
        return "Finding a steadier angle...";
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
  const examplePrompts = useMemo(() => {
    const combined = [
      ...visibleQuickStarts.map((item) => item.prompt),
      ...visibleStarterSuggestions,
    ];

    return combined.filter((item, index) => combined.indexOf(item) === index).slice(0, effectiveLowEnergyConversationMode ? 4 : 6);
  }, [effectiveLowEnergyConversationMode, visibleQuickStarts, visibleStarterSuggestions]);
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
  const latestAssistantMessage = useMemo(
    () => [...coachMessages].reverse().find((message) => message.role === "assistant") ?? null,
    [coachMessages],
  );
  const suggestedProgramTool = useMemo(
    () => getProgramToolById(adaptiveProfile.suggestedProgram),
    [adaptiveProfile.suggestedProgram],
  );
  const hasRatedLatestAssistantMessage = latestAssistantMessage
    ? ratedCoachMessageIds.includes(latestAssistantMessage.id)
    : false;

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
    }),
    [
      effectiveLowEnergyConversationMode,
      currentStreak,
      latestEntry?.notes,
      lifecycleProfile.previousActiveGapDays,
      lifecycleProfile.stage,
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
  }, [chatInput]);

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

  useEffect(() => {
    return () => {
      const pendingDraft = draftInputRef.current.trim();
      if (pendingDraft.length > 0) {
        void growth.recordEvent("ai_coach_conversation_abandoned", {
          hasDraft: true,
          draftLength: pendingDraft.length,
        });
      }
    };
  }, [growth]);

  const handleSendCoachMessage = async (messageOverride?: string) => {
    const nextMessage = (messageOverride ?? chatInput).trim();

    if (!nextMessage || !user?.id || sendCoachMessage.isPending || retryCooldownSeconds > 0) {
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
    const isRetry = typeof messageOverride === "string" && messageOverride.trim().length > 0;

    if (isRetry) {
      await trackRetryTriggered("ai-coach-send", {
        mode: coachMode,
      });
    }

    try {
      await sendCoachMessage.mutateAsync({
        message: nextMessage,
        context: coachContext,
        mode: coachMode,
      });
      await growth.recordEvent("ai_coach_message_sent", {
        mode: coachMode,
      });
      await growth.recordEvent("ai_coach_response_received", {
        mode: coachMode,
        durationMs: Date.now() - startedAt,
      });
      if (Date.now() - startedAt > 7000) {
        await growth.recordEvent("ai_coach_response_slow", {
          mode: coachMode,
          durationMs: Date.now() - startedAt,
        });
      }
      if (isRetry) {
        await trackRetrySucceeded("ai-coach-send", {
          mode: coachMode,
        });
      }
      if (!hasUnlimitedAiCoach) {
        const nextUsage = await incrementAiCoachUsage();
        setDailyCoachUsage(nextUsage.count);
      }
      await clearPendingReflection(user.id, "coach-chat");
      setChatInput("");
      setRetryCooldownUntil(null);
    } catch (error) {
      await growth.recordEvent("ai_coach_response_failed", {
        mode: coachMode,
        category: categorizeError(error),
      });
      const messageText = getErrorMessage(error);
      setChatError(
        messageText === "AI Coach is temporarily unavailable."
          ? "The conversation is taking a moment to reconnect."
          : messageText,
      );
      setLastFailedMessage(nextMessage);
      setRetryCooldownUntil(Date.now() + COACH_RETRY_COOLDOWN_MS);
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

  const handleCoachFeedback = async (helpful: boolean) => {
    if (!latestAssistantMessage || hasRatedLatestAssistantMessage) {
      return;
    }

    setRatedCoachMessageIds((current) => [...current, latestAssistantMessage.id]);
    await trackCoachFeedback(helpful, {
      mode: coachMode,
      messageId: latestAssistantMessage.id,
      source: "coach-screen",
    });
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
      subtitle="Use Coach to reflect, organize thoughts, reduce overwhelm, and plan lower-energy days."
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View style={styles.sectionIntro}>
            <AppText style={styles.sectionKicker}>What Coach is for</AppText>
            <AppText style={styles.sectionBody}>
              Coach is a support tool for reflection, thought organization, pacing, difficult days, and mental overload.
            </AppText>
          </View>

          <View style={styles.heroCard}>
            <AppText style={styles.heroTitle}>Start with what would help most</AppText>
            <AppText style={styles.heroBody}>
              Coach can help you reflect, organize thoughts, reduce overwhelm, and find a steadier next step.
            </AppText>
            <AppText style={styles.heroSupportNote}>
              Pick a starting point below, use an example prompt, or type your own message.
            </AppText>
          </View>

          <View style={styles.card}>
            <AppText style={styles.contextLabel}>Common starting points</AppText>
            <AppText style={styles.title}>Choose a support area</AppText>
            <AppText style={styles.body}>
              Each option starts a calmer, more focused conversation.
            </AppText>
            <View style={styles.quickStartGrid}>
              {visibleQuickStarts.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => {
                    setCoachMode(item.mode);
                    setChatInput(item.prompt);
                    setChatError(null);
                  }}
                  style={({ pressed }) => [styles.quickStartCard, pressed && styles.actionCardPressed]}
                >
                  <AppText style={styles.quickStartTitle}>{item.title}</AppText>
                  <AppText style={styles.quickStartBody}>{item.body}</AppText>
                  <AppText style={styles.quickStartPrompt}>{item.prompt}</AppText>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.card}>
            <AppText style={styles.contextLabel}>Message Coach</AppText>
            <AppText style={styles.title}>Start a conversation</AppText>
            <AppText style={styles.body}>
              Share a hard moment, a crowded thought, or a planning problem. Coach keeps replies short, calm, and practical.
            </AppText>
            <AppText style={styles.supportNote}>
              {hasAdaptiveSupport && premiumAdaptiveSupport.active
                ? "Coach is keeping this shorter and lighter right now. It still stays grounded and does not replace therapy or professional care."
                : "Coach is for reflection, organization, and pacing support. It does not diagnose, treat, or replace professional care."}
            </AppText>
            {effectiveLowEnergyConversationMode ? (
              <View style={styles.lowEnergyBanner}>
                <AppText style={styles.lowEnergyBannerText}>
                  {hasLowEnergyAssist && coachLowEnergyAssist.active
                    ? "Low Energy Assist is keeping Coach shorter and simpler right now."
                    : "Coach is keeping things shorter and simpler today."}
                </AppText>
              </View>
            ) : null}
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
                  : lifecycleProfile.shouldSoftenPremiumPrompts
                    ? "Take your time with the free app first. Daily check-ins, tracking, reminders, Programs, Care, and basic insights stay free."
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
                  Your first Coach conversation is saved here for later reference.
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
                <AppText style={styles.emptyChatTitle}>Useful starting prompts</AppText>
                <AppText style={styles.body}>
                  A short prompt is enough to begin.
                </AppText>
                <AppText style={styles.supportNote}>
                  Coach can help with overload, lower-energy planning, thought organization, emotional processing, and pacing.
                </AppText>
                <View style={styles.starterSuggestions}>
                  {examplePrompts.map((suggestion) => (
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
                </View>
              </View>
            )}

            {latestAssistantMessage && !sendCoachMessage.isPending && !hasRatedLatestAssistantMessage ? (
              <View style={styles.feedbackCard}>
                <AppText style={styles.feedbackTitle}>Was this helpful?</AppText>
                <View style={styles.feedbackActions}>
                  <Pressable
                    onPress={() => {
                      void handleCoachFeedback(true);
                    }}
                    style={({ pressed }) => [styles.feedbackChip, pressed && styles.actionCardPressed]}
                  >
                    <AppText style={styles.feedbackChipText}>Helpful</AppText>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      void handleCoachFeedback(false);
                    }}
                    style={({ pressed }) => [styles.feedbackChip, pressed && styles.actionCardPressed]}
                  >
                    <AppText style={styles.feedbackChipText}>Not helpful</AppText>
                  </Pressable>
                </View>
              </View>
            ) : null}

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
                placeholder={effectiveLowEnergyConversationMode ? "A few words is enough." : "What feels most important right now?"}
                placeholderTextColor="#9ca3af"
                textAlignVertical="top"
                style={styles.chatInput}
                editable={!hasReachedFreeCoachLimit}
              />
            </View>
            {coachMessages.length ? (
              <View style={styles.fieldGroup}>
                <AppText style={styles.fieldLabel}>Example prompts</AppText>
                <View style={styles.starterSuggestions}>
                {examplePrompts.map((suggestion) => (
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
                </View>
              </View>
            ) : null}
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
                    onPress={() => void handleSendCoachMessage(lastFailedMessage)}
                    disabled={sendCoachMessage.isPending || retryCooldownSeconds > 0}
                  />
                ) : null}
                {hasReachedFreeCoachLimit ? (
                  <AppButton label="See Premium" onPress={() => router.push("/premium?source=coach-limit")} />
                ) : null}
              </View>
            ) : null}
          </View>

          {suggestedProgramTool ? (
            <View style={styles.card}>
              <AppText style={styles.title}>Related support in Programs</AppText>
              <AppText style={styles.body}>
                {suggestedProgramTool.title} may fit what this week has looked like.
              </AppText>
              <AppButton label="Open in Programs" variant="secondary" onPress={() => router.push("/programs")} />
            </View>
          ) : null}

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
            <AppText style={styles.title}>No check-in yet today</AppText>
            <AppText style={styles.body}>
              Coach still works without a check-in. Add one in Today if you want more context for reflection and patterns.
            </AppText>
            <AppButton label="Go to Today" onPress={() => router.push("/today")} />
            </View>
          )}

          <View style={styles.card}>
          <AppText style={styles.title}>Other tools in Coach</AppText>
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
            <AppText style={styles.reflectionIntro}>
              Start with a few words. You do not need to capture everything.
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
              placeholder="Write a few lines about today, what helped, or what you want to carry forward."
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
                  Your reflection is saved. It can add useful context later.
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
                  ? "That may be enough for now."
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
                <AppText style={styles.successTitle}>A quieter minute counts</AppText>
                <AppText style={styles.successBody}>
                  Even one quiet minute can help the day feel a little less loaded.
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
                <AppText style={styles.successTitle}>Tomorrow has a softer start</AppText>
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
  feedbackCard: {
    gap: 10,
    borderRadius: 16,
    backgroundColor: "#fffaf6",
    borderWidth: 1,
    borderColor: "#f3dfd1",
    padding: 14,
  },
  feedbackTitle: {
    color: "#6b7280",
    fontSize: 14,
  },
  feedbackActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  feedbackChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#ead9cb",
    backgroundColor: "#ffffff",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  feedbackChipText: {
    color: "#8b6a4f",
    fontWeight: "700",
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
