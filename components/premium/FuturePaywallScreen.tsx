import { useEffect, useState } from "react";
import { Alert, Linking, Pressable, ScrollView, StyleSheet, View } from "react-native";
import AppButton from "../ui/AppButton";
import AppScreen from "../ui/AppScreen";
import AppText from "../ui/AppText";
import PaywallHero from "./PaywallHero";
import PlanOptionCard from "./PlanOptionCard";
import { usePremium } from "../../features/premium/hooks";
import type { PremiumPlan } from "../../features/premium/types";
import { trackEvent, trackRetryTriggered } from "../../lib/events";
import { derivePremiumValue } from "../../lib/premium-ecosystem/calm-premium/derivePremiumValue";
import { preserveFreeUserDignity } from "../../lib/premium-ecosystem/calm-premium/preserveFreeUserDignity";
import { deriveAccessibilityPrograms } from "../../lib/premium-ecosystem/financial-accessibility/deriveAccessibilityPrograms";
import { deriveRegionalSensitivity } from "../../lib/premium-ecosystem/financial-accessibility/deriveRegionalSensitivity";
import { preventEmotionalConversion } from "../../lib/premium-ecosystem/ethical-monetization/preventEmotionalConversion";
import { validateMonetizationEthics } from "../../lib/premium-ecosystem/ethical-monetization/validateMonetizationEthics";
import { deriveUpgradeTiming } from "../../lib/premium-ecosystem/low-pressure-upgrades/deriveUpgradeTiming";
import { preventConversionPressure } from "../../lib/premium-ecosystem/low-pressure-upgrades/preventConversionPressure";
import { deriveBillingTransparency } from "../../lib/premium-ecosystem/subscription-calmness/deriveBillingTransparency";
import { preserveGracefulDowngrades } from "../../lib/premium-ecosystem/subscription-calmness/preserveGracefulDowngrades";
import { deriveLongTermPremiumValue } from "../../lib/premium-ecosystem/sustainable-value/deriveLongTermPremiumValue";
import { preventArtificialScarcity } from "../../lib/premium-ecosystem/sustainable-value/preventArtificialScarcity";

const PRIVACY_POLICY_URL = "https://www.livewithms.com/policies/privacy-policy";
const TERMS_OF_USE_URL = "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/";

type FuturePaywallScreenProps = {
  onClose: () => void;
};

export default function FuturePaywallScreen({ onClose }: FuturePaywallScreenProps) {
  const premium = usePremium();
  const [selectedPlan, setSelectedPlan] = useState<PremiumPlan>("yearly");
  const premiumValue = derivePremiumValue();
  const upgradeTiming = deriveUpgradeTiming({
    source: "premium-screen",
    isLoading: premium.isLoading,
    hasRecentFailure: Boolean(premium.offeringsErrorMessage),
  });
  const safeMonetization = validateMonetizationEthics([
    premiumValue.summary,
    deriveLongTermPremiumValue(),
    deriveAccessibilityPrograms(),
  ]).valid;

  useEffect(() => {
    void trackEvent("paywall_viewed", {
      source: "premium-screen",
    });
  }, []);

  const openPrivacyPolicy = () => {
    void Linking.openURL(PRIVACY_POLICY_URL);
  };

  const openTermsOfUse = () => {
    void Linking.openURL(TERMS_OF_USE_URL);
  };

  const primaryPackage = premium.currentOffering?.[selectedPlan] ?? null;
  const showPlans = !premium.hasPremiumAccess;
  const monthlyPrice = premium.currentOffering?.monthly?.priceString ?? "Unavailable";
  const yearlyPrice = premium.currentOffering?.yearly?.priceString ?? "Unavailable";
  const purchaseLabel = premium.isPurchasing
    ? "Starting purchase..."
    : primaryPackage
      ? preventConversionPressure(`Continue with ${selectedPlan === "yearly" ? "Yearly" : "Monthly"}`)
      : "Pricing unavailable right now";

  const handlePurchase = async () => {
    if (!primaryPackage || premium.isPurchasing) {
      return;
    }

    await trackEvent("upgrade_clicked", {
      plan: selectedPlan,
    });
    await trackEvent("purchase_started", {
      plan: selectedPlan,
    });

    const result = await premium.purchasePlan(selectedPlan);

    if (result.success && !result.cancelled) {
      await trackEvent("purchase_completed", {
        plan: selectedPlan,
      });
      Alert.alert(
        "Premium is ready",
        "Thank you for supporting LiveWithMS. Your premium features are now available.",
        [{ text: "Continue", onPress: onClose }],
      );
      return;
    }

    if (result.message && !result.cancelled) {
      Alert.alert("Purchase unavailable", result.message);
    }
  };

  const handleRestore = async () => {
    const result = await premium.restorePurchases();

    if (result.success) {
      await trackEvent("restore_completed", {
        status: "success",
      });
      Alert.alert("Purchases restored", "Your premium access has been refreshed.", [
        { text: "Continue", onPress: onClose },
      ]);
      return;
    }

    if (result.message) {
      Alert.alert("Restore unavailable", result.message);
    }
  };

  const handleSelectPlan = (plan: PremiumPlan) => {
    setSelectedPlan(plan);
    void trackEvent("subscription_plan_selected", {
      plan,
      source: "premium-screen",
    });
  };

  return (
    <AppScreen title="LiveWithMS Premium" subtitle="An optional upgrade for deeper support, while the calm core experience stays free.">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <PaywallHero />

        <View style={styles.valueCard}>
          <AppText style={styles.valueTitle}>What stays free</AppText>
          <AppText style={styles.valueBody}>
            {preserveFreeUserDignity(
              "Daily check-ins, basic tracking, reminders, Programs, Care, and core insights all stay part of the free app.",
            )}
          </AppText>
        </View>

        <View style={styles.valueCard}>
          <AppText style={styles.valueTitle}>{premiumValue.title}</AppText>
          <View style={styles.bulletList}>
            {premiumValue.lines.map((line) => (
              <AppText key={line} style={styles.bulletText}>• {preventEmotionalConversion(line)}</AppText>
            ))}
          </View>
          <AppText style={styles.valueBody}>
            {preventEmotionalConversion(premiumValue.summary)}
          </AppText>
          <AppText style={styles.valueBody}>
            {safeMonetization
              ? "Premium is meant to be an optional enhancement, not something you need to use the core app well."
              : "Premium remains optional, and the free app should still feel supportive."}
          </AppText>
          <AppText style={styles.valueBody}>{deriveLongTermPremiumValue()}</AppText>
        </View>

        {premium.hasPremiumAccess ? (
          <View style={styles.activeCard}>
            <AppText style={styles.activeTitle}>Premium is active</AppText>
            <AppText style={styles.activeBody}>
              Unlimited AI Coach is available now, and your premium support can stay available without changing the tone of the rest of the app.
            </AppText>
            <AppButton
              label={premium.isLoading ? "Refreshing..." : "Refresh Premium Status"}
              onPress={() => void premium.refreshPremiumStatus()}
              variant="secondary"
              disabled={premium.isLoading}
            />
          </View>
        ) : null}

        {showPlans ? (
          <>
            {premium.isLoading && !premium.currentOffering ? (
              <View style={styles.statusCard}>
                <AppText style={styles.statusTitle}>Checking current pricing…</AppText>
                <AppText style={styles.statusBody}>
                  This can take a moment while the App Store refreshes in the background.
                </AppText>
              </View>
            ) : null}

            {premium.offeringsErrorMessage ? (
              <View style={styles.statusCard}>
                <AppText style={styles.statusTitle}>Premium is almost ready</AppText>
                <AppText style={styles.statusBody}>
                  {premium.offeringsErrorMessage}
                </AppText>
                <AppText style={styles.statusBody}>
                  If Apple’s setup is still finishing, pricing can take a little time to appear. The rest of the app still works normally in the meantime.
                </AppText>
                <AppButton
                  label={premium.isLoading ? "Retrying..." : "Try again"}
                  onPress={() => {
                    void trackRetryTriggered("premium-refresh");
                    void premium.refreshPremiumStatus();
                  }}
                  variant="secondary"
                  disabled={premium.isLoading}
                />
              </View>
            ) : null}

            <View style={styles.comparisonCard}>
              <AppText style={styles.comparisonTitle}>Choose the pace that fits</AppText>
              <AppText style={styles.comparisonBody}>
                {upgradeTiming === "defer"
                  ? "You do not need to decide right away. Pricing can wait until it feels clearer."
                  : "Monthly stays flexible. Yearly is simpler if you expect to use the app regularly."}
              </AppText>
              <View style={styles.pricingSnapshot}>
                <View style={styles.pricingPill}>
                  <AppText style={styles.pricingLabel}>Monthly</AppText>
                  <AppText style={styles.pricingValue}>{monthlyPrice}</AppText>
                </View>
                <View style={styles.pricingPill}>
                  <AppText style={styles.pricingLabel}>Yearly</AppText>
                  <AppText style={styles.pricingValue}>{yearlyPrice}</AppText>
                  <AppText style={styles.pricingHint}>{preventArtificialScarcity("Best value over time")}</AppText>
                </View>
              </View>
              <AppText style={styles.comparisonTitle}>Feature comparison</AppText>
              <View style={styles.comparisonRow}>
                <AppText style={styles.comparisonLabel}>Free</AppText>
                <AppText style={styles.comparisonValue}>Check-ins, reminders, Programs, Care, and core insights</AppText>
              </View>
              <View style={styles.comparisonRow}>
                <AppText style={styles.comparisonLabel}>Premium</AppText>
                <AppText style={styles.comparisonValue}>Unlimited AI Coach plus deeper insights, personalization, and future guided tools</AppText>
              </View>
              <AppText style={styles.comparisonBody}>{deriveAccessibilityPrograms()}</AppText>
              <AppText style={styles.comparisonBody}>{deriveRegionalSensitivity()}</AppText>
            </View>

            <PlanOptionCard
              plan="yearly"
              title="Yearly"
              price={yearlyPrice}
              subtitle="A steadier option if you want support throughout the year."
              detail="Lower-friction choice if you want the app to stay with you across changing weeks."
              badge="Best value"
              selected={selectedPlan === "yearly"}
              onPress={() => handleSelectPlan("yearly")}
            />

            <PlanOptionCard
              plan="monthly"
              title="Monthly"
              price={monthlyPrice}
              subtitle="Best if you want a simple month-to-month option."
              detail="A flexible starting point if you want to try Premium without a longer commitment."
              selected={selectedPlan === "monthly"}
              onPress={() => handleSelectPlan("monthly")}
            />
          </>
        ) : null}

        <View style={styles.disclosureCard}>
          <AppText style={styles.disclosureTitle}>Restore and privacy</AppText>
          <Pressable style={styles.restoreCallout} onPress={() => void handleRestore()}>
            <AppText style={styles.restoreCalloutText}>Restore Purchases</AppText>
          </Pressable>
          <AppText style={styles.disclosureText}>
            {deriveBillingTransparency()}
          </AppText>
          <AppText style={styles.disclosureText}>
            {preserveGracefulDowngrades()}
          </AppText>
          <AppText style={styles.disclosureText}>
            Your check-ins and wellness data stay yours. Premium changes access, not your control over the app.
          </AppText>
        </View>

        <View style={styles.actions}>
          {showPlans ? (
            <AppButton
              label={purchaseLabel}
              onPress={() => void handlePurchase()}
              disabled={!primaryPackage || premium.isPurchasing || premium.isLoading}
            />
          ) : (
            <AppButton label="Done" onPress={onClose} />
          )}
          <Pressable style={styles.secondaryButton} onPress={onClose}>
            <AppText style={styles.secondaryText}>Not now</AppText>
          </Pressable>
        </View>

        <View style={styles.legalLinks}>
          <Pressable onPress={openPrivacyPolicy} style={styles.legalButton}>
            <AppText style={styles.legalText}>Privacy Policy</AppText>
          </Pressable>
          <Pressable onPress={openTermsOfUse} style={styles.legalButton}>
            <AppText style={styles.legalText}>Terms of Use</AppText>
          </Pressable>
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
    gap: 20,
  },
  planCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f1e1d4",
    padding: 18,
    gap: 8,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
  },
  planBody: {
    color: "#6b7280",
  },
  valueCard: {
    backgroundColor: "#fffaf6",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#f3dfd1",
    padding: 16,
    gap: 10,
  },
  valueTitle: {
    color: "#1f2937",
    fontSize: 17,
    fontWeight: "700",
  },
  valueBody: {
    color: "#6b7280",
    lineHeight: 21,
  },
  bulletList: {
    gap: 8,
  },
  bulletText: {
    color: "#4b5563",
    lineHeight: 20,
  },
  activeCard: {
    backgroundColor: "#f7fbf7",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#d8ead9",
    padding: 16,
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
    backgroundColor: "#fffaf6",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#f3dfd1",
    padding: 16,
    gap: 10,
  },
  statusTitle: {
    color: "#1f2937",
    fontSize: 17,
    fontWeight: "700",
  },
  statusBody: {
    color: "#6b7280",
    lineHeight: 20,
  },
  comparisonCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#f1e1d4",
    padding: 16,
    gap: 12,
  },
  comparisonTitle: {
    color: "#1f2937",
    fontSize: 17,
    fontWeight: "700",
  },
  comparisonBody: {
    color: "#6b7280",
    lineHeight: 20,
  },
  pricingSnapshot: {
    flexDirection: "row",
    gap: 10,
  },
  pricingPill: {
    flex: 1,
    backgroundColor: "#fffaf6",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f3dfd1",
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
    color: "#1f2937",
    fontSize: 22,
    fontWeight: "700",
  },
  pricingHint: {
    color: "#8b6a4f",
    fontSize: 12,
    lineHeight: 18,
  },
  comparisonRow: {
    gap: 4,
  },
  comparisonLabel: {
    color: "#c25d10",
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  comparisonValue: {
    color: "#4b5563",
    lineHeight: 20,
  },
  disclosureCard: {
    backgroundColor: "#fffaf6",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f3dfd1",
    padding: 16,
    gap: 8,
  },
  disclosureTitle: {
    color: "#1f2937",
    fontSize: 15,
    fontWeight: "700",
  },
  disclosureText: {
    color: "#6b7280",
    lineHeight: 20,
    fontSize: 13,
  },
  restoreCallout: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#ead9cb",
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  restoreCalloutText: {
    color: "#8b6a4f",
    fontSize: 13,
    fontWeight: "700",
  },
  actions: {
    gap: 12,
  },
  secondaryButton: {
    alignItems: "center",
    paddingVertical: 6,
  },
  secondaryText: {
    color: "#6b7280",
    fontSize: 13,
    textDecorationLine: "underline",
  },
  legalLinks: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
  },
  legalButton: {
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  legalText: {
    color: "#6b7280",
    fontSize: 13,
    textDecorationLine: "underline",
  },
});
