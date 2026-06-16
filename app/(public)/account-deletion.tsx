import { Linking, Pressable, ScrollView, StyleSheet, View } from "react-native";
import AppScreen from "../../components/ui/AppScreen";
import AppText from "../../components/ui/AppText";

const ACCOUNT_DELETION_EMAIL = "valmontmarketing@gmail.com";

const deletionItems = [
  "Full account deletion",
  "Community posts deletion",
  "Symptom tracking deletion",
  "Coach conversation deletion",
  "Care data deletion",
];

export default function AccountDeletionScreen() {
  const openMail = () => {
    void Linking.openURL(`mailto:${ACCOUNT_DELETION_EMAIL}?subject=LiveWithMS%20Account%20Deletion%20Request`);
  };

  return (
    <AppScreen
      eyebrow="Support"
      title="Delete Your LiveWithMS Account"
      subtitle="You can request account deletion at any time, even if you are not signed in."
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <AppText style={styles.body}>
            To request deletion of your LiveWithMS account and related data, email us at{" "}
            <AppText style={styles.inlineEmail}>{ACCOUNT_DELETION_EMAIL}</AppText>.
          </AppText>
          <Pressable onPress={openMail} style={styles.emailButton}>
            <AppText style={styles.emailButtonText}>Email deletion request</AppText>
          </Pressable>
        </View>

        <View style={styles.card}>
          <AppText style={styles.sectionTitle}>What you can request</AppText>
          {deletionItems.map((item) => (
            <AppText key={item} style={styles.listItem}>• {item}</AppText>
          ))}
        </View>

        <View style={styles.card}>
          <AppText style={styles.sectionTitle}>Subscriptions</AppText>
          <AppText style={styles.body}>
            Subscription billing is handled through the Apple App Store or Google Play and may
            need to be cancelled separately from your deletion request.
          </AppText>
        </View>

        <View style={styles.card}>
          <AppText style={styles.sectionTitle}>Timing</AppText>
          <AppText style={styles.body}>
            Deletion requests are typically processed within 30 days.
          </AppText>
        </View>

        <View style={styles.card}>
          <AppText style={styles.sectionTitle}>Temporary retention</AppText>
          <AppText style={styles.body}>
            Certain records may be retained temporarily if required for legal, security,
            fraud-prevention, or accounting purposes.
          </AppText>
        </View>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingBottom: 104,
    gap: 16,
  },
  card: {
    backgroundColor: "#fffaf6",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#f3dfd1",
    padding: 18,
    gap: 10,
  },
  sectionTitle: {
    color: "#1f2937",
    fontSize: 17,
    fontWeight: "700",
  },
  body: {
    color: "#6b7280",
    fontSize: 15,
    lineHeight: 23,
  },
  listItem: {
    color: "#4b5563",
    fontSize: 15,
    lineHeight: 22,
  },
  inlineEmail: {
    color: "#c25d10",
    fontWeight: "700",
  },
  emailButton: {
    alignSelf: "flex-start",
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: "#e9771d",
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  emailButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
});
