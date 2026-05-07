import { Linking, Pressable, StyleSheet } from "react-native";
import AppScreen from "../../components/ui/AppScreen";
import AppText from "../../components/ui/AppText";

const PRIVACY_POLICY_URL = "https://www.livewithms.com/policies/privacy-policy";

export default function PrivacyScreen() {
  return (
    <AppScreen
      title="Privacy"
      subtitle="We only use your information to support your experience in the app."
    >
      <AppText>
        Your check-ins, profile details, and wellness information are stored to help you track
        patterns over time and personalize your experience.
      </AppText>
      <AppText>
        LiveWithMS is designed to give you more clarity about your daily health, while keeping
        your personal information protected.
      </AppText>
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
