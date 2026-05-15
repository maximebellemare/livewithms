import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import OnboardingScaffold from "../../components/onboarding/OnboardingScaffold";
import AppText from "../../components/ui/AppText";
import { ONBOARDING_STEPS } from "../../features/onboarding/constants";
import { useOnboarding } from "../../features/onboarding/hooks";
import { getPersonalizedOnboardingGuidance } from "../../features/onboarding/personalization";

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
    body: "It offers supportive reflection. It is not medical advice, diagnosis, or therapy.",
  },
  {
    title: "Premium",
    body: "If you ever choose it later, it simply adds deeper AI support. Your core tracking stays free.",
  },
];

export default function PlanScreen() {
  const router = useRouter();
  const { draft } = useOnboarding();
  const guidance = getPersonalizedOnboardingGuidance(draft);

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

        <View style={styles.guidanceCard}>
          <AppText style={styles.guidanceTitle}>{guidance.title}</AppText>
          <AppText style={styles.guidanceBody}>{guidance.body}</AppText>
          <AppText style={styles.guidanceNote}>
            You stay in control of what you track, what you share, and which tools you use.
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
  guidanceCard: {
    backgroundColor: "#f7fbf7",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#d7ead7",
    padding: 18,
    gap: 8,
  },
  guidanceTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
  },
  guidanceBody: {
    color: "#4b5563",
    lineHeight: 22,
  },
  guidanceNote: {
    color: "#6b7280",
    lineHeight: 20,
    fontSize: 13,
  },
});
