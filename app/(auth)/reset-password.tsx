import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet } from "react-native";
import AuthForm from "../../components/auth/AuthForm";
import AppText from "../../components/ui/AppText";
import { colors, spacing } from "../../components/ui/design";
import { authApi } from "../../features/auth/api";
import { useAuth } from "../../features/auth/hooks";
import { getAuthErrorMessage } from "../../lib/auth-errors";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { updatePassword, signOut, isMockMode } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

    if (!password || !confirmPassword) {
      setErrorMessage("Please enter and confirm your new password.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    const session = await authApi.getCurrentSession();
    if (!session) {
      setErrorMessage("This password reset link is invalid or has expired. Please request a new one.");
      return;
    }

    setLoading(true);
    const result = await updatePassword(password);
    if (result.error) {
      setErrorMessage(getAuthErrorMessage(result.error));
      setLoading(false);
      return;
    }

    setSuccessMessage("Password updated successfully. Please sign in again.");
    await signOut();
    setLoading(false);
    router.replace("/sign-in");
  };

  return (
    <AuthForm
      title="Reset Password"
      subtitle="Enter a new password for your account"
      email={email}
      password={password}
      confirmPassword={confirmPassword}
      setEmail={setEmail}
      setPassword={setPassword}
      setConfirmPassword={setConfirmPassword}
      submitLabel="Update Password"
      onSubmit={handleSubmit}
      loading={loading}
      errorMessage={errorMessage}
      successMessage={successMessage}
      showEmail={false}
      showPassword
      showConfirmPassword
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
          Password reset is unavailable in dev-only mock mode.
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
