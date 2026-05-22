import { useRouter } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import OnboardingScaffold from "../../components/onboarding/OnboardingScaffold";
import AppText from "../../components/ui/AppText";
import { trackEvent } from "../../lib/events";
import { deriveCategoryDefiningPositioning } from "../../lib/product-identity/deriveCategoryDefiningPositioning";
import { ONBOARDING_STEPS } from "../../features/onboarding/constants";

export default function WelcomeScreen() {
  const router = useRouter();
  const positioning = deriveCategoryDefiningPositioning();

  useEffect(() => {
    void trackEvent("onboarding_started", {
      step: "welcome",
    });
  }, []);

  return (
    <OnboardingScaffold
      title="Support for living with MS, gently."
      subtitle={positioning.onboardingSubtitle}
      step={1}
      totalSteps={ONBOARDING_STEPS.length}
      onNext={() => router.push("/symptoms")}
      nextLabel="Continue"
    >
      <View style={styles.stack}>
        <View style={styles.heroCard}>
          <AppText style={styles.heroTitle}>A calmer place to carry difficult days.</AppText>
          <AppText style={styles.heroBody}>
            LiveWithMS helps you check in, notice patterns, and feel a little more supported during difficult periods.
          </AppText>
        </View>

        <View style={styles.infoCard}>
          <AppText style={styles.infoTitle}>Simple, low-pressure support</AppText>
          <AppText style={styles.infoBody}>
            This is not just a symptom tracker. It is a calmer support environment for check-ins, reflection, care, and steadier continuity over time.
          </AppText>
          <AppText style={styles.infoBody}>{positioning.onboardingPrivacyLine}</AppText>
        </View>
      </View>
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 16,
  },
  heroCard: {
    backgroundColor: "#fff4ec",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#f2d8c4",
    padding: 18,
    gap: 8,
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
  infoCard: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#f1e1d4",
    padding: 18,
    gap: 6,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
  },
  infoBody: {
    color: "#6b7280",
    lineHeight: 22,
  },
});
