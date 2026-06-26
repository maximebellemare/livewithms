import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import env from "../../lib/env";
import { supabase } from "../../lib/supabase/client";
import type { AuthResult, SignUpResult } from "./types";

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out`)), timeoutMs);
    }),
  ]);
}

function getAuthErrorMeta(error: unknown) {
  const maybeError = error as {
    message?: unknown;
    code?: unknown;
    status?: unknown;
  };

  const message = typeof maybeError?.message === "string" ? maybeError.message : "Unknown auth error";
  const code = typeof maybeError?.code === "string" ? maybeError.code : undefined;
  const status = typeof maybeError?.status === "number" ? maybeError.status : undefined;
  const normalizedMessage = message.toLowerCase();

  return {
    message,
    code,
    status,
    timedOut: normalizedMessage.includes("timed out") || normalizedMessage.includes("timeout"),
    networkFailure:
      normalizedMessage.includes("network request failed") ||
      normalizedMessage.includes("failed to fetch") ||
      normalizedMessage.includes("networkerror"),
    duplicateEmail:
      normalizedMessage.includes("already registered") ||
      normalizedMessage.includes("already been registered") ||
      normalizedMessage.includes("user already registered"),
  };
}

function isRetryableSignUpError(error: unknown) {
  const meta = getAuthErrorMeta(error);
  return meta.timedOut || meta.networkFailure;
}

async function pause(ms: number) {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export const authApi = {
  async getSession(): Promise<Session | null> {
    const { data, error } = await withTimeout(supabase.auth.getSession(), 8000, "Supabase session restore");
    if (error) {
      throw error;
    }

    return data.session;
  },
  async getCurrentSession(): Promise<Session | null> {
    const { data, error } = await withTimeout(supabase.auth.getSession(), 8000, "Supabase current session");
    if (error) {
      throw error;
    }

    return data.session;
  },
  onAuthStateChange(callback: (session: Session | null, event: AuthChangeEvent) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(session, event);
    });
  },
  async signIn(email: string, password: string): Promise<AuthResult> {
    console.log("[auth] signin start", {
      email,
    });

    const { error } = await withTimeout(
      supabase.auth.signInWithPassword({
        email,
        password,
      }),
      12000,
      "Supabase sign in",
    );

    if (error) {
      console.error("[auth] signin failure", {
        email,
        message: error.message,
        code: "code" in error ? error.code : undefined,
        status: "status" in error ? error.status : undefined,
      });
    } else {
      console.log("[auth] signin success", {
        email,
      });
    }

    return { error };
  },
  async signUp(email: string, password: string): Promise<SignUpResult> {
    console.log("[auth] signup start", {
      email,
    });

    const { data, error } = await withTimeout(supabase.auth.signUp({ email, password }), 15000, "Supabase sign up");

    if (error) {
      const meta = getAuthErrorMeta(error);
      console.error("[auth] signup failure", {
        email,
        message: meta.message,
        code: meta.code,
        status: meta.status,
        timedOut: meta.timedOut,
        networkFailure: meta.networkFailure,
        duplicateEmail: meta.duplicateEmail,
      });

      if (isRetryableSignUpError(error)) {
        console.log("[auth] signup recovery start", {
          email,
          strategy: "session-then-signin",
        });

        await pause(1200);

        try {
          const recoveredSession = await authApi.getCurrentSession();
          if (recoveredSession?.user?.id) {
            console.log("[auth] signup recovery success", {
              email,
              strategy: "session",
              userId: recoveredSession.user.id,
            });
            return {
              error: null,
              session: recoveredSession,
            };
          }
        } catch (sessionError) {
          console.error("[auth] signup recovery session check failed", {
            email,
            message: sessionError instanceof Error ? sessionError.message : String(sessionError),
          });
        }

        try {
          const signInRecovery = await withTimeout(
            supabase.auth.signInWithPassword({
              email,
              password,
            }),
            12000,
            "Supabase sign up recovery sign in",
          );

          if (signInRecovery.error) {
            const recoveryMeta = getAuthErrorMeta(signInRecovery.error);
            console.error("[auth] signup recovery sign-in failed", {
              email,
              message: recoveryMeta.message,
              code: recoveryMeta.code,
              status: recoveryMeta.status,
            });
          } else if (signInRecovery.data.session) {
            console.log("[auth] signup recovery success", {
              email,
              strategy: "sign-in",
              userId: signInRecovery.data.session.user.id,
            });
            return {
              error: null,
              session: signInRecovery.data.session,
            };
          }
        } catch (signInRecoveryError) {
          console.error("[auth] signup recovery sign-in threw", {
            email,
            message: signInRecoveryError instanceof Error ? signInRecoveryError.message : String(signInRecoveryError),
          });
        }
      }
    } else {
      console.log("[auth] signup success", {
        email,
        hasSession: Boolean(data.session),
        userId: data.user?.id ?? null,
      });
    }

    return {
      error,
      session: data.session,
    };
  },
  async sendPasswordReset(email: string): Promise<AuthResult> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: env.resetPasswordRedirectUrl,
    });

    return { error };
  },
  async updatePassword(password: string): Promise<AuthResult> {
    const { error } = await supabase.auth.updateUser({
      password,
    });

    return { error };
  },
  async signOut() {
    await supabase.auth.signOut();
  },
};
