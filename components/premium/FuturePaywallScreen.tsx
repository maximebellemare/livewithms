import { useEffect, useMemo, useState } from "react";
import { Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import AppButton from "../ui/AppButton";
import CalmSkeleton from "../ui/CalmSkeleton";
import AppScreen from "../ui/AppScreen";
import AppText from "../ui/AppText";
import PlanOptionCard from "./PlanOptionCard";
import { usePremium } from "../../features/premium/hooks";
import type { PremiumOfferingPackage, PremiumPlan } from "../../features/premium/types";
import { getLocalizedStorePrice } from "../../features/premium/display";
import { trackEvent, trackRetryTriggered } from "../../lib/events";
import { colors } from "../ui/design";
import { isExpoGo } from "../../lib/revenueCatEnvironment";

const PRIVACY_POLICY_URL = "https://www.livewithms.com/policies/privacy-policy";
const TERMS_OF_USE_URL = "https://www.livewithms.com/policies/terms-of-service";
const APPLE_EULA_URL = "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/";

const PREMIUM_BENEFITS = [
  "Track symptoms, sleep, water, mood, energy, and habits in one place.",
  "Notice patterns over time and get clearer summaries from your own data.",
  "Talk to the AI Coach when you feel tired, overwhelmed, or unsure.",
  "Build nutrition plans, grocery lists, and food check-ins that support your day.",
  "Use brain games, daily plans, and community support to stay consistent.",
  "Prepare better notes for doctor visits and everyday symptom decisions.",
];

type FuturePaywallScreenProps = {
  onClose: () => void;
  requiredAccess?: boolean;
  onRequiredExit?: () => void;
};

type TrialDetails = {
  shortLabel: string;
  fullLabel: string;
  days: number | null;
};

function parseIsoTrialLabel(period: string | null | undefined) {
  if (!period) {
    return null;
  }

  const dayMatch = /^P(\d+)D$/i.exec(period);
  if (dayMatch) {
    const days = Number(dayMatch[1]);
    return {
      shortLabel: `${days} day${days === 1 ? "" : "s"} free`,
      fullLabel: `${days} days free`,
      days,
    };
  }

  const weekMatch = /^P(\d+)W$/i.exec(period);
  if (weekMatch) {
    const weeks = Number(weekMatch[1]);
    return {
      shortLabel: `${weeks} week${weeks === 1 ? "" : "s"} free`,
      fullLabel: `${weeks} week${weeks === 1 ? "" : "s"} free`,
      days: weeks * 7,
    };
  }

  const monthMatch = /^P(\d+)M$/i.exec(period);
  if (monthMatch) {
    const months = Number(monthMatch[1]);
    return {
      shortLabel: `${months} month${months === 1 ? "" : "s"} free`,
      fullLabel: `${months} month${months === 1 ? "" : "s"} free`,
      days: null,
    };
  }

  return null;
}

function getTrialDetails(pkg: PremiumOfferingPackage | null | undefined): TrialDetails | null {
  if (!pkg?.introductoryOffer?.isFreeTrial) {
    return null;
  }

  const parsed = parseIsoTrialLabel(pkg.freeTrialPeriod ?? pkg.introductoryOffer.period ?? null);
  if (parsed) {
    return parsed;
  }

  if (
    typeof pkg.introductoryOffer.periodNumberOfUnits === "number" &&
    pkg.introductoryOffer.periodUnit
  ) {
    const amount = pkg.introductoryOffer.periodNumberOfUnits;
    const unit = pkg.introductoryOffer.periodUnit.toLowerCase();
    return {
      shortLabel: `${amount} ${unit}${amount === 1 ? "" : "s"} free`,
      fullLabel: `${amount} ${unit}${amount === 1 ? "" : "s"} free`,
      days: unit === "day" ? amount : null,
    };
  }

  return {
    shortLabel: "Free trial available",
    fullLabel: "Free trial available",
    days: null,
  };
}

function getPlanRenewalCopy(plan: PremiumPlan, pkg: PremiumOfferingPackage | null | undefined) {
  const trial = getTrialDetails(pkg);
  const price = getLocalizedStorePrice(pkg);
  const cadence = plan === "yearly" ? "year" : "month";

  if (trial) {
    return `${trial.shortLabel}, then ${price}/${cadence}`;
  }

  return `${price}/${cadence}`;
}

export default function FuturePaywallScreen({
  onClose,
  requiredAccess = false,
  onRequiredExit,
}: FuturePaywallScreenProps) {
  const premium = usePremium();
  const [selectedPlan, setSelectedPlan] = useState<PremiumPlan>("yearly");
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);
  const [purchaseSuccessMessage, setPurchaseSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    void trackEvent("paywall_viewed", {
      source: requiredAccess ? "premium-gate" : "premium-screen",
    });
  }, [requiredAccess]);

  const openPrivacyPolicy = () => {
    void Linking.openURL(PRIVACY_POLICY_URL);
  };

  const openTermsOfUse = () => {
    void Linking.openURL(TERMS_OF_USE_URL);
  };

  const openEula = () => {
    void Linking.openURL(APPLE_EULA_URL);
  };

  const monthlyPackage = premium.currentOffering?.monthly ?? null;
  const yearlyPackage = premium.currentOffering?.yearly ?? null;
  const selectedPackage = premium.currentOffering?.[selectedPlan] ?? null;
  const showPlans = !premium.hasPremiumAccess;
  const expoGoPricingFallback = isExpoGo() && !premium.currentOffering;
  const showLoadingPricingShell = premium.isLoading && !premium.currentOffering && !premium.offeringsErrorMessage;
  const monthlyPrice = expoGoPricingFallback ? "Monthly plan" : getLocalizedStorePrice(monthlyPackage);
  const yearlyPrice = expoGoPricingFallback ? "Yearly plan" : getLocalizedStorePrice(yearlyPackage);
  const selectedPlanTrial = getTrialDetails(selectedPackage);
  const yearlyTrial = getTrialDetails(yearlyPackage);
  const monthlyTrial = getTrialDetails(monthlyPackage);
  const anyTrial = selectedPlanTrial ?? yearlyTrial ?? monthlyTrial;
  const heroTitle = anyTrial?.days === 3 ? "Start your 3-day free trial" : "Unlock your personalized MS support plan";
  const heroSubtitle =
    "Track symptoms, notice patterns, talk things through with Coach, and stay organized with one calm plan for daily life with MS.";
  const heroBody =
    "Premium includes full access to tracking, insights, Coach, nutrition support, brain games, doctor-visit prep, and community support.";
  const purchaseLabel = premium.isPurchasing
    ? selectedPlanTrial
      ? `Starting ${selectedPlanTrial.shortLabel.toLowerCase()}...`
      : "Starting Premium..."
    : selectedPlanTrial
      ? `Start ${selectedPlanTrial.shortLabel.toLowerCase()}`
      : "Start Premium";
  const purchaseCaption = selectedPlanTrial
    ? `Cancel anytime before the trial ends to avoid being charged.`
    : "Subscription renews automatically unless canceled before renewal.";
  const blockedAccessCopy = requiredAccess
    ? "LiveWithMS Premium is now required to continue. Start your trial or subscription to keep your tracking, Coach, nutrition, programs, and community support in one place."
    : null;

  const handlePurchase = async () => {
    if (!selectedPackage || premium.isPurchasing) {
      return;
    }

    setPurchaseError(null);
    setRestoreMessage(null);
    setPurchaseSuccessMessage(null);

    await trackEvent("upgrade_clicked", {
      plan: selectedPlan,
      source: requiredAccess ? "premium-gate" : "premium-screen",
    });
    await trackEvent("purchase_started", {
      plan: selectedPlan,
    });

    const result = await premium.purchasePlan(selectedPlan);

    if (result.success && !result.cancelled) {
      await trackEvent("purchase_completed", {
        plan: selectedPlan,
      });
      const successMessage = selectedPlanTrial
        ? `${selectedPlanTrial.fullLabel} started.`
        : "Premium access started.";
      setPurchaseSuccessMessage(successMessage);
      Alert.alert("You're in.", successMessage, [{ text: "Continue", onPress: onClose }]);
      return;
    }

    if (result.message && !result.cancelled) {
      setPurchaseError(result.message);
      Alert.alert("Unable to start Premium", result.message);
    }
  };

  const handleRestore = async () => {
    setPurchaseError(null);
    setPurchaseSuccessMessage(null);
    const result = await premium.restorePurchases();

    if (result.success) {
      await trackEvent("restore_completed", {
        status: "success",
      });
      setRestoreMessage(result.message ?? "Premium restored.");
      Alert.alert("Premium restored.", result.message ?? "Premium restored.", [
        { text: "Continue", onPress: onClose },
      ]);
      return;
    }

    if (result.message) {
      setPurchaseError(result.message);
      Alert.alert("Restore failed", result.message);
    }
  };

  const handleSelectPlan = (plan: PremiumPlan) => {
    setSelectedPlan(plan);
    setPurchaseError(null);
    setRestoreMessage(null);
    void trackEvent("subscription_plan_selected", {
      plan,
      source: requiredAccess ? "premium-gate" : "premium-screen",
    });
  };

  return (
    <AppScreen title="LiveWithMS Premium" subtitle="Full access to your personalized MS support tools.">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <View pointerEvents="none" style={styles.heroGlowPrimary} />
          <View pointerEvents="none" style={styles.heroGlowSecondary} />
          <AppText style={styles.heroEyebrow}>LiveWithMS Premium</AppText>
          <AppText style={styles.heroTitle}>{heroTitle}</AppText>
          <AppText style={styles.heroSubtitle}>{heroSubtitle}</AppText>
          <AppText style={styles.heroBody}>{heroBody}</AppText>
        </View>

        {blockedAccessCopy ? (
          <View style={styles.requiredCard}>
            <AppText style={styles.requiredTitle}>Premium is now required to continue</AppText>
            <AppText style={styles.requiredBody}>{blockedAccessCopy}</AppText>
          </View>
        ) : null}

        <View style={styles.benefitsCard}>
          <AppText style={styles.sectionTitle}>What Premium unlocks</AppText>
          <View style={styles.bulletList}>
            {PREMIUM_BENEFITS.map((line) => (
              <AppText key={line} style={styles.bulletText}>• {line}</AppText>
            ))}
          </View>
        </View>

        {premium.hasPremiumAccess ? (
          <View style={styles.activeCard}>
            <AppText style={styles.activeTitle}>Premium is active</AppText>
            <AppText style={styles.activeBody}>
              Your subscription is active, so you can keep using the full LiveWithMS experience.
            </AppText>
            <AppButton
              label={premium.isLoading ? "Refreshing..." : "Continue"}
              onPress={onClose}
              variant="secondary"
              disabled={premium.isLoading}
            />
          </View>
        ) : null}

        {showPlans ? (
          <>
            {showLoadingPricingShell ? (
              <View style={styles.statusCard}>
                <AppText style={styles.sectionTitle}>Loading pricing</AppText>
                <AppText style={styles.statusBody}>
                  Checking the latest App Store or Google Play pricing for this device.
                </AppText>
                <View style={styles.loadingSkeletonGroup}>
                  <CalmSkeleton width="64%" height={12} />
                  <CalmSkeleton width="86%" height={12} />
                </View>
              </View>
            ) : null}

            {premium.offeringsErrorMessage ? (
              <View style={styles.statusCard}>
                <AppText style={styles.sectionTitle}>Pricing is taking a moment</AppText>
                <AppText style={styles.statusBody}>{premium.offeringsErrorMessage}</AppText>
                <AppButton
                  label={premium.isLoading ? "Retrying..." : "Retry pricing"}
                  onPress={() => {
                    void trackRetryTriggered("premium-refresh");
                    void premium.refreshPremiumStatus();
                  }}
                  variant="secondary"
                  disabled={premium.isLoading}
                />
              </View>
            ) : null}

            <View style={styles.pricingSummaryCard}>
              <AppText style={styles.sectionTitle}>Choose your plan</AppText>
              <AppText style={styles.statusBody}>
                Yearly is selected by default for the best overall value. Monthly stays available if you want a more flexible option.
              </AppText>
              <View style={styles.pricingSnapshot}>
                <View style={styles.pricingPill}>
                  <AppText style={styles.pricingLabel}>Monthly</AppText>
                  {showLoadingPricingShell ? (
                    <CalmSkeleton width="70%" height={28} radius={10} />
                  ) : (
                    <>
                      <AppText style={styles.pricingValue}>{monthlyPrice}</AppText>
                      <AppText style={styles.pricingHint}>{getPlanRenewalCopy("monthly", monthlyPackage)}</AppText>
                    </>
                  )}
                </View>
                <View style={styles.pricingPill}>
                  <AppText style={styles.pricingLabel}>Yearly</AppText>
                  {showLoadingPricingShell ? (
                    <CalmSkeleton width="74%" height={28} radius={10} />
                  ) : (
                    <>
                      <AppText style={styles.pricingValue}>{yearlyPrice}</AppText>
                      <AppText style={styles.pricingHint}>{getPlanRenewalCopy("yearly", yearlyPackage)}</AppText>
                    </>
                  )}
                </View>
              </View>
            </View>

            <PlanOptionCard
              plan="yearly"
              title="Yearly"
              price={yearlyPrice}
              subtitle={getPlanRenewalCopy("yearly", yearlyPackage)}
              detail="Best value for ongoing support, insights, Coach, and nutrition planning."
              badge="Best Value"
              selected={selectedPlan === "yearly"}
              onPress={() => handleSelectPlan("yearly")}
              disabled={showLoadingPricingShell}
            />

            <PlanOptionCard
              plan="monthly"
              title="Monthly"
              price={monthlyPrice}
              subtitle={getPlanRenewalCopy("monthly", monthlyPackage)}
              detail="Flexible monthly access to the full LiveWithMS experience."
              badge="Flexible"
              selected={selectedPlan === "monthly"}
              onPress={() => handleSelectPlan("monthly")}
              disabled={showLoadingPricingShell}
            />
          </>
        ) : null}

        <View style={styles.disclosureCard}>
          <AppText style={styles.sectionTitle}>Billing and restore</AppText>
          <Pressable style={styles.restoreCallout} onPress={() => void handleRestore()}>
            <AppText style={styles.restoreCalloutText}>
              {premium.isRestoring ? "Restoring..." : "Restore Purchases"}
            </AppText>
          </Pressable>
          <AppText style={styles.disclosureText}>
            {Platform.OS === "android"
              ? "Billing is handled securely through Google Play with localized Play Store pricing."
              : "Billing is handled securely through Apple with localized App Store pricing."}
          </AppText>
          <AppText style={styles.disclosureText}>{purchaseCaption}</AppText>
          <AppText style={styles.disclosureText}>
            LiveWithMS can help you stay organized and notice patterns over time, but it does not replace medical advice.
          </AppText>
          {purchaseError ? <AppText style={styles.errorText}>{purchaseError}</AppText> : null}
          {restoreMessage ? <AppText style={styles.successText}>{restoreMessage}</AppText> : null}
          {purchaseSuccessMessage ? <AppText style={styles.successText}>{purchaseSuccessMessage}</AppText> : null}
        </View>

        <View style={styles.actions}>
          {showPlans ? (
            <>
              <AppButton
                label={purchaseLabel}
                onPress={() => void handlePurchase()}
                disabled={!selectedPackage || premium.isPurchasing || premium.isLoading}
              />
              <AppText style={styles.purchaseHint}>{purchaseCaption}</AppText>
            </>
          ) : (
            <AppButton label="Continue" onPress={onClose} />
          )}

          {requiredAccess ? (
            <Pressable style={styles.secondaryButton} onPress={onRequiredExit}>
              <AppText style={styles.secondaryText}>Sign out</AppText>
            </Pressable>
          ) : (
            <Pressable style={styles.secondaryButton} onPress={onClose}>
              <AppText style={styles.secondaryText}>Not now</AppText>
            </Pressable>
          )}
        </View>

        <View style={styles.legalLinks}>
          <Pressable onPress={openPrivacyPolicy} style={styles.legalButton}>
            <AppText style={styles.legalText}>Privacy Policy</AppText>
          </Pressable>
          <Pressable onPress={openTermsOfUse} style={styles.legalButton}>
            <AppText style={styles.legalText}>Terms of Use</AppText>
          </Pressable>
          <Pressable onPress={openEula} style={styles.legalButton}>
            <AppText style={styles.legalText}>Apple Standard EULA</AppText>
          </Pressable>
        </View>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 104,
    gap: 18,
  },
  heroCard: {
    overflow: "hidden",
    gap: 12,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceRaised,
    padding: 22,
    shadowColor: "rgba(120, 71, 29, 0.22)",
    shadowOpacity: 1,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  heroGlowPrimary: {
    position: "absolute",
    top: -44,
    right: -28,
    width: 190,
    height: 190,
    borderRadius: 999,
    backgroundColor: colors.accentGlow,
  },
  heroGlowSecondary: {
    position: "absolute",
    bottom: -56,
    left: -30,
    width: 150,
    height: 150,
    borderRadius: 999,
    backgroundColor: "rgba(255, 214, 182, 0.55)",
  },
  heroEyebrow: {
    color: colors.accentDeep,
    fontWeight: "700",
    fontSize: 14,
    letterSpacing: 0.9,
    textTransform: "uppercase",
  },
  heroTitle: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    color: colors.textBody,
    fontSize: 16,
    lineHeight: 24,
  },
  heroBody: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 23,
  },
  requiredCard: {
    backgroundColor: "#fff3e8",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#f1c8a7",
    padding: 18,
    gap: 8,
  },
  requiredTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  requiredBody: {
    color: colors.textBody,
    lineHeight: 22,
  },
  benefitsCard: {
    backgroundColor: "#fffdfb",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#efd7c4",
    padding: 18,
    gap: 12,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "700",
  },
  bulletList: {
    gap: 8,
  },
  bulletText: {
    color: colors.textBody,
    lineHeight: 21,
  },
  activeCard: {
    backgroundColor: "#f7fbf7",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#d8ead9",
    padding: 18,
    gap: 10,
  },
  activeTitle: {
    color: "#166534",
    fontSize: 18,
    fontWeight: "700",
  },
  activeBody: {
    color: "#3f5f46",
    lineHeight: 21,
  },
  statusCard: {
    backgroundColor: "#fffdfb",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#efd7c4",
    padding: 18,
    gap: 10,
  },
  statusBody: {
    color: colors.textBody,
    lineHeight: 20,
  },
  pricingSummaryCard: {
    backgroundColor: "#fffdfb",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#efd7c4",
    padding: 18,
    gap: 10,
  },
  pricingSnapshot: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  pricingPill: {
    flex: 1,
    flexBasis: 160,
    minWidth: 150,
    backgroundColor: "#fff6ee",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#efcfb6",
    padding: 14,
    gap: 4,
  },
  pricingLabel: {
    color: "#c25d10",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  pricingValue: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 28,
    flexShrink: 1,
  },
  pricingHint: {
    color: "#8b6a4f",
    fontSize: 12,
    lineHeight: 18,
  },
  loadingSkeletonGroup: {
    gap: 8,
    marginTop: 2,
  },
  disclosureCard: {
    backgroundColor: "#fff7f1",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#efcfb6",
    padding: 18,
    gap: 8,
  },
  disclosureText: {
    color: colors.textMuted,
    lineHeight: 20,
    fontSize: 13,
  },
  restoreCallout: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#efcfb6",
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  restoreCalloutText: {
    color: "#8b6a4f",
    fontSize: 13,
    fontWeight: "700",
  },
  purchaseHint: {
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
    fontSize: 13,
  },
  errorText: {
    color: "#b42318",
    fontSize: 13,
    lineHeight: 20,
  },
  successText: {
    color: "#166534",
    fontSize: 13,
    lineHeight: 20,
  },
  actions: {
    gap: 12,
  },
  secondaryButton: {
    alignItems: "center",
    paddingVertical: 6,
  },
  secondaryText: {
    color: colors.textMuted,
    fontSize: 13,
    textDecorationLine: "underline",
  },
  legalLinks: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 16,
  },
  legalButton: {
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  legalText: {
    color: colors.textMuted,
    fontSize: 13,
    textDecorationLine: "underline",
  },
});
