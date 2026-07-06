import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import OnboardingScaffold from "../../components/onboarding/OnboardingScaffold";
import AppText from "../../components/ui/AppText";
import { ONBOARDING_FEATURE_HIGHLIGHTS, ONBOARDING_STEPS } from "../../features/onboarding/constants";

const FEATURE_SET = ONBOARDING_FEATURE_HIGHLIGHTS.slice(0, 5);

export default function FeatureEducationPrimaryScreen() {
  const router = useRouter();

  return (
    <OnboardingScaffold
      title="See what LiveWithMS can do for you."
      subtitle="Each feature is designed to stay useful without asking you to do everything at once."
      step={6}
      totalSteps={ONBOARDING_STEPS.length}
      onBack={() => router.back()}
      onNext={() => router.push("/care-intro")}
      nextLabel="Continue"
    >
      <View style={styles.stack}>
        {FEATURE_SET.map((feature) => (
          <View key={feature.id} style={styles.featureCard}>
            <AppText style={styles.featureTitle}>{feature.title}</AppText>
            <AppText style={styles.featureBody}>{feature.body}</AppText>
          </View>
        ))}
      </View>
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 14,
  },
  featureCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#f1e1d4",
    padding: 18,
    gap: 8,
  },
  featureTitle: {
    color: "#1f2937",
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "700",
  },
  featureBody: {
    color: "#4b5563",
    lineHeight: 22,
  },
});
