import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Animated, Linking, Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from "react-native";
import { router } from "expo-router";
import { useCalmEnvironment } from "../../../../features/calm-environment/hooks";
import { useIsAdmin } from "../../../../features/admin/hooks";
import AppButton from "../../../../components/ui/AppButton";
import AppScreen from "../../../../components/ui/AppScreen";
import AppText from "../../../../components/ui/AppText";
import { useDeleteAccount } from "../../../../features/account/hooks";
import { useAuth } from "../../../../features/auth/hooks";
import { useLowEnergyMode } from "../../../../features/low-energy-mode/hooks";
import { canAccessPremiumFeature } from "../../../../features/premium/entitlements";
import { usePremium } from "../../../../features/premium/hooks";
import { shouldShowPremiumInternalDebug } from "../../../../features/premium/tester-overrides";
import { fetchCommunityProfile, upsertCommunityProfile } from "../../../../features/community/api";
import { useSaveProfileStep } from "../../../../features/profile/hooks";
import { useReminderSettings } from "../../../../features/reminders/hooks";
import { requestReminderPermission, scheduleTestNotification } from "../../../../features/reminders/notifications";
import { useCheckInOverview } from "../../../../features/checkins/hooks";
import { getCurrentCheckInStreak } from "../../../../features/checkins/consistency";
import { useGrowthState } from "../../../../features/growth/hooks";
import type { CelebrationKey } from "../../../../features/growth/types";
import { resetOnboardingSupportPreferences } from "../../../../features/onboarding/preferences";
import { useProgramProgress } from "../../../../features/programs/hooks";
import { loadExerciseUsage, type ExerciseUsage } from "../../../../features/exercises/storage";
import { getErrorMessage } from "../../../../lib/errors";
import { trackEvent } from "../../../../lib/events";
import { requestAppTourReplay } from "../../../../features/app-tour/storage";
import { derivePremiumPositioning } from "../../../../lib/premium-ecosystem/calm-premium/derivePremiumPositioning";
import { derivePremiumValue } from "../../../../lib/premium-ecosystem/calm-premium/derivePremiumValue";
import { preserveFreeUserDignity } from "../../../../lib/premium-ecosystem/calm-premium/preserveFreeUserDignity";
import { preventEmotionalConversion } from "../../../../lib/premium-ecosystem/ethical-monetization/preventEmotionalConversion";

const PRIVACY_POLICY_URL = "https://www.livewithms.com/policies/privacy-policy";
const TERMS_OF_USE_URL = "https://www.livewithms.com/policies/terms-of-service";
const SUPPORT_EMAIL_URL = "mailto:support@livewithms.com";
function safeTrim(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getCommunityNameSaveErrorMessage(error: unknown) {
  const maybeError = error as {
    message?: unknown;
    code?: unknown;
    details?: unknown;
    hint?: unknown;
  };
  const message = typeof maybeError?.message === "string" ? maybeError.message : "";
  const code = typeof maybeError?.code === "string" ? maybeError.code : "";
  const details = typeof maybeError?.details === "string" ? maybeError.details : "";
  const hint = typeof maybeError?.hint === "string" ? maybeError.hint : "";
  const combined = `${message} ${details} ${hint}`.toLowerCase();

  if (combined.includes("choose a community name")) {
    return "Choose a community name.";
  }

  if (combined.includes("network connection failed")) {
    return "Network connection failed. Check your connection and try again.";
  }

  return "Community name could not be updated. Please try again.";
}

function formatReminderTime(hour: number, minute: number) {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);

  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

type AchievementRow = {
  id: CelebrationKey;
  title: string;
  body: string;
  completed: boolean;
  unlockCopy: string;
};

function getAchievementRows(input: {
  streak: number;
  totalCheckIns: number;
  firstReflectionCompleted: boolean;
  firstMealPlanGenerated: boolean;
  firstCommunityPost: boolean;
  firstBreathingReset: boolean;
  exerciseSessionsCompleted: number;
}): AchievementRow[] {
  return [
    {
      id: "first_check_in_completed",
      title: "First check-in completed",
      body: "The first check-in gives Today, Track, and Insights something real to build from.",
      completed: input.totalCheckIns >= 1,
      unlockCopy: "First check-in completed.",
    },
    {
      id: "three_day_check_in_streak",
      title: "3-day check-in streak",
      body: "Three days of check-ins helps patterns start to become more useful.",
      completed: input.streak >= 3,
      unlockCopy: "Nice consistency.",
    },
    {
      id: "seven_day_check_in_streak",
      title: "7-day check-in streak",
      body: "A week of check-ins gives Insights more context.",
      completed: input.streak >= 7,
      unlockCopy: "7-day check-in streak.",
    },
    {
      id: "first_reflection_completed",
      title: "First reflection completed",
      body: "One useful note can make future patterns easier to understand.",
      completed: input.firstReflectionCompleted,
      unlockCopy: "First reflection completed.",
    },
    {
      id: "first_nutrition_plan",
      title: "First meal plan generated",
      body: "Nutrition support is ready when food decisions feel tiring.",
      completed: input.firstMealPlanGenerated,
      unlockCopy: "First nutrition plan created.",
    },
    {
      id: "first_community_post",
      title: "First community post",
      body: "A shared question or experience can make Community feel more useful and lived-in.",
      completed: input.firstCommunityPost,
      unlockCopy: "First community post published.",
    },
    {
      id: "first_breathing_reset",
      title: "First breathing reset",
      body: "A quick reset is now there when stress or overload starts building.",
      completed: input.firstBreathingReset,
      unlockCopy: "First breathing reset completed.",
    },
    {
      id: "ten_exercises_completed",
      title: "10 exercises completed",
      body: "A few short exercise sessions can build useful focus and consistency over time.",
      completed: input.exerciseSessionsCompleted >= 10,
      unlockCopy: "10 exercises completed.",
    },
  ];
}

type PreferenceRowProps = {
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
};

function PreferenceRow({ title, description, value, onValueChange, disabled = false }: PreferenceRowProps) {
  return (
    <View style={styles.preferenceRow}>
      <View style={styles.preferenceCopy}>
        <AppText style={styles.preferenceTitle}>{title}</AppText>
        <AppText style={styles.preferenceDescription}>{description}</AppText>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: "#e7ddd5", true: "#f2c29f" }}
        thumbColor={value ? "#e8751a" : "#ffffff"}
      />
    </View>
  );
}

type LinkRowProps = {
  label: string;
  onPress: () => void;
};

function LinkRow({ label, onPress }: LinkRowProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.linkRow, pressed && styles.linkRowPressed]}>
      <AppText style={styles.linkText}>{label}</AppText>
      <AppText style={styles.linkChevron}>›</AppText>
    </Pressable>
  );
}

async function openTrackedLink(
  url: string,
  eventName: "support_email_opened",
  fallbackEmail: string,
) {
  void trackEvent(eventName);

  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert("Unable to open email", `Please email ${fallbackEmail}.`);
  }
}

export default function ProfileScreen() {
  const { user, isMockMode, signOut } = useAuth();
  const isAdminQuery = useIsAdmin(user?.id);
  const deleteAccount = useDeleteAccount();
  const resetOnboarding = useSaveProfileStep();
  const reminders = useReminderSettings();
  const checkInOverview = useCheckInOverview(user?.id);
  const premium = usePremium();
  const programProgress = useProgramProgress();
  const growth = useGrowthState({
    totalCheckIns: checkInOverview.data?.length ?? 0,
    reminderEnabled: reminders.enabled,
  });
  const showInternalPremiumDebug = shouldShowPremiumInternalDebug(user?.email) || premium.testerPremiumOverrideActive;
  const lowEnergyMode = useLowEnergyMode();
  const calmEnvironment = useCalmEnvironment();
  const darkMode = calmEnvironment.appearance === "dark";
  const profileContentStyle = [
    styles.content,
    lowEnergyMode.enabled && styles.contentSimplified,
    darkMode && styles.contentDark,
  ];
  const cardStyle = [
    styles.card,
    lowEnergyMode.enabled && styles.cardSimplified,
    darkMode && styles.cardDark,
  ];
  const hasAdaptiveSupport = canAccessPremiumFeature("adaptive_support", {
    subscriptionsEnabled: premium.subscriptionsEnabled,
    hasPremiumAccess: premium.hasPremiumAccess,
    premiumFeatureFlags: premium.premiumFeatureFlags,
  });
  const premiumPositioning = derivePremiumPositioning();
  const premiumValue = derivePremiumValue();
  const [communityDisplayName, setCommunityDisplayName] = useState("");
  const [isSavingCommunityProfile, setIsSavingCommunityProfile] = useState(false);
  const [communityProfileError, setCommunityProfileError] = useState<string | null>(null);
  const [exerciseUsage, setExerciseUsage] = useState<ExerciseUsage | null>(null);
  const [achievementCelebration, setAchievementCelebration] = useState<AchievementRow | null>(null);
  const achievementCelebrationOpacity = useRef(new Animated.Value(0)).current;
  const achievementCelebrationY = useRef(new Animated.Value(8)).current;
  const lastCelebratedAchievementIdRef = useRef<CelebrationKey | null>(null);
  const streak = useMemo(
    () => getCurrentCheckInStreak(checkInOverview.data ?? [], getTodayDateString()),
    [checkInOverview.data],
  );
  const achievementRows = useMemo(() => getAchievementRows({
    streak,
    totalCheckIns: checkInOverview.data?.length ?? 0,
    firstReflectionCompleted:
      (checkInOverview.data ?? []).some((entry) => entry.hasReflection) ||
      (growth.state?.eventCounts.reflection_saved ?? 0) > 0,
    firstMealPlanGenerated: (growth.state?.eventCounts.nutrition_meal_plan_generated ?? 0) > 0,
    firstCommunityPost: (growth.state?.eventCounts.community_post_created ?? 0) > 0,
    firstBreathingReset: (programProgress.progress.toolProgress["breathing-reset"]?.completionCount ?? 0) > 0,
    exerciseSessionsCompleted: exerciseUsage?.sessionsCompleted ?? 0,
  }), [
    checkInOverview.data,
    exerciseUsage?.sessionsCompleted,
    growth.state?.eventCounts.community_post_created,
    growth.state?.eventCounts.nutrition_meal_plan_generated,
    growth.state?.eventCounts.reflection_saved,
    programProgress.progress.toolProgress,
    streak,
  ]);
  const unseenAchievement = useMemo(
    () => {
      if (growth.isLoading || programProgress.isLoading || exerciseUsage === null) {
        return null;
      }

      return achievementRows.find(
        (achievement) =>
          achievement.completed &&
          !growth.state?.seenCelebrations[achievement.id] &&
          lastCelebratedAchievementIdRef.current !== achievement.id,
      ) ?? null;
    },
    [achievementRows, exerciseUsage, growth.isLoading, growth.state?.seenCelebrations, programProgress.isLoading],
  );

  useEffect(() => {
    let cancelled = false;
    setCommunityDisplayName("");

    if (!user?.id) {
      return () => {
        cancelled = true;
      };
    }

    void fetchCommunityProfile(user.id)
      .then((communityProfile) => {
        if (cancelled) {
          return;
        }
        setCommunityDisplayName(communityProfile?.display_name ?? "");
      })
      .catch((error) => {
        const maybeError = error as { message?: unknown; code?: unknown; details?: unknown; hint?: unknown };
        console.error("[profile] community profile lookup failed", {
          message: maybeError?.message,
          code: maybeError?.code,
          details: maybeError?.details,
          hint: maybeError?.hint,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    let cancelled = false;

    void loadExerciseUsage().then((usage) => {
      if (!cancelled) {
        setExerciseUsage(usage);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!unseenAchievement) {
      return;
    }

    lastCelebratedAchievementIdRef.current = unseenAchievement.id;
    setAchievementCelebration(unseenAchievement);
    achievementCelebrationOpacity.setValue(0);
    achievementCelebrationY.setValue(8);

    Animated.sequence([
      Animated.parallel([
        Animated.timing(achievementCelebrationOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(achievementCelebrationY, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(2200),
      Animated.timing(achievementCelebrationOpacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setAchievementCelebration((current) => (current?.id === unseenAchievement.id ? null : current));
      }
    });

    void growth.markCelebrationSeen(unseenAchievement.id);
  }, [achievementCelebrationOpacity, achievementCelebrationY, growth, unseenAchievement]);

  const handleSaveCommunityProfile = () => {
    if (!user?.id || isSavingCommunityProfile) {
      return;
    }

    const displayName = safeTrim(communityDisplayName);
    if (!displayName) {
      Alert.alert("Community name", "Choose a community name.");
      return;
    }
    if (displayName.includes("@")) {
      Alert.alert("Community name", "Use a name that does not include an email address.");
      return;
    }

    void (async () => {
      setIsSavingCommunityProfile(true);
      setCommunityProfileError(null);
      try {
        const communityProfile = await upsertCommunityProfile({
          userId: user.id,
          displayName,
        });
        setCommunityDisplayName(communityProfile.display_name ?? "");
        Alert.alert("Community name saved", "This name will appear on your Community posts and replies.");
      } catch (error) {
        const maybeError = error as {
          message?: unknown;
          code?: unknown;
          details?: unknown;
          hint?: unknown;
        };
        console.error("[profile] community name save failed", {
          message: maybeError?.message,
          code: maybeError?.code,
          details: maybeError?.details,
          hint: maybeError?.hint,
        });
        const message = getCommunityNameSaveErrorMessage(error);
        setCommunityProfileError(`${maybeError?.code ?? "error"} ${typeof maybeError?.message === "string" ? maybeError.message : ""}`.trim());
        Alert.alert("Unable to save community name.", message);
      } finally {
        setIsSavingCommunityProfile(false);
      }
    })();
  };
  const confirmDeleteAccount = () => {
    Alert.alert(
      "Delete account",
      "Delete your account and app data permanently? This cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void handleDeleteAccount();
          },
        },
      ],
    );
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount.mutateAsync();
      Alert.alert("Account deleted", "Your account and app data have been permanently deleted.", [
        {
          text: "OK",
          onPress: () => {
            void signOut();
          },
        },
      ]);
    } catch (error) {
      Alert.alert("Unable to delete account", getErrorMessage(error));
    }
  };

  const handleResetOnboarding = async () => {
    if (!__DEV__ || !user?.id || resetOnboarding.isPending) {
      return;
    }

    try {
      await resetOnboarding.mutateAsync({
        userId: user.id,
        input: { onboarding_completed: false },
      });
      await resetOnboardingSupportPreferences();
      router.replace("/welcome");
    } catch (error) {
      Alert.alert("Unable to reset onboarding", getErrorMessage(error));
    }
  };

  const handleNotificationPermissionPress = () => {
    if (reminders.permissionStatus === "denied") {
      void Linking.openSettings();
      return;
    }

    if (reminders.permissionStatus === "granted") {
      return;
    }

    void (async () => {
      try {
        const status = await requestReminderPermission();
        await reminders.refresh();

        if (status === "denied") {
          Alert.alert("Notifications are disabled", "You can enable notifications from iPhone Settings.");
        }
      } catch (error) {
        Alert.alert("Unable to update notifications", getErrorMessage(error));
      }
    })();
  };

  const updateReminderPreference = (updates: Parameters<typeof reminders.updateNotificationPreference>[0]) => {
    void (async () => {
      try {
        await reminders.updateNotificationPreference(updates);
      } catch (error) {
        Alert.alert("Unable to update notifications", getErrorMessage(error));
      }
    })();
  };

  const handleSendTestNotification = () => {
    if (!__DEV__) {
      return;
    }

    void (async () => {
      try {
        const identifier = await scheduleTestNotification();
        await reminders.refresh();

        if (identifier) {
          Alert.alert("Test notification scheduled", "It should arrive in about 10 seconds.");
          return;
        }

        Alert.alert("Notifications are disabled", "Enable notifications to send a test.");
      } catch (error) {
        Alert.alert("Unable to send test notification", getErrorMessage(error));
      }
    })();
  };

  return (
    <AppScreen
      title="Profile"
      subtitle="Manage account, appearance, notifications, privacy, and support."
    >
      <ScrollView
        contentContainerStyle={profileContentStyle}
        showsVerticalScrollIndicator={false}
      >
        <View style={cardStyle}>
          <AppText style={styles.sectionKicker}>Account</AppText>
          <AppText style={styles.sectionTitle}>Account</AppText>
          <View style={styles.accountRow}>
            <AppText style={styles.accountLabel}>Email</AppText>
            <AppText style={styles.accountValue}>{user?.email ?? "Not available"}</AppText>
          </View>
          <View style={styles.accountRow}>
            <AppText style={styles.accountLabel}>Account status</AppText>
            <AppText style={styles.accountValue}>{__DEV__ && isMockMode ? "Mock mode" : "Signed in"}</AppText>
          </View>
          <View style={styles.accountActions}>
            <AppButton label="Sign out" onPress={() => void signOut()} variant="secondary" />
            {__DEV__ ? (
              <AppButton
                label={resetOnboarding.isPending ? "Resetting onboarding..." : "Reset Onboarding (Dev Only)"}
                onPress={() => void handleResetOnboarding()}
                variant="secondary"
                disabled={resetOnboarding.isPending}
              />
            ) : null}
          </View>
        </View>

        <View style={cardStyle}>
          <AppText style={styles.sectionKicker}>Community</AppText>
          <AppText style={styles.sectionTitle}>Community name</AppText>
          <View style={styles.formField}>
            <AppText style={styles.accountLabel}>Display name</AppText>
            <TextInput
              value={communityDisplayName}
              onChangeText={setCommunityDisplayName}
              maxLength={32}
              placeholder="Name shown on posts"
              placeholderTextColor="#9ca3af"
              style={styles.textInput}
            />
            <AppText style={styles.helperText}>This is the name shown on your community posts.</AppText>
          </View>
          <AppButton
            label={isSavingCommunityProfile ? "Saving..." : "Save Community Name"}
            onPress={handleSaveCommunityProfile}
            disabled={isSavingCommunityProfile || !safeTrim(communityDisplayName)}
            variant="secondary"
          />
        </View>

        <View style={cardStyle}>
          <AppText style={styles.sectionKicker}>Premium</AppText>
          <AppText style={styles.sectionTitle}>Premium</AppText>
          <View style={styles.premiumCard}>
            <View style={styles.premiumHeader}>
              <View style={styles.premiumCopy}>
                <AppText style={styles.premiumTitle}>
                  {premium.hasPremiumAccess ? "Premium is active" : "LiveWithMS Premium"}
                </AppText>
                <AppText style={styles.premiumBody}>
                  {premium.hasPremiumAccess
                    ? hasAdaptiveSupport
                      ? premiumPositioning.activeProfileBody
                      : "Premium is active, and your plan is managed securely through Apple."
                    : preserveFreeUserDignity(
                        preventEmotionalConversion(
                          premiumPositioning.inactiveProfileBody,
                        ),
                      )}
                </AppText>
              </View>
              <AppText style={[styles.premiumBadge, premium.hasPremiumAccess && styles.premiumBadgeActive]}>
                {premium.hasPremiumAccess ? "Active" : "Optional"}
              </AppText>
            </View>
            {__DEV__ && premium.debugPremiumOverrideActive ? (
              <AppText style={styles.devPremiumNote}>Development Premium Enabled</AppText>
            ) : null}
            {showInternalPremiumDebug ? (
              <View style={styles.devPremiumDebugBlock}>
                <AppText style={styles.devPremiumNote}>
                  Premium source: {premium.premiumAccessSource}
                </AppText>
                <AppText style={styles.devPremiumNote}>
                  RevenueCat configured: {premium.revenueCatDebugSnapshot.configured ? "true" : "false"}
                </AppText>
                <AppText style={styles.devPremiumNote}>
                  RevenueCat app user id: {premium.revenueCatDebugSnapshot.loggedInAppUserId ?? "none"}
                </AppText>
                <AppText style={styles.devPremiumNote}>
                  Original app user id: {premium.revenueCatDebugSnapshot.originalAppUserId ?? "none"}
                </AppText>
                <AppText style={styles.devPremiumNote}>
                  Entitlement active: {premium.revenueCatEntitlementActive ? "true" : "false"}
                </AppText>
                <AppText style={styles.devPremiumNote}>
                  Active entitlement keys: {premium.revenueCatDebugSnapshot.activeEntitlementIdentifiers.join(", ") || "none"}
                </AppText>
                <AppText style={styles.devPremiumNote}>
                  Latest expiration: {premium.revenueCatDebugSnapshot.latestExpirationDate ?? "none"}
                </AppText>
                <AppText style={styles.devPremiumNote}>
                  Last restore result: {premium.revenueCatDebugSnapshot.lastRestoreResult ?? "none"}
                </AppText>
                <AppText style={styles.devPremiumNote}>
                  Last restore error: {premium.revenueCatDebugSnapshot.lastRestoreErrorMessage ?? "none"}
                </AppText>
                <AppText style={styles.devPremiumNote}>
                  Offerings loaded: {premium.revenueCatDebugSnapshot.selectedOfferingIdentifier ? "true" : "false"}
                </AppText>
                <AppText style={styles.devPremiumNote}>
                  Products loaded: {premium.revenueCatDebugSnapshot.productIdentifiers.length > 0 ? "true" : "false"}
                </AppText>
                <AppText style={styles.devPremiumNote}>
                  Products: {premium.revenueCatDebugSnapshot.productIdentifiers.join(", ") || "none"}
                </AppText>
                <AppText style={styles.devPremiumNote}>
                  Last purchase error: {premium.revenueCatDebugSnapshot.lastPurchaseErrorMessage ?? "none"}
                </AppText>
                <AppText style={styles.devPremiumNote}>
                  Last RevenueCat error: {premium.revenueCatDebugSnapshot.lastErrorMessage ?? "none"}
                </AppText>
                <AppText style={styles.devPremiumNote}>
                  Tester override active: {premium.testerPremiumOverrideActive ? "true" : "false"}
                </AppText>
                <AppText style={styles.devPremiumNote}>
                  Dev override active: {premium.debugPremiumOverrideActive ? "true" : "false"}
                </AppText>
              </View>
            ) : null}
            <View style={styles.premiumFeatureList}>
              {premiumValue.lines.map((line) => (
                <AppText key={line} style={styles.premiumFeatureText}>• {line}</AppText>
              ))}
            </View>
            <AppText style={styles.premiumNote}>
              {premium.hasPremiumAccess
                ? hasAdaptiveSupport
                  ? "Premium includes adaptive support during difficult days. You can manage your plan anytime through Apple."
                  : "You can manage your plan anytime through Apple."
                : "Any subscription you choose is handled securely through Apple, with restore available whenever you need it."}
            </AppText>
            <AppButton
              label={premium.hasPremiumAccess ? "View Premium" : "Explore Premium"}
              onPress={() => router.push("/premium?source=profile")}
              variant="secondary"
            />
          </View>
        </View>

        <View style={cardStyle}>
          <AppText style={styles.sectionKicker}>Appearance</AppText>
          <AppText style={styles.sectionTitle}>Appearance</AppText>
          <View style={[styles.environmentCard, darkMode && styles.environmentCardDark]}>
            <View style={styles.environmentDensityBlock}>
              <AppText style={styles.preferenceTitle}>Appearance</AppText>
              <AppText style={styles.preferenceDescription}>
                Choose a light or dark app appearance.
              </AppText>
              <View style={styles.timeChipRow}>
                {[
                  { id: "light", label: "Light" },
                  { id: "dark", label: "Dark" },
                ].map((option) => {
                  const isSelected = option.id === calmEnvironment.appearance;

                  return (
                    <Pressable
                      key={option.id}
                      onPress={() => {
                        void calmEnvironment.setAppearance(option.id as "light" | "dark");
                      }}
                      style={({ pressed }) => [
                        styles.timeChip,
                        isSelected && styles.timeChipSelected,
                        pressed && styles.timeChipPressed,
                      ]}
                    >
                      <AppText style={[styles.timeChipText, isSelected && styles.timeChipTextSelected]}>
                        {option.label}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            <PreferenceRow
              title="Low Energy Mode"
              description="Simplifies this screen and reduces visual layers."
              value={lowEnergyMode.enabled}
              onValueChange={(value) => {
                void lowEnergyMode.setEnabled(value);
              }}
              disabled={lowEnergyMode.isLoading}
            />
            {lowEnergyMode.enabled ? (
              <View style={styles.settingImpactCard}>
                <AppText style={styles.preferenceTitle}>Low Energy Mode is active</AppText>
                <AppText style={styles.preferenceDescription}>
                  Profile is showing tighter sections with fewer visual details.
                </AppText>
              </View>
            ) : null}
          </View>
        </View>

        <View style={cardStyle}>
          <AppText style={styles.sectionKicker}>Audio</AppText>
          <AppText style={styles.sectionTitle}>Audio</AppText>
          <View style={[styles.environmentCard, darkMode && styles.environmentCardDark]}>
            <PreferenceRow
              title="Sound effects"
              description="Optional gentle sounds for Coach, timers, and support cues."
              value={calmEnvironment.soundEffects}
              onValueChange={(value) => {
                void calmEnvironment.setSoundEffects(value);
              }}
              disabled={calmEnvironment.isLoading}
            />
          </View>
        </View>

        {reminders.notificationsAvailable ? (
          <View style={cardStyle}>
            <AppText style={styles.sectionKicker}>Notifications</AppText>
            <AppText style={styles.sectionTitle}>Notifications</AppText>
            <Pressable
              accessibilityRole="button"
              disabled={reminders.permissionStatus === "granted" || reminders.isSaving}
              onPress={handleNotificationPermissionPress}
              style={({ pressed }) => [
                styles.notificationStatusCard,
                darkMode && styles.notificationStatusCardDark,
                pressed && styles.linkRowPressed,
              ]}
            >
              <View style={styles.preferenceCopy}>
                <AppText style={styles.preferenceTitle}>Enable notifications</AppText>
                <AppText style={styles.preferenceDescription}>
                  {reminders.permissionStatus === "granted"
                    ? "Enabled"
                    : reminders.permissionStatus === "denied"
                      ? "Disabled in iPhone Settings"
                      : "Disabled"}
                </AppText>
              </View>
              <AppText style={styles.inlineLinkText}>
                {reminders.permissionStatus === "granted"
                  ? "Enabled"
                  : reminders.permissionStatus === "denied"
                    ? "Open Settings"
                    : reminders.isSaving
                      ? "Updating..."
                      : "Enable"}
              </AppText>
            </Pressable>
            <View style={styles.notificationSettingsList}>
              <PreferenceRow
                title="Daily check-in reminders"
                description="A gentle afternoon or evening prompt when today’s check-in is not complete."
                value={reminders.dailyCheckInRemindersEnabled}
                onValueChange={(value) => updateReminderPreference({ dailyCheckInRemindersEnabled: value })}
                disabled={reminders.isSaving}
              />
              <View style={styles.subSettingGroup}>
                <PreferenceRow
                  title="Replies to my posts"
                  description="Let me know when someone replies to one of my threads."
                  value={reminders.communityReplyNotificationsEnabled}
                  onValueChange={(value) => updateReminderPreference({ communityReplyNotificationsEnabled: value })}
                  disabled={reminders.isSaving}
                />
                <PreferenceRow
                  title="Reactions to my posts"
                  description="Let me know when someone reacts to one of my posts or replies."
                  value={reminders.communityReactionNotificationsEnabled}
                  onValueChange={(value) => updateReminderPreference({ communityReactionNotificationsEnabled: value })}
                  disabled={reminders.isSaving}
                />
                <PreferenceRow
                  title="Community activity summary"
                  description="Optional updates when new posts appear in categories I opened recently."
                  value={reminders.communityRecentActivityNotificationsEnabled}
                  onValueChange={(value) => updateReminderPreference({ communityRecentActivityNotificationsEnabled: value })}
                  disabled={reminders.isSaving}
                />
              </View>
              <PreferenceRow
                title="Medication reminders"
                description="Daily medication reminders at your selected time."
                value={reminders.medicationRemindersEnabled}
                onValueChange={(value) => updateReminderPreference({ medicationRemindersEnabled: value })}
                disabled={reminders.isSaving}
              />
              <PreferenceRow
                title="Appointment reminders"
                description="Reminders before saved appointments."
                value={reminders.appointmentRemindersEnabled}
                onValueChange={(value) => updateReminderPreference({ appointmentRemindersEnabled: value })}
                disabled={reminders.isSaving}
              />
              {reminders.appointmentRemindersEnabled ? (
                <View style={styles.subSettingGroup}>
                  <PreferenceRow
                    title="1 day before"
                    description="A reminder the day before an appointment."
                    value={reminders.appointmentReminderOneDay}
                    onValueChange={(value) => updateReminderPreference({ appointmentReminderOneDay: value })}
                    disabled={reminders.isSaving}
                  />
                  <PreferenceRow
                    title="1 hour before"
                    description="A reminder shortly before an appointment."
                    value={reminders.appointmentReminderOneHour}
                    onValueChange={(value) => updateReminderPreference({ appointmentReminderOneHour: value })}
                    disabled={reminders.isSaving}
                  />
                </View>
              ) : null}
              <View style={styles.reminderTimingBlock}>
                <View style={styles.preferenceCopy}>
                  <AppText style={styles.preferenceTitle}>Reminder timing</AppText>
                  <AppText style={styles.preferenceDescription}>
                    Medication reminders use {formatReminderTime(reminders.hour, reminders.minute)}.
                  </AppText>
                </View>
                <View style={styles.timeChipRow}>
                  {reminders.timeOptions.map((option) => {
                    const isSelected = reminders.hour === option.hour && reminders.minute === option.minute;

                    return (
                      <Pressable
                        key={option.id}
                        accessibilityRole="button"
                        onPress={() => {
                          void reminders.updateTime(option.hour, option.minute).catch((error) => {
                            Alert.alert("Unable to update reminder time", getErrorMessage(error));
                          });
                        }}
                        disabled={reminders.isSaving}
                        style={({ pressed }) => [
                          styles.timeChip,
                          isSelected && styles.timeChipSelected,
                          pressed && styles.timeChipPressed,
                        ]}
                      >
                        <AppText style={[styles.timeChipText, isSelected && styles.timeChipTextSelected]}>
                          {option.label}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
              <PreferenceRow
                title="Quiet reminders"
                description="Use calm notification delivery without sound."
                value={reminders.quietReminders}
                onValueChange={(value) => updateReminderPreference({ quietReminders: value })}
                disabled={reminders.isSaving}
              />
              {__DEV__ ? (
                <AppButton
                  label="Send test notification"
                  onPress={handleSendTestNotification}
                  variant="secondary"
                />
              ) : null}
            </View>
          </View>
        ) : null}

        <View style={cardStyle}>
          <AppText style={styles.sectionKicker}>Achievements</AppText>
          <AppText style={styles.sectionTitle}>Gentle consistency</AppText>
          <AppText style={styles.preferenceDescription}>
            These celebrate useful app moments, not symptom improvement.
          </AppText>
          {achievementCelebration ? (
            <Animated.View
              style={[
                styles.achievementCelebrationCard,
                {
                  opacity: achievementCelebrationOpacity,
                  transform: [{ translateY: achievementCelebrationY }],
                },
              ]}
            >
              <AppText style={styles.achievementCelebrationIcon}>✓</AppText>
              <View style={styles.preferenceCopy}>
                <AppText style={styles.preferenceTitle}>{achievementCelebration.unlockCopy}</AppText>
                <AppText style={styles.preferenceDescription}>{achievementCelebration.title}</AppText>
              </View>
            </Animated.View>
          ) : null}
          <View style={styles.achievementList}>
            {achievementRows.map((achievement) => (
              <View
                key={achievement.id}
                style={[
                  styles.achievementRow,
                  achievement.completed && styles.achievementRowComplete,
                  achievementCelebration?.id === achievement.id && styles.achievementRowFresh,
                ]}
              >
                <AppText style={styles.achievementIcon}>{achievement.completed ? "✓" : "○"}</AppText>
                <View style={styles.preferenceCopy}>
                  <AppText style={styles.preferenceTitle}>{achievement.title}</AppText>
                  <AppText style={styles.preferenceDescription}>{achievement.body}</AppText>
                </View>
              </View>
            ))}
          </View>
        </View>

        {__DEV__ ? (
          <View style={cardStyle}>
            <AppText style={styles.sectionKicker}>Dev</AppText>
            <AppText style={styles.sectionTitle}>Profile save debug</AppText>
            <AppText style={styles.preferenceDescription}>User id: {user?.id ?? "none"}</AppText>
            <AppText style={styles.preferenceDescription}>
              Last community profile error: {communityProfileError ?? "none"}
            </AppText>
          </View>
        ) : null}

        <View style={cardStyle}>
          <AppText style={styles.sectionKicker}>Care & Data</AppText>
          <AppText style={styles.sectionTitle}>Care and privacy</AppText>
          <LinkRow label="Health Summary" onPress={() => router.push("/health-summary")} />
          <LinkRow label="Export data" onPress={() => router.push("/health-summary")} />
          <LinkRow label="Delete account" onPress={confirmDeleteAccount} />
        </View>

        <View style={cardStyle}>
          <AppText style={styles.sectionKicker}>Support</AppText>
          <AppText style={styles.sectionTitle}>Support and legal</AppText>
          {isAdminQuery.data ? (
            <LinkRow label="Affiliate Dashboard" onPress={() => router.push("/affiliate-admin")} />
          ) : null}
          <LinkRow label="App tour" onPress={requestAppTourReplay} />
          <LinkRow
            label="Contact Support"
            onPress={() => void openTrackedLink(SUPPORT_EMAIL_URL, "support_email_opened", "support@livewithms.com")}
          />
          <LinkRow label="Privacy Policy" onPress={() => void Linking.openURL(PRIVACY_POLICY_URL)} />
          <LinkRow label="Terms of Use" onPress={() => void Linking.openURL(TERMS_OF_USE_URL)} />
          {__DEV__ ? (
            <>
              <PreferenceRow
                title="Enable Premium Testing"
                description="Use a development-only Premium override for local testing."
                value={premium.debugPremiumOverrideActive}
                onValueChange={(value) => {
                  void premium.setDebugPremiumOverride(value);
                }}
              />
              <LinkRow label="Analytics Debug (Dev Only)" onPress={() => router.push("/analytics-debug")} />
            </>
          ) : null}
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
    gap: 18,
  },
  contentSimplified: {
    paddingHorizontal: 18,
    gap: 12,
  },
  contentDark: {
    backgroundColor: "#111827",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#f1e1d4",
    padding: 18,
    gap: 16,
  },
  cardSimplified: {
    padding: 14,
    gap: 12,
    borderRadius: 18,
    borderColor: "#ead8ca",
  },
  cardDark: {
    backgroundColor: "#f8fafc",
    borderColor: "#334155",
  },
  sectionKicker: {
    fontSize: 12,
    fontWeight: "700",
    color: "#c25d10",
    textTransform: "uppercase",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
  },
  accountRow: {
    gap: 4,
  },
  accountLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#c25d10",
    textTransform: "uppercase",
  },
  accountValue: {
    fontSize: 16,
    color: "#1f2937",
  },
  accountActions: {
    gap: 12,
  },
  formField: {
    gap: 8,
  },
  textInput: {
    minHeight: 50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f3dfd1",
    backgroundColor: "#fffaf6",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1f2937",
  },
  helperText: {
    fontSize: 13,
    lineHeight: 18,
    color: "#6b7280",
  },
  preferenceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    borderRadius: 18,
    backgroundColor: "#fffaf6",
    borderWidth: 1,
    borderColor: "#f3dfd1",
    padding: 16,
    minHeight: 84,
  },
  preferenceCopy: {
    flex: 1,
    gap: 6,
  },
  preferenceTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  preferenceDescription: {
    color: "#6b7280",
    lineHeight: 21,
  },
  environmentCard: {
    gap: 14,
    borderRadius: 18,
    backgroundColor: "#fffaf6",
    borderWidth: 1,
    borderColor: "#f3dfd1",
    padding: 16,
  },
  environmentCardDark: {
    backgroundColor: "#f8fafc",
    borderColor: "#cbd5e1",
  },
  environmentDensityBlock: {
    gap: 10,
  },
  settingImpactCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#d7c7ba",
    backgroundColor: "#ffffff",
    padding: 14,
    gap: 6,
  },
  premiumCard: {
    gap: 14,
    borderRadius: 18,
    backgroundColor: "#fffaf6",
    borderWidth: 1,
    borderColor: "#f3dfd1",
    padding: 16,
  },
  premiumHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  premiumCopy: {
    flex: 1,
    gap: 6,
  },
  premiumTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1f2937",
  },
  premiumBody: {
    color: "#6b7280",
    lineHeight: 21,
  },
  premiumBadge: {
    borderRadius: 999,
    backgroundColor: "#fff0e5",
    color: "#b45309",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  premiumBadgeActive: {
    backgroundColor: "#e8f5ea",
    color: "#166534",
  },
  premiumFeatureList: {
    gap: 10,
  },
  premiumFeatureText: {
    color: "#4b5563",
    lineHeight: 20,
  },
  achievementCelebrationCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#f2c29f",
    backgroundColor: "#fff5eb",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  achievementCelebrationIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    textAlign: "center",
    lineHeight: 30,
    fontSize: 15,
    fontWeight: "800",
    color: "#b45309",
    backgroundColor: "#fde6d2",
  },
  achievementList: {
    gap: 10,
  },
  achievementRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f3dfd1",
    backgroundColor: "#ffffff",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  achievementRowComplete: {
    borderColor: "#cde8d2",
    backgroundColor: "#f4fbf5",
  },
  achievementRowFresh: {
    borderColor: "#e8751a",
  },
  achievementIcon: {
    width: 24,
    height: 24,
    borderRadius: 999,
    backgroundColor: "#fff0e5",
    color: "#c25d10",
    fontSize: 14,
    lineHeight: 24,
    fontWeight: "700",
    textAlign: "center",
    overflow: "hidden",
  },
  devPremiumDebugBlock: {
    gap: 6,
    alignItems: "flex-start",
  },
  devPremiumNote: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#d9d0c8",
    backgroundColor: "#fffaf6",
    color: "#6b7280",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  premiumNote: {
    color: "#6b7280",
    lineHeight: 20,
    fontSize: 13,
  },
  notificationStatusCard: {
    minHeight: 66,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#f3dfd1",
    backgroundColor: "#fffaf6",
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
  },
  notificationStatusCardDark: {
    backgroundColor: "#ffffff",
    borderColor: "#cbd5e1",
  },
  notificationSettingsList: {
    gap: 14,
  },
  subSettingGroup: {
    gap: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#f3dfd1",
    backgroundColor: "#fffaf6",
    padding: 12,
  },
  reminderTimingBlock: {
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#f3dfd1",
    backgroundColor: "#fffaf6",
    padding: 14,
  },
  timeChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  timeChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e5d6cb",
    backgroundColor: "#ffffff",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  timeChipSelected: {
    backgroundColor: "#fff0e5",
    borderColor: "#e8751a",
  },
  timeChipPressed: {
    opacity: 0.82,
  },
  timeChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4b5563",
  },
  timeChipTextSelected: {
    color: "#b45309",
  },
  inlineLinkText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#c25d10",
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderRadius: 16,
    backgroundColor: "#fffaf6",
    borderWidth: 1,
    borderColor: "#f3dfd1",
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 54,
  },
  linkRowPressed: {
    opacity: 0.82,
  },
  linkText: {
    flex: 1,
    fontSize: 15,
    color: "#374151",
  },
  linkChevron: {
    fontSize: 18,
    color: "#9ca3af",
  },
});
