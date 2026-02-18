import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";

type Mode = "signin" | "signup" | "forgot";


const AuthPage = () => {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { signIn, signUp, sendPasswordReset } = useAuth();

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (error) {
      toast.error((error as any).message ?? "Google sign-in failed");
      setGoogleLoading(false);
    }
    // On success the page redirects — no need to reset loading
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (mode === "forgot") {
      const { error } = await sendPasswordReset(email);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Password reset email sent! Check your inbox.");
        setMode("signin");
      }
    } else if (mode === "signup") {
      const { error } = await signUp(email, password);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Check your email to confirm your account!");
        setMode("signin");
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error(error.message);
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
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-primary py-3.5 text-base font-semibold text-primary-foreground shadow-card transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? "…" : btn}
          </button>
        </form>

        {/* Google Sign-In — shown on sign-in and sign-up screens */}
        {mode !== "forgot" && (
          <>
            <div className="relative flex items-center gap-3 py-1">
              <div className="flex-1 border-t border-border" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="flex-1 border-t border-border" />
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="flex w-full items-center justify-center gap-3 rounded-full border border-border bg-card py-3.5 text-sm font-semibold text-foreground shadow-soft transition-all hover:bg-secondary active:scale-[0.98] disabled:opacity-60"
            >
              {/* Google "G" SVG */}
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
                <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.548 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/>
              </svg>
              {googleLoading ? "Signing in…" : "Continue with Google"}
            </button>
          </>
        )}

        {mode === "forgot" ? (
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Remember it?{" "}
            <button onClick={() => setMode("signin")} className="font-medium text-primary hover:underline">
              Sign In
            </button>
          </p>
        ) : (
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {mode === "signup" ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
              className="font-medium text-primary hover:underline"
            >
              {mode === "signup" ? "Sign In" : "Sign Up"}
            </button>
          </p>
        )}


        <p className="mt-6 text-center text-[10px] text-muted-foreground">
          ⚕️ Not medical advice · Your data is encrypted and private
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
