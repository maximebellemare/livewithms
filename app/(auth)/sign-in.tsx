import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import appIcon from "../../assets/icon.png";
import AuthTextField from "../../components/auth/AuthTextField";
import AppText from "../../components/ui/AppText";
import { colors, radii, shadows, spacing } from "../../components/ui/design";
import { useAuth } from "../../features/auth/hooks";
import { getAuthErrorMessage } from "../../lib/auth-errors";

export default function SignInScreen() {
  const router = useRouter();
  const { isMockMode, devMockState, setDevMockState, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage("Enter your email and password.");
      return;
    }

    setLoading(true);
    const result = await signIn(email.trim(), password);
    if (result.error) {
      setErrorMessage(getAuthErrorMessage(result.error));
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View pointerEvents="none" style={styles.background}>
        <View style={styles.glowTop} />
        <View style={styles.glowBottom} />
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardArea}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
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

          <View style={styles.signInCard}>
            <View style={styles.cardHeader}>
              <AppText style={styles.cardEyebrow}>Sign in</AppText>
              <AppText style={styles.cardTitle}>Continue with your account</AppText>
              <AppText style={styles.cardSubtitle}>
                Use your email and password to open your check-ins, care details, and support
                tools.
              </AppText>
            </View>

            <View style={styles.form}>
              <AuthTextField
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                keyboardType="email-address"
              />
              <AuthTextField
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                secureTextEntry
              />

              {errorMessage ? <AppText style={styles.errorText}>{errorMessage}</AppText> : null}

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={loading ? "Signing in" : "Continue with Email"}
                accessibilityState={{ disabled: loading }}
                onPress={() => void handleSubmit()}
                disabled={loading}
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && !loading && styles.primaryButtonPressed,
                  loading && styles.primaryButtonDisabled,
                ]}
              >
                <AppText style={styles.primaryButtonText}>
                  {loading ? "Signing in..." : "Continue with Email"}
                </AppText>
              </Pressable>

              <View style={styles.secondaryActions}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push("/sign-up")}
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    pressed && styles.secondaryButtonPressed,
                  ]}
                >
                  <AppText style={styles.secondaryButtonText}>Create Account</AppText>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push("/forgot-password")}
                  style={({ pressed }) => [styles.textAction, pressed && styles.textActionPressed]}
                >
                  <AppText style={styles.textActionText}>Forgot Password</AppText>
                </Pressable>
              </View>
            </View>

            <AppText style={styles.trustText}>Your information stays private and secure.</AppText>
          </View>

          {isMockMode ? (
            <View style={styles.devCard}>
              <AppText style={styles.devTitle}>Dev-only mock auth mode is active.</AppText>
              <AppText style={styles.devBody}>Current mock state: {devMockState}</AppText>
              <View style={styles.devActions}>
                <Pressable
                  onPress={() => setDevMockState("signed-out")}
                  style={({ pressed }) => [styles.devButton, pressed && styles.secondaryButtonPressed]}
                >
                  <AppText style={styles.secondaryButtonText}>Simulate signed-out</AppText>
                </Pressable>
                <Pressable
                  onPress={() => setDevMockState("signed-in-onboarded")}
                  style={({ pressed }) => [styles.devButton, pressed && styles.secondaryButtonPressed]}
                >
                  <AppText style={styles.secondaryButtonText}>Simulate signed-in onboarded</AppText>
                </Pressable>
                <Pressable
                  onPress={() => setDevMockState("signed-in-not-onboarded")}
                  style={({ pressed }) => [styles.devButton, pressed && styles.secondaryButtonPressed]}
                >
                  <AppText style={styles.secondaryButtonText}>Simulate signed-in not onboarded</AppText>
                </Pressable>
              </View>
            </View>
          ) : null}

          <View style={styles.legalSection}>
            <View style={styles.legalLinks}>
              <Pressable
                accessibilityRole="link"
                onPress={() => router.push("/terms")}
                style={({ pressed }) => [styles.legalLink, pressed && styles.legalLinkPressed]}
              >
                <AppText style={styles.legalLinkText}>Terms</AppText>
              </Pressable>
              <Pressable
                accessibilityRole="link"
                onPress={() => router.push("/privacy")}
                style={({ pressed }) => [styles.legalLink, pressed && styles.legalLinkPressed]}
              >
                <AppText style={styles.legalLinkText}>Privacy Policy</AppText>
              </Pressable>
              <Pressable
                accessibilityRole="link"
                onPress={() => router.push("/medical-disclaimer")}
                style={({ pressed }) => [styles.legalLink, pressed && styles.legalLinkPressed]}
              >
                <AppText style={styles.legalLinkText}>Medical Disclaimer</AppText>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.page,
  },
  keyboardArea: {
    flex: 1,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.page,
  },
  glowTop: {
    position: "absolute",
    top: -128,
    right: -84,
    width: 320,
    height: 320,
    borderRadius: 999,
    backgroundColor: "rgba(254, 120, 26, 0.18)",
    opacity: 1,
  },
  glowBottom: {
    position: "absolute",
    left: -100,
    bottom: 40,
    width: 280,
    height: 280,
    borderRadius: 999,
    backgroundColor: "rgba(255, 214, 182, 0.62)",
    opacity: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.screenX,
    paddingTop: spacing.screenTop,
    paddingBottom: 32,
    gap: 22,
  },
  heroBlock: {
    gap: 16,
    paddingTop: 12,
    paddingHorizontal: 2,
  },
  brandLockup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: "rgba(255, 253, 251, 0.86)",
    paddingHorizontal: 16,
    paddingVertical: 16,
    ...shadows.floating,
  },
  brandIcon: {
    width: 68,
    height: 68,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceRaised,
    ...shadows.soft,
  },
  brandTextBlock: {
    gap: 2,
    flex: 1,
  },
  brandName: {
    fontSize: 25,
    lineHeight: 30,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.4,
  },
  brandSupportLine: {
    fontSize: 15,
    lineHeight: 21,
    color: colors.accentDeep,
    fontWeight: "600",
  },
  subtitle: {
    color: colors.textBody,
    lineHeight: 25,
    maxWidth: 360,
  },
  signInCard: {
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radii.cardLarge,
    padding: spacing.cardPadding,
    gap: 20,
    ...shadows.floating,
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
    color: colors.accentDeep,
  },
  cardTitle: {
    fontSize: 29,
    lineHeight: 36,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.5,
  },
  cardSubtitle: {
    color: colors.textBody,
    lineHeight: 22,
  },
  form: {
    gap: 14,
  },
  secondaryActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  trustText: {
    color: colors.textBody,
    fontSize: 14,
    lineHeight: 20,
  },
  primaryButton: {
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: colors.accent,
    borderWidth: 1,
    borderColor: colors.accentDeep,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    ...shadows.floating,
  },
  primaryButtonPressed: {
    backgroundColor: colors.accentDeep,
  },
  primaryButtonDisabled: {
    opacity: 0.62,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
  },
  secondaryButton: {
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: colors.surfaceAccent,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryButtonPressed: {
    opacity: 0.78,
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600",
  },
  textAction: {
    minHeight: 44,
    justifyContent: "center",
    paddingVertical: 8,
  },
  textActionPressed: {
    opacity: 0.72,
  },
  textActionText: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600",
  },
  errorText: {
    color: colors.errorText,
    lineHeight: 21,
  },
  devCard: {
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radii.card,
    padding: spacing.compactCardPadding,
    gap: 12,
  },
  devTitle: {
    fontWeight: "700",
    color: "#b45309",
  },
  devBody: {
    color: colors.textBody,
  },
  devActions: {
    gap: 10,
  },
  devButton: {
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: colors.borderSoft,
    justifyContent: "center",
    alignItems: "center",
  },
  legalSection: {
    gap: 8,
    paddingTop: 2,
    paddingBottom: 8,
  },
  legalLinks: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 4,
  },
  legalLink: {
    minHeight: 34,
    paddingHorizontal: 8,
    paddingVertical: 6,
    justifyContent: "center",
    borderRadius: 10,
  },
  legalLinkPressed: {
    opacity: 0.75,
  },
  legalLinkText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
  },
});
