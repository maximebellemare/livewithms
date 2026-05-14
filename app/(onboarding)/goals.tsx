import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import OnboardingScaffold from "../../components/onboarding/OnboardingScaffold";
import AppText from "../../components/ui/AppText";
import { ONBOARDING_STEPS } from "../../features/onboarding/constants";

export default function GoalsScreen() {
  const router = useRouter();

  return (
    <OnboardingScaffold
      title="Understand your patterns over time"
      subtitle="Patterns become clearer as your check-ins build over time."
      step={3}
      totalSteps={ONBOARDING_STEPS.length}
      onBack={() => router.back()}
      onNext={() => router.push("/plan")}
      nextLabel="Continue"
    >
      <View style={styles.stack}>
        <View style={styles.heroCard}>
          <AppText style={styles.heroTitle}>You do not need perfect tracking.</AppText>
          <AppText style={styles.heroBody}>
            A few honest check-ins are enough to start revealing gentle trends.
          </AppText>
        </View>

        <View style={styles.patternCard}>
          <AppText style={styles.patternTitle}>Over time, you may start to notice</AppText>
          <AppText style={styles.patternBody}>How sleep and fatigue connect</AppText>
          <AppText style={styles.patternBody}>When stress seems to make days feel heavier</AppText>
          <AppText style={styles.patternBody}>What may be helping steadier days</AppText>
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
  patternCard: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#f1e1d4",
    padding: 18,
    gap: 10,
  },
  patternTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
  },
  patternBody: {
    color: "#4b5563",
    lineHeight: 22,
  },
});
