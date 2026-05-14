import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import OnboardingScaffold from "../../components/onboarding/OnboardingScaffold";
import AppText from "../../components/ui/AppText";
import { ONBOARDING_STEPS } from "../../features/onboarding/constants";

const EXPECTATION_POINTS = [
  {
    title: "Daily check-ins",
    body: "Most take about a minute and help the app feel more personal.",
  },
  {
    title: "Insights",
    body: "They improve over time as your check-ins begin to form patterns.",
  },
  {
    title: "AI Coach",
    body: "It offers supportive reflection, not medical advice or diagnosis.",
  },
];

export default function PlanScreen() {
  const router = useRouter();

  return (
    <OnboardingScaffold
      title="What to expect"
      subtitle="A few simple habits can make the app more useful over time."
      step={4}
      totalSteps={ONBOARDING_STEPS.length}
      onBack={() => router.back()}
      onNext={() => router.push("/complete")}
      nextLabel="Continue"
    >
      <View style={styles.stack}>
        <View style={styles.heroCard}>
          <AppText style={styles.heroTitle}>You are building awareness, not doing this perfectly.</AppText>
          <AppText style={styles.heroBody}>
            A few consistent check-ins can support reflection, pattern spotting, and steadier decisions.
          </AppText>
        </View>

        {EXPECTATION_POINTS.map((tool) => (
          <View key={tool.title} style={styles.toolCard}>
            <AppText style={styles.toolTitle}>{tool.title}</AppText>
            <AppText style={styles.toolBody}>{tool.body}</AppText>
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
  toolCard: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#f1e1d4",
    padding: 18,
    gap: 6,
  },
  toolTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
  },
  toolBody: {
    color: "#4b5563",
    lineHeight: 22,
  },
});
