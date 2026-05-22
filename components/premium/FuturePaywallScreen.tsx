import { useEffect, useState } from "react";
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
import { getLocalizedStorePrice, PREMIUM_PRICE_FALLBACK } from "../../features/premium/display";
import { trackEvent, trackRetryTriggered } from "../../lib/events";
import { derivePremiumPositioning } from "../../lib/premium-ecosystem/calm-premium/derivePremiumPositioning";
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
import { ENABLE_RC_DEBUG_PANEL } from "../../lib/revenuecat/debug";

const PRIVACY_POLICY_URL = "https://www.livewithms.com/policies/privacy-policy";
const TERMS_OF_USE_URL = "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/";
const RC_DEBUG_UNLOCK_TAP_COUNT = 7;

type FuturePaywallScreenProps = {
  onClose: () => void;
};

export default function FuturePaywallScreen({ onClose }: FuturePaywallScreenProps) {
  const premium = usePremium();
  const lowEnergyMode = useLowEnergyMode();
  const [selectedPlan, setSelectedPlan] = useState<PremiumPlan>("yearly");
  const [debugTapCount, setDebugTapCount] = useState(0);
  const positioning = derivePremiumPositioning();
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

  useEffect(() => {
    void premium.refreshRevenueCatDiagnostics();
  }, [premium.refreshRevenueCatDiagnostics]);

  const openPrivacyPolicy = () => {
    void Linking.openURL(PRIVACY_POLICY_URL);
  };

  const openTermsOfUse = () => {
    void Linking.openURL(TERMS_OF_USE_URL);
  };

  const primaryPackage = premium.currentOffering?.[selectedPlan] ?? null;
  const showPlans = !premium.hasPremiumAccess;
  const showLoadingPricingShell =
    premium.isLoading && !premium.currentOffering && !premium.offeringsErrorMessage;
  const monthlyPrice = getLocalizedStorePrice(premium.currentOffering?.monthly);
  const yearlyPrice = getLocalizedStorePrice(premium.currentOffering?.yearly);
  const purchaseLabel = premium.isPurchasing
    ? "Starting purchase..."
    : primaryPackage
      ? preventConversionPressure(`Continue with ${selectedPlan === "yearly" ? positioning.yearly.title : positioning.monthly.title}`)
      : PREMIUM_PRICE_FALLBACK;

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
        "Your calmer Premium support is now available.",
        [{ text: "Continue", onPress: onClose }],
      );
      return;
    }

    if (result.message && !result.cancelled) {
      Alert.alert("Purchase needs a moment", result.message);
    }
  };

  const handleRestore = async () => {
    const result = await premium.restorePurchases();

    if (result.success) {
      await trackEvent("restore_completed", {
        status: "success",
      });
      Alert.alert("Premium access is back in place", "Your Premium access has been refreshed.", [
        { text: "Continue", onPress: onClose },
      ]);
      return;
    }

    if (result.message) {
      Alert.alert("Restore needs a moment", result.message);
    }
  };

  const handleSelectPlan = (plan: PremiumPlan) => {
    setSelectedPlan(plan);
    void trackEvent("subscription_plan_selected", {
      plan,
      source: "premium-screen",
    });
  };

  const debugPanelVisible = __DEV__ || (ENABLE_RC_DEBUG_PANEL && debugTapCount >= RC_DEBUG_UNLOCK_TAP_COUNT);
  const debugSnapshot = premium.revenueCatDebugSnapshot;

  const handleVersionTap = () => {
    if (!ENABLE_RC_DEBUG_PANEL && !__DEV__) {
      return;
    }

    setDebugTapCount((current) => Math.min(RC_DEBUG_UNLOCK_TAP_COUNT, current + 1));
  };

  return (
    <AppScreen title="LiveWithMS Premium" subtitle={positioning.screenSubtitle}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <PaywallHero />

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
            {(lowEnergyMode.enabled ? positioning.primaryLines.slice(0, 2) : positioning.primaryLines).map((line) => (
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

        <View style={styles.valueCard}>
          <AppText style={styles.valueTitle}>{positioning.secondaryTitle}</AppText>
          <View style={styles.bulletList}>
            {(lowEnergyMode.enabled ? positioning.secondaryLines.slice(0, 2) : positioning.secondaryLines).map((line) => (
              <AppText key={line} style={styles.bulletText}>• {preventEmotionalConversion(line)}</AppText>
            ))}
          </View>
          <AppText style={styles.valueBody}>
            {preventEmotionalConversion(positioning.tertiaryBody)}
          </AppText>
        </View>

        {premium.hasPremiumAccess ? (
          <View style={styles.activeCard}>
            <AppText style={styles.activeTitle}>Premium is active</AppText>
            <AppText style={styles.activeBody}>
              {positioning.activeProfileBody}
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
            {showLoadingPricingShell ? (
              <View style={styles.statusCard}>
                <AppText style={styles.statusTitle}>Bringing in current pricing…</AppText>
                <AppText style={styles.statusBody}>
                  This can take a moment while the App Store refreshes in the background.
                </AppText>
                <View style={styles.loadingSkeletonGroup}>
                  <CalmSkeleton width="64%" height={12} />
                  <CalmSkeleton width="86%" height={12} />
                </View>
              </View>
            ) : null}

            {premium.offeringsErrorMessage ? (
              <View style={styles.statusCard}>
                <AppText style={styles.statusTitle}>Pricing needs a moment</AppText>
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
              <AppText style={styles.comparisonTitle}>{positioning.plansTitle}</AppText>
              <AppText style={styles.comparisonBody}>
                {upgradeTiming === "defer"
                  ? "You do not need to decide right away. Pricing can wait until it feels clearer."
                  : lowEnergyMode.enabled
                    ? "Monthly stays flexible. Yearly keeps the experience steadier over time."
                    : positioning.plansBody}
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
              {positioning.trustLines.map((line) => (
                <AppText key={line} style={styles.comparisonBody}>
                  {line}
                </AppText>
              ))}
              <AppText style={styles.comparisonBody}>{deriveAccessibilityPrograms()}</AppText>
              <AppText style={styles.comparisonBody}>{deriveRegionalSensitivity()}</AppText>
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
          <AppText style={styles.disclosureTitle}>Restore and billing</AppText>
          <Pressable style={styles.restoreCallout} onPress={() => void handleRestore()}>
            <AppText style={styles.restoreCalloutText}>Restore purchases</AppText>
          </Pressable>
          <AppText style={styles.disclosureText}>
            {deriveBillingTransparency()}
          </AppText>
          <AppText style={styles.disclosureText}>
            {preserveGracefulDowngrades()}
          </AppText>
          <AppText style={styles.disclosureText}>{positioning.profileNote}</AppText>
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

        <Pressable style={styles.debugVersionTapTarget} onPress={handleVersionTap}>
          <AppText style={styles.debugVersionText}>
            App {debugSnapshot.appVersion} ({debugSnapshot.buildNumber})
          </AppText>
        </Pressable>

        {debugPanelVisible ? (
          <View style={styles.debugCard}>
            {/* TODO: Remove or disable RevenueCat debug panel after subscription issue is resolved. */}
            <AppText style={styles.debugTitle}>RevenueCat debug snapshot</AppText>
            <AppText style={styles.debugLine}>SDK key: {debugSnapshot.maskedSdkKey}</AppText>
            <AppText style={styles.debugLine}>Bundle ID: {debugSnapshot.bundleIdentifier}</AppText>
            <AppText style={styles.debugLine}>Requested offering: {debugSnapshot.requestedOfferingIdentifier}</AppText>
            <AppText style={styles.debugLine}>
              Current offering: {debugSnapshot.currentOfferingIdentifier ?? "none"}
            </AppText>
            <AppText style={styles.debugLine}>
              Selected offering: {debugSnapshot.selectedOfferingIdentifier ?? "none"}
            </AppText>
            <AppText style={styles.debugLine}>
              All offerings: {debugSnapshot.allOfferingIdentifiers.join(", ") || "none"}
            </AppText>
            <AppText style={styles.debugLine}>
              Packages: {debugSnapshot.availablePackageIdentifiers.join(", ") || "none"}
            </AppText>
            <AppText style={styles.debugLine}>
              Products: {debugSnapshot.productIdentifiers.join(", ") || "none"}
            </AppText>
            <AppText style={styles.debugLine}>
              Active entitlements: {debugSnapshot.activeEntitlementIdentifiers.join(", ") || "none"}
            </AppText>
            <AppText style={styles.debugLine}>
              Last error: {debugSnapshot.lastErrorCode ?? "none"} {debugSnapshot.lastErrorMessage ?? ""}
            </AppText>
            <AppText style={styles.debugLine}>
              Last fetch: {debugSnapshot.timestamp}
            </AppText>

            <View style={styles.debugProducts}>
              {debugSnapshot.products.length ? (
                debugSnapshot.products.map((product) => (
                    <View key={`${product.packageIdentifier}:${product.productIdentifier}`} style={styles.debugProductRow}>
                      <AppText style={styles.debugProductTitle}>
                        {product.packageIdentifier} {"->"} {product.productIdentifier}
                      </AppText>
                    <AppText style={styles.debugLine}>{product.title ?? "title missing"}</AppText>
                    <AppText style={styles.debugLine}>
                      {product.priceString ?? "priceString missing"}
                      {product.currencyCode ? ` (${product.currencyCode})` : ""}
                    </AppText>
                  </View>
                ))
              ) : (
                <AppText style={styles.debugLine}>No products in the selected offering.</AppText>
              )}
            </View>

            <AppButton
              label={premium.isLoading ? "Refreshing diagnostics..." : "Refresh RevenueCat Diagnostics"}
              onPress={() => void premium.refreshRevenueCatDiagnostics()}
              variant="secondary"
              disabled={premium.isLoading}
            />
          </View>
        ) : null}
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
  debugVersionTapTarget: {
    alignItems: "center",
    paddingVertical: 6,
  },
  debugVersionText: {
    color: "#9ca3af",
    fontSize: 11,
  },
  debugCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#d8dee8",
    padding: 16,
    gap: 8,
  },
  debugTitle: {
    color: "#111827",
    fontSize: 15,
    fontWeight: "700",
  },
  debugLine: {
    color: "#475569",
    fontSize: 12,
    lineHeight: 18,
  },
  debugProducts: {
    gap: 8,
  },
  debugProductRow: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 10,
    gap: 4,
  },
  debugProductTitle: {
    color: "#1f2937",
    fontSize: 12,
    fontWeight: "700",
  },
});
