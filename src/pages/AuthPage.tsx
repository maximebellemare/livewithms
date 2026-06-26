import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import MedicalDisclaimerDialog from "@/components/MedicalDisclaimerDialog";
import { friendlyError } from "@/lib/errorMessages";
import { getReferralPrefill, normalizeReferral, storePendingReferralCode, storeReferral } from "@/lib/affiliate";

type Mode = "signin" | "signup" | "forgot";

const AuthPage = () => {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const [referralCode, setReferralCode] = useState(() => getReferralPrefill(searchParams.toString() ? `?${searchParams.toString()}` : ""));

  const { signIn, signUp, sendPasswordReset } = useAuth();

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const isCapacitor = false;
      const redirectUri = isCapacitor
        ? "com.livewithms.app://auth/callback"
        : window.location.origin;

      const { error } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: redirectUri,
      });
      if (error) {
        const message = error instanceof Error ? error.message : "Google sign-in failed.";
        toast.error(friendlyError(message));
        setGoogleLoading(false);
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Google sign-in failed.";
      toast.error(friendlyError(message));
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (mode === "forgot") {
      const { error } = await sendPasswordReset(email);
      if (error) {
        toast.error(friendlyError(error.message));
      } else {
        toast.success("Password reset email sent! Check your inbox.");
        setMode("signin");
      }
    } else if (mode === "signup") {
      const normalizedReferral = normalizeReferral(referralCode);
      if (normalizedReferral) {
        storePendingReferralCode(normalizedReferral);
        storeReferral(normalizedReferral);
      }
      const { error } = await signUp(email, password);
      if (error) {
        toast.error(friendlyError(error.message));
      } else {
        toast.success("Account created! You're all set.");
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error(friendlyError(error.message));
      }
    }
    setLoading(false);
  };

  const titles: Record<Mode, { heading: string; sub: string; btn: string }> = {
    signin:  { heading: "Welcome back",      sub: "Sign in to your account",        btn: "Sign In" },
    signup:  { heading: "Create account",    sub: "Start tracking your health",     btn: "Sign Up" },
    forgot:  { heading: "Reset password",    sub: "We'll email you a reset link",   btn: "Send reset link" },
  };
  const { heading, sub, btn } = titles[mode];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="text-center mb-8">
          <span className="text-5xl">🧡</span>
          <h1 className="mt-4 font-display text-3xl font-bold text-foreground">LiveWithMS</h1>
          <p className="mt-2 text-sm text-muted-foreground">{sub}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-xl bg-card p-4 shadow-soft space-y-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            {mode !== "forgot" && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-foreground">Password</label>
                  {mode === "signin" && (
                    <button
                      type="button"
                      onClick={() => setMode("forgot")}
                      className="text-xs text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            )}
            {mode === "signup" && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Referral code <span className="text-muted-foreground font-normal">(optional)</span></label>
                <input
                  type="text"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
                  placeholder="Example: SARAH"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-primary py-3.5 text-base font-semibold text-primary-foreground shadow-card transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? "…" : btn}
          </button>
        </form>

        {mode !== "forgot" && (
          <>
            <div className="relative flex items-center gap-3 py-1">
              <div className="flex-1 border-t border-border" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="flex-1 border-t border-border" />
            </div>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              {mode === "signup" ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
                className="font-medium text-primary hover:underline"
              >
                {mode === "signup" ? "Sign In" : "Sign Up"}
              </button>
            </p>
          </>
        )}

        {mode === "forgot" && (
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Remember it?{" "}
            <button onClick={() => setMode("signin")} className="font-medium text-primary hover:underline">
              Sign In
            </button>
          </p>
        )}

        <p className="mt-6 text-center text-xs text-muted-foreground">
          <MedicalDisclaimerDialog triggerClassName="hover:text-primary/70 transition-colors cursor-pointer" /> · <a href="https://livewithms.com/policies/privacy-policy" target="_blank" rel="noopener noreferrer" className="hover:text-primary/70 transition-colors">Privacy Policy</a> · <a href="https://livewithms.com/policies/terms-of-service" target="_blank" rel="noopener noreferrer" className="hover:text-primary/70 transition-colors">Terms</a> · <a href="mailto:support@livewithms.com" className="hover:text-primary/70 transition-colors">Contact support</a> · Your data is encrypted and private
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
