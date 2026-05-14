import { useEffect, useState } from "react";
import { Alert, Linking, Pressable, ScrollView, StyleSheet, View } from "react-native";
import AppButton from "../ui/AppButton";
import AppScreen from "../ui/AppScreen";
import AppText from "../ui/AppText";
import PaywallHero from "./PaywallHero";
import PlanOptionCard from "./PlanOptionCard";
import { usePremium } from "../../features/premium/hooks";
import type { PremiumPlan } from "../../features/premium/types";
import { trackEvent } from "../../lib/events";

const PRIVACY_POLICY_URL = "https://www.livewithms.com/policies/privacy-policy";
const TERMS_OF_USE_URL = "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/";

type FuturePaywallScreenProps = {
  onClose: () => void;
};

export default function FuturePaywallScreen({ onClose }: FuturePaywallScreenProps) {
  const premium = usePremium();
  const [selectedPlan, setSelectedPlan] = useState<PremiumPlan>("yearly");

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
  const purchaseLabel = premium.isPurchasing
    ? "Starting purchase..."
    : primaryPackage
      ? `Continue with ${selectedPlan === "yearly" ? "Yearly" : "Monthly"}`
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

  return (
    <AppScreen title="LiveWithMS Premium" subtitle="A calm upgrade for deeper personalized support, while the core app stays free.">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <PaywallHero />

        <View style={styles.valueCard}>
          <AppText style={styles.valueTitle}>What stays free</AppText>
          <AppText style={styles.valueBody}>
            Daily check-ins, basic tracking, reminders, Programs, Care, and core insights all stay part of the free app.
          </AppText>
        </View>

        <View style={styles.valueCard}>
          <AppText style={styles.valueTitle}>What Premium adds</AppText>
          <View style={styles.bulletList}>
            <AppText style={styles.bulletText}>• Unlimited AI Coach conversations</AppText>
            <AppText style={styles.bulletText}>• More personalized AI insight support over time</AppText>
            <AppText style={styles.bulletText}>• Future guided programs and deeper summaries</AppText>
          </View>
          <AppText style={styles.valueBody}>
            Premium helps support continued development while unlocking more personalized support.
          </AppText>
        </View>

        {premium.hasPremiumAccess ? (
          <View style={styles.activeCard}>
            <AppText style={styles.activeTitle}>Premium is active</AppText>
            <AppText style={styles.activeBody}>
              Unlimited AI Coach is available now, and your future premium features will unlock here automatically as they are added.
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
                  This can take a moment while the App Store and RevenueCat refresh.
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
                  If Apple’s paid applications setup is still finishing, pricing can take a little time to appear.
                </AppText>
                <AppButton
                  label={premium.isLoading ? "Retrying..." : "Try again"}
                  onPress={() => void premium.refreshPremiumStatus()}
                  variant="secondary"
                  disabled={premium.isLoading}
                />
              </View>
            ) : null}

            <View style={styles.comparisonCard}>
              <AppText style={styles.comparisonTitle}>Feature comparison</AppText>
              <View style={styles.comparisonRow}>
                <AppText style={styles.comparisonLabel}>Free</AppText>
                <AppText style={styles.comparisonValue}>Daily check-ins, reminders, Programs, Care, and core insights</AppText>
              </View>
              <View style={styles.comparisonRow}>
                <AppText style={styles.comparisonLabel}>Premium</AppText>
                <AppText style={styles.comparisonValue}>Unlimited AI Coach, deeper insight support, and future guided tools</AppText>
              </View>
            </View>

            <PlanOptionCard
              plan="yearly"
              title="Yearly"
              price={premium.currentOffering?.yearly?.priceString ?? "Unavailable"}
              subtitle="A steadier option if you want support throughout the year."
              badge="Best value"
              selected={selectedPlan === "yearly"}
              onPress={() => setSelectedPlan("yearly")}
            />

            <PlanOptionCard
              plan="monthly"
              title="Monthly"
              price={premium.currentOffering?.monthly?.priceString ?? "Unavailable"}
              subtitle="Best if you want a simple month-to-month option."
              selected={selectedPlan === "monthly"}
              onPress={() => setSelectedPlan("monthly")}
            />
          </>
        ) : null}

        <View style={styles.disclosureCard}>
          <AppText style={styles.disclosureText}>
            Auto-renewal applies unless cancelled at least 24 hours before the end of the current period. Cancel anytime in your App Store account settings.
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
          <Pressable style={styles.secondaryButton} onPress={() => void handleRestore()}>
            <AppText style={styles.secondaryText}>Restore Purchases</AppText>
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
  },
  disclosureText: {
    color: "#6b7280",
    lineHeight: 20,
    fontSize: 13,
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
