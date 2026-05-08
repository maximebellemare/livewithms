import { Linking, Pressable, ScrollView, StyleSheet, View } from "react-native";
import AppButton from "../ui/AppButton";
import AppScreen from "../ui/AppScreen";
import AppText from "../ui/AppText";
import PaywallHero from "./PaywallHero";

const PRIVACY_POLICY_URL = "https://www.livewithms.com/policies/privacy-policy";
const TERMS_OF_USE_URL = "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/";

type FuturePaywallScreenProps = {
  onClose: () => void;
};

export default function FuturePaywallScreen({ onClose }: FuturePaywallScreenProps) {
  const openPrivacyPolicy = () => {
    void Linking.openURL(PRIVACY_POLICY_URL);
  };

  const openTermsOfUse = () => {
    void Linking.openURL(TERMS_OF_USE_URL);
  };

  // TODO: Replace placeholder plan data with RevenueCat offerings once subscriptions are enabled.
  // TODO: Wire the primary CTA and restore action to RevenueCat only when the subscription flag is enabled.
  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <PaywallHero />

        <View style={styles.planCard}>
          <AppText style={styles.planTitle}>Monthly</AppText>
          <AppText style={styles.planBody}>Price placeholder</AppText>
        </View>

        <View style={styles.planCard}>
          <AppText style={styles.planTitle}>Yearly</AppText>
          <AppText style={styles.planBody}>Price placeholder</AppText>
        </View>

        <View style={styles.disclosureCard}>
          <AppText style={styles.disclosureText}>
            Auto-renewal applies unless cancelled at least 24 hours before the end of the current period. Cancel anytime in your App Store account settings.
          </AppText>
        </View>

        <View style={styles.actions}>
          <AppButton label="Continue" onPress={onClose} />
          <Pressable style={styles.secondaryButton} onPress={onClose}>
            <AppText style={styles.secondaryText}>Not now</AppText>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={() => {}}>
            <AppText style={styles.secondaryText}>Restore Purchases</AppText>
          </Pressable>
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
  planCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f1e1d4",
    padding: 18,
    gap: 8,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
  },
  planBody: {
    color: "#6b7280",
  },
  disclosureCard: {
    backgroundColor: "#fffaf6",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f3dfd1",
    padding: 16,
  },
  disclosureText: {
    color: "#6b7280",
    lineHeight: 20,
    fontSize: 13,
  },
  actions: {
    gap: 12,
  },
  secondaryButton: {
    alignItems: "center",
    paddingVertical: 6,
  },
  secondaryText: {
    color: "#6b7280",
    fontSize: 13,
    textDecorationLine: "underline",
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
