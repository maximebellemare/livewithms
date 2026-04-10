import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { isReactNativeWebView, postToNativeWebView } from "@/lib/webview";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<{ error: any }>;
  updatePassword: (newPassword: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    // IMPORTANT: Set up the listener BEFORE restoring the session
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setLoading(false);

      // Signal the native wrapper on critical auth events
      if (event === "SIGNED_IN") {
        postToNativeWebView({ type: "AUTH_SIGNED_IN", userId: newSession?.user?.id });
      }
      if (event === "SIGNED_OUT") {
        // Nuke all cached queries so the next user starts clean
        queryClient.clear();
        postToNativeWebView({ type: "AUTH_SIGNED_OUT" });
      }
    });

    // Restore persisted session with WebView-safe retry (up to 2 attempts)
    const restoreSession = async (attempt = 0) => {
      try {
        const { data: { session: s } } = await supabase.auth.getSession();
        setSession(s);
        setUser(s?.user ?? null);
        setLoading(false);
      } catch {
        if (attempt < 2) {
          setTimeout(() => restoreSession(attempt + 1), 1500);
        } else {
          setLoading(false);
        }
      }
    };
    restoreSession();

    return () => subscription.unsubscribe();
  }, [queryClient]);

  // --- WebView resume: refresh session when app returns from background ---
  useEffect(() => {
    if (!isReactNativeWebView) return;

    const handleVisibility = () => {
      if (document.visibilityState === "visible" && session) {
        // Silently refresh the token — if it expired while backgrounded
        // the listener will fire and update state automatically
        supabase.auth.getSession().catch(() => {
          // Ignore — the retry in restoreSession already handles this
        });
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [session]);

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      return { error };
    } catch (e: any) {
      return { error: { message: e?.message || "Signup failed. Please try again." } };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error };
    } catch (e: any) {
      return { error: { message: e?.message || "Login failed. Please try again." } };
    }
  };

  const signOut = useCallback(async () => {
    try {
      // Clear all cached data BEFORE signing out to prevent stale state
      queryClient.clear();
      await supabase.auth.signOut();
    } catch {
      // Best-effort sign out; clear local state regardless
      setSession(null);
      setUser(null);
      queryClient.clear();
    }
    // Signal native wrapper to remount WebView
    postToNativeWebView({ type: "AUTH_SIGNED_OUT" });
  }, [queryClient]);

  const sendPasswordReset = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error };
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut, sendPasswordReset, updatePassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
