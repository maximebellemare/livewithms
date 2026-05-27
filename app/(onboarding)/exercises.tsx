import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import OnboardingScaffold from "../../components/onboarding/OnboardingScaffold";
import AppText from "../../components/ui/AppText";
import { ONBOARDING_STEPS } from "../../features/onboarding/constants";

const EXERCISE_POINTS = [
  "Memory Match and Sequence Recall",
  "Reaction Check and Pattern Spotting",
  "Steady Tap and Focus Sprint",
];

export default function ExercisesIntroScreen() {
  const router = useRouter();

  return (
    <OnboardingScaffold
      title="Gentle cognitive and focus exercises."
      subtitle="Short exercises designed for attention, memory, focus, and consistency."
      step={4}
      totalSteps={ONBOARDING_STEPS.length}
      onBack={() => router.back()}
      onNext={() => router.push("/community-intro")}
      nextLabel="Continue"
    >
      <View style={styles.stack}>
        <View style={styles.heroCard}>
          <AppText style={styles.heroTitle}>Short practice, no pressure.</AppText>
          <AppText style={styles.heroBody}>
            Exercises are calm, optional, and built without leaderboards or streak pressure.
          </AppText>
        </View>

        <View style={styles.listCard}>
          {EXERCISE_POINTS.map((point) => (
            <View key={point} style={styles.listRow}>
              <View style={styles.dot} />
              <AppText style={styles.listText}>{point}</AppText>
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
    gap: 12,
  },
  listRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    marginTop: 8,
    backgroundColor: "#d98641",
  },
  listText: {
    flex: 1,
    color: "#4b5563",
    lineHeight: 22,
  },
});
