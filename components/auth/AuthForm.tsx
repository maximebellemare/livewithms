import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import AppButton from "../ui/AppButton";
import AppScreen from "../ui/AppScreen";
import AppText from "../ui/AppText";
import AuthTextField from "./AuthTextField";
import { colors, radii, shadows, spacing } from "../ui/design";

type AuthFormProps = {
  title: string;
  subtitle?: string;
  email: string;
  password?: string;
  confirmPassword?: string;
  setEmail: (value: string) => void;
  setPassword?: (value: string) => void;
  setConfirmPassword?: (value: string) => void;
  submitLabel: string;
  onSubmit: () => void | Promise<void>;
  loading?: boolean;
  errorMessage?: string | null;
  successMessage?: string | null;
  showEmail?: boolean;
  showPassword?: boolean;
  showConfirmPassword?: boolean;
  footer?: ReactNode;
  children?: ReactNode;
};

export default function AuthForm({
  title,
  subtitle,
  email,
  password,
  confirmPassword,
  setEmail,
  setPassword,
  setConfirmPassword,
  submitLabel,
  onSubmit,
  loading = false,
  errorMessage,
  successMessage,
  showEmail = true,
  showPassword = false,
  showConfirmPassword = false,
  footer,
  children,
}: AuthFormProps) {
  return (
    <AppScreen title={title} subtitle={subtitle}>
      <View style={styles.card}>
        <View style={styles.form}>
        {showEmail ? (
          <AuthTextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
          />
        ) : null}

        {showPassword && setPassword ? (
          <AuthTextField
            label="Password"
            value={password ?? ""}
            onChangeText={setPassword}
            placeholder="Password"
            secureTextEntry
          />
        ) : null}

        {showConfirmPassword && setConfirmPassword ? (
          <AuthTextField
            label="Confirm Password"
            value={confirmPassword ?? ""}
            onChangeText={setConfirmPassword}
            placeholder="Confirm password"
            secureTextEntry
          />
        ) : null}

        {errorMessage ? <AppText style={styles.error}>{errorMessage}</AppText> : null}
        {successMessage ? <AppText style={styles.success}>{successMessage}</AppText> : null}

        {children}

        <AppButton label={loading ? "Loading..." : submitLabel} onPress={() => void onSubmit()} disabled={loading} />
      </View>
      </View>

      {footer}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.screenX,
    borderRadius: radii.cardLarge,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.cardPadding,
    ...shadows.floating,
  },
  form: {
    gap: 12,
  },
  error: {
    color: "#b91c1c",
  },
  success: {
    color: "#166534",
  },
});
