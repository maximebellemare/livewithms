import { useRouter } from "expo-router";
import { useState } from "react";
import AuthForm from "../../components/auth/AuthForm";
import AppButton from "../../components/ui/AppButton";
import AppText from "../../components/ui/AppText";
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
    const result = await signUp(email.trim(), password);

    if (result.error) {
      setErrorMessage(getAuthErrorMessage(result.error));
    } else if (!result.session) {
      setSuccessMessage("Check your email to confirm your account");
    }

    setLoading(false);
  };

  return (
    <AuthForm
      title="Sign Up"
      subtitle="Create an account with your email and password"
      email={email}
      password={password}
      confirmPassword={confirmPassword}
      setEmail={setEmail}
      setPassword={setPassword}
      setConfirmPassword={setConfirmPassword}
      submitLabel="Create Account"
      onSubmit={handleSubmit}
      loading={loading}
      errorMessage={errorMessage}
      successMessage={successMessage}
      showPassword
      showConfirmPassword
      footer={<AppButton label="Back to sign in" onPress={() => router.replace("/sign-in")} />}
    >
      {__DEV__ && isMockMode ? (
        <AppText style={{ color: "#b45309" }}>
          Real sign-up requires Supabase env. Mock mode is for routing only.
        </AppText>
      ) : null}
    </AuthForm>
  );
}
