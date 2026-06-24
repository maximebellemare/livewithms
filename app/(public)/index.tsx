import { useRouter } from "expo-router";
import { Image, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import appIcon from "../../assets/icon.png";
import AppText from "../../components/ui/AppText";
import { colors, radii, shadows, spacing } from "../../components/ui/design";

export default function PublicIndexScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View pointerEvents="none" style={styles.background}>
        <View style={styles.glowTop} />
        <View style={styles.glowBottom} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroBlock}>
          <View style={styles.brandLockup}>
            <Image
              accessibilityIgnoresInvertColors
              source={appIcon}
              style={styles.brandIcon}
            />
            <View style={styles.brandTextBlock}>
              <AppText style={styles.brandName}>LiveWithMS</AppText>
              <AppText style={styles.brandSupportLine}>Calm support for living with MS.</AppText>
            </View>
          </View>

          <AppText style={styles.subtitle}>
            Track patterns, organize care, and reduce overwhelm with tools designed for
            lower-energy moments.
          </AppText>
        </View>

        <View style={styles.entryCard}>
          <View style={styles.cardHeader}>
            <AppText style={styles.cardEyebrow}>Welcome</AppText>
            <AppText style={styles.cardTitle}>Sign in to continue</AppText>
            <AppText style={styles.cardSubtitle}>
              Open your check-ins, care details, reflections, and guided support in one place.
            </AppText>
          </View>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Continue to sign in"
              onPress={() => router.push("/sign-in")}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.primaryButtonPressed,
              ]}
            >
              <AppText style={styles.primaryButtonText}>Sign In</AppText>
            </Pressable>
          </View>

          <AppText style={styles.trustText}>Your information stays private and secure.</AppText>
        </View>

        <View style={styles.footerLinks}>
          <Pressable
            accessibilityRole="link"
            onPress={() => router.push("/privacy")}
            style={({ pressed }) => [styles.footerLink, pressed && styles.footerLinkPressed]}
          >
            <AppText style={styles.footerLinkText}>Privacy</AppText>
          </Pressable>
          <AppText style={styles.footerDot}>•</AppText>
          <Pressable
            accessibilityRole="link"
            onPress={() => router.push("/terms")}
            style={({ pressed }) => [styles.footerLink, pressed && styles.footerLinkPressed]}
          >
            <AppText style={styles.footerLinkText}>Terms</AppText>
          </Pressable>
          <AppText style={styles.footerDot}>•</AppText>
          <Pressable
            accessibilityRole="link"
            onPress={() => router.push("/medical-disclaimer")}
            style={({ pressed }) => [styles.footerLink, pressed && styles.footerLinkPressed]}
          >
            <AppText style={styles.footerLinkText}>Medical Disclaimer</AppText>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.page,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.page,
  },
  glowTop: {
    position: "absolute",
    top: -120,
    right: -80,
    width: 290,
    height: 290,
    borderRadius: 999,
    backgroundColor: "#ffe6d3",
    opacity: 0.76,
  },
  glowBottom: {
    position: "absolute",
    left: -100,
    bottom: 70,
    width: 230,
    height: 230,
    borderRadius: 999,
    backgroundColor: "#fff0e2",
    opacity: 0.84,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "space-between",
    paddingHorizontal: spacing.screenX,
    paddingTop: spacing.screenTop + 8,
    paddingBottom: 28,
    gap: 28,
  },
  heroBlock: {
    gap: 14,
    paddingTop: 12,
  },
  brandLockup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  brandIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  brandTextBlock: {
    flex: 1,
    gap: 2,
  },
  brandName: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "700",
    color: colors.text,
  },
  brandSupportLine: {
    fontSize: 15,
    lineHeight: 21,
    color: colors.textWarm,
  },
  subtitle: {
    color: colors.textBody,
    lineHeight: 24,
    maxWidth: 360,
  },
  entryCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.cardLarge,
    padding: spacing.cardPadding,
    gap: 20,
    ...shadows.soft,
  },
  cardHeader: {
    gap: 6,
  },
  cardEyebrow: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: colors.textWarm,
  },
  cardTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700",
    color: colors.text,
  },
  cardSubtitle: {
    color: colors.textMuted,
    lineHeight: 22,
  },
  actions: {
    gap: 12,
  },
  primaryButton: {
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    ...shadows.soft,
  },
  primaryButtonPressed: {
    backgroundColor: "#d96915",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
  },
  trustText: {
    color: colors.textWarm,
    fontSize: 14,
    lineHeight: 20,
  },
  footerLinks: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
    paddingTop: 4,
  },
  footerLink: {
    minHeight: 34,
    justifyContent: "center",
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  footerLinkPressed: {
    opacity: 0.72,
  },
  footerLinkText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
  },
  footerDot: {
    color: "#bca38f",
    fontSize: 13,
    lineHeight: 18,
  },
});
