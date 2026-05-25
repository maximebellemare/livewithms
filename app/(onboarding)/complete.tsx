import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import OnboardingScaffold from "../../components/onboarding/OnboardingScaffold";
import AppText from "../../components/ui/AppText";
import { ONBOARDING_STEPS } from "../../features/onboarding/constants";
import { useOnboarding } from "../../features/onboarding/hooks";
import { getPersonalizedOnboardingGuidance } from "../../features/onboarding/personalization";
import { deriveCategoryDefiningPositioning } from "../../lib/product-identity/deriveCategoryDefiningPositioning";
import { derivePremiumPositioning } from "../../lib/premium-ecosystem/calm-premium/derivePremiumPositioning";

export default function CompleteScreen() {
  const router = useRouter();
  const { completeOnboarding, draft, isCompleting } = useOnboarding();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const guidance = getPersonalizedOnboardingGuidance(draft);
  const positioning = deriveCategoryDefiningPositioning();
  const premiumPositioning = derivePremiumPositioning();

  const handleNext = async () => {
    if (isCompleting) return;

    const ok = await completeOnboarding();
    if (!ok) {
      setErrorMessage("Could not save profile. Please try again.");
      return;
    }

    setErrorMessage(null);
    router.replace("/today");
  };

  return (
    <OnboardingScaffold
      title="Start with today."
      subtitle="A simple check-in helps the app start building useful patterns."
      step={7}
      totalSteps={ONBOARDING_STEPS.length}
      onBack={() => router.back()}
      onNext={handleNext}
      nextLabel="Begin first check-in"
      loading={isCompleting}
      errorMessage={errorMessage}
    >
      <View style={styles.stack}>
        <View style={styles.heroCard}>
          <AppText style={styles.heroTitle}>{guidance.title}</AppText>
          <AppText style={styles.heroBody}>
            {guidance.body}
          </AppText>
        </View>

        <View style={styles.infoCard}>
          <AppText style={styles.infoTitle}>What happens next</AppText>
          <AppText style={styles.infoBody}>You’ll land in Today for your first check-in.</AppText>
          <AppText style={styles.infoBody}>{guidance.nextSecondary}</AppText>
          <AppText style={styles.infoBody}>The first few check-ins help Insights start showing clearer patterns.</AppText>
          <AppText style={styles.infoBody}>{positioning.onboardingCompletionLine}</AppText>
          <AppText style={styles.infoBody}>AI support stays optional and is meant for reflection, not diagnosis, treatment, or emergency care.</AppText>
          <AppText style={styles.infoBody}>{premiumPositioning.onboardingBody}</AppText>
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
    gap: 10,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
  },
  infoBody: {
    color: "#4b5563",
    lineHeight: 22,
  },
});
