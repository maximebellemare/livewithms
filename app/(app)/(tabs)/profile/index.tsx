import { router } from "expo-router";
import { Alert, Linking, Pressable, ScrollView, StyleSheet, View } from "react-native";
import AppButton from "../../../../components/ui/AppButton";
import AppScreen from "../../../../components/ui/AppScreen";
import AppText from "../../../../components/ui/AppText";
import { useDeleteAccount } from "../../../../features/account/hooks";
import { useAuth } from "../../../../features/auth/hooks";
import { getErrorMessage } from "../../../../lib/errors";

const PRIVACY_POLICY_URL = "https://www.livewithms.com/policies/privacy-policy";
const TERMS_OF_USE_URL = "https://www.livewithms.com/policies/terms-of-service";
const NATIONAL_MS_SOCIETY_URL = "https://www.nationalmssociety.org/";
const MAYO_MS_URL = "https://www.mayoclinic.org/diseases-conditions/multiple-sclerosis";
const NHS_MS_URL = "https://www.nhs.uk/conditions/multiple-sclerosis/";

export default function ProfileScreen() {
  const { signOut } = useAuth();
  const deleteAccount = useDeleteAccount();

  const confirmDeleteAccount = () => {
    Alert.alert(
      "Delete account",
      "This will permanently delete your account and app data.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void handleDeleteAccount();
          },
        },
      ],
    );
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount.mutateAsync();
      Alert.alert(
        "Account deleted",
        "Your account and app data have been permanently deleted.",
        [
          {
            text: "OK",
            onPress: () => {
              void signOut();
            },
          },
        ],
      );
    } catch (error) {
      Alert.alert("Unable to delete account", getErrorMessage(error));
    }
  };

  const openPrivacyPolicy = () => {
    void Linking.openURL(PRIVACY_POLICY_URL);
  };

  const openTermsOfUse = () => {
    void Linking.openURL(TERMS_OF_USE_URL);
  };

  const openNationalMSSociety = () => {
    void Linking.openURL(NATIONAL_MS_SOCIETY_URL);
  };

  const openMayoClinic = () => {
    void Linking.openURL(MAYO_MS_URL);
  };

  const openNHS = () => {
    void Linking.openURL(NHS_MS_URL);
  };

  return (
    <AppScreen
      title="Profile"
      subtitle="Manage your account, privacy choices, and support options."
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <AppText style={styles.title}>Quick links</AppText>
          <AppText style={styles.body}>
            Move to the sections you may need most for wellness tracking, legal details, and medical sources.
          </AppText>
          <AppButton label="Go to Today" onPress={() => router.push("/today")} />
          <View style={styles.legalLinks}>
            <Pressable onPress={openPrivacyPolicy} style={styles.legalButton}>
              <AppText style={styles.legalText}>Privacy Policy</AppText>
            </Pressable>
            <Pressable onPress={openTermsOfUse} style={styles.legalButton}>
              <AppText style={styles.legalText}>Terms of Use</AppText>
            </Pressable>
            <Pressable onPress={openNationalMSSociety} style={styles.legalButton}>
              <AppText style={styles.legalText}>Medical Sources</AppText>
            </Pressable>
          </View>
        </View>

        <View style={styles.card}>
          <AppText style={styles.title}>Account</AppText>
          <AppText style={styles.body}>
            Review your app access, sign out securely, or permanently delete your account.
          </AppText>
          <AppButton label="Sign out" onPress={() => void signOut()} />
          <AppButton
            label={deleteAccount.isPending ? "Deleting account..." : "Delete account"}
            onPress={confirmDeleteAccount}
            variant="secondary"
            disabled={deleteAccount.isPending}
          />
        </View>

        <View style={styles.card}>
          <AppText style={styles.title}>Privacy and support</AppText>
          <AppText style={styles.body}>
            LiveWithMS is designed to support your daily wellness tracking while keeping your
            information tied to your personal account.
          </AppText>
          <AppText style={styles.body}>
            If you need help with access, billing, or your account, contact support from the email
            linked to your profile.
          </AppText>
          <View style={styles.legalLinks}>
            <Pressable onPress={openPrivacyPolicy} style={styles.legalButton}>
              <AppText style={styles.legalText}>Privacy Policy</AppText>
            </Pressable>
            <Pressable onPress={openTermsOfUse} style={styles.legalButton}>
              <AppText style={styles.legalText}>Terms of Use</AppText>
            </Pressable>
          </View>
        </View>

        <View style={styles.card}>
          <AppText style={styles.title}>Medical disclaimer and sources</AppText>
          <AppText style={styles.body}>
            LiveWithMS provides wellness education and self-tracking tools only. It does not
            provide medical advice, diagnosis, or treatment. Always speak with a qualified
            healthcare professional about medical decisions, symptoms, medications, or treatment
            changes.
          </AppText>
          <View style={styles.legalLinks}>
            <Pressable onPress={openNationalMSSociety} style={styles.legalButton}>
              <AppText style={styles.legalText}>National Multiple Sclerosis Society</AppText>
            </Pressable>
            <Pressable onPress={openMayoClinic} style={styles.legalButton}>
              <AppText style={styles.legalText}>Mayo Clinic Multiple Sclerosis</AppText>
            </Pressable>
            <Pressable onPress={openNHS} style={styles.legalButton}>
              <AppText style={styles.legalText}>NHS Multiple Sclerosis</AppText>
            </Pressable>
          </View>
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
    gap: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
  },
  body: {
    color: "#4b5563",
  },
  legalLinks: {
    gap: 8,
    marginTop: 4,
  },
  legalButton: {
    alignSelf: "flex-start",
  },
  legalText: {
    color: "#6b7280",
    textDecorationLine: "underline",
  },
});
