import { useEffect, useMemo, useState } from "react";
import { Alert, Linking, Pressable, ScrollView, StyleSheet, View } from "react-native";
import AppButton from "../ui/AppButton";
import CalmSkeleton from "../ui/CalmSkeleton";
import AppScreen from "../ui/AppScreen";
import AppText from "../ui/AppText";
import PaywallHero from "./PaywallHero";
import PlanOptionCard from "./PlanOptionCard";
import { useLowEnergyMode } from "../../features/low-energy-mode/hooks";
import { usePremium } from "../../features/premium/hooks";
import type { PremiumPlan } from "../../features/premium/types";
import { PREMIUM_REGULAR_TRIAL_DAYS } from "../../features/premium/config";
import { getLocalizedStorePrice } from "../../features/premium/display";
import { trackEvent, trackRetryTriggered } from "../../lib/events";
import { derivePremiumPositioning } from "../../lib/premium-ecosystem/calm-premium/derivePremiumPositioning";
import { derivePremiumValue } from "../../lib/premium-ecosystem/calm-premium/derivePremiumValue";
import { preserveFreeUserDignity } from "../../lib/premium-ecosystem/calm-premium/preserveFreeUserDignity";
import { preventEmotionalConversion } from "../../lib/premium-ecosystem/ethical-monetization/preventEmotionalConversion";
import { validateMonetizationEthics } from "../../lib/premium-ecosystem/ethical-monetization/validateMonetizationEthics";
import { deriveUpgradeTiming } from "../../lib/premium-ecosystem/low-pressure-upgrades/deriveUpgradeTiming";
import { preventConversionPressure } from "../../lib/premium-ecosystem/low-pressure-upgrades/preventConversionPressure";
import { deriveBillingTransparency } from "../../lib/premium-ecosystem/subscription-calmness/deriveBillingTransparency";
import { preserveGracefulDowngrades } from "../../lib/premium-ecosystem/subscription-calmness/preserveGracefulDowngrades";
import { preventArtificialScarcity } from "../../lib/premium-ecosystem/sustainable-value/preventArtificialScarcity";
import { isExpoGo } from "../../lib/revenueCatEnvironment";

const PRIVACY_POLICY_URL = "https://www.livewithms.com/policies/privacy-policy";
const TERMS_OF_USE_URL = "https://www.livewithms.com/policies/terms-of-service";

type FuturePaywallScreenProps = {
  onClose: () => void;
};

export default function FuturePaywallScreen({ onClose }: FuturePaywallScreenProps) {
  const premium = usePremium();
  const lowEnergyMode = useLowEnergyMode();
  const [selectedPlan, setSelectedPlan] = useState<PremiumPlan>("yearly");
  const positioning = derivePremiumPositioning();
  const premiumValue = derivePremiumValue();
  const upgradeTiming = deriveUpgradeTiming({
    source: "premium-screen",
    isLoading: premium.isLoading,
    hasRecentFailure: Boolean(premium.offeringsErrorMessage),
  });
  const safeMonetization = validateMonetizationEthics([
    premiumValue.summary,
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
  const expoGoPricingFallback = isExpoGo() && !premium.currentOffering;
  const showLoadingPricingShell =
    premium.isLoading && !premium.currentOffering && !premium.offeringsErrorMessage;
  const monthlyPrice = expoGoPricingFallback ? "Monthly plan" : getLocalizedStorePrice(premium.currentOffering?.monthly);
  const yearlyPrice = expoGoPricingFallback ? "Yearly plan" : getLocalizedStorePrice(premium.currentOffering?.yearly);
  const trialHeadline = useMemo(() => `${PREMIUM_REGULAR_TRIAL_DAYS} days free`, []);
  const purchaseLabel = premium.isPurchasing
    ? positioning.purchaseLoadingLabel
    : primaryPackage
      ? preventConversionPressure(positioning.purchaseCta)
      : positioning.purchaseUnavailableLabel;

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
        positioning.purchaseSuccessTitle,
        positioning.purchaseSuccessBody,
        [{ text: "Continue", onPress: onClose }],
      );
      return;
    }

    if (result.message && !result.cancelled) {
      Alert.alert(positioning.purchasePendingTitle, result.message);
    }
  };

  const handleRestore = async () => {
    const result = await premium.restorePurchases();

    if (result.success) {
      await trackEvent("restore_completed", {
        status: "success",
      });
      Alert.alert("Premium restored.", result.message ?? positioning.restoreSuccessBody, [
        { text: "Continue", onPress: onClose },
      ]);
      return;
    }

    if (result.message) {
      Alert.alert(result.message.startsWith("Restore failed") ? "Restore failed" : positioning.restorePendingTitle, result.message);
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
    <AppScreen title="LiveWithMS Premium" subtitle={positioning.screenSubtitle}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <PaywallHero />

        <View style={styles.trialCard}>
          <AppText style={styles.trialTitle}>{trialHeadline}</AppText>
          <AppText style={styles.trialBody}>
            {`New subscribers currently see the standard ${PREMIUM_REGULAR_TRIAL_DAYS}-day free trial when available.`}
          </AppText>
        </View>

        <View style={styles.valueCard}>
          <AppText style={styles.valueTitle}>{positioning.freeTierTitle}</AppText>
          <AppText style={styles.valueBody}>
            {preserveFreeUserDignity(
              positioning.freeTierBody,
            )}
          </AppText>
        </View>

        <View style={styles.valueCard}>
          <AppText style={styles.valueTitle}>{premiumValue.title}</AppText>
          <View style={styles.bulletList}>
            {(lowEnergyMode.enabled ? premiumValue.lines.slice(0, 3) : premiumValue.lines.slice(0, 4)).map((line) => (
              <AppText key={line} style={styles.bulletText}>• {preventEmotionalConversion(line)}</AppText>
            ))}
          </View>
          <AppText style={styles.valueBody}>
            {preventEmotionalConversion(premiumValue.summary)}
          </AppText>
          <AppText style={styles.valueBody}>
            {safeMonetization
              ? "Premium is optional. The free app still supports core check-ins, tracking, and care tools."
              : "Premium remains optional, and the free app still supports the essentials."}
          </AppText>
        </View>

        {premium.hasPremiumAccess ? (
          <View style={styles.activeCard}>
            <AppText style={styles.activeTitle}>{positioning.activeTitle}</AppText>
            <AppText style={styles.activeBody}>
              {positioning.activeProfileBody}
            </AppText>
            <AppButton
              label={premium.isLoading ? "Refreshing..." : positioning.activeRefreshLabel}
              onPress={() => void premium.refreshPremiumStatus()}
              variant="secondary"
              disabled={premium.isLoading}
            />
          </View>
        ) : null}

        {showPlans ? (
          <>
            {showLoadingPricingShell ? (
              <View style={styles.statusCard}>
                <AppText style={styles.statusTitle}>{positioning.loadingPricingTitle}</AppText>
                <AppText style={styles.statusBody}>
                  {positioning.loadingPricingBody}
                </AppText>
                <View style={styles.loadingSkeletonGroup}>
                  <CalmSkeleton width="64%" height={12} />
                  <CalmSkeleton width="86%" height={12} />
                </View>
              </View>
            ) : null}

            {premium.offeringsErrorMessage ? (
              <View style={styles.statusCard}>
                <AppText style={styles.statusTitle}>{positioning.errorPricingTitle}</AppText>
                <AppText style={styles.statusBody}>
                  {premium.offeringsErrorMessage}
                </AppText>
                {__DEV__ && isExpoGo() ? (
                  <AppText style={styles.statusBody}>
                    {positioning.expoGoPricingNote}
                  </AppText>
                ) : null}
                <AppText style={styles.statusBody}>
                  {positioning.errorPricingBody}
                </AppText>
                <AppButton
                  label={premium.isLoading ? "Retrying..." : positioning.retryLabel}
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
              <AppText style={styles.comparisonTitle}>{positioning.plansTitle}</AppText>
              <AppText style={styles.comparisonBody}>
                {upgradeTiming === "defer"
                    ? "You do not need to decide right away."
                    : lowEnergyMode.enabled
                    ? "Monthly keeps support flexible. Yearly lowers the overall yearly cost and reduces renewal frequency."
                    : positioning.plansBody}
              </AppText>
              <AppText style={styles.comparisonBody}>
                {`The current store configuration uses the standard ${PREMIUM_REGULAR_TRIAL_DAYS}-day free trial.`}
              </AppText>
              <View style={styles.pricingSnapshot}>
                <View style={styles.pricingPill}>
                  <AppText style={styles.pricingLabel}>{positioning.monthly.title}</AppText>
                  {showLoadingPricingShell ? (
                    <CalmSkeleton width="70%" height={28} radius={10} />
                  ) : (
                    <AppText style={styles.pricingValue}>{monthlyPrice}</AppText>
                  )}
                </View>
                <View style={styles.pricingPill}>
                  <AppText style={styles.pricingLabel}>{positioning.yearly.title}</AppText>
                  {showLoadingPricingShell ? (
                    <CalmSkeleton width="74%" height={28} radius={10} />
                  ) : (
                    <>
                      <AppText style={styles.pricingValue}>{yearlyPrice}</AppText>
                      <AppText style={styles.pricingHint}>{preventArtificialScarcity(positioning.yearly.badge ?? "Steadier over time")}</AppText>
                    </>
                  )}
                </View>
              </View>
              <AppText style={styles.pricingSupportText}>{positioning.monthly.subtitle}</AppText>
              <AppText style={styles.pricingSupportText}>{positioning.yearly.subtitle}</AppText>
              <AppText style={styles.comparisonTitle}>{positioning.trustTitle}</AppText>
              {positioning.trustLines.slice(0, 2).map((line) => (
                <AppText key={line} style={styles.comparisonBody}>
                  {line}
                </AppText>
              ))}
            </View>

            <PlanOptionCard
              plan="yearly"
              title={positioning.yearly.title}
              price={yearlyPrice}
              subtitle={positioning.yearly.subtitle}
              detail={positioning.yearly.detail}
              badge={positioning.yearly.badge}
              selected={selectedPlan === "yearly"}
              onPress={() => handleSelectPlan("yearly")}
              disabled={showLoadingPricingShell}
            />

            <PlanOptionCard
              plan="monthly"
              title={positioning.monthly.title}
              price={monthlyPrice}
              subtitle={positioning.monthly.subtitle}
              detail={positioning.monthly.detail}
              selected={selectedPlan === "monthly"}
              onPress={() => handleSelectPlan("monthly")}
              disabled={showLoadingPricingShell}
            />
          </>
        ) : null}

        <View style={styles.disclosureCard}>
          <AppText style={styles.disclosureTitle}>{positioning.restoreTitle}</AppText>
          <Pressable style={styles.restoreCallout} onPress={() => void handleRestore()}>
            <AppText style={styles.restoreCalloutText}>{positioning.restoreButtonLabel}</AppText>
          </Pressable>
          <AppText style={styles.disclosureText}>
            {deriveBillingTransparency()}
          </AppText>
          <AppText style={styles.disclosureText}>
            {preserveGracefulDowngrades()}
          </AppText>
          <AppText style={styles.disclosureText}>{positioning.profileNote}</AppText>
          <AppText style={styles.disclosureText}>{positioning.softValueBody}</AppText>
        </View>

        <View style={styles.actions}>
          {showPlans ? (
            <AppButton
              label={purchaseLabel}
              onPress={() => void handlePurchase()}
              disabled={!primaryPackage || premium.isPurchasing || premium.isLoading}
            />
          ) : (
            <AppButton label={positioning.doneCtaLabel} onPress={onClose} />
          )}
          <Pressable style={styles.secondaryButton} onPress={onClose}>
            <AppText style={styles.secondaryText}>{positioning.secondaryCtaLabel}</AppText>
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
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 104,
    gap: 16,
  },
  trialCard: {
    backgroundColor: "#fff7ef",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#f0dcc7",
    padding: 16,
    gap: 8,
  },
  trialTitle: {
    color: "#1f2937",
    fontSize: 19,
    fontWeight: "800",
  },
  trialBody: {
    color: "#6b7280",
    lineHeight: 21,
  },
  trialNote: {
    color: "#8b5a2b",
    lineHeight: 21,
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
    gap: 10,
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
    flexWrap: "wrap",
    gap: 10,
  },
  pricingPill: {
    flex: 1,
    flexBasis: 160,
    minWidth: 150,
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
    lineHeight: 28,
    flexShrink: 1,
  },
  pricingHint: {
    color: "#8b6a4f",
    fontSize: 12,
    lineHeight: 18,
  },
  pricingSupportText: {
    color: "#8b6a4f",
    fontSize: 13,
    lineHeight: 19,
  },
  loadingSkeletonGroup: {
    gap: 8,
    marginTop: 2,
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
    flexWrap: "wrap",
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
