import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import OnboardingScaffold from "../../components/onboarding/OnboardingScaffold";
import AppText from "../../components/ui/AppText";
import { ONBOARDING_STEPS } from "../../features/onboarding/constants";

const TRACKING_POINTS = [
  "Fatigue, mood, stress, and sleep in one place",
  "A quick daily picture you can keep up with",
  "Simple enough for lower-energy days",
];

export default function SymptomsScreen() {
  const router = useRouter();

  return (
    <OnboardingScaffold
      title="Track your symptoms and energy"
      subtitle="A short daily check-in helps you notice what today feels like."
      step={2}
      totalSteps={ONBOARDING_STEPS.length}
      onBack={() => router.back()}
      onNext={() => router.push("/goals")}
      nextLabel="Continue"
    >
      <View style={styles.stack}>
        <View style={styles.heroCard}>
          <AppText style={styles.heroTitle}>Most check-ins take about a minute.</AppText>
          <AppText style={styles.heroBody}>
            Start with the basics. Add more only when it feels useful.
          </AppText>
        </View>

        <View style={styles.listCard}>
          {TRACKING_POINTS.map((point) => (
            <View key={point} style={styles.pointRow}>
              <View style={styles.dot} />
              <AppText style={styles.pointText}>{point}</AppText>
            </View>
          ))}
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
  listCard: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#f1e1d4",
    padding: 18,
    gap: 14,
  },
  pointRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: "#e8751a",
    marginTop: 8,
  },
  pointText: {
    flex: 1,
    color: "#4b5563",
    lineHeight: 22,
  },
});
