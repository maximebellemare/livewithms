import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet } from "react-native";
import AuthForm from "../../components/auth/AuthForm";
import AppText from "../../components/ui/AppText";
import { colors, spacing } from "../../components/ui/design";
import { useAuth } from "../../features/auth/hooks";
import { getAuthErrorMessage } from "../../lib/auth-errors";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { sendPasswordReset, isMockMode } = useAuth();
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleBackToSignIn = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/sign-in");
  };

  const handleSubmit = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setErrorMessage("Please enter your email.");
      return;
    }

    setLoading(true);
    const result = await sendPasswordReset(email.trim());
    if (result.error) {
      setErrorMessage(getAuthErrorMessage(result.error));
    } else {
      setSuccessMessage("Check your email for a password reset link.");
    }
    setLoading(false);
  };

  return (
    <AuthForm
      title="Forgot Password"
      subtitle="Enter your email to receive a reset link"
      email={email}
      setEmail={setEmail}
      submitLabel="Send Reset Email"
      onSubmit={handleSubmit}
      loading={loading}
      errorMessage={errorMessage}
      successMessage={successMessage}
      topAction={(
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to sign in"
          onPress={handleBackToSignIn}
          style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
        >
          <AppText style={styles.backButtonText}>← Back to sign in</AppText>
        </Pressable>
      )}
    >
      {isMockMode ? (
        <AppText style={{ color: "#b45309" }}>
          Recovery emails are unavailable in dev-only mock mode.
        </AppText>
      ) : null}
    </AuthForm>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingRight: 8,
  },
  backButtonPressed: {
    opacity: 0.72,
  },
  backButtonText: {
    color: colors.accentDeep,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
    paddingHorizontal: spacing.xs,
  },
});
