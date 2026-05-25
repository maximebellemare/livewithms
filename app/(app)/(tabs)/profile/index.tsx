import { useEffect, useState } from "react";
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from "react-native";
import { router } from "expo-router";
import { useCalmEnvironment } from "../../../../features/calm-environment/hooks";
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
import { resetOnboardingSupportPreferences } from "../../../../features/onboarding/preferences";
import { getErrorMessage } from "../../../../lib/errors";
import { trackEvent } from "../../../../lib/events";
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
  const deleteAccount = useDeleteAccount();
  const resetOnboarding = useSaveProfileStep();
  const reminders = useReminderSettings();
  const premium = usePremium();
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
      eyebrow="Settings"
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
                  Entitlement active: {premium.revenueCatEntitlementActive ? "true" : "false"}
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
