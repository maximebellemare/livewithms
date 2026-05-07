import { Linking, Pressable, StyleSheet } from "react-native";
import AppScreen from "../../components/ui/AppScreen";
import AppText from "../../components/ui/AppText";

const TERMS_OF_USE_URL = "https://www.livewithms.com/policies/terms-of-service";

export default function TermsScreen() {
  return (
    <AppScreen
      title="Terms"
      subtitle="Use LiveWithMS as a personal wellness companion, not a substitute for medical care."
    >
      <AppText>
        LiveWithMS is intended to help you record symptoms, reflect on changes, and follow your
        wellness routines more consistently.
      </AppText>
      <AppText>
        The app does not diagnose, treat, or replace professional medical advice. Always speak
        with your care team about urgent symptoms or treatment decisions.
      </AppText>
      <Pressable onPress={() => void Linking.openURL(TERMS_OF_USE_URL)} style={styles.linkButton}>
        <AppText style={styles.linkText}>Open Terms of Use</AppText>
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
