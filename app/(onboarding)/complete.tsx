import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import OnboardingScaffold from "../../components/onboarding/OnboardingScaffold";
import AppText from "../../components/ui/AppText";
import { ONBOARDING_STEPS } from "../../features/onboarding/constants";
import { useOnboarding } from "../../features/onboarding/hooks";

export default function CompleteScreen() {
  const router = useRouter();
  const { completeOnboarding, isCompleting } = useOnboarding();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleNext = async () => {
    if (isCompleting) return;

    const ok = await completeOnboarding();
    if (!ok) {
      setErrorMessage("Unable to finish onboarding. Please try again.");
      return;
    }

    setErrorMessage(null);
    router.replace("/today");
  };

  return (
    <OnboardingScaffold
      title="You’re ready"
      subtitle="Start with one simple check-in and let the rest build from there."
      step={5}
      totalSteps={ONBOARDING_STEPS.length}
      onBack={() => router.back()}
      onNext={handleNext}
      nextLabel="Start my 1-minute check-in"
      loading={isCompleting}
      errorMessage={errorMessage}
    >
      <View style={styles.stack}>
        <View style={styles.heroCard}>
          <AppText style={styles.heroTitle}>A gentle first step is enough.</AppText>
          <AppText style={styles.heroBody}>
            Today will guide you into your first check-in so Coach and Insights can start to feel more personal.
          </AppText>
        </View>

        <View style={styles.infoCard}>
          <AppText style={styles.infoTitle}>What happens next</AppText>
          <AppText style={styles.infoBody}>You’ll land in Today for your first check-in.</AppText>
          <AppText style={styles.infoBody}>After that, you can try a short reflection or calm reset in Coach.</AppText>
          <AppText style={styles.infoBody}>The first 3 check-ins help the app start to feel personal.</AppText>
          <AppText style={styles.infoBody}>Small daily steps can reveal meaningful patterns over time.</AppText>
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
