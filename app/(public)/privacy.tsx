import { Linking, Pressable, StyleSheet } from "react-native";
import AppScreen from "../../components/ui/AppScreen";
import AppText from "../../components/ui/AppText";
import { preventPsychologicalSegmentation } from "../../lib/ethical-insights/anti-profiling/preventPsychologicalSegmentation";
import { validateNonExploitativeAnalytics } from "../../lib/ethical-insights/anti-profiling/validateNonExploitativeAnalytics";
import { deriveResearchParticipation } from "../../lib/ethical-insights/human-centered-research/deriveResearchParticipation";
import { validateEthicalResearchUse } from "../../lib/ethical-insights/human-centered-research/validateEthicalResearchUse";
import { deriveAnonymizedPatterns } from "../../lib/ethical-insights/population-patterns/deriveAnonymizedPatterns";
import { deriveHumanReadableTransparency } from "../../lib/ethical-insights/transparent-governance/deriveHumanReadableTransparency";
import { validateOptOutClarity } from "../../lib/ethical-insights/transparent-governance/validateOptOutClarity";

const PRIVACY_POLICY_URL = "https://www.livewithms.com/policies/privacy-policy";

export default function PrivacyScreen() {
  const research = deriveResearchParticipation();
  const transparencyLines = deriveHumanReadableTransparency().map((line) =>
    preventPsychologicalSegmentation(line),
  );
  const safeTransparencyLines =
    validateNonExploitativeAnalytics(transparencyLines).valid && validateOptOutClarity(transparencyLines).valid
      ? transparencyLines
      : ["Your information should only support your experience and should never be used to exploit vulnerability."];
  const researchLines =
    validateEthicalResearchUse(research.lines).valid
      ? research.lines
      : ["Any future research participation should stay optional, transparent, and easy to decline."];
  const groupedPatternLine = deriveAnonymizedPatterns({
    topic: "accessibility",
    dominantPattern: "lower-density support",
    cohortSize: 64,
  });

  return (
    <AppScreen
      title="Privacy"
      subtitle="We only use your information to support your experience in the app."
    >
      {safeTransparencyLines.map((line) => (
        <AppText key={line}>{line}</AppText>
      ))}
      <AppText>{groupedPatternLine}</AppText>
      {researchLines.map((line) => (
        <AppText key={line}>{line}</AppText>
      ))}
      <Pressable onPress={() => void Linking.openURL(PRIVACY_POLICY_URL)} style={styles.linkButton}>
        <AppText style={styles.linkText}>Open Privacy Policy</AppText>
      </Pressable>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  linkButton: {
    alignSelf: "flex-start",
  },
  linkText: {
    color: "#6b7280",
    textDecorationLine: "underline",
  },
});
