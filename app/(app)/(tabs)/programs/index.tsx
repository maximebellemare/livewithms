import { router } from "expo-router";
import { Linking, Pressable, ScrollView, StyleSheet, View } from "react-native";
import AppButton from "../../../../components/ui/AppButton";
import AppScreen from "../../../../components/ui/AppScreen";
import AppText from "../../../../components/ui/AppText";

const NATIONAL_MS_SOCIETY_URL = "https://www.nationalmssociety.org/";
const MAYO_MS_URL = "https://www.mayoclinic.org/diseases-conditions/multiple-sclerosis";
const NHS_MS_URL = "https://www.nhs.uk/conditions/multiple-sclerosis/";

export default function ProgramsScreen() {
  return (
    <AppScreen
      title="Programs"
      subtitle="Guided wellness programs can help you build steadier routines and feel more supported."
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <AppText style={styles.title}>Move between sections</AppText>
          <View style={styles.navButtons}>
            <AppButton label="Go to Coach" onPress={() => router.push("/coach")} variant="secondary" />
            <AppButton label="Go to Today" onPress={() => router.push("/today")} variant="secondary" />
          </View>
        </View>
        <View style={styles.card}>
          <AppText style={styles.title}>Guided support, one step at a time</AppText>
          <AppText style={styles.body}>
            Programs are designed to help you move through common challenges with gentle structure,
            practical check-ins, and steady daily momentum.
          </AppText>
        </View>
        <View style={styles.card}>
          <AppText style={styles.title}>Focus areas</AppText>
          <AppText style={styles.body}>Energy pacing and recovery habits.</AppText>
          <AppText style={styles.body}>Calming routines for stressful days.</AppText>
          <AppText style={styles.body}>Daily practices that help you feel more in control.</AppText>
        </View>
        <View style={styles.sourcesRow}>
          <Pressable onPress={() => void Linking.openURL(NATIONAL_MS_SOCIETY_URL)}>
            <AppText style={styles.sourcesText}>Sources</AppText>
          </Pressable>
          <Pressable onPress={() => void Linking.openURL(MAYO_MS_URL)}>
            <AppText style={styles.sourcesText}>Mayo Clinic</AppText>
          </Pressable>
          <Pressable onPress={() => void Linking.openURL(NHS_MS_URL)}>
            <AppText style={styles.sourcesText}>NHS</AppText>
          </Pressable>
        </View>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 120,
    gap: 12,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f1e1d4",
    padding: 18,
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
  },
  body: {
    color: "#4b5563",
  },
  navButtons: {
    gap: 10,
  },
  sourcesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  sourcesText: {
    color: "#6b7280",
    fontSize: 13,
    textDecorationLine: "underline",
  },
});
