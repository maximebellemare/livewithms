import { useState } from "react";
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Switch, View } from "react-native";
import { router } from "expo-router";
import AppButton from "../../../../components/ui/AppButton";
import AppScreen from "../../../../components/ui/AppScreen";
import AppText from "../../../../components/ui/AppText";
import { useDeleteAccount } from "../../../../features/account/hooks";
import { useAuth } from "../../../../features/auth/hooks";
import { getCareWins, getCheckInsInLastDays, getCurrentCheckInStreak } from "../../../../features/checkins/consistency";
import { useCheckInOverview } from "../../../../features/checkins/hooks";
import { useGrowthState } from "../../../../features/growth/hooks";
import { usePremium } from "../../../../features/premium/hooks";
import { useSaveProfileStep } from "../../../../features/profile/hooks";
import { useReminderSettings } from "../../../../features/reminders/hooks";
import { getErrorMessage } from "../../../../lib/errors";
import { preventPsychologicalSegmentation } from "../../../../lib/ethical-insights/anti-profiling/preventPsychologicalSegmentation";
import { validateNonExploitativeAnalytics } from "../../../../lib/ethical-insights/anti-profiling/validateNonExploitativeAnalytics";
import { deriveAccessibilityMetrics } from "../../../../lib/ethical-insights/calm-analytics/deriveAccessibilityMetrics";
import { deriveCalmnessMetrics } from "../../../../lib/ethical-insights/calm-analytics/deriveCalmnessMetrics";
import { deriveResearchParticipation } from "../../../../lib/ethical-insights/human-centered-research/deriveResearchParticipation";
import { validateEthicalResearchUse } from "../../../../lib/ethical-insights/human-centered-research/validateEthicalResearchUse";
import { deriveAnonymizedPatterns } from "../../../../lib/ethical-insights/population-patterns/deriveAnonymizedPatterns";
import { deriveHumanReadableTransparency } from "../../../../lib/ethical-insights/transparent-governance/deriveHumanReadableTransparency";
import { validateOptOutClarity } from "../../../../lib/ethical-insights/transparent-governance/validateOptOutClarity";
import { trackEvent } from "../../../../lib/events";
import { derivePremiumValue } from "../../../../lib/premium-ecosystem/calm-premium/derivePremiumValue";
import { preserveFreeUserDignity } from "../../../../lib/premium-ecosystem/calm-premium/preserveFreeUserDignity";
import { preventEmotionalConversion } from "../../../../lib/premium-ecosystem/ethical-monetization/preventEmotionalConversion";
import { derivePauseSupport } from "../../../../lib/legacy-integrity/graceful-pauses/derivePauseSupport";
import { preserveCalmDisengagement } from "../../../../lib/legacy-integrity/graceful-pauses/preserveCalmDisengagement";
import { deriveHealthyDistance } from "../../../../lib/legacy-integrity/healthy-completion/deriveHealthyDistance";
import { preventRetentionClinginess } from "../../../../lib/legacy-integrity/healthy-completion/preventRetentionClinginess";
import { deriveDeletionClarity } from "../../../../lib/legacy-integrity/data-ownership/deriveDeletionClarity";
import { validateOwnershipTransparency } from "../../../../lib/legacy-integrity/data-ownership/validateOwnershipTransparency";
import { deriveGentleReturnFlows } from "../../../../lib/legacy-integrity/calm-reentry/deriveGentleReturnFlows";
import { preventGuiltReactivation } from "../../../../lib/legacy-integrity/calm-reentry/preventGuiltReactivation";

const PRIVACY_POLICY_URL = "https://www.livewithms.com/policies/privacy-policy";
const TERMS_OF_USE_URL = "https://www.livewithms.com/policies/terms-of-service";
const SUPPORT_EMAIL_URL = "mailto:support@livewithms.com";
const FEEDBACK_EMAIL_URL = "mailto:support@livewithms.com?subject=LiveWithMS%20Feedback";
const NATIONAL_MS_SOCIETY_URL = "https://www.nationalmssociety.org/";
const MAYO_MS_URL = "https://www.mayoclinic.org/diseases-conditions/multiple-sclerosis";
const NHS_MS_URL = "https://www.nhs.uk/conditions/multiple-sclerosis/";

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

function getReminderHelperText(
  enabled: boolean,
  permissionStatus: "unknown" | "granted" | "denied" | "unavailable",
  selectedTimeLabel: string,
) {
  if (permissionStatus === "unavailable") {
    return "Reminders need native notification support in this build before they can be turned on.";
  }

  if (permissionStatus === "denied") {
    return "Notifications are currently turned off. You can enable them later from iPhone Settings.";
  }

  if (enabled) {
    return `A gentle reminder is set for ${selectedTimeLabel}.`;
  }

  return "Gentle reminders are optional, flexible, and there when a little support helps.";
}

function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

async function openTrackedLink(url: string, eventName: "feedback_email_opened" | "support_email_opened") {
  await trackEvent(eventName);
  await Linking.openURL(url);
}

export default function ProfileScreen() {
  const { user, isMockMode, signOut } = useAuth();
  const deleteAccount = useDeleteAccount();
  const resetOnboarding = useSaveProfileStep();
  const overviewQuery = useCheckInOverview(user?.id);
  const reminders = useReminderSettings();
  const premium = usePremium();
  const [reduceMotionEnabled, setReduceMotionEnabled] = useState(false);
  const [comfortSpacingEnabled, setComfortSpacingEnabled] = useState(true);
  const overviewEntries = overviewQuery.data ?? [];
  const totalCheckIns = overviewEntries.length;
  const streak = getCurrentCheckInStreak(overviewEntries, getTodayDateString());
  const weeklyCheckIns = getCheckInsInLastDays(overviewEntries, getTodayDateString(), 7);
  const wins = getCareWins(overviewEntries);
  const growth = useGrowthState({
    totalCheckIns,
    reminderEnabled: reminders.enabled,
  });
  const premiumValue = derivePremiumValue();
  const legacyPause = derivePauseSupport({
    lowEngagement: weeklyCheckIns === 0,
    wantsDistance: totalCheckIns > 0,
  });
  const legacyDistance = deriveHealthyDistance({
    totalCheckIns,
    wantsLessIllnessCentrality: totalCheckIns > 0,
  });
  const legacyReturn = deriveGentleReturnFlows({
    hasHistory: totalCheckIns > 0,
  });
  const ownershipLines = [
    legacyPause.body,
    legacyDistance,
    deriveDeletionClarity(),
    legacyReturn,
  ].map((line) =>
    preventGuiltReactivation(
      preventRetentionClinginess(
        preserveCalmDisengagement(line),
      ),
    ),
  );
  const safeOwnershipLines = validateOwnershipTransparency(ownershipLines).valid ? ownershipLines : [deriveDeletionClarity()];
  const transparencyLines = deriveHumanReadableTransparency().map((line) =>
    preventPsychologicalSegmentation(line),
  );
  const safeTransparencyLines =
    validateNonExploitativeAnalytics(transparencyLines).valid && validateOptOutClarity(transparencyLines).valid
      ? transparencyLines
      : ["Any grouped insight work should stay low-resolution, optional where appropriate, and never exploit distress."];
  const researchParticipation = deriveResearchParticipation();
  const safeResearchLines = validateEthicalResearchUse(researchParticipation.lines).valid
    ? researchParticipation.lines
    : ["Future research participation should stay transparent, optional, and easy to decline."];
  const anonymizedPatternLine = deriveAnonymizedPatterns({
    topic: "calmness",
    dominantPattern: "simpler support during heavier stretches",
    cohortSize: 72,
  });
  const calmnessMetricLine = deriveCalmnessMetrics()[0]?.purpose;
  const accessibilityMetricLine = deriveAccessibilityMetrics()[0]?.purpose;

  const confirmDeleteAccount = () => {
    Alert.alert(
      "Delete account",
      preventGuiltReactivation(
        preserveCalmDisengagement(
          "Delete your account and app data permanently? This cannot be undone, and stepping away is okay if you need less of this now.",
        ),
      ),
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
      Alert.alert("Account deleted", "Your account and app data have been permanently deleted. You do not need to keep anything active here for your experience to remain yours.", [
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
      router.replace("/welcome");
    } catch (error) {
      Alert.alert("Unable to reset onboarding", getErrorMessage(error));
    }
  };

  const handleReminderToggle = (nextValue: boolean) => {
    if (!nextValue) {
      void reminders.disableReminders().catch((error) => {
        Alert.alert("Unable to update reminders", getErrorMessage(error));
      });
      return;
    }

    Alert.alert(
      "Gentle reminders",
      "Gentle reminders can help you build a consistent check-in routine.",
      [
        {
          text: "Not now",
          style: "cancel",
        },
        {
          text: "Continue",
          onPress: () => {
            void (async () => {
              try {
                const result = await reminders.enableReminders();

                if ("status" in result) {
                  const { status } = result;

                  if (status === "denied") {
                    Alert.alert(
                      "Notifications are off",
                      "You can still use the app normally. If you want reminders later, you can enable notifications in iPhone Settings.",
                      [
                        {
                          text: "OK",
                          style: "cancel",
                        },
                        {
                          text: "Open Settings",
                          onPress: () => {
                            void Linking.openSettings();
                          },
                        },
                      ],
                    );
                    return;
                  }

                  if (status === "unavailable") {
                    Alert.alert(
                      "Reminders aren’t ready yet",
                      "This build does not have native notifications available yet, so reminders can’t be scheduled right now.",
                    );
                  }
                }

                if (result.ok) {
                  await growth.recordEvent("reminder_enabled", {
                    source: "profile",
                    hour: reminders.hour,
                    minute: reminders.minute,
                  });
                }
              } catch (error) {
                Alert.alert("Unable to update reminders", getErrorMessage(error));
              }
            })();
          },
        },
      ],
    );
  };

  const handleReminderTimeChange = (hour: number, minute: number) => {
    void reminders
      .updateTime(hour, minute)
      .then(async () => {
        await growth.recordEvent("reminder_time_changed", {
          hour,
          minute,
        });
      })
      .catch((error) => {
        Alert.alert("Unable to change reminder time", getErrorMessage(error));
      });
  };

  return (
    <AppScreen
      title="Profile"
      subtitle="Manage your account, preferences, and support in one calm place."
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
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

        <View style={styles.card}>
          <AppText style={styles.sectionTitle}>Premium</AppText>
          <View style={styles.premiumCard}>
            <View style={styles.premiumHeader}>
              <View style={styles.premiumCopy}>
                <AppText style={styles.premiumTitle}>
                  {premium.hasPremiumAccess ? "Premium is active" : "LiveWithMS Premium"}
                </AppText>
                <AppText style={styles.premiumBody}>
                  {premium.hasPremiumAccess
                    ? "Unlimited AI Coach is ready, and your premium support stays available across the app."
                    : preserveFreeUserDignity(
                        preventEmotionalConversion(
                          "Keep the free core experience, or unlock unlimited AI Coach and more personalized support over time.",
                        ),
                      )}
                </AppText>
              </View>
              <AppText style={[styles.premiumBadge, premium.hasPremiumAccess && styles.premiumBadgeActive]}>
                {premium.hasPremiumAccess ? "Active" : "Optional"}
              </AppText>
            </View>
            <View style={styles.premiumFeatureList}>
              {premiumValue.lines.map((line) => (
                <AppText key={line} style={styles.premiumFeatureText}>• {line}</AppText>
              ))}
            </View>
            <AppButton
              label={premium.hasPremiumAccess ? "View Premium" : "Explore Premium"}
              onPress={() => router.push("/premium?source=profile")}
              variant="secondary"
            />
          </View>
        </View>

        <View style={styles.card}>
          <AppText style={styles.sectionTitle}>App Preferences</AppText>
          <AppText style={styles.sectionBody}>
            Keep the app feeling supportive in a way that works for you. These settings are local to this device for now.
          </AppText>
          <PreferenceRow
            title="Gentle reminders"
            description={getReminderHelperText(
              reminders.enabled,
              reminders.permissionStatus,
              reminders.selectedTimeLabel,
            )}
            value={reminders.enabled}
            onValueChange={handleReminderToggle}
            disabled={reminders.isLoading || reminders.isSaving}
          />
          <View style={styles.reminderCard}>
            <View style={styles.reminderHeader}>
              <View style={styles.reminderCopy}>
                <AppText style={styles.preferenceTitle}>Reminder time</AppText>
                <AppText style={styles.preferenceDescription}>
                  Pick a calm time for one daily reminder.
                </AppText>
              </View>
              <AppText style={styles.reminderTimeLabel}>{reminders.selectedTimeLabel}</AppText>
            </View>
            <View style={styles.timeChipRow}>
              {reminders.timeOptions.map((option) => {
                const isSelected =
                  option.hour === reminders.hour && option.minute === reminders.minute;

                return (
                  <Pressable
                    key={option.id}
                    onPress={() => handleReminderTimeChange(option.hour, option.minute)}
                    disabled={reminders.isLoading || reminders.isSaving}
                    style={({ pressed }) => [
                      styles.timeChip,
                      isSelected && styles.timeChipSelected,
                      pressed && !reminders.isLoading && !reminders.isSaving && styles.timeChipPressed,
                    ]}
                  >
                    <AppText style={[styles.timeChipText, isSelected && styles.timeChipTextSelected]}>
                      {option.label}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
            {reminders.permissionStatus === "denied" ? (
              <Pressable
                onPress={() => {
                  void Linking.openSettings();
                }}
                style={({ pressed }) => [styles.inlineLink, pressed && styles.inlineLinkPressed]}
              >
                <AppText style={styles.inlineLinkText}>Open iPhone Settings</AppText>
              </Pressable>
            ) : null}
          </View>
          <PreferenceRow
            title="Reduce motion"
            description="Use a calmer feel with less movement where possible."
            value={reduceMotionEnabled}
            onValueChange={setReduceMotionEnabled}
          />
          <PreferenceRow
            title="Comfort spacing"
            description="Keep layouts feeling roomy and easy to scan."
            value={comfortSpacingEnabled}
            onValueChange={setComfortSpacingEnabled}
          />
        </View>

        <View style={styles.card}>
          <AppText style={styles.sectionTitle}>Consistency</AppText>
          {totalCheckIns > 0 ? (
            <>
              <View style={styles.consistencyGrid}>
                <View style={styles.consistencyPill}>
                  <AppText style={styles.consistencyValue}>{streak}</AppText>
                  <AppText style={styles.consistencyLabel}>
                    {streak === 1 ? "day streak" : "day streak"}
                  </AppText>
                </View>
                <View style={styles.consistencyPill}>
                  <AppText style={styles.consistencyValue}>{totalCheckIns}</AppText>
                  <AppText style={styles.consistencyLabel}>
                    {totalCheckIns === 1 ? "total check-in" : "total check-ins"}
                  </AppText>
                </View>
                <View style={styles.consistencyPill}>
                  <AppText style={styles.consistencyValue}>{weeklyCheckIns}</AppText>
                  <AppText style={styles.consistencyLabel}>days this week</AppText>
                </View>
              </View>
              <AppText style={styles.sectionBody}>
                {weeklyCheckIns >= 5
                  ? "You’ve been returning steadily this week."
                  : streak > 1
                    ? "You’ve checked in consistently."
                    : "Small steps add up."}
              </AppText>
            </>
          ) : (
            <AppText style={styles.sectionBody}>
              Your consistency will start to grow here one check-in at a time.
            </AppText>
          )}

          <View style={styles.metricsCard}>
            <AppText style={styles.preferenceTitle}>Your app rhythm</AppText>
            <View style={styles.metricRow}>
              <AppText style={styles.metricLabel}>Days active</AppText>
              <AppText style={styles.metricValue}>{growth.metrics.daysActive}</AppText>
            </View>
            <View style={styles.metricRow}>
              <AppText style={styles.metricLabel}>Check-in rhythm</AppText>
              <AppText style={styles.metricValue}>
                {growth.metrics.checkInFrequency > 0
                  ? `${growth.metrics.checkInFrequency}/day`
                  : "Just getting started"}
              </AppText>
            </View>
            <View style={styles.metricRow}>
              <AppText style={styles.metricLabel}>Reminders</AppText>
              <AppText style={styles.metricValue}>
                {growth.metrics.reminderEnabled ? "Enabled" : "Off"}
              </AppText>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <AppText style={styles.sectionTitle}>Support & Legal</AppText>
          <AppText style={styles.sectionBody}>
            Find the main policies, medical context, and support options here whenever you need them.
          </AppText>
          <LinkRow label="Health Summary" onPress={() => router.push("/health-summary")} />
          <LinkRow label="Privacy Policy" onPress={() => void Linking.openURL(PRIVACY_POLICY_URL)} />
          <LinkRow label="Terms of Use" onPress={() => void Linking.openURL(TERMS_OF_USE_URL)} />
          <LinkRow label="Medical Disclaimer" onPress={() => router.push("/medical-disclaimer")} />
          <LinkRow label="Contact Support" onPress={() => void openTrackedLink(SUPPORT_EMAIL_URL, "support_email_opened")} />
          <LinkRow label="Send Feedback" onPress={() => void openTrackedLink(FEEDBACK_EMAIL_URL, "feedback_email_opened")} />
        </View>

        <View style={styles.card}>
          <AppText style={styles.sectionTitle}>Pause & Ownership</AppText>
          <AppText style={styles.sectionBody}>
            Use the app when it helps. Step back when it does not. Your history belongs to you, not to the platform.
          </AppText>
          {safeOwnershipLines.map((line) => (
            <AppText key={line} style={styles.sectionBody}>
              • {line}
            </AppText>
          ))}
          <LinkRow label="Open Health Summary" onPress={() => router.push("/health-summary")} />
        </View>

        <View style={styles.card}>
          <AppText style={styles.sectionTitle}>Data & Privacy</AppText>
          <AppText style={styles.sectionBody}>
            Your check-ins, notes, and care tools are tied to your own account and are meant to stay private to you.
          </AppText>
          {safeTransparencyLines.map((line) => (
            <AppText key={line} style={styles.sectionBody}>
              {line}
            </AppText>
          ))}
          <AppText style={styles.sectionBody}>{anonymizedPatternLine}</AppText>
          {calmnessMetricLine ? <AppText style={styles.sectionBody}>{calmnessMetricLine}</AppText> : null}
          {accessibilityMetricLine ? <AppText style={styles.sectionBody}>{accessibilityMetricLine}</AppText> : null}
          {safeResearchLines.map((line) => (
            <AppText key={line} style={styles.sectionBody}>
              {line}
            </AppText>
          ))}
          <View style={styles.sourceLinks}>
            <LinkRow
              label="National Multiple Sclerosis Society"
              onPress={() => void Linking.openURL(NATIONAL_MS_SOCIETY_URL)}
            />
            <LinkRow
              label="Mayo Clinic Multiple Sclerosis"
              onPress={() => void Linking.openURL(MAYO_MS_URL)}
            />
            <LinkRow
              label="NHS Multiple Sclerosis"
              onPress={() => void Linking.openURL(NHS_MS_URL)}
            />
          </View>

          <View style={styles.winsSection}>
            <AppText style={styles.preferenceTitle}>Small wins</AppText>
            {wins.length > 0 ? (
              <View style={styles.winsList}>
                {wins.map((win) => (
                  <View key={win} style={styles.winPill}>
                    <AppText style={styles.winText}>{win}</AppText>
                  </View>
                ))}
              </View>
            ) : (
              <AppText style={styles.preferenceDescription}>
                Wins will show up here as you check in and reflect over time.
              </AppText>
            )}
          </View>

          {__DEV__ ? (
            <LinkRow label="Analytics Debug (Dev Only)" onPress={() => router.push("/analytics-debug")} />
          ) : null}

          <View style={styles.dangerCard}>
            <AppText style={styles.dangerTitle}>Delete account</AppText>
            <AppText style={styles.dangerBody}>
              If you no longer want to use LiveWithMS, you can permanently delete your account and app data.
            </AppText>
            <Pressable
              onPress={confirmDeleteAccount}
              disabled={deleteAccount.isPending}
              style={({ pressed }) => [
                styles.deleteButton,
                pressed && !deleteAccount.isPending && styles.deleteButtonPressed,
                deleteAccount.isPending && styles.deleteButtonDisabled,
              ]}
            >
              <AppText style={styles.deleteButtonText}>
                {deleteAccount.isPending ? "Deleting account..." : "Delete account"}
              </AppText>
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
    gap: 16,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#f1e1d4",
    padding: 18,
    gap: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
  },
  sectionBody: {
    color: "#4b5563",
    lineHeight: 22,
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
    gap: 10,
  },
  consistencyGrid: {
    gap: 10,
  },
  consistencyPill: {
    borderRadius: 18,
    backgroundColor: "#fffaf6",
    borderWidth: 1,
    borderColor: "#f3dfd1",
    padding: 14,
    gap: 2,
  },
  consistencyValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1f2937",
  },
  consistencyLabel: {
    fontSize: 13,
    color: "#6b7280",
  },
  metricsCard: {
    gap: 10,
    borderRadius: 18,
    backgroundColor: "#fffaf6",
    borderWidth: 1,
    borderColor: "#f3dfd1",
    padding: 14,
  },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  metricLabel: {
    flex: 1,
    color: "#6b7280",
    lineHeight: 20,
  },
  metricValue: {
    color: "#1f2937",
    fontWeight: "600",
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
    padding: 14,
  },
  preferenceCopy: {
    flex: 1,
    gap: 4,
  },
  preferenceTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  preferenceDescription: {
    color: "#6b7280",
    lineHeight: 20,
  },
  reminderCard: {
    gap: 12,
    borderRadius: 18,
    backgroundColor: "#fffaf6",
    borderWidth: 1,
    borderColor: "#f3dfd1",
    padding: 14,
  },
  premiumCard: {
    gap: 12,
    borderRadius: 18,
    backgroundColor: "#fffaf6",
    borderWidth: 1,
    borderColor: "#f3dfd1",
    padding: 14,
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
    lineHeight: 20,
  },
  premiumBadge: {
    borderRadius: 999,
    backgroundColor: "#fff0e5",
    color: "#b45309",
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: 10,
    paddingVertical: 6,
    overflow: "hidden",
  },
  premiumBadgeActive: {
    backgroundColor: "#e8f5ea",
    color: "#166534",
  },
  premiumFeatureList: {
    gap: 8,
  },
  premiumFeatureText: {
    color: "#4b5563",
    lineHeight: 20,
  },
  reminderHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  reminderCopy: {
    flex: 1,
    gap: 4,
  },
  reminderTimeLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#c25d10",
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
  inlineLink: {
    alignSelf: "flex-start",
  },
  inlineLinkPressed: {
    opacity: 0.82,
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
    paddingHorizontal: 14,
    paddingVertical: 13,
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
  sourceLinks: {
    gap: 10,
  },
  winsSection: {
    gap: 10,
  },
  winsList: {
    gap: 10,
  },
  winPill: {
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: "#fffaf6",
    borderWidth: 1,
    borderColor: "#f3dfd1",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  winText: {
    color: "#6b7280",
    fontSize: 14,
    fontWeight: "600",
  },
  dangerCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#f5c2c7",
    backgroundColor: "#fff7f7",
    padding: 16,
    gap: 10,
  },
  dangerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#991b1b",
  },
  dangerBody: {
    color: "#7f1d1d",
    lineHeight: 21,
  },
  deleteButton: {
    borderRadius: 14,
    backgroundColor: "#b91c1c",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  deleteButtonPressed: {
    opacity: 0.84,
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  deleteButtonText: {
    textAlign: "center",
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});
