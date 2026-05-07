import { Linking, Pressable, StyleSheet, View } from "react-native";
import AppScreen from "../../components/ui/AppScreen";
import AppText from "../../components/ui/AppText";

const NATIONAL_MS_SOCIETY_URL = "https://www.nationalmssociety.org/";
const MAYO_MS_URL = "https://www.mayoclinic.org/diseases-conditions/multiple-sclerosis";
const NHS_MS_URL = "https://www.nhs.uk/conditions/multiple-sclerosis/";

export default function MedicalDisclaimerScreen() {
  return (
    <AppScreen
      title="Medical Disclaimer"
      subtitle="LiveWithMS supports education and self-tracking, not medical diagnosis or treatment."
    >
      <AppText>
        LiveWithMS provides wellness education and self-tracking tools only. It does not provide
        medical advice, diagnosis, or treatment. Always speak with a qualified healthcare
        professional about medical decisions, symptoms, medications, or treatment changes.
      </AppText>
      <View style={styles.sources}>
        <Pressable onPress={() => void Linking.openURL(NATIONAL_MS_SOCIETY_URL)}>
          <AppText style={styles.linkText}>National Multiple Sclerosis Society</AppText>
        </Pressable>
        <Pressable onPress={() => void Linking.openURL(MAYO_MS_URL)}>
          <AppText style={styles.linkText}>Mayo Clinic Multiple Sclerosis</AppText>
        </Pressable>
        <Pressable onPress={() => void Linking.openURL(NHS_MS_URL)}>
          <AppText style={styles.linkText}>NHS Multiple Sclerosis</AppText>
        </Pressable>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  sources: {
    gap: 10,
  },
  linkText: {
    color: "#6b7280",
    textDecorationLine: "underline",
  },
});
