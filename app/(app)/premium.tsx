import { useLocalSearchParams, useRouter } from "expo-router";
import { Linking, Pressable, ScrollView, StyleSheet, View } from "react-native";
import PaywallHero from "../../components/premium/PaywallHero";
import AppButton from "../../components/ui/AppButton";
import AppScreen from "../../components/ui/AppScreen";
import AppText from "../../components/ui/AppText";

const PRIVACY_POLICY_URL = "https://www.livewithms.com/policies/privacy-policy";
const TERMS_OF_USE_URL = "https://www.livewithms.com/policies/terms-of-service";

export default function PremiumScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ source?: string }>();

  const handleClose = () => {
    if (params.source === "onboarding") {
      router.replace("/today");
      return;
    }

    router.back();
  };
  const handlePrimary = async () => {
    handleClose();
  };

  const openPrivacyPolicy = () => {
    void Linking.openURL(PRIVACY_POLICY_URL);
  };

  const openTermsOfUse = () => {
    void Linking.openURL(TERMS_OF_USE_URL);
  };

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <PaywallHero />

        <View style={styles.infoCard}>
          <AppText style={styles.infoTitle}>Continue your progress</AppText>
          <AppText style={styles.infoBody}>
            Your daily check-ins, history, wellness support, and guided content are all available
            in the app.
          </AppText>
        </View>

        <View style={styles.actions}>
          <AppButton label="Continue" onPress={() => void handlePrimary()} />
          <AppButton label="Not now" onPress={handleClose} variant="secondary" />
        </View>

        <View style={styles.legalLinks}>
          <Pressable onPress={openPrivacyPolicy} style={styles.legalButton}>
            <AppText style={styles.legalText}>Privacy Policy</AppText>
          </Pressable>
          <Pressable onPress={openTermsOfUse} style={styles.legalButton}>
            <AppText style={styles.legalText}>Terms of Use</AppText>
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
    gap: 20,
  },
  actions: {
    gap: 12,
  },
  infoCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f1e1d4",
    padding: 18,
    gap: 8,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
  },
  infoBody: {
    color: "#6b7280",
  },
  legalLinks: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
  },
  legalButton: {
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  legalText: {
    color: "#6b7280",
    fontSize: 13,
    textDecorationLine: "underline",
  },
});
