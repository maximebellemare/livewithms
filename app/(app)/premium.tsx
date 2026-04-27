import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import FeatureList from "../../components/premium/FeatureList";
import PaywallHero from "../../components/premium/PaywallHero";
import PlanOptionCard from "../../components/premium/PlanOptionCard";
import AppButton from "../../components/ui/AppButton";
import AppScreen from "../../components/ui/AppScreen";
import AppText from "../../components/ui/AppText";
import { usePremium } from "../../features/premium/hooks";
import type { PremiumPlan } from "../../features/premium/types";

export default function PremiumScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ source?: string }>();
  const { activateMockPremium } = usePremium();
  const [selectedPlan, setSelectedPlan] = useState<PremiumPlan>("yearly");

  const handleClose = () => {
    if (params.source === "onboarding") {
      router.replace("/today");
      return;
    }

    router.back();
  };

  const handlePrimary = () => {
    activateMockPremium();
    router.replace("/today");
  };

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <PaywallHero />
        <FeatureList />

        <View style={styles.planGroup}>
          <PlanOptionCard
            plan="yearly"
            title="Yearly"
            price="$59.99 / year"
            subtitle="More support for less each month"
            selected={selectedPlan === "yearly"}
            badge="Best value"
            onPress={() => setSelectedPlan("yearly")}
          />
          <PlanOptionCard
            plan="monthly"
            title="Monthly"
            price="$7.99 / month"
            subtitle="A flexible way to start"
            selected={selectedPlan === "monthly"}
            onPress={() => setSelectedPlan("monthly")}
          />
        </View>

        <View style={styles.actions}>
          <AppButton label="Start improving today" onPress={handlePrimary} />
          <AppButton label="Not now" onPress={handleClose} variant="secondary" />
        </View>

        <AppText style={styles.footnote}>
          Phase 1 mock paywall only. Purchases are not live yet.
        </AppText>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 36,
    gap: 20,
  },
  planGroup: {
    gap: 12,
  },
  actions: {
    gap: 12,
  },
  footnote: {
    textAlign: "center",
    color: "#6b7280",
    fontSize: 13,
  },
});
