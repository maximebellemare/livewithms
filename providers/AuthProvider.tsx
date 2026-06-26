import { PropsWithChildren, createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { authApi } from "../features/auth/api";
import type { AuthContextValue, AuthResult, SignUpResult } from "../features/auth/types";
import type { DevMockAuthState } from "../features/auth/types";
import {
  getDevMockAuthState,
  getMockSessionData,
  setDevMockAuthState as setGlobalDevMockAuthState,
  subscribeToDevMockAuth,
} from "../lib/dev-auth";
import env from "../lib/env";
import { logger } from "../lib/logger";
import { profileApi } from "../features/profile/api";

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export default function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [devMockState, setLocalDevMockState] = useState<DevMockAuthState>(getDevMockAuthState());
  const initializedRef = useRef(false);
  const readyRef = useRef(false);

  useEffect(() => {
    if (!__DEV__) {
      return;
    }

    console.log("[startup] AuthProvider initialization", {
      isSupabaseConfigured: env.isSupabaseConfigured,
      supabaseProjectRef: env.supabaseProjectRef,
    });
  }, []);

  const setDevMockState = useCallback((state: DevMockAuthState) => {
    setGlobalDevMockAuthState(state);
  }, []);

  const signIn = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      if (!env.isSupabaseConfigured) {
        return { error: new Error("Supabase is not configured. Dev-only mock mode is active.") };
      }

      const result = await authApi.signIn(email, password);
      if (result.error) {
        logger.warn("Sign in failed", { error: result.error.message });
      }
      return result;
    },
    [],
  );

  const signUp = useCallback(
    async (email: string, password: string): Promise<SignUpResult> => {
      if (!env.isSupabaseConfigured) {
        return {
          error: new Error("Supabase is not configured. Dev-only mock mode is active."),
          session: null,
        };
      }

      const result = await authApi.signUp(email, password);
      if (result.error) {
        logger.warn("Sign up failed", { error: result.error.message });
        console.error("[auth] signup failed in provider", {
          email,
          message: result.error.message,
        });
        return result;
      }

      if (result.session?.user?.id) {
        try {
          console.log("[profile] profile creation start", {
            userId: result.session.user.id,
            source: "signup-bootstrap",
          });
          await profileApi.createFallbackProfile(result.session.user.id);
          console.log("[profile] profile creation success", {
            userId: result.session.user.id,
            source: "signup-bootstrap",
          });
        } catch (error) {
          console.error("[profile] profile creation failure", {
            userId: result.session.user.id,
            source: "signup-bootstrap",
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
      return result;
    },
    [],
  );

  const sendPasswordReset = useCallback(
    async (email: string): Promise<AuthResult> => {
      if (!env.isSupabaseConfigured) {
        return { error: new Error("Supabase is not configured. Dev-only mock mode is active.") };
      }

      const result = await authApi.sendPasswordReset(email);
      if (result.error) {
        logger.warn("Password reset email failed", { error: result.error.message });
      }
      return result;
    },
    [],
  );

  const updatePassword = useCallback(
    async (password: string): Promise<AuthResult> => {
      if (!env.isSupabaseConfigured) {
        return { error: new Error("Supabase is not configured. Dev-only mock mode is active.") };
      }

      const result = await authApi.updatePassword(password);
      if (result.error) {
        logger.warn("Password update failed", { error: result.error.message });
      }
      return result;
    },
    [],
  );

  const signOut = useCallback(async (): Promise<void> => {
    if (!env.isSupabaseConfigured) {
      setDevMockState("signed-out");
      return;
    }

    await authApi.signOut();
  }, [setDevMockState]);

  useEffect(() => {
    if (initializedRef.current) {
      return;
    }

    initializedRef.current = true;

    if (!env.isSupabaseConfigured) {
      logger.warn("AuthProvider using dev-only mock auth mode");
      if (__DEV__) {
        console.log("[startup] Session load end", {
          source: "mock-auth",
          hasSession: Boolean(getMockSessionData().session),
        });
      }
      const initial = getMockSessionData();
      setSession(initial.session);
      setUser(initial.user);

      const unsubscribe = subscribeToDevMockAuth((state) => {
        const next = getMockSessionData();
        setLocalDevMockState(state);
        setSession(next.session);
        setUser(next.user);
      });

      if (!readyRef.current) {
        readyRef.current = true;
        if (__DEV__) {
          console.log("[startup] RouteGate appReady state", {
            source: "mock-auth",
            appReady: true,
          });
        }
        setIsReady(true);
      }

      return unsubscribe;
    }

    const { data } = authApi.onAuthStateChange((nextSession) => {
      if (__DEV__) {
        console.log("[startup] Auth state changed", {
          event: "onAuthStateChange",
          hasSession: Boolean(nextSession),
          userId: nextSession?.user?.id ?? null,
        });
      }
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
    });

    if (__DEV__) {
      console.log("[startup] Session load start", {
        source: "supabase",
      });
    }

    void authApi
      .getSession()
      .then((nextSession) => {
        if (__DEV__) {
          console.log("[startup] Session load end", {
            source: "supabase",
            hasSession: Boolean(nextSession),
            userId: nextSession?.user?.id ?? null,
          });
        }
        setSession(nextSession);
        setUser(nextSession?.user ?? null);
      })
      .catch((error) => {
        if (__DEV__) {
          console.error("[startup] Session load failed", {
            message: error instanceof Error ? error.message : String(error),
          });
        }
        logger.error("Initial session restore failed", { error: String(error) });
        setSession(null);
        setUser(null);
      })
      .finally(() => {
        if (!readyRef.current) {
          readyRef.current = true;
          if (__DEV__) {
            console.log("[startup] RouteGate appReady state", {
              source: "auth-provider-finally",
              appReady: true,
            });
          }
          setIsReady(true);
        }
      });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      isReady,
      isAuthenticated: !!user,
      isMockMode: !env.isSupabaseConfigured,
      devMockState,
      setDevMockState,
      signIn,
      signUp,
      sendPasswordReset,
      updatePassword,
      signOut,
    }),
    [devMockState, isReady, sendPasswordReset, session, setDevMockState, signIn, signOut, signUp, updatePassword, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
