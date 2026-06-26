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

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp, isMockMode } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (loading) {
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !password || !confirmPassword) {
      setErrorMessage("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const result = await signUp(email.trim(), password);

      if (result.error) {
        setErrorMessage(getAuthErrorMessage(result.error));
        return;
      }

      if (!result.session) {
        setSuccessMessage("Check your email to confirm your account.");
        return;
      }
    } finally {
      setLoading(false);
    }
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
              Create your account to save check-ins, organize care, and keep your support tools ready on difficult days.
            </AppText>
          </View>

          <View style={styles.signUpCard}>
            <View style={styles.cardHeader}>
              <AppText style={styles.cardEyebrow}>Create account</AppText>
              <AppText style={styles.cardTitle}>Start with your email</AppText>
              <AppText style={styles.cardSubtitle}>
                Set up a secure account so your check-ins, care details, and support tools stay with you.
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
              <AuthTextField
                label="Confirm password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm password"
                secureTextEntry
              />

              {errorMessage ? <AppText style={styles.errorText}>{errorMessage}</AppText> : null}
              {successMessage ? <AppText style={styles.successText}>{successMessage}</AppText> : null}

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={loading ? "Creating account" : "Create account"}
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
                  {loading ? "Creating account..." : "Create Account"}
                </AppText>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={() => router.replace("/sign-in")}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && styles.secondaryButtonPressed,
                ]}
              >
                <AppText style={styles.secondaryButtonText}>Back to sign in</AppText>
              </Pressable>
            </View>

            {__DEV__ && isMockMode ? (
              <View style={styles.devCard}>
                <AppText style={styles.devBody}>
                  Real sign-up requires Supabase env. Mock mode is for routing only.
                </AppText>
              </View>
            ) : null}

            <AppText style={styles.trustText}>Your information stays private and secure.</AppText>
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
    top: -110,
    right: -70,
    width: 280,
    height: 280,
    borderRadius: 999,
    backgroundColor: "#ffe6d3",
    opacity: 0.75,
  },
  glowBottom: {
    position: "absolute",
    left: -90,
    bottom: 80,
    width: 240,
    height: 240,
    borderRadius: 999,
    backgroundColor: "#fff0e2",
    opacity: 0.8,
  },
  scrollContent: {
    paddingHorizontal: spacing.screenX,
    paddingTop: spacing.screenTop,
    paddingBottom: 32,
    gap: 22,
  },
  heroBlock: {
    gap: 14,
    paddingTop: 16,
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
    gap: 2,
    flexShrink: 1,
  },
  brandName: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.4,
  },
  brandSupportLine: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textWarm,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 25,
    color: colors.textBody,
  },
  signUpCard: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 22,
    gap: 20,
    ...shadows.soft,
  },
  cardHeader: {
    gap: 8,
  },
  cardEyebrow: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    letterSpacing: 0.4,
    color: colors.accent,
    textTransform: "uppercase",
  },
  cardTitle: {
    fontSize: 27,
    lineHeight: 32,
    fontWeight: "800",
    letterSpacing: -0.5,
    color: colors.text,
  },
  cardSubtitle: {
    fontSize: 15,
    lineHeight: 23,
    color: colors.textMuted,
  },
  form: {
    gap: 14,
  },
  primaryButton: {
    minHeight: 54,
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    ...shadows.soft,
  },
  primaryButtonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.995 }],
  },
  primaryButtonDisabled: {
    opacity: 0.64,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "700",
  },
  secondaryButton: {
    minHeight: 50,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceAccent,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  secondaryButtonPressed: {
    opacity: 0.84,
  },
  secondaryButtonText: {
    color: "#9a4f18",
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
  },
  errorText: {
    color: colors.errorText,
    lineHeight: 22,
  },
  successText: {
    color: colors.successText,
    lineHeight: 22,
  },
  trustText: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textWarm,
    textAlign: "center",
  },
  devCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#f2d5bb",
    backgroundColor: "#fff6ed",
    padding: 14,
  },
  devBody: {
    color: "#b45309",
    lineHeight: 20,
  },
});
