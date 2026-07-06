import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import OnboardingScaffold from "../../components/onboarding/OnboardingScaffold";
import AppText from "../../components/ui/AppText";
import { ONBOARDING_STEPS } from "../../features/onboarding/constants";
import { useGrowthState } from "../../features/growth/hooks";
import { useOnboarding } from "../../features/onboarding/hooks";
import { getPersonalizedOnboardingGuidance } from "../../features/onboarding/personalization";

export default function CompleteScreen() {
  const router = useRouter();
  const { completeOnboarding, draft, isCompleting } = useOnboarding();
  const growth = useGrowthState();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const guidance = getPersonalizedOnboardingGuidance(draft);

  const handleNext = async () => {
    if (isCompleting) {
      return;
    }

    const ok = await completeOnboarding();
    if (!ok) {
      setErrorMessage("Could not save profile. Please try again.");
      return;
    }

    setErrorMessage(null);
    await growth.maybePromptForReview({
      trigger: "onboarding_completed",
    });
    router.replace("/today");
  };

  return (
    <OnboardingScaffold
      title="You’re ready to begin."
      subtitle="Start with one short check-in. The rest can stay available when it becomes useful."
      step={10}
      totalSteps={ONBOARDING_STEPS.length}
      onBack={() => router.back()}
      onNext={handleNext}
      nextLabel="Go to Today"
      loading={isCompleting}
      errorMessage={errorMessage}
    >
      <View style={styles.stack}>
        <View style={styles.heroCard}>
          <AppText style={styles.heroTitle}>{guidance.nextPrimary}</AppText>
          <AppText style={styles.heroBody}>{guidance.nextSecondary}</AppText>
        </View>

        <View style={styles.infoCard}>
          <AppText style={styles.infoTitle}>What happens next</AppText>
          <AppText style={styles.infoBody}>Today will guide your first check-in and daily overview.</AppText>
          <AppText style={styles.infoBody}>Track, Coach, Care, Nutrition, Programs, and Community stay available from the main tabs.</AppText>
          <AppText style={styles.infoBody}>AI support is optional and does not replace professional medical care.</AppText>
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
    backgroundColor: "#fff4ea",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#f3d5bc",
    padding: 22,
    gap: 8,
  },
  heroTitle: {
    fontSize: 24,
    lineHeight: 31,
    fontWeight: "700",
    color: "#1f2937",
  },
  heroBody: {
    color: "#4b5563",
    lineHeight: 22,
  },
  infoCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
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
